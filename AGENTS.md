# Rocksaurus — Dino Studio

3D dinosaur-band shorts (Three.js + Web Audio) with a React studio UI for previewing and recording them to
video. React 19 + TypeScript, Vite, Vitest. Deployed to GitHub Pages from `main`.

## Commands

| Command          | Notes                                                         |
| ---------------- | ------------------------------------------------------------- |
| `npm run dev`    | Vite dev server (http://localhost:5173)                       |
| `npm run check`  | The gate: `typecheck && lint && format:check && test`         |
| `npm test`       | `vitest run` (jsdom). `npm run test:watch` to iterate         |
| `npm run build`  | `tsc -b && vite build` — CI runs this too, so keep it passing |
| `npm run format` | Prettier write (formatting is enforced, not advisory)         |

Verified on Node 22.22 (2026-10-03): `npm run check` passes — 18 test files, 67 tests — and `npm run build`
succeeds. Nothing in the repo is currently failing or skipped. Two non-blocking notes:

- Vitest prints a perf hint ("jsdom was created 18 times… use `pool: 'vmThreads'`"). Environment setup is ~74%
  of the ~8 s run. Not configured; left as-is.
- The vendor bundle is ~1.1 MB (three.js). `vite.config.ts` raises `chunkSizeWarningLimit` to 1500 on purpose.

`package.json` requires Node `>=22`; `.nvmrc` pins `24` and both CI workflows use `node-version-file: .nvmrc`.
So CI runs 24 while 22 also works locally — don't "fix" one to match the other without checking both.

## The one rule: episodes are pure functions of time

Every visual is `update(t)` where `t` is seconds since the episode started. No frame counters, no accumulated
state, no `Date.now()`. This is what makes a render reproducible and recordable. Randomness goes through
`rng(seed)` in `src/engine/math.ts` (mulberry32), never `Math.random()`.

An episode implements `Episode` (`src/engine/types.ts`): `id`, `title`, `duration`, `setup(stage) → { update(t) }`,
optional `audio(bus, t0)`, `captions`, `preload()`.

## Layout

```
src/
  app/        React shell: App (router), Layout (topbar + Outlet)
  features/
    studio/   The studio page: useStudioSession (stage+player lifecycle), usePlayback, Transport/EpisodeList/StudioHeader
    brand/    Channel-art page: renders profile picture + banner PNGs off-screen from the same 3D Rory
  ui/         Radix-based primitives (Button, Slider, SegmentedControl, Tooltip) + ui.module.css; re-exported from ui/index.ts
  engine/     stage (renderer + 2D compositing), player (loop, audio clock, cleanup), recorder (MediaRecorder),
              captions/subtitles (canvas overlay), formats, dispose, math, types
  band/       One module per instrument: guitarist/bassist/drummer/keyboardist/singer → Performer { root, update(t) }.
              timing.ts holds the shared animation primitives (beatPulse, recentHit, latestStarted)
  characters/ Dinosaur rigs + shared rig helpers (reach.ts arm IK, rocker.ts Rory-with-guitar). MIXED .js/.ts — see below
  props/      Instruments, clothes, hair, scene objects. Also mixed .js/.ts
  world/      Scenes/sets: rock-stage.js, meadow.js, pizzeria.js, interior.ts (room kit), text-texture, screen-script
  audio/      Synth voices + part schedulers (see below)
  episodes/   One folder per video; index.ts is the registry
  lib/        formatTime
  test/       setup.ts (jest-dom + ResizeObserver stub), render.tsx (renderWithProviders)
```

React owns the page; the engine owns the canvas. `useStudioSession` builds stage + player in a ref callback and
returns a cleanup that disposes both (WebGL context, RAF loop, audio) when episode/format/`?cam` changes.
`usePlayback` reads the player through `useSyncExternalStore`; the player notifies at most every 100 ms
(`NOTIFY_EVERY`) so React doesn't re-render per frame.

`createStage` renders Three.js into an offscreen WebGL canvas and composites it onto a 2D output canvas each
frame, together with the caption overlay. The 2D canvas is what is shown _and_ what `recordEpisode` captures.
An episode may swap `stage.scene` to cut between locations; `stage.dispose()` tracks every scene it has rendered.

## Timing and audio

- **One module-level audio graph** (`src/audio/context.ts`), built at import time:
  `episode bus → master → (dry + convolver reverb) → compressor → speakers + MediaStreamDestination`.
  The reverb impulse is synthesized from seeded noise. The recorder pulls `audio.recordStream` from here, which
  is why recorded video has sound. Importing this module constructs an `AudioContext`; the player calls
  `ctx.resume()` on the first sound toggle (browser autoplay policy).
- **The audio clock is the clock.** With sound on, `player.elapsed()` is `audio.ctx.currentTime - t0`; with sound
  off it's `performance.now()`. Picture therefore never drifts from music. Consequence: **`seek()` turns sound
  off** — music is only ever scheduled from the top. `restart()` fades the old bus out, calls
  `cancelScheduled()`, and makes a fresh `GainNode` bus.
- **Lazy note building** (`src/audio/schedule.ts`): `atTime(when, make)` defers building a note's nodes until
  1.5 s before it sounds; a `generation` counter drops pending notes on stop/restart. Build a whole song's nodes
  up front and the audio thread chokes — don't.
- **Parts are data, played twice.** A part object (`DrumPart`, `KeyboardPart`, `VocalPart`, `GuitarPart`) feeds
  both the synth scheduler _and_ the animation, so sticks, paws and jaws land exactly on the sound:
  `drumHits(part)`, `timedNotes(part)`, `sungNotes(part)` all return times in seconds, sorted.
- **Grids.** Drums: one string per instrument, 16 steps/bar, `x` hit · `X` accent · `g` ghost · `o` open hat ·
  `.` rest (whitespace ignored, use it to mark bars). Everything else: eighth-note tuples
  `[eighth, note, lengthInEighths, …]`, fractional eighths allowed. Note names go through `midi()`/`frequency()`
  in `audio/notes.ts`.
- **Voices** are all synthesized, no samples: `guitar.js` (Karplus–Strong + amp/cab), `piano.js` (light, realtime),
  `grand-piano.ts` (physically modeled, pre-rendered to buffers — `warmGrand()` in `preload()`), `slap-bass.ts`,
  `bass.js`, `drums.js`, `synth.ts` (lead/organ/pad), `voice.ts` (formant singing, driven by `vowels.ts`),
  `sfx.js`/`foley.ts` (boops, rattles, footsteps), `track.js` (load/play a real recording).

`src/band/timing.ts` is the animation vocabulary: `beatPulse(t, beat)` for on-the-beat pulses, `recentHit(t, times)`
for exponential decay off the most recent hit, `latestStarted(items, t)` for "which note is sounding".

## 3D stack: three.js only — a standing rule

**Use three.js and no other library for 3D or graphics.** This is the repo owner's rule, not an inference from
the code, so do not weigh it against convenience, bundle size, developer ergonomics or "this one case is
simpler declaratively". If a task seems to need another 3D library, the task is wrong or it needs the owner's
decision first — raise it, don't adopt one.

All 3D in this project is written against three.js directly — `new THREE.Mesh(...)`, hand-built scene graphs,
an imperative render loop in `engine/player.ts`. There is no React Three Fiber, no `@react-three/drei`, and no
other 3D engine anywhere in the dependency tree (`three` and `@types/three` are the only graphics packages, and
nothing pulls a wrapper in transitively). Keep it that way: build scenes from three.js primitives following the
patterns in `src/world/` and `src/characters/`, and don't reach for `@react-three/fiber`, `drei`, Babylon.js,
PlayCanvas, A-Frame or similar.

That is not a general ban on dependencies, and it says nothing about the rest of the stack: React 19,
react-router, the Radix UI primitives, lucide-react and the Web Audio API are all load-bearing here and stay.
The constraint is narrow and specific: the 3D/graphics layer stays raw three.js. Two reasons it is worth
holding: declarative scene graphs fight the "episode is a pure function of `t`" model this codebase is built
on, and a wrapper would have to be threaded through `engine/stage.ts`, `engine/player.ts` and every episode at
once — never a change that belongs inside unrelated work.

**Pinned skills.** `skills-lock.json` is the lockfile pinning two agent skills — consult the relevant one as the
authority before writing code in its area:

- `three-best-practices` — source `emalorenzo/three-agent-skills`, path `skills/three-best-practices/SKILL.md`.
  Read before writing or refactoring three.js code: scene graph, materials, geometry, render loop,
  disposal/memory.
- `frontend-design` — source `anthropics/skills`, path `skills/frontend-design/SKILL.md`. Read before UI work in
  `src/ui/` and `src/app/`.

The checkout directory (`.agents/`) is gitignored and not present in a fresh clone.

## Conventions actually used here

- **Imports are extensionless**, including TS importing JS (`import { enableShadows } from '../characters/materials'`)
  and directory indexes (`import bandLive from './band-live'`). Only `three/addons/**/*.js` carries an extension.
- **`import type` is mandatory** for types: `verbatimModuleSyntax` + `@typescript-eslint/consistent-type-imports: error`.
- **`noUncheckedIndexedAccess` is on**, plus `noUnusedLocals`/`noUnusedParameters`. Hence the `episodes[0]!`,
  `clicks.at(-1) ?? -1` and `arms.find(...)!` style throughout — keep it, don't widen types to avoid it.
- **TS episodes declare `const episode: Episode = {…}` then `export default episode`** so the contract is checked
  at the definition. JS episodes are only checked where `src/episodes/index.ts` types the registry as `Episode[]` —
  that file is the type boundary for all JS content.
- **Rigs are plain objects of `THREE.Group` pivots**, documented by `CharacterRig` (`characters/types.ts`):
  `root/squash/torso/head/eyes/cheeks/arms/feet/tail` + `setMouth(k)`/`setFrown(on)`. `arm.userData.side` is
  `-1` (left) / `1` (right) — find arms and feet by that, never by index. Call `resetPose(rig)` before posing
  each frame, then `idle(rig, t, {…})`, then your pose. `reachArm(pivot, target, elbow?)` does the arm IK and
  lazily creates paw/elbow/forearm meshes in the pivot's parent space.
- **Comments explain intent, often with the beat sheet or stage plot inline** (see `episodes/rory-hello/index.js`,
  `episodes/band-live/index.ts`). Match that density — it's how the choreography stays readable.
- **CSS modules + design tokens.** No inline styles, no Tailwind. Tokens live in `src/styles/global.css`
  (`--bg`, `--surface-2`, `--accent`, `--radius`, …); dark only (`color-scheme: dark`). UI primitives wrap Radix
  and take an explicit `label`/`aria-label`.
- **Tests use Vitest globals** (`describe`/`it`/`expect`/`vi` — no imports) and query by role/text via
  `renderWithProviders` from `src/test/render.tsx`. Pure logic (timing, parts, captions, formats, scripts) is
  unit-tested; Three.js scene building and audio graphs are not.
- **Prettier**: single quotes, semicolons, trailing commas, `printWidth: 120`, `arrowParens: 'avoid'`.
- **Branches** are kebab-case topics (`band-live`, `steggy-matcha`, `github-pages`). Commit subjects are a
  descriptive sentence ("Add \"Steggy & the Matcha Theory\": a one-minute Short at home and at the café") with a
  prose body explaining the episode and any shared pieces extracted.

## Gotchas

- **`src/characters/` and `src/props/` mix `.ts` and `.js`.** `allowJs: true`, `checkJs: false` — JS files get
  _inferred_ types with no checking, so a typo in `rory.js` surfaces only at runtime. Notably `rory.js` is the
  base rig module: `createRory`, `resetPose` and `idle` are imported by nearly every TypeScript performer, and
  they are untyped. `CharacterRig` describes the shape but is not enforced on the JS rigs. `.ts`: `rocker`,
  `reach`, `stegosaurus`, `parasaurolophus`, `types`. `.js`: `rory`, `lulu`, `tyrannosaurus`, `materials`.
  Converting a file is a fine standalone change — the tsconfig comment says so — but expect new strict errors
  at every call site once it's typed.
- **Episodes are also mixed.** `rory-*` and `meet-lulu`/`meet-tiki` are JS; `band-live`, `lulu-on-call`,
  `steggy-matcha`, `meet-paris`, `meet-steggy` are TS.
- **There is no `public/` directory.** `rory-rocks` tries to load `${BASE_URL}audio/riff.wav` and falls back to a
  synthesized riff (`FALLBACK = 'synth'`, or `'click'` for a metronome). The README's "save it as
  `public/audio/riff.wav`" means create that directory.
- **Pages deploys under a subpath**, so anything referencing an asset URL must go through
  `import.meta.env.BASE_URL` (the router uses it as `basename`). `pages.yml` builds with
  `--base /<repo>/` and copies `dist/index.html` to `dist/404.html` for SPA fallback. Local dev stays at `/`.
- **Fonts come from a Google Fonts `<link>` in `index.html`** (Fredoka, Bungee, Inter, Metal Mania, Rye, Cinzel).
  Canvas text won't use them until loaded — `StudioPage.record()` awaits `document.fonts.load()` before
  recording and `textTexture()` repaints once its fonts arrive. Keep that pattern for any new canvas text.
- **Recording** runs one full pass with sound forced on, so the episode restarts; MP4 where supported, WebM
  otherwise. It needs a visible tab.
- **Dispose properly.** `disposeObject` walks geometries, materials and any texture-valued material property;
  `stage.dispose()` also calls `renderer.forceContextLoss()`. Leaking a WebGL context per format switch is the
  easy bug here.

## Adding things

- **Episode**: copy a neighbour folder, change `id`/`title`/`duration`/`update(t)`/`audio(bus, t0)`, then register
  it in a folder in `src/episodes/index.ts`. The first episode in the first folder is the studio default.
- **Joke variant**: spread an existing episode and replace only `id`, `title`, `captions` (see
  `episodes/rory-friday/index.js`).
- **Character**: return the same rig shape so `idle()`, `resetPose()` and `reachArm()` keep working.
- **Band member**: return `Performer { root, update(t) }` and take `(part, clock: SongClock)` so the song's data
  drives the animation.
- Debug camera: append `&cam=x,y,z,lookX,lookY,lookZ` to the studio URL to pin the camera for close-ups.

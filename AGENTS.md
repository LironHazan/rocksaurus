# Rocksaurus — Dino Studio

3D dinosaur-band shorts (Three.js + Web Audio) with a React studio UI for previewing and recording them to
video. React 19 + TypeScript 7, Vite, Vitest, oxlint. Deployed to GitHub Pages from `main`.

## Commands

| Command                   | Notes                                                                        |
| ------------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`             | Vite dev server (http://localhost:5173)                                      |
| `npm run check`           | The gate: `typecheck && lint && lint:boundaries && format:check && test`     |
| `npm run lint:boundaries` | dependency-cruiser: module boundaries and layers (`.dependency-cruiser.cjs`) |
| `npm test`                | `vitest run` (jsdom). `npm run test:watch` to iterate                        |
| `npm run build`           | `tsc -b && vite build` — CI runs this too, so keep it passing                |
| `npm run format`          | Prettier write (formatting is enforced, not advisory)                        |

The toolchain is TypeScript 7 (the native compiler) and **oxlint**, not ESLint: `.oxlintrc.json` is the lint
config, and the stricter rule categories are deliberately off. `react-refresh/only-export-components` has no
oxlint equivalent, so that HMR check is gone. Node 24 (`.nvmrc`, `engines` and CI agree). The three.js vendor
chunk is large on purpose; `vite.config.ts` raises `chunkSizeWarningLimit` for it.

## The one rule: episodes are pure functions of time

Every visual is `update(t)` where `t` is seconds since the episode started. No frame counters, no accumulated
state, no `Date.now()`. This is what makes a render reproducible and recordable. Randomness goes through
`rng(seed)` in `src/engine/math.ts` (mulberry32), never `Math.random()`.

An episode implements `Episode` (`src/engine/types.ts`): `id`, `title`, `duration`, `setup(stage) → { update(t) }`,
optional `audio(bus, t0)`, `captions`, `preload()`.

## Layout

```
src/
  app/        React shell (router, layout)
  features/   studio/ (useStudioSession = stage + player lifecycle, usePlayback), watch/ (read-only mobile player at /watch, 720×1280), brand/ (channel-art PNGs)
  ui/         Radix-based primitives, re-exported from ui/index.ts
  engine/     stage (renderer + 2D compositing), player (loop, audio clock, cleanup), recorder, captions/subtitles, math, types
  band/       One module per instrument → Performer { root, update(t) }; timing.ts has beatPulse, recentHit, latestStarted
  characters/ Dinosaur rigs + helpers (reach.ts arm IK, rocker.ts). MIXED .js/.ts — see Gotchas
  props/      Instruments, clothes, hair, scene objects. Also mixed .js/.ts
  world/      Sets and screens (rock-stage, campus, bedroom, lulu-home, interior room kit, screen-script)
  audio/      Synth voices + part schedulers (see below)
  episodes/   One folder per video; index.ts is the registry, grouped into sidebar folders
```

React owns the page; the engine owns the canvas. `useStudioSession` builds stage + player and disposes both
(WebGL context, RAF loop, audio) when episode/format/`?cam` changes. `usePlayback` reads the player through
`useSyncExternalStore`; the player notifies at most every 100 ms so React doesn't re-render per frame.
`createStage` renders Three.js offscreen and composites it, with the caption overlay, onto a 2D canvas — that
canvas is what is shown _and_ what `recordEpisode` captures. An episode may swap `stage.scene` to cut between
locations.

## Timing and audio

- **One module-level audio graph** (`src/audio/context.ts`), built at import time:
  `episode bus → master → (dry + reverb) → compressor → speakers + MediaStreamDestination`. The recorder pulls
  its stream from here, which is why recorded video has sound. Importing it constructs an `AudioContext`.
- **The audio clock is the clock.** With sound on, elapsed time is `audio.ctx.currentTime - t0`; with sound off it
  is `performance.now()`. Picture never drifts from music. Consequence: **`seek()` turns sound off** — music is
  only ever scheduled from the top.
- **Lazy note building** (`src/audio/schedule.ts`): `atTime(when, make)` defers building a note's nodes until
  1.5 s before it sounds, and `cancelScheduled()` drops pending notes on stop/restart. Build a whole song's nodes
  up front and the audio thread chokes — don't.
- **Parts are data, played twice.** A part object (`DrumPart`, `KeyboardPart`, `VocalPart`, `GuitarPart`) feeds
  both the synth scheduler _and_ the animation, so sticks, paws and jaws land exactly on the sound:
  `drumHits(part)`, `timedNotes(part)`, `sungNotes(part)` return times in seconds, sorted.
- **Grids.** Drums: one string per instrument, 16 steps/bar, `x` hit · `X` accent · `g` ghost · `o` open hat ·
  `.` rest (whitespace ignored). Everything else: tuples `[eighth, note, lengthInEighths, …]`, fractional eighths
  allowed. Note names go through `midi()`/`frequency()` in `audio/notes.ts`.
- **Voices are synthesized, no samples** (`track.js` plays a real recording). `grand-piano.ts` is pre-rendered:
  call `warmGrand(notes)` in `preload()` so playback doesn't stutter.

## 3D stack: three.js only — a standing rule

**Use three.js and no other library for 3D or graphics.** This is the repo owner's rule, not an inference from
the code, so do not weigh it against convenience, bundle size or "this case is simpler declaratively". If a task
seems to need React Three Fiber, `@react-three/drei`, Babylon.js, PlayCanvas, A-Frame or similar, raise it with
the owner instead of adopting one.

Scenes are built imperatively (`new THREE.Mesh(...)`, hand-built scene graphs, the render loop in
`engine/player.ts`); follow the patterns in `src/world/` and `src/characters/`. The rule covers only the
3D/graphics layer: React 19, react-router, Radix, lucide-react and Web Audio stay. Why: declarative scene graphs
fight the "pure function of `t`" model, and a wrapper would have to be threaded through `engine/stage.ts`,
`engine/player.ts` and every episode at once.

**Pinned skills** (`skills-lock.json`; checkout in the gitignored `.agents/`, absent from a fresh clone): consult
`three-best-practices` before writing or refactoring three.js (scene graph, materials, disposal), and
`frontend-design` before UI work in `src/ui/` and `src/app/`, and `codebase-design` / `setup-ts-deep-modules` before
adding or splitting a module.

## Conventions

- **Modules are deep; episodes are leaves.** Import a module's root files only, never another episode's files:
  a set or prop that two Shorts share moves to `world/` or `props/`. Layers go
  `features → episodes → band → characters, props, world → engine → audio`. `npm run lint:boundaries` enforces it;
  see [docs/adr/0001-deep-modules.md](docs/adr/0001-deep-modules.md).
- **Imports are extensionless**, including TS importing JS and directory indexes. Only `three/addons/**/*.js`
  carries an extension.
- **`import type` is mandatory** for types: `verbatimModuleSyntax` + `typescript/consistent-type-imports: error`
  (oxlint). A value import of a type fails `npm run lint`.
- **`noUncheckedIndexedAccess` is on**, plus `noUnusedLocals`/`noUnusedParameters`. Hence the `episodes[0]!`,
  `clicks.at(-1) ?? -1` and `arms.find(...)!` style — keep it, don't widen types to avoid it.
- **TS episodes declare `const episode: Episode = {…}` then `export default episode`** so the contract is checked
  at the definition. JS episodes are only checked where `src/episodes/index.ts` types the registry as `Episode[]`.
- **Rigs are plain objects of `THREE.Group` pivots**, documented by `CharacterRig` (`characters/types.ts`).
  `arm.userData.side` is `-1` (left) / `1` (right) — find arms and feet by that, never by index. Each frame: `resetPose(rig)`,
  then `idle(rig, t, {…})`, then your pose. `reachArm(pivot, target, elbow?)` does the arm IK.
- **Comments explain intent, often with the beat sheet inline** (see `episodes/band-live/index.ts`). Match that
  density.
- **CSS modules + design tokens** from `src/styles/global.css`. No inline styles, no Tailwind; dark only. UI
  primitives wrap Radix and take an explicit `label`/`aria-label`.
- **Tests use Vitest globals** (no imports) and query by role/text via `renderWithProviders`
  (`src/test/render.tsx`). Pure logic (timing, parts, captions, formats, scripts) is unit-tested; Three.js scene
  building and audio graphs are not.
- **Prettier**: single quotes, semicolons, trailing commas, `printWidth: 120`, `arrowParens: 'avoid'`.

## Gotchas

- **`src/characters/` and `src/props/` mix `.ts` and `.js`** (`allowJs: true`, `checkJs: false`), so a typo in a
  JS file surfaces only at runtime. Notably `rory.js` is the base rig (`createRory`, `resetPose`, `idle`),
  imported by nearly every TypeScript performer, and it is untyped. Converting a file is a fine standalone change,
  but expect new strict errors at every call site.
- **There is no `public/` directory.** `rory-rocks` tries to load `${BASE_URL}audio/riff.wav` and falls back to a
  synthesized riff; to use a real one, create `public/audio/riff.wav`.
- **Pages deploys under a subpath**, so asset URLs must go through `import.meta.env.BASE_URL` (the router uses it
  as `basename`). `pages.yml` builds with `--base /<repo>/`. Local dev stays at `/`.
- **Canvas text needs its fonts loaded** (Google Fonts `<link>` in `index.html`). `StudioPage.record()` awaits
  `document.fonts.load()` before recording and `textTexture()` repaints once its fonts arrive. Keep that pattern.
- **Phones never see the studio.** `StudioGuard` (`src/app/`) redirects every studio route to `/watch` when the
  device is a touch phone (`PHONE_QUERY` in `lib/useIsPhone.ts`), keeping only `?episode=`. New studio pages go
  under that guard; new viewer pages go beside `/watch`.
- **Recording** runs one full pass with sound forced on, so the episode restarts. It needs a visible tab.
- **Dispose properly.** `disposeObject` walks geometries, materials and textures; `stage.dispose()` also forces
  WebGL context loss. Leaking a context per format switch is the easy bug here.

## Adding things

- **Episode**: copy a neighbour folder, change `id`/`title`/`duration`/`update(t)`/`audio(bus, t0)`, then register
  it in a folder in `src/episodes/index.ts`. The first episode in the first folder is the studio default.
- **End card**: every new Short ends with the channel's subscribe card (Rory with a sign, `src/episodes/outro.ts`):
  `export default withOutro(episode)`. It adds `OUTRO_LEN` seconds and a sting; keep `duration` the story's length.
- **Joke variant**: spread an existing episode and replace only `id`, `title`, `captions`
  (see `episodes/rory-friday/index.js`).
- **Character**: return the same rig shape so `idle()`, `resetPose()` and `reachArm()` keep working.
  Build the tail with `growTail()` (`characters/tail.ts`): one tapered tube whose first spine point is inside the
  body. Never a `ConeGeometry` stuck on the back, which shows a seam and looks detached (a bug that kept coming back).
- **Band member**: return `Performer { root, update(t) }` and take `(part, clock: SongClock)`.
- **Debug camera**: append `&cam=x,y,z,lookX,lookY,lookZ` to the studio URL to pin the camera for close-ups.

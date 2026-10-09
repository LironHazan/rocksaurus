# Rocksaurus — Dino Studio

Rocksaurus makes YouTube Shorts about a dinosaur rock band: Rory (guitar), Lulu (drums), Tiki Taka (bass), Steggy
(keys) and Paris (vocals). Each Short is a 3D scene (three.js) with synthesized sound (Web Audio). A React studio
previews a Short and records it to video. GitHub Pages deploys `main`.

## Commands

- `npm run check` — the gate: typecheck, lint, `lint:boundaries`, format check, tests. Run it before every commit.
- `npm run build` — `tsc -b && vite build`. CI runs it too.
- `npm run test:e2e` — builds, then Playwright smoke-tests the studio and the watch page in headless Chromium. CI runs
  it on every PR.
- `npm run dev` — the studio at http://localhost:5173. Open a Short with `?episode=<id>`.
- `npm run format` — Prettier. Formatting is enforced.

The tools are not the usual ones: TypeScript 7 (native compiler), **oxlint** (not ESLint), and
**dependency-cruiser** for module boundaries (`.dependency-cruiser.cjs`). Node 24.

## Rules

- **An episode is a pure function of time.** Every visual is `update(t)`, with `t` in seconds from the start. No
  frame counters, no state carried between frames, no `Date.now()`, no `Math.random()` (use `rng(seed)` from
  `src/engine/math.ts`). This makes every render the same, so it can be recorded.
- **three.js only for 3D.** This is the owner's rule. Do not add React Three Fiber, drei, Babylon.js or any other 3D
  library, even when it looks simpler: ask the owner first. Build scenes imperatively, like `src/world/` and
  `src/characters/`.
- **TypeScript only.** No `.js` files in `src/`. Do not widen types or add `any` to get past `noUncheckedIndexedAccess`;
  use the `arms.find(…)!` style.
- **Modules are deep; episodes are leaves.** Import a module's root files only, and never another episode's files.
  Layers: `features → episodes → band → characters, props, world → engine → audio`. Why:
  [docs/adr/0001-deep-modules.md](docs/adr/0001-deep-modules.md).
- **Rigs:** find arms and feet by `userData.side` (`-1` left, `1` right), never by index. Each frame: `resetPose(rig)`,
  then `idle(rig, t)`, then the pose. `reachArm(pivot, target, elbow?)` does the arm IK.
- **Dispose what you create.** `disposeObject` frees geometries, materials and textures. A leaked WebGL context per
  format switch is the easy bug here.
- **Comment the why, not the what:** intent, units, ranges, beat sheets, what an anonymous shape is
  (`ball(…) // snout`). No comment that repeats a name in the code, and no section banner that repeats what follows.
- **Tests:** unit-test pure logic (timing, parts, captions, scripts) with Vitest globals. Every registered Short is
  played through in `src/episodes/episodes.smoke.test.ts` (no browser); do not write per-mesh tests of scene building.

## Gotchas

- **Pages serves the app under a subpath.** Build asset URLs from `import.meta.env.BASE_URL`.
- **Canvas text needs its fonts loaded** (Google Fonts in `index.html`). Await `document.fonts.load()` before you
  record; `textTexture()` repaints when its fonts arrive.
- **Phones never see the studio:** `StudioGuard` sends them to `/watch`. Put new studio pages under that guard.

## Read before the task

- Adding or changing a Short, a character, a prop or a set: [docs/agents/shorts.md](docs/agents/shorts.md) (also has
  the owner's house rules for every Short).
- Music, sound effects, voices, or the player clock: [docs/agents/audio.md](docs/agents/audio.md).
- Anything the browser shows (to test it): [docs/agents/browser-testing.md](docs/agents/browser-testing.md).
- three.js code: the pinned `three-best-practices` skill. UI in `src/ui/` or `src/app/` (CSS modules and the tokens in
  `src/styles/global.css`, Radix primitives): the `frontend-design` skill. Adding or splitting a module: the
  `codebase-design` and `setup-ts-deep-modules` skills. Skills are pinned in `skills-lock.json`.

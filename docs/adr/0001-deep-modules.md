# ADR 0001: Deep modules, checked by dependency-cruiser

- Status: Accepted
- Date: 2026-10-09

## Context

A deep module has a lot of behaviour behind a small interface. Some parts of this repository are already deep:

- The `Episode` interface (`setup(stage) → { update(t) }`, `audio`, `captions`) hides all of a Short. The studio,
  the watch page and the recorder know only this interface.
- The engine (`createStage`, `createPlayer`, `recordEpisode`) hides the renderer, the audio clock and the clean-up.

Other parts were shallow, and no tool checked the boundaries:

- Episodes imported files from other episodes (8 imports). For example, `prod-certs` used the campus from
  `office-besties`, the cup and the sky from `monday-coffee`, and the bedroom from `lulu-on-call`. A change to one
  Short could break a different Short.
- The rules in `AGENTS.md` were text only. Agents broke them, and no check failed.

## Decision

1. Use the `setup-ts-deep-modules` skill (mattpocock/skills), pinned in `skills-lock.json` with `codebase-design`.
   It defines the rules. `dependency-cruiser` checks them.
2. Keep the current folders. Do not move code to `src/packages/`. The library modules are `engine`, `audio`,
   `band`, `characters`, `props`, `world`, `lib` and `ui`.
3. The root files of a module are its entry points. A subfolder of a library module (by convention `lib/`) is
   private.
4. An episode is a leaf. It does not import from another episode. A set, a prop or a riff that two Shorts use goes
   into a library module. A joke variant can spread a different episode through that episode's `index`.
5. The app gets Shorts only through the registry, `src/episodes/index.ts`.
6. Dependencies go in one direction:
   `features → episodes → band → characters, props, world → engine → audio`.
   The engine is above audio because the player and the recorder own the audio clock. Audio uses only
   `engine/math` (the seeded `rng`).
7. Import cycles are not permitted.
8. `npm run lint:boundaries` runs the check. It is part of `npm run check` and of CI.

## Consequences

- These files moved to library modules, so no episode imports a different episode:
  - `world/bedroom.ts` and `world/lulu-home.ts` (from `lulu-on-call/sets/`)
  - `world/campus.ts` (from `office-besties/sets.ts`)
  - `world/sky.ts` and `props/cup.ts` (from `monday-coffee/sets.ts`)
  - `audio/rory-riff.js` (from `rory-rocks/riff.js`)
- A wrong import fails at once, with the name of the rule that it breaks.
- TypeScript 7 has no compiler API yet. Because of this, `dependency-cruiser` parses the code with `swc`
  (`@swc/core`). It prints a `missing-typescript-transpiler` warning. You can ignore this warning: the check reads
  all 235 modules.
- Later work: give `audio` a smaller interface (episodes import from 17 files in `src/audio/`), and add a
  `characters/pose` entry point for `resetPose`, `idle` and `reachArm`. Move the internals to `lib/` when each of
  these is done.

## Alternatives that we did not use

- **A barrel `index.ts` for each module.** It makes a module shallow again, and the skill does not recommend it.
- **ESLint import rules.** The repository uses oxlint, not ESLint.
- **Move all code to `src/packages/`.** It changes too many paths and gives no more safety than the current
  folders.

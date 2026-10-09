# Proposal: deep modules for Rocksaurus

Status: proposal (Phase 1). No code changes yet.

## 1. What a deep module is

A deep module has a lot of behaviour behind a small public interface. The caller knows the interface. The caller
does not know the parts inside.

The `setup-ts-deep-modules` skill (mattpocock/skills) makes this rule concrete for TypeScript:

1. A module is a folder. The files at the root of the folder are its entry points. These files are public.
2. Each subfolder (for example `lib/`) is private. Only files of the same module can import it.
3. Tests import entry points only.
4. Import cycles are not permitted.
5. Use a small number of entry points. Do not use one large barrel `index.ts` that exports all.

A tool, `dependency-cruiser`, checks these rules. The command `npm run lint:boundaries` fails when code breaks a rule.

Issue mattpocock/skills#458 tells of a problem: the `improve-codebase-architecture` skill does not find shallow
modules (files that import from many places). A boundary check finds them, so we use one.

## 2. The current architecture

The repository has good parts. Keep them:

- **The `Episode` interface is already deep.** `setup(stage) → { update(t) }`, `audio(bus, t0)` and `captions` hide
  all of an episode's scenes, rigs and sounds. The studio, the watch page and the recorder know only this interface.
- **The engine is deep.** `createStage`, `createPlayer` and `recordEpisode` hide the renderer, the 2D compositing, the
  audio clock and the clean-up.
- **"Parts are data, played twice."** One part object feeds the synth and the animation. This is a good interface.

We measured the imports (`grep` over `src/`). These are the problems:

| Problem                                  | Data                                                                                                                                                                                                                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Episodes import from other episodes      | 8 imports. Examples: `prod-certs` imports `createCampus` from `office-besties/sets`, and `createCup` and `sky` from `monday-coffee/sets`. `monday-coffee` and `prod-certs` import the bedroom from `lulu-on-call/sets`. A change to one Short can break a different Short. |
| The audio layer is shallow               | Episodes import from 17 different files in `src/audio/`. Many of these files are internal synth voices (`drums`, `bass`, `guitar`, `sfx`). The caller must know the file that holds each voice.                                                                            |
| Episode `index.ts` files import too much | `monday-coffee/index.ts` has 29 imports. `steggy-matcha` has 25. `office-besties` has 21. Each new Short copies this wide import list.                                                                                                                                     |
| Rig helpers are spread out               | `resetPose` and `idle` come from `characters/rory.js`. `reachArm` comes from `characters/reach.ts`. Materials come from `characters/materials.js`. Every pose needs three imports.                                                                                         |
| No tool checks the boundaries            | The rules in `AGENTS.md` are text only. Nothing stops a new cross-episode import.                                                                                                                                                                                          |

## 3. The proposed modules

The modules stay in their current folders (`src/engine`, `src/audio`, ...). We do not move them to
`src/packages/`. This keeps the diff small and keeps the paths that `AGENTS.md` shows.

| Module            | Entry points (public)                                                                                                                 | Private (`lib/`)                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `engine`          | `stage`, `player`, `recorder`, `captions`, `formats`, `math`, `types`, `dispose`, `snapshot`                                          | `subtitles` and other helpers                                       |
| `audio`           | `music` (drums, bass, guitar, keys, voice parts and their timings), `foley` (beds and sound effects), `babble`, `schedule` (`atTime`) | all synth voices: `drums.js`, `bass.js`, `guitar.js`, `sfx.js`, ... |
| `characters`      | one file per dino (`rory`, `lulu`, `tyrannosaurus`, ...), `pose` (`resetPose`, `idle`, `reachArm`, `releaseArm`), `materials`         | `tail`, rig geometry helpers                                        |
| `props`           | one file per prop, as now                                                                                                             | shared geometry (`tube`, textures)                                  |
| `world`           | `rock-stage`, `interior`, `school`, `screen-script`, `text-texture`, and a new **`sets`** entry point                                 | room kit internals                                                  |
| `band`            | one file per instrument, `timing`                                                                                                     | —                                                                   |
| `episodes/<name>` | `index.ts` only (the default `Episode`)                                                                                               | `timeline`, `music`, `sound`, `sets`, `cast`, `captions`            |

The important new item is `world/sets`. It holds the sets that many Shorts use: the bedroom, Lulu's home, the
campus, the sky, the coffee cup. Then no episode imports from another episode.

### Layer rules

The dependencies go in one direction only:

```
features → episodes → band → characters, props, world → audio, engine
```

- `engine` imports nothing from the other modules.
- An episode imports no other episode. (`rory-friday`, a joke variant, is the one exception: it spreads
  `rory-hello`. It imports the entry point `rory-hello/index`, so the rule permits it.)
- `features` imports `episodes/index` (the registry) and `engine`. The brand page also imports `characters/rocker` and `world/rock-stage` to draw the channel art.

## 4. How deep modules make the current architecture better

1. **A new Short is faster to write.** An episode imports a small number of entry points (`audio/music`,
   `characters/pose`, `world/sets`) and not 20 to 30 files.
2. **A change in one Short cannot break a different Short.** Shared sets move to `world/sets`. The episode folders
   become private.
3. **The audio layer can change inside.** We can change a synth voice and no episode sees it. This agrees with the
   lazy scheduling rule: `atTime` stays the one way to make notes.
4. **The "pure function of `t`" rule stays.** Deep modules change only the imports. They do not change `update(t)`.
5. **Agents make fewer errors.** The boundary check gives an error at once. An agent does not have to remember the
   rules in `AGENTS.md`.
6. **The architecture skill gets better data.** `improve-codebase-architecture` can read the boundary report and
   find the shallow modules (see issue #458).

## 5. Migration plan

Each step is one small PR. After each step, `npm run check` and `npm run build` must pass.

1. Add `dependency-cruiser` and `npm run lint:boundaries`. Start with two rules only: no cycles, and no
   cross-episode imports. Set the second rule to `warn`. Add it to `npm run check`.
2. Move the shared sets to `world/sets`. Change the cross-episode rule to `error`.
3. Add `audio/music` and move the synth voices to `audio/lib/`. Add the layer rules for `audio`.
4. Add `characters/pose`. Move `tail` and the rig helpers to `characters/lib/`.
5. Add the layer rules for all modules. Change all rules to `error`.
6. Add a short section to `AGENTS.md`: the module table and the `lint:boundaries` command.

Phase 5 of the upgrade plan (`improve-codebase-architecture`) can do steps 2 to 5.

## 6. Risks

- **JS files have no type checks** (`checkJs: false`). An incorrect import path in a moved `.js` file shows only at
  run time. Run each changed episode in the studio after each move.
- **Many paths change.** Do one module per PR, so the review stays easy.
- **Do not add barrel files.** A barrel `index.ts` that exports all would make the module shallow again, and it
  can make the three.js chunk larger.
- **Do not add a new 3D library.** This proposal changes only the module boundaries. The three.js-only rule stays.

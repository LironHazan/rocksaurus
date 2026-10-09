# Audio and timing

Read this before you add music, sound effects or voices, or change `src/audio/` or `src/engine/player.ts`.

- **The audio clock is the clock.** With sound on, elapsed time is `audio.ctx.currentTime - t0`; with sound off it is
  `performance.now()`. So **`seek()` turns sound off**: music is only ever scheduled from the top.
- **One audio graph, built at import time** (`src/audio/context.ts`): episode bus → master → (dry + reverb) →
  compressor → speakers + `MediaStreamDestination`. The recorder records from it. Importing it creates an
  `AudioContext`.
- **Build notes lazily.** Schedule every note with `atTime(when, make)` (`src/audio/schedule.ts`): it builds the
  nodes 1.5 s before they sound. Building a whole song's nodes up front chokes the audio thread.
- **Parts are data, played twice.** One part object (`DrumPart`, `KeyboardPart`, `VocalPart`, `GuitarPart`,
  `BassPart`) feeds the synth and the animation, so paws and jaws land on the sound. `drumHits`, `timedNotes`,
  `sungNotes` and `bassTimes` return sorted times in seconds.
- **Grids.** Drums: one string per instrument, 16 steps a bar: `x` hit, `X` accent, `g` ghost, `o` open hat, `.` rest
  (spaces ignored). Other parts: tuples `[eighth, note, lengthInEighths, …]`; fractional eighths are fine.
- **Voices are synthesized.** `track.ts` is the only player for a recording. `grand-piano.ts` is pre-rendered: call
  `warmGrand(notes)` in the episode's `preload()`.
- **Dialogue is babble** (`src/audio/babble.ts`): `syllables(lines, voices, seed)` drives both the sung syllables
  (`playSyllables`) and the mouths (`mouthOf`).
- **Foley** is in `src/audio/foley.ts`, with `bed()` for a background sound under a whole shot.

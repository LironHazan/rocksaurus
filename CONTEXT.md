# Domain terms

The words the code and the docs use for Rocksaurus concepts. Use these names for new modules and types.

- **Short**: one episode, a YouTube Short under a minute. In code: an `Episode` in `src/episodes/`.
- **Cue sheet**: a Short's sound design: every cue and bed with its time. `cueSheet()` in `src/audio/cue-sheet.ts`.
- **Cue**: one sound at one time (`at`, in seconds from the start of the Short), such as a footstep or a chat pop.
- **Bed**: background sound under a span of the Short (`from`…`to`), such as a quiet room or a street.
- **Player**: how one kind of cue sounds: `(bus, when) => void`.
- **Foley**: the everyday sounds the players use (`src/audio/foley.ts`): steps, keys, phones, birds.
- **Babble**: the dino speech: sung syllables at talking pitch that the mouths move to (`src/audio/babble.ts`).

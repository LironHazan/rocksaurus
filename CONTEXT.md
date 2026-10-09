# Domain terms

The words the code and the docs use for Rocksaurus concepts. Use these names for new modules and types.

- **Short**: one episode, a YouTube Short under a minute. In code: an `Episode` in `src/episodes/`.
- **Cue sheet**: a Short's sound design: every cue and bed with its time. `cueSheet()` in `src/audio/cue-sheet.ts`.
- **Cue**: one sound at one time (`at`, in seconds from the start of the Short), such as a footstep or a chat pop.
- **Bed**: background sound under a span of the Short (`from`…`to`), such as a quiet room or a street.
- **Player**: how one kind of cue sounds: `(bus, when) => void`.
- **Foley**: the everyday sounds the players use (`src/audio/foley.ts`): steps, keys, phones, birds.
- **Babble**: the dino speech: sung syllables at talking pitch that the mouths move to (`src/audio/babble.ts`).
- **Director**: cuts between a Short's locations and points the camera (`direct()` in `src/engine/director.ts`).
- **Location**: one place a Short cuts to: a scene, the cast that moves into it, and how it is framed at time t.
  Several locations can share one scene (four beats in Paris's shop).
- **Cut list**: which location is on screen from which time: `cuts([[from, location], …])`.
- **Shot**: the camera's position and the point it looks at (`{ cam, look }`).

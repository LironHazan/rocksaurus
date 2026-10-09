# Making a Short

Read this before you add or change an episode, a character, a prop or a set.

## The owner's house rules

- Every new Short ends with the subscribe card: `export default withOutro(episode)` (`src/episodes/outro.ts`). Keep
  `duration` the story's length; the card adds `OUTRO_LEN`.
- Captions go bottom-left (`title`, `sub`, `punch` in `src/engine/subtitles.ts`), start with a capital letter, and
  carry a light metal joke where one fits.
- Natural sound only (foley, beds, babble), except in scenes where the band plays.
- No real logos or trademarks. A band name as plain text on a tee is fine.
- Show faces: front and three-quarter views. Avoid shots of a dinosaur's back.

## An episode

1. Copy a neighbour folder (`omli-audition` is a recent, complete one): `timeline.ts` (cues, chat, lines),
   `captions.ts`, `sound.ts`, `sets.ts`, `cast.ts`, `index.ts`, and a `timeline.test.ts` for the timing.
2. Declare `const episode: Episode = {…}`, then `export default withOutro(episode)`.
3. Register it in a folder in `src/episodes/index.ts`. The first episode of the first folder is the studio default.
4. Film it with the director (`src/engine/director.ts`): `direct(stage, locations, where)` returns `update` and
   `dispose`. Each location is `{ scene, cast?, frame(t) }`, where `frame` poses the location and returns its `Shot`;
   `where` is a cut list (`cuts([[0, 'home'], [CUE.arrive, 'campus']])`). Do not set `stage.scene` or the camera
   yourself.
5. A joke variant spreads an existing episode and replaces only `id`, `title` and `captions`
   (`episodes/rory-friday/index.ts`).

## A character

- Return the `CharacterRig` shape (`src/characters/types.ts`), so `resetPose`, `idle` and `reachArm` work on it.
- Build the tail with `growTail()` (`src/characters/tail.ts`): one tapered tube whose first spine point is inside the
  body. Never a cone stuck on the back: it shows a seam and looks detached (this bug came back three times).
- Clothes and hair read the rig's `fit`, so publish it if the character wears fitted props.

## A band member

Return `Performer { root, update(t) }` and take `(part, clock: SongClock)` (`src/band/types.ts`). Read
[audio.md](audio.md) for the part formats.

## Checking a shot

- Pin the camera: add `&cam=x,y,z,lookX,lookY,lookZ` to the studio URL.
- A registered Short is played through by `npm run check` (`src/episodes/episodes.smoke.test.ts`): it fails on an
  error in `setup()`/`update(t)` or a mesh with `NaN` vertices. See [browser-testing.md](browser-testing.md).
- A set or prop that two Shorts use goes into `src/world/` or `src/props/`, never imported from another episode
  (`npm run lint:boundaries` fails on that).

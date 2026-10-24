# Rory's Guitar Lessons: a Short series on theory and tabs

Rory (guitar) starts music lessons. Each Short teaches one idea: a scale, a mode, a chord inversion. The screen is
split: the 3D scene on top, a real guitar tab below it that scrolls in time with the playing. Lulu drops in now and
then (drums under the lesson, or a cameo at the end).

Status: **plan, not approved.** Nothing is built yet. The open decisions are at the end.

## Goals

- Each lesson is a short that teaches one concept a guitarist can use, with correct tab.
- The tab and the sound come from the same data, so what you see is what you hear.
- A viewer can pause the Short and play along from the tab on screen.

## Constraints from the repo

These come from `AGENTS.md` and `docs/agents/`. Every lesson must follow them.

- **Pure function of time.** The tab playhead, the fretting hand and the sound all come from `t`. No frame counters,
  no `Date.now()`, no `Math.random()`.
- **three.js only**, built imperatively in `src/world/`, `src/props/` and `src/characters/`.
- **Lessons are episodes.** Each one is a folder under `src/episodes/` with `index.ts`, `timeline.ts`, `captions.ts`,
  `music.ts`, and `timeline.test.ts`. Register it in `src/episodes/index.ts` in a new folder "Rory's Guitar Lessons".
  Every Short ends with `withOutro(episode)`.
- **Shared code is not imported from another episode.** The tab overlay, the fretboard and the theory data go in
  modules that episodes can import (see Architecture).
- **Captions** start with a capital letter and carry a metal joke. They stay out of the bottom of the frame (below).
- **Safe area.** On Shorts, YouTube covers the bottom ~25% of the frame. `FORMATS.shorts.safe` is `top 0.17`,
  `bottom 0.745`. Everything that matters sits between those two lines.

## Screen layout (9:16, 1080 × 1920)

```
 0.00 ┌──────────────────────────────┐
      │  title card / caption        │  ← top-left, boxed (engine TOP_LEFT convention)
 0.17 │──────────────────────────────│  ← YouTube safe area starts
      │                              │
      │   3D scene: Rory + Lulu      │  3D: Rory's face and both hands
      │   close-up on the fretboard  │  in view, ¾ view; fretboard prop
      │                              │
 0.52 │──────────────────────────────│
      │   TAB STAVE (2D overlay)     │  6 lines, scrolling playhead,
      │   e B G D A E  ← string names│  beat grid, fret numbers
 0.745│──────────────────────────────│  ← YouTube safe area ends
      │   (covered by YouTube UI)    │  nothing that matters here
 1.00 └──────────────────────────────┘
```

Decisions this layout makes (see Open decisions):

- **The tab sits in the middle band (0.52 to 0.745)**, not the bottom quarter, so YouTube's UI doesn't cover it.
  The 3D scene takes the top ~50%.
- **Captions move to the top-left, boxed.** The bottom is taken by the tab. `src/engine/subtitles.ts` already has a
  `TOP_LEFT` style with a backdrop, so no new caption code is needed.
- **The tab is drawn as a 2D overlay** through `Stage.render(overlay)`, like the captions. That overlay is composited
  onto the output canvas, so the recorder captures it.

## Architecture

| Piece                 | Where                                                                                       | Why                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Theory data (pure)    | `src/theory/` : notes, tuning, intervals, scales, modes, chord shapes, inversions           | No dependencies, so it can be unit-tested in isolation.                                                                                                    |
| Tab stave overlay     | `src/engine/tab-stave.ts`                                                                   | Alongside `captions.ts` and `subtitles.ts`: a 2D overlay drawn from `t`. Takes a `Tab` (strings, bars, notes) and returns a draw function.                |
| Fretboard prop        | `src/props/fretboard.ts`                                                                    | A neck with frets and string positions, so the camera can show the hand on the right string and fret.                                                    |
| Fretting hand         | `src/characters/` (extend `rocker.ts`) or a new `src/band/` helper                          | Today `guitarist.ts` picks a fret from pitch along the neck. A lesson needs an exact string and fret. See Risks.                                           |
| Lesson template       | `src/lessons/` (shared; band layer)                                                         | Turns a lesson's `Tab` into the timeline (note times, bars), the tab overlay and the fretting-hand targets. Each lesson supplies data only.               |
| Lesson episodes       | `src/episodes/guitar-lessons/<lesson>/`                                                     | One per lesson: its tab data, captions, and its beat sheet.                                                                                                |
| Registration          | `src/episodes/index.ts`                                                                     | New folder: `{ id: 'guitar-lessons', title: "Rory's Guitar Lessons", episodes: [...] }`.                                                                   |

Before any code is written, check the layers against `.dependency-cruiser.cjs`
(`features → episodes → band → characters, props, world → engine → audio`). `src/lessons/` must sit at the band layer,
and `src/theory/` must import nothing. `npm run lint:boundaries` decides this, not the plan.

## The tab data

A lesson's tab is literal data, written by hand, the same way the other Shorts keep their note tables.

```ts
// one note: [beat, string, fret] — string 1 = high e, 6 = low E; fret 0 = open
type TabNote = readonly [beat: number, string: number, fret: number, len?: number];
```

Two guarantees, both checked in Vitest, not by eye:

1. **The tab matches its theory.** Each lesson names its scale, mode or chord (for example `dorian('A')`). A test
   derives the pitches from the tab and checks they are exactly that scale or chord, with each note's interval
   correct. A wrong fret fails the build.
2. **The sound matches the tab.** The notes are scheduled from the same `TabNote` list (through `playRiff` or
   `playLeadGuitar`), so a test checks that the scheduled MIDI pitches equal the pitches of the tab.

## Syllabus (first batch: 8 lessons)

Each Short is about 45 to 55 s, plus the outro. Units are ordered so each one builds on the last.

| #   | Short                    | Concept                                                    | Tab shows                                                                 | Lulu            |
| --- | ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------- | --------------- |
| 1   | Reading tab              | Strings, frets, the beat grid, the playhead                | An open-string pattern with one fret up                                   | cameo           |
| 2   | Minor pentatonic         | The five-note box, the shape you'll use most               | Box 1 in A, up and down                                                   | drums           |
| 3   | Natural minor            | Aeolian: W H W W H W W                                     | A minor, two octaves, one position                                        | cameo           |
| 4   | Harmonic minor           | Raised 7th, the augmented 2nd                              | A harmonic minor; the gap is labelled                                     | drums           |
| 5   | Melodic minor            | Raised 6th and 7th going up, natural going down            | Ascending and descending lines, both written                              | cameo           |
| 6   | Dorian                   | Minor with a raised 6th: the sound of Santana and Miles    | A Dorian in one position, a ii–IV bass line under it                      | drums           |
| 7   | Lydian and Mixolydian    | Raised 4th; flat 7th over a major chord                    | Two short licks, the same shape with one note moved                       | cameo           |
| 8   | Chord inversions         | Root, 1st and 2nd inversion of a major triad                | Three voicings of C on the same strings, with the bass note marked        | drums           |

Later batches, not in this plan: Phrygian, Locrian and the other modes; barre chords; drop-2 voicings; sevenths
and their inversions; the blues scale; bends and vibrato as techniques; ii–V–I and modal interchange. Each one reuses
the same template, so a new lesson is data plus a beat sheet.

## Lesson template (each Short)

Same shape each time, so a viewer knows the rhythm of the series:

| Time (s)   | What happens                                                                               |
| ---------- | ------------------------------------------------------------------------------------------ |
| 0 – 2      | Title card, top-left: `🎸 Lesson 6 · Dorian`                                               |
| 2 – 6      | Rory explains the idea in one caption; the tab fades in                                    |
| 6 – 40     | Rory plays it at a slow tempo; the playhead moves across the tab; camera on the fretting hand |
| 40 – 46    | Lulu or Tiki joins (drums or a line), or the lesson ends on a chord                       |
| 46 – end   | A punchline (metal joke); `withOutro`                                                       |

## Risks

1. **Exact string and fret.** `src/band/guitarist.ts` sets the fret from pitch along the neck, not from a string and a
   fret number, so a viewer could see a note played on the wrong string. The fix: extend the fretting-hand pose to take
   `{ string, fret }` for lessons, and leave the existing band code unchanged. This is the largest piece of new work,
   so it goes first, before any lesson.
2. **Legibility on a phone.** Fret numbers and string names must read at phone size. Set their size as a fraction of
   the frame's short side, and check the result in a screenshot at 1080 × 1920 before writing the rest.
3. **Music theory errors.** A wrong note is a public mistake on a channel. The tests in "The tab data" are what stop
   it. Review each tab by ear as well.
4. **Frame cost.** Each Short adds a 3D scene and a 2D overlay. The smoke test plays every Short through in jsdom,
   so the new episodes add a few seconds to `npm run check`. Keep the scenes shared where possible.
5. **Public deploy.** `main` deploys the `/watch` player to GitHub Pages, so the lessons go public when merged. See the
   open decisions.

## Phases

1. **Theory core.** `src/theory/`: notes, intervals, scales, modes, triads, inversions, tuning. Vitest for each formula.
2. **Tab stave overlay.** `src/engine/tab-stave.ts`: draw from `t`, with a snapshot test of the drawn commands (not
   pixels). Screenshot it in DevTools at 1080 × 1920.
3. **Fretting hand.** Exact string and fret, with the fretboard prop. Test: for each tab note, the hand's target
   matches the string and fret.
4. **Pilot: lesson 2, Minor pentatonic.** One full Short end to end: scene, tab, sound, captions, outro, tests.
   Review it by ear and on screen before building the rest. This is the check that the template works.
5. **The other seven lessons**, each with its tests, and the folder registered in `src/episodes/index.ts`.
6. **Checks.** `npm run check`, `npm run build`, `npm run test:e2e`, then a look at the watch page through
   `npm run build:public`.

Each phase is a separate commit on a branch. Nothing is pushed or opened as a PR until you say so.

## Open decisions

These are the choices the plan can't make alone. Each has a recommendation.

1. **Layout.** The tab in the middle band (0.52 to 0.745), the 3D scene above it. *Recommended.* The alternative, a
   tab in the bottom quarter, is covered by YouTube's buttons.
2. **Captions.** Top-left and boxed, as the engine already does for busy shots. *Recommended.* The alternative is to
   drop the subtitles and use only the tab.
3. **Sound.** The house rule is natural sound only, except where the band plays. A lesson is the band playing, so
   synthesized guitar, bass and drums fit. Confirm you're fine with that exception.
4. **Lulu.** Drums under lessons 2, 4, 6 and 8, and a cameo in the others. *Recommended.* The alternative is no drums
   at all, which keeps the lessons about the guitar.
5. **Public.** The lessons go on `main` and are visible on the public `/watch` page. *Recommended, since they are
   Shorts.* The alternative is to keep them studio-only until the first batch is reviewed.
6. **First batch.** Eight lessons as listed above. *Recommended.* The alternative is a pilot of one lesson, reviewed
   before the rest is planned.
7. **Length.** 45 to 55 s of story, plus the outro. *Recommended.*

Once these are decided, phase 1 starts.

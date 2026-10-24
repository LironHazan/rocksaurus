# Rory's Guitar Lessons: a Short series on theory and tabs

Rory (guitar) starts music lessons. Each Short teaches one idea: a scale, a mode, a chord inversion. The screen is
split: the 3D scene on top, a real guitar tab below it that scrolls in time with the playing. Lulu drops in now and
then (drums under the lesson, or a cameo at the end).

Status: **plan, not approved.** Nothing is built yet. The open decisions are at the end.

## Goals

- Each lesson teaches one concept a guitarist can use, with correct tab, in a musical setting.
- The tab and the sound come from the same data, so what you see is what you hear.
- A viewer can pause the Short and play along from the tab on screen.

## How each lesson teaches

Taught from the research (see Sources). The lessons follow these rules:

1. **Sound before names.** The groove plays first with no labels. The viewer hears the mood, then Rory names it.
2. **A mode lives in a context.** Every mode arrives over a chord or a groove, never as a bare shape. A mode is defined
   by its *characteristic note* against that chord (Dorian: the raised 6th over a minor chord). The lesson points at
   that note.
3. **One mode per groove.** Stay in one mode over a vamp so the viewer can hear it, without tracking chord changes.
   This is the Berklee PULSE approach. The chord-by-chord approach comes after, in the batch on progressions.
4. **Shape comes last.** The tab shows the fretboard shape only after the viewer knows the sound. Each shape is
   played over a drone or the groove, not alone.
5. **Ear and theory together.** Each lesson asks the viewer to hear the note before reading it. A later "name that
   mode" Short tests it.
6. **Tie it back to the band.** Each lesson uses a riff or a groove the band already plays (for example the gypsy-jazz
   and blues episodes), so the theory lands in a song a viewer knows from the channel.

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

| Piece              | Where                                                             | Why                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Theory data (pure) | `src/theory/`: notes, tuning, intervals, scales, modes, chords    | No dependencies, so it can be unit-tested in isolation.                                                                                         |
| Tab stave overlay  | `src/engine/tab-stave.ts`                                         | Alongside `captions.ts` and `subtitles.ts`: a 2D overlay drawn from `t`. Takes a `Tab` (strings, bars, notes) and returns a draw function.     |
| Fretboard prop     | `src/props/fretboard.ts`                                          | A neck with frets and string positions, so the camera can show the hand on the right string and fret.                                          |
| Fretting hand      | `src/characters/` (extend `rocker.ts`) or a new `src/band/` helper | Today `guitarist.ts` picks a fret from pitch along the neck. A lesson needs an exact string and fret. See Risks.                              |
| Lesson template    | `src/lessons/` (shared; band layer)                               | Turns a lesson's `Tab` into the timeline (note times, bars), the tab overlay and the fretting-hand targets. Each lesson supplies data only.     |
| Lesson episodes    | `src/episodes/guitar-lessons/<lesson>/`                           | One per lesson: its tab data, captions, and its beat sheet.                                                                                     |
| Registration       | `src/episodes/index.ts`                                           | New folder: `{ id: 'guitar-lessons', title: "Rory's Guitar Lessons", episodes: [...] }`.                                                        |

Before any code is written, check the layers against `.dependency-cruiser.cjs`
(`features → episodes → band → characters, props, world → engine → audio`). `src/lessons/` must sit at the band layer,
and `src/theory/` must import nothing. `npm run lint:boundaries` decides this, not the plan.

## The tab data

A lesson's tab is literal data, written by hand, the same way the other Shorts keep their note tables.

```ts
// one note: [beat, string, fret, len?] — string 1 = high e, 6 = low E; fret 0 = open
type TabNote = readonly [beat: number, string: number, fret: number, len?: number];
```

Two guarantees, both checked in Vitest, not by eye:

1. **The tab matches its theory.** Each lesson names its scale, mode or chord (for example `dorian('A')`). A test
   derives the pitches from the tab and checks they are exactly that scale or chord, with each note's interval
   correct. A wrong fret fails the build.
2. **The sound matches the tab.** The notes are scheduled from the same `TabNote` list (through `playRiff` or
   `playLeadGuitar`), so a test checks that the scheduled MIDI pitches equal the pitches of the tab.

## Syllabus (first batch: 7 lessons)

Each Short is about 45 to 55 s, plus the outro. The order builds from the minor world the band already lives in, then
moves to the modes, and ends on chords.

| #   | Short                 | Context (the groove the viewer hears first)                  | Characteristic note / idea                   | Tab shows                                          | Lulu    |
| --- | --------------------- | ------------------------------------------------------------ | -------------------------------------------- | -------------------------------------------------- | ------- |
| 1   | Minor pentatonic      | Rory's rock riff over an Am vamp, the one he already plays   | Five notes, no 2nd or 6th                    | Box 1 in A, up and down, over the vamp             | drums   |
| 2   | Natural minor         | A sad minor verse over Am, one chord                         | Home minor: W H W W H W W                    | A minor, one position                              | cameo   |
| 3   | Dorian                | An Am7 funk vamp                                             | The raised 6th (F♯ over Am)                  | A Dorian in one position, over the vamp            | drums   |
| 4   | Harmonic minor        | A gypsy cadence: E7 → Am, the minor-key "sting"              | The raised 7th (G♯) and the gap of an aug. 2nd | A harmonic minor; the gap is labelled             | cameo   |
| 5   | Melodic minor         | An Am(maj7) vamp, a jazz line that climbs and falls          | Raised 6th and 7th going up, natural going down | Ascending and descending lines, both written     | drums   |
| 6   | Mixolydian and Lydian | G7 vamp (Mixolydian: the flat 7th); C → D vamp (Lydian: the raised 4th) | Flat 7th over major; raised 4th over major   | Two short lines, one note moved between them     | cameo   |
| 7   | Chord inversions      | I–IV–V in C, the same chord played three ways                | Root, 1st and 2nd inversion of a major triad | Three voicings of C on the same strings, bass marked | drums   |

Drums under lessons 1, 3, 5 and 7; cameo in 2, 4 and 6.

### Suggested next batch (not in batch 1)

These come from the research and from the band's existing work. Each one needs a groove first, as above.

- **Phrygian**, over an E power-chord groove: the metal sound, with the flat 2nd as its characteristic note. It fits
  a metal band better than any other mode.
- **Phrygian dominant** (harmonic minor's 5th mode), over E7: the flamenco-Spanish sound from lesson 4's cadence.
- **Blues scale in a 12-bar blues**, tied to the blues-rehearsal episode.
- **ii–V–I with arpeggios**, the chord-by-chord approach, after the one-mode-per-groove lessons.
- **"Name that mode" ear test**: the viewer hears a groove, then guesses, then sees the answer. The research points to
  this as the final step of the series.

## Lesson template (each Short)

Same shape each time, so a viewer knows the rhythm of the series. Sound comes before names:

| Time (s)   | What happens                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------- |
| 0 – 2      | Title card, top-left: `🎸 Lesson 3 · Dorian`                                                  |
| 2 – 8      | The groove plays with no labels; the camera is on the band. No tab yet.                       |
| 8 – 12     | Rory names the characteristic note; the tab fades in with the groove                          |
| 12 – 40    | Rory plays the mode over the groove, slowly; the playhead moves across the tab; camera on the fretting hand |
| 40 – 46    | Lulu or Tiki joins (drums or a line), or the lesson ends on a chord                           |
| 46 – end   | A punchline (metal joke); `withOutro`                                                         |

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
6. **Research is thin.** The pedagogy sources found are mostly practitioner advice and small studies. The plan follows
   them where they agree, and the lessons should be checked against the viewers' responses once the first ones are out.

## Phases

1. **Theory core.** `src/theory/`: notes, intervals, scales, modes, triads, inversions, tuning. Vitest for each formula.
2. **Tab stave overlay.** `src/engine/tab-stave.ts`: draw from `t`, with a snapshot test of the drawn commands (not
   pixels). Screenshot it in DevTools at 1080 × 1920.
3. **Fretting hand.** Exact string and fret, with the fretboard prop. Test: for each tab note, the hand's target
   matches the string and fret.
4. **Pilot: lesson 1, Minor pentatonic.** One full Short end to end: scene, tab, sound, captions, outro, tests.
   Review it by ear and on screen before building the rest. This is the check that the template works.
5. **The other six lessons**, each with its tests, and the folder registered in `src/episodes/index.ts`.
6. **Checks.** `npm run check`, `npm run build`, `npm run test:e2e`, then a look at the watch page through
   `npm run build:public`.

Each phase is a separate commit on a branch. Nothing is pushed or opened as a PR until you say so.

## Sources

Pedagogy research for the "How each lesson teaches" section. Mostly practitioner sources and small studies; no
controlled comparison of teaching methods for guitar modes was found.

- Context over bare patterns: [Practice with context (mt4e)](https://mt4e.substack.com/p/practice-with-context);
  [The Best Way To Practice Guitar Scale](https://fachords.com/practice-scale-in-context). Both argue scale shapes
  without musical reference lead to aimless playing.
- Drone and root reference: [Guitar Scales In Context](https://staff.deervalley.com/default.aspx/u32BAF/244531/Guitar%20Scales%20In%20Context%20A%20Practical%20Encyclopaedi.pdf).
- One mode over a groove, Dorian as the characteristic-note example: [Berklee PULSE, Dorian lesson](https://pulse.berklee.edu/content/public/pub_unit_assets/lessons/lesson10_dorian/Improvisation_Dorian_Lesson.pdf).
- Dorian's colour is the major 6th, and modes are used over chord qualities:
  [Fretjam, Basic Dorian Mode Theory](https://fretjam.com/dorian-mode-guitar.html); [Premier Guitar, The Modes Part 2](https://www.premierguitar.com/articles/The_Modes_Part_2).
- Ear and theory taught together: Peter Vandemoortele's root-motion study (harmonic ear training works best alongside
  basic theory), reported in [Aural Skills Pedagogy: From Academic Research To The Everyday Classroom (Beckman, Texas
  State)](https://digital.library.txstate.edu/items/be0c84b4-c5cc-4388-8cda-84536ed687fd/full).
- Tension to watch: Premier Guitar's chord-by-chord approach and Berklee's one-mode-per-groove approach are both in
  use. The plan uses one-mode-per-groove first, then chord-by-chord.

## Open decisions

These are the choices the plan can't make alone. Each has a recommendation.

1. **Layout.** The tab in the middle band (0.52 to 0.745), the 3D scene above it. *Recommended.* The alternative, a
   tab in the bottom quarter, is covered by YouTube's buttons.
2. **Captions.** Top-left and boxed, as the engine already does for busy shots. *Recommended.* The alternative is to
   drop the subtitles and use only the tab.
3. **Sound.** The house rule is natural sound only, except where the band plays. A lesson is the band playing, so
   synthesized guitar, bass and drums fit. Confirm you're fine with that exception.
4. **Lulu.** Drums under lessons 1, 3, 5 and 7, and a cameo in the others. *Recommended.* The alternative is no drums
   at all, which keeps the lessons about the guitar.
5. **Public.** The lessons go on `main` and are visible on the public `/watch` page. *Recommended, since they are
   Shorts.* The alternative is to keep them studio-only until the first batch is reviewed.
6. **First batch.** Seven lessons as listed above. *Recommended.* Or add Phrygian from the suggested batch now, since
   it is the most useful mode for a metal band.
7. **Length.** 45 to 55 s of story, plus the outro. *Recommended.*

Once these are decided, phase 1 starts.

# Rory's Guitar Lessons: a Short series on theory and tabs

Rory (guitar) starts music lessons. Each Short teaches one idea: a scale, a mode, a chord, a rule of harmony. The screen
is split: the 3D scene on top, a real guitar tab below it that scrolls in time with the playing. Lulu drops in now and
then (drums under the lesson, or a cameo at the end).

Status: **plan, not approved.** Nothing is built yet. The open decisions are at the end.

## Goals

- The series covers the theory a guitarist needs, in the order it depends on: intervals, the major scale, chords in a
  key, then every mode and its chords.
- Each lesson teaches one concept, with correct tab, in a musical setting.
- The tab and the sound come from the same data, so what you see is what you hear.
- A viewer can pause the Short and play along from the tab on screen.

## How each lesson teaches

Taught from the research (see Sources). The lessons follow these rules:

1. **Sound before names.** The groove plays first with no labels. The viewer hears the mood, then Rory names it.
2. **A mode lives in a context.** Every mode arrives over a chord or a groove, never as a bare shape. A mode is defined
   by its *characteristic note* against that chord (Dorian: the raised 6th over a minor chord). The lesson points at
   that note.
3. **One mode per groove.** Stay in one mode over a vamp so the viewer can hear it, without tracking chord changes.
   This is the Berklee PULSE approach. The chord-by-chord approach comes later, in batch 5.
4. **Shape comes last.** The tab shows the fretboard shape only after the viewer knows the sound. Each shape is
   played over a drone or the groove, not alone.
5. **Ear and theory together.** Each lesson asks the viewer to hear the note before reading it. "Name that mode" Shorts
   test it at the end of each family.
6. **Each lesson builds on the one before.** A mode is taught after the major scale and the chords it is made from.
7. **Tie it back to the band.** Each lesson uses a riff or a groove the band already plays where one fits (for example
   the gypsy-jazz and blues episodes).

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
- **Lessons with no fretboard content** (the circle of fifths, cadences) use the same overlay for a diagram in place of
  the tab.

## Architecture

| Piece              | Where                                                              | Why                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Theory data (pure) | `src/theory/`: notes, tuning, intervals, scales, modes, chords     | No dependencies, so it can be unit-tested in isolation. Holds the major scale, the three families of modes and their diatonic chords.          |
| Tab stave overlay  | `src/engine/tab-stave.ts`                                          | Alongside `captions.ts` and `subtitles.ts`: a 2D overlay drawn from `t`. Takes a `Tab` (strings, bars, notes) and returns a draw function.     |
| Diagram overlay    | `src/engine/diagram.ts`                                            | For the circle of fifths and similar, drawn from `t` on the same overlay.                                                                      |
| Fretboard prop     | `src/props/fretboard.ts`                                           | A neck with frets and string positions, so the camera can show the hand on the right string and fret.                                          |
| Fretting hand      | `src/characters/` (extend `rocker.ts`) or a new `src/band/` helper | Today `guitarist.ts` picks a fret from pitch along the neck. A lesson needs an exact string and fret. See Risks.                                |
| Lesson template    | `src/lessons/` (shared; band layer)                                | Turns a lesson's `Tab` into the timeline (note times, bars), the overlay and the fretting-hand targets. Each lesson supplies data only.         |
| Lesson episodes    | `src/episodes/guitar-lessons/<lesson>/`                            | One per lesson: its tab or diagram data, captions, and its beat sheet.                                                                          |
| Registration       | `src/episodes/index.ts`                                            | New folder: `{ id: 'guitar-lessons', title: "Rory's Guitar Lessons", episodes: [...] }`.                                                        |

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

The theory data is checked the same way: `src/theory/` tests that each mode's step pattern and characteristic note are
right, and that each family's seven modes are the seven rotations of its parent scale.

## Curriculum

Each Short is about 45 to 55 s, plus the outro. The series is 38 Shorts in five batches. Each batch depends only on the
ones before it.

### Batch 1: foundations (7 Shorts)

| #   | Short                         | Context (the groove or example)                                  | Idea                                                                                              | Tab / diagram                                          | Lulu  |
| --- | ----------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----- |
| 1   | Intervals                     | Two notes over an A drone: m3, M3, P5, the octave                | The 12 notes, half and whole steps; interval names by ear                                         | Two-note shapes on adjacent strings                    | cameo |
| 2   | The major scale               | A C major vamp                                                   | W W H W W W H: the parent of every mode in this series                                            | One-octave box, two positions                          | drums |
| 3   | Scale degrees and modes       | The same seven notes started on D, over a Dm chord               | Degrees 1–7 and their names; a mode is the major scale started on a different degree               | The major scale on one string set, from each degree     | cameo |
| 4   | Diatonic triads               | I–IV–V–vi in C                                                   | The chord built on each degree: I ii iii IV V vi vii°; functions tonic, subdominant, dominant      | Triad shapes on three strings                          | drums |
| 5   | Diatonic sevenths             | A I–vi–IV–V loop with sevenths                                   | Maj7, m7, dom7, m7♭5 on each degree                                                               | Seventh shapes                                         | cameo |
| 6   | Keys and the circle of fifths | One groove played in G, then in F                                | Key signatures; relative keys (C ↔ Am); why keys sit a fifth apart                                | Diagram: the circle, no tab                            | drums |
| 7   | Cadences                      | The endings of songs: V–I, IV–I, V–vi, I–V                       | How a phrase ends; what the ear expects next                                                      | Chord shapes, no scale                                 | cameo |

Pilot: lesson 2, the major scale.

### Batch 2: the minor world and the modes of major (10 Shorts)

| #   | Short                    | Context (the groove or example)                                          | Characteristic note / idea                          | Tab shows                                             | Lulu  |
| --- | ------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------- | ----------------------------------------------------- | ----- |
| 8   | Natural minor            | A sad minor verse over Am, one chord                                     | Home minor: W H W W H W W (Aeolian)                 | A minor, one position                                 | cameo |
| 9   | Minor pentatonic         | Rory's rock riff over an Am vamp, the one he already plays               | Five notes: no 2nd, no 6th                          | Box 1 in A, up and down, over the vamp                | drums |
| 10  | Dorian                   | An Am7 funk vamp                                                         | The raised 6th (F♯ over Am)                         | A Dorian in one position, over the vamp               | cameo |
| 11  | Mixolydian               | A G7 vamp                                                                | The flat 7th over a major chord                     | One position, over the vamp                           | drums |
| 12  | Lydian                   | A C → D vamp                                                             | The raised 4th over a major chord                   | One position, over the vamp                           | cameo |
| 13  | Phrygian                 | An E power-chord groove, the metal sound                                 | The flat 2nd over a minor chord                     | One position, over the groove                         | drums |
| 14  | Locrian                  | A half-diminished chord with nothing to resolve to                       | The flat 5th: why Locrian is rare as a home key     | One position, over the chord                          | cameo |
| 15  | Harmonic minor           | A gypsy cadence: E7 → Am, the minor-key "sting"                          | Raised 7th (G♯) and the gap of an augmented 2nd     | A harmonic minor; the gap is labelled                 | drums |
| 16  | Melodic minor            | An Am(maj7) vamp, a jazz line that climbs and falls                      | Raised 6th and 7th going up, natural going down     | Ascending and descending lines, both written          | cameo |
| 17  | Chord inversions         | I–IV–V in C, the same chord played three ways                            | Root, 1st and 2nd inversion of a major triad        | Three voicings of C on the same strings, bass marked  | drums |

### Batch 3: the harmonic minor family (7 Shorts)

The seven modes of harmonic minor, each over the chord built on its degree in harmonic minor. Each is taught as a home
key's sound, not a shape.

| #   | Short                                       | Characteristic note                           | Context                                              |
| --- | ------------------------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| 18  | Locrian ♮6 (from degree 2)                  | Natural 6th; the half-diminished home chord   | A ii°7 → V7 → i turnaround                           |
| 19  | Ionian ♯5 (from degree 3)                   | Augmented 5th                                 | A bright III+ chord under a major groove             |
| 20  | Dorian ♯4 (from degree 4): "the minor #4"   | Raised 4th: in D, G♯; steps W H A2 H W H W    | A Dm vamp with the ♯4 lick on top                    |
| 21  | Phrygian dominant (from degree 5)           | Raised 3rd over a dominant chord: the flamenco sound | E7 → Am, the gypsy cadence from lesson 15     |
| 22  | Lydian ♯2 (from degree 6)                   | Raised 2nd                                    | A VI chord (F major) with the ♯2 on top              |
| 23  | Super Locrian ♭♭7 (from degree 7)           | Altered 7th: the diminished-7 sound           | A vii° chord, the most dissonant home sound          |
| 24  | Name that mode: harmonic minor              | The six modes above, one groove each          | The ear test for the family                          |

### Batch 4: the melodic minor family (7 Shorts)

The seven modes of melodic minor. Each is taught over the chord built on its degree in melodic minor.

| #   | Short                                        | Characteristic note                        | Context                                                     |
| --- | -------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| 25  | Dorian ♭2 (from degree 2)                    | Flat 2nd                                   | A ii-type chord with the ♭2 lick                            |
| 26  | Lydian augmented (from degree 3)             | Raised 5th                                 | An augmented chord under a bright groove                    |
| 27  | Lydian dominant (from degree 4)              | Raised 4th (♯11) over a dominant chord     | A G7 vamp with the ♯11 on top                               |
| 28  | Mixolydian ♭6 (from degree 5)                | Flat 6th over a dominant chord             | An A7 vamp with the ♭6 on top                               |
| 29  | Locrian ♮2 (from degree 6)                   | Natural 2nd over a half-diminished chord   | A half-diminished chord with the natural 2nd on top         |
| 30  | Altered (from degree 7)                      | Every altered tension over a dominant      | A V7alt → I cadence                                         |
| 31  | Name that mode: melodic minor                | The six modes above, one groove each       | The ear test for the family                                 |

### Batch 5: putting it together (7 Shorts)

| #   | Short                       | Context                                     | Idea                                                         |
| --- | --------------------------- | ------------------------------------------- | ------------------------------------------------------------ |
| 32  | ii–V–I with arpeggios       | A jazz turnaround                           | The chord-by-chord approach: each chord gets its own mode    |
| 33  | Modal interchange           | Borrowing a chord from the parallel key     | Why a minor chord can sit in a major song                    |
| 34  | Blues scale in a 12-bar     | The blues-rehearsal episode's progression   | The ♭5 blue note over the 12-bar form                        |
| 35  | Secondary dominants         | V/V, V/ii: a dominant that points at a chord | How a chord leans on the next one                            |
| 36  | Reading a chord chart       | A short song with a chart on screen         | Symbols, slash chords, and the form                          |
| 37  | Major pentatonic            | A bright major groove                       | The shape that goes with the major scale, and its box        |
| 38  | Name that mode, full set    | Every mode in this series, one groove each  | The final ear test; the series closes on it                  |

## Lesson template (each Short)

Same shape each time, so a viewer knows the rhythm of the series. Sound comes before names:

| Time (s)   | What happens                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------- |
| 0 – 2      | Title card, top-left: `🎸 Lesson 10 · Dorian`                                                 |
| 2 – 8      | The groove plays with no labels; the camera is on the band. No tab yet.                       |
| 8 – 12     | Rory names the characteristic note; the tab (or diagram) fades in with the groove             |
| 12 – 40    | Rory plays the idea over the groove, slowly; the playhead moves across the tab; camera on the fretting hand |
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
   it. Review each tab by ear as well. The mode formulas are the most likely place for a mistake, so they get the
   strictest test.
4. **Frame cost.** Each Short adds a 3D scene and a 2D overlay. The smoke test plays every Short through in jsdom,
   so the new episodes add a few seconds to `npm run check`. 38 Shorts is a real cost: keep the scenes shared where
   possible.
5. **Public deploy.** `main` deploys the `/watch` player to GitHub Pages, so the lessons go public when merged. See the
   open decisions.
6. **Research is thin.** The pedagogy sources found are mostly practitioner advice and small studies. The plan follows
   them where they agree, and the lessons should be checked against the viewers' responses once the first ones are out.

## Phases

1. **Theory core.** `src/theory/`: intervals, the major scale, the three families of modes, triads, sevenths,
   inversions, tuning. Vitest for each formula.
2. **Tab stave and diagram overlays.** `src/engine/tab-stave.ts` and `src/engine/diagram.ts`: draw from `t`, with a
   snapshot test of the drawn commands (not pixels). Screenshot them in DevTools at 1080 × 1920.
3. **Fretting hand.** Exact string and fret, with the fretboard prop. Test: for each tab note, the hand's target
   matches the string and fret.
4. **Pilot: lesson 2, the major scale.** One full Short end to end: scene, tab, sound, captions, outro, tests.
   Review it by ear and on screen before building the rest. This is the check that the template works.
5. **The rest of batch 1**, each with its tests, and the folder registered in `src/episodes/index.ts`.
6. **Batches 2 to 5**, one batch at a time, each reviewed before the next starts.
7. **Checks.** `npm run check`, `npm run build`, `npm run test:e2e`, then a look at the watch page through
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
  use. The plan uses one-mode-per-groove first, then chord-by-chord in batch 5.

## Open decisions

These are the choices the plan can't make alone. Each has a recommendation.

1. **Layout.** The tab in the middle band (0.52 to 0.745), the 3D scene above it. *Recommended.* The alternative, a
   tab in the bottom quarter, is covered by YouTube's buttons.
2. **Captions.** Top-left and boxed, as the engine already does for busy shots. *Recommended.* The alternative is to
   drop the subtitles and use only the tab.
3. **Sound.** The house rule is natural sound only, except where the band plays. A lesson is the band playing, so
   synthesized guitar, bass and drums fit. Confirm you're fine with that exception.
4. **Lulu.** Drums and cameos alternate as in the tables above. *Recommended.* The alternative is no drums at all,
   which keeps the lessons about the guitar.
5. **Public.** The lessons go on `main` and are visible on the public `/watch` page. *Recommended, since they are
   Shorts.* The alternative is to keep them studio-only until batch 1 is reviewed.
6. **Scope.** Batch 1 only (seven Shorts), then review, or the full 38 Shorts planned now? *Recommended: batch 1 only.*
   Batches 2 to 5 are sketched here, but they change once batch 1 is out and the reaction is known.
7. **Length.** 45 to 55 s of story, plus the outro. *Recommended.*
8. **The "minor #4" reading.** I read "minor #4" as the Dorian ♯4, the fourth mode of harmonic minor (lesson 20). If you
   meant something else, say which and it moves.

Once these are decided, phase 1 starts.

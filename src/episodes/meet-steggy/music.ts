import type { KeyboardPart, KeyNote } from '../../audio/keyboard-part';
import type { DrumPart } from '../../audio/drum-patterns';

// Prog-rock in E minor, 4/4 @ 120 BPM: 1 eighth = 0.25 s, 1 bar = 2 s, 6 bars = 12 s.
export const BPM = 120;
export const BEAT = 60 / BPM;
export const ROCK_IN = 2; // seconds: the band kicks in
export const LEAD_IN = 6; // seconds: Steggy switches to the synth lead
export const GLISS = 10; // seconds: lightning run down the keyboard
export const FINAL = 11; // seconds: final chord

type Chord = { root: string; tones: [string, string, string]; pad: string[] };
const CHORDS: Chord[] = [
  { root: 'E3', tones: ['E4', 'G4', 'B4'], pad: ['E3', 'B3', 'G4'] }, // Em
  { root: 'C3', tones: ['E4', 'G4', 'B4'], pad: ['C3', 'G3', 'E4', 'B4'] }, // Cmaj7
  { root: 'A3', tones: ['E4', 'G4', 'C5'], pad: ['A3', 'E4', 'G4', 'C5'] }, // Am7
  { root: 'B3', tones: ['D#4', 'F#4', 'A4'], pad: ['B3', 'D#4', 'F#4', 'A4'] }, // B7
];
const bar = (n: number) => n * 8;

// left hand: 3-3-2 syncopated roots (eighths 0, 3, 6 of each bar) — the prog groove
const leftHand = (b: number, root: string): KeyNote[] =>
  [0, 3, 6].map(e => [bar(b) + e, root, 2.6, 0.55, 'L'] as const);

// right hand: 16th-note arpeggios grouped in threes, so the accents drift across the 4/4 beat
const arpeggio = (b: number, [a, c, d]: [string, string, string]): KeyNote[] =>
  Array.from(
    { length: 16 },
    (_, i) => [bar(b) + i * 0.5, [a, c, d][i % 3]!, 0.45, i % 3 === 0 ? 0.6 : 0.42, 'R'] as const,
  );

export const piano: KeyboardPart = {
  bpm: BPM,
  sound: 'piano',
  notes: [
    // bar 0: dreamy Em9 arpeggio
    ...(['E5', 'B4', 'F#5', 'G5', 'B5', 'G5', 'F#5', 'D5'] as const).map((n, i) => [i, n, 1.6, 0.4, 'R'] as const),
    // bars 1–2: arpeggios over the groove; bars 3–4: left hand only (the right hand takes the lead)
    ...CHORDS.flatMap((c, i) => [...leftHand(i + 1, c.root), ...(i < 2 ? arpeggio(i + 1, c.tones) : [])]),
    // final chord
    [bar(5) + 4, 'E3', 4, 0.6, 'L'],
    [bar(5) + 4, 'B3', 4, 0.55, 'L'],
    ...(['E4', 'G4', 'B4', 'F#5'] as const).map(n => [bar(5) + 4, n, 4, 0.55, 'R'] as const),
  ],
};

/** A right-hand phrase whose notes follow each other with no gaps, from eighth `start`: [note, length in eighths]. */
function legato(start: number, phrase: readonly (readonly [string, number])[]): KeyNote[] {
  let at = start;
  return phrase.map(([note, len]) => {
    const played: KeyNote = [at, note, len, 0.7, 'R'];
    at += len;
    return played;
  });
}

export const leadSynth: KeyboardPart = {
  bpm: BPM,
  sound: 'lead',
  notes: [
    // bar 3 (Am7): singing melody
    ...legato(bar(3), [
      ['A4', 1],
      ['C5', 1],
      ['E5', 1],
      ['G5', 1.5],
      ['E5', 0.5],
      ['D5', 1],
      ['C5', 1],
      ['B4', 1],
    ]),
    // bar 4 (B7): fast harmonic-minor run up, then a held, vibrato note
    ...(['B4', 'C5', 'D#5', 'E5', 'F#5', 'G5', 'A5', 'B5'] as const).map(
      (n, i) => [bar(4) + i * 0.5, n, 0.5, 0.65, 'R'] as const,
    ),
    [bar(4) + 4, 'A5', 1, 0.7, 'R'],
    [bar(4) + 5, 'G5', 1, 0.7, 'R'],
    [bar(4) + 6, 'F#5', 2, 0.75, 'R'],
    // bar 5: lightning run down (32nd notes)
    ...(['B5', 'A5', 'G5', 'F#5', 'E5', 'D#5', 'C5', 'B4', 'A4', 'G4', 'F#4', 'E4'] as const).map(
      (n, i) => [bar(5) + i * 0.25, n, 0.3, 0.6, 'R'] as const,
    ),
  ],
};

export const padSynth: KeyboardPart = {
  bpm: BPM,
  sound: 'pad',
  notes: [
    ...(['E3', 'B3', 'D4', 'F#4', 'G4'] as const).map(n => [0, n, 8, 0.6, 'L'] as const), // Em9 intro wash
    ...CHORDS.slice(2).flatMap((c, i) => c.pad.map(n => [bar(i + 3), n, 8, 0.5, 'L'] as const)), // under the lead
    ...(['E3', 'B3', 'D4', 'F#4', 'G4', 'B4'] as const).map(n => [bar(5) + 4, n, 4, 0.7, 'L'] as const), // final chord
  ],
};

const REST = '................';
const GROOVE = { kick: 'x.....x.....x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' }; // kick follows the 3-3-2
export const drums: DrumPart = {
  bpm: BPM,
  tracks: {
    kick: [REST, GROOVE.kick, GROOVE.kick, GROOVE.kick, GROOVE.kick, '........X.......'].join(' '),
    snare: [REST, GROOVE.snare, GROOVE.snare, GROOVE.snare, '....x.......xxxx', REST].join(' '),
    hat: [REST, GROOVE.hat, GROOVE.hat, GROOVE.hat, 'x.x.x.x.x.x.....', REST].join(' '),
    crash: [REST, 'x...............', REST, 'x...............', REST, '........X.......'].join(' '),
  },
};

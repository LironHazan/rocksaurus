import type { KeyboardPart, KeyNote } from '../../audio/keyboard-part';
import { playKeyboardPart } from '../../audio/keyboard-part';
import { playDrums } from '../../audio/drums';
import { playVocal } from '../../audio/voice';
import { atTime } from '../../audio/schedule';
import { ding, stretch } from '../../audio/sfx';
import * as fx from '../../audio/foley';
import type { DrumPart } from '../../audio/drum-patterns';
import type { VocalPart } from '../../audio/vowels';
import { BAR, BPM, CUE, DURATION, TRY, TRY_AT } from './timeline';

// "Rot Hotic Waltz": a spooky waltz in A minor (the kind of tune a goth shop plays on a loop), 3/4 at 120 BPM.
// An eighth is 0.25 s and a bar is six eighths, so bar n starts at n × 1.5 s. It stays minor while she shops,
// holds a low note while she finds the ring, and turns bright and major at the register.

export const BARS = Math.round(DURATION / BAR); // 23

interface Chord {
  bass: string;
  stab: readonly string[];
}
const CHORDS: Record<string, Chord> = {
  Am: { bass: 'A2', stab: ['C4', 'E4', 'A4'] },
  E7: { bass: 'E2', stab: ['B3', 'D4', 'G#4'] },
  Dm: { bass: 'D2', stab: ['A3', 'D4', 'F4'] },
  F: { bass: 'F2', stab: ['A3', 'C4', 'F4'] },
  A: { bass: 'A2', stab: ['A3', 'C#4', 'E4'] },
  E: { bass: 'E2', stab: ['B3', 'E4', 'G#4'] },
};

/** The chord of each bar. */
export const PLAN: readonly string[] = [
  'Am',
  'E7', // 0–1   the door, the bell
  'Am',
  'E7',
  'Am',
  'Dm',
  'E7',
  'Am',
  'F',
  'E7', // 2–9   browsing
  'Am',
  'E7',
  'Am',
  'Dm',
  'E7', // 10–14  try-ons
  'Am',
  'Am', // 15–16  the ring
  'A',
  'E',
  'A', // 17–19  the register: major
  'E',
  'A',
  'A', // 20–22  roll for initiative
];

/** The tune, by bar: [eighth in the bar, note, length]. */
const TUNE: Record<number, readonly (readonly [number, string, number])[]> = {
  2: [
    [0, 'A4', 2],
    [2, 'C5', 1],
    [3, 'E5', 1],
    [4, 'A5', 2],
  ],
  3: [
    [0, 'G#5', 2],
    [2, 'E5', 1],
    [3, 'B4', 1],
    [4, 'G#4', 2],
  ],
  4: [
    [0, 'A4', 1],
    [1, 'B4', 1],
    [2, 'C5', 2],
    [4, 'E5', 2],
  ],
  5: [
    [0, 'D5', 2],
    [2, 'F5', 2],
    [4, 'A4', 2],
  ],
  6: [
    [0, 'G#4', 1],
    [1, 'B4', 1],
    [2, 'D5', 1],
    [3, 'E5', 1],
    [4, 'G#5', 2],
  ],
  7: [
    [0, 'A5', 3],
    [3, 'E5', 1],
    [4, 'C5', 2],
  ], // the wizard walks out of the curtain
  8: [
    [0, 'C5', 2],
    [2, 'F5', 2],
    [4, 'A5', 2],
  ],
  9: [
    [0, 'B4', 2],
    [2, 'G#4', 2],
    [4, 'E4', 2],
  ],
  10: [
    [0, 'A4', 2],
    [2, 'C5', 1],
    [3, 'E5', 1],
    [4, 'A5', 2],
  ], // the ranger
  11: [
    [0, 'G#5', 2],
    [2, 'E5', 1],
    [3, 'B4', 1],
    [4, 'G#4', 2],
  ],
  12: [
    [0, 'A4', 1],
    [1, 'B4', 1],
    [2, 'C5', 2],
    [4, 'E5', 2],
  ],
  13: [
    [0, 'D5', 3],
    [3, 'C5', 1],
    [4, 'B4', 2],
  ], // the elf
  14: [
    [0, 'G#4', 1],
    [1, 'B4', 1],
    [2, 'D5', 1],
    [3, 'E5', 1],
    [4, 'G#4', 2],
  ],
  17: [
    [0, 'C#5', 2],
    [2, 'E5', 2],
    [4, 'A5', 2],
  ], // major: ka-ching
  18: [
    [0, 'B4', 2],
    [2, 'E5', 2],
    [4, 'G#5', 2],
  ],
  19: [
    [0, 'A5', 3],
    [3, 'E5', 3],
  ],
  21: [[0, 'A5', 6]], // natural 20
};

function organPart(): KeyboardPart {
  const notes: KeyNote[] = [];
  PLAN.forEach((name, bar) => {
    const a = bar * 6;
    const chord = CHORDS[name]!;
    if (bar < 2) {
      for (const n of [...chord.stab, chord.bass]) notes.push([a, n, 6, 0.3]); // a held, spooky chord
    } else if (bar === 15 || bar === 16) {
      // tension: a cluster with a clash in it
      for (const n of ['A3', 'C4', 'E4', bar === 15 ? 'G#4' : 'Bb4']) notes.push([a, n, 6, 0.3]);
    } else if (bar === 20) {
      for (const n of chord.stab) notes.push([a, n, 6, 0.3]);
    } else if (bar === 21) {
      for (const n of [...chord.stab, 'A2', 'E3', 'A5']) notes.push([a, n, 12, 0.5]); // the big chord
    } else if (bar === 22) {
      // rung out by bar 21's long notes
    } else {
      for (const at of [2, 4]) for (const n of chord.stab) notes.push([a + at, n, 1, 0.24]); // pah, pah
    }
  });
  return { bpm: BPM, sound: 'organ', notes, gain: 0.8 };
}

function leadPart(): KeyboardPart {
  const notes: KeyNote[] = [];
  for (const [bar, tune] of Object.entries(TUNE))
    for (const [at, note, len] of tune) notes.push([Number(bar) * 6 + at, note, len, 0.5]);
  // reveal flourishes: a quick run up on each curtain opening
  for (const s of TRY_AT) {
    const a = (s + TRY.open[0]) / 0.25;
    ['A4', 'C5', 'E5', 'A5'].forEach((n, i) => notes.push([a + i * 0.5, n, 0.5, 0.45]));
  }
  return { bpm: BPM, sound: 'lead', notes, gain: 0.55 };
}

/** Light brushes: one string per instrument, twelve 16ths to a bar. */
function drumPart(): DrumPart {
  const rows: Record<string, string[]> = { kick: [], snare: [], hat: [], tom: [], crash: [] };
  const bar = (kick = '', snare = '', hat = '', tom = '', crash = '') => {
    for (const [k, v] of Object.entries({ kick, snare, hat, tom, crash })) rows[k]!.push(v.padEnd(12, '.'));
  };
  for (let b = 0; b < BARS; b++) {
    if (b < 2) bar();
    else if (b <= 14) bar('x', '', '....x...x...');
    else if (b <= 16)
      bar('x.x'); // a heartbeat
    else if (b <= 19) bar('x', '....x...x...', 'x.x.x.x.x.x.');
    else if (b === 20)
      bar('x...x...x...', '', '', '..x.x.x.xxXX'); // roll for initiative
    else if (b === 21) bar('x...x...x...', '....x...x...', '', '', 'X');
    else bar('', '', '', '', 'x');
  }
  return { bpm: BPM, tracks: Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, v.join(' ')])) };
}

/** Paris hums while she browses, and belts the natural 20. [eighth, note, length, vowel, velocity] */
export const vocal: VocalPart = {
  bpm: BPM,
  notes: [
    [12, 'A4', 3, 'u', 0.4],
    [15, 'C5', 3, 'u', 0.4],
    [18, 'B4', 2, 'u', 0.4],
    [20, 'A4', 4, 'u', 0.4],
    [24, 'E5', 4, 'u', 0.4],
    [124, 'E5', 2, 'a', 0.7],
    [126, 'A5', 10, 'a', 0.9],
  ],
};

export type FxKind =
  'bell' | 'step' | 'hangers' | 'swish' | 'sparkle' | 'rustle' | 'stretch' | 'kaching' | 'printer' | 'dice';
export interface Fx {
  at: number;
  kind: FxKind;
}

/** Every sound effect, in order, as data. */
export function effects(): Fx[] {
  const out: Fx[] = [{ at: CUE.bell, kind: 'bell' }];
  for (let t = CUE.walkIn[0]; t < CUE.walkIn[1]; t += 0.42) out.push({ at: t, kind: 'step' });
  for (let t = CUE.browse[0] + 0.3; t < CUE.pick; t += 0.55) out.push({ at: t, kind: 'hangers' });
  out.push({ at: CUE.pick, kind: 'rustle' });
  for (const s of TRY_AT) {
    out.push(
      { at: s + TRY.close[0], kind: 'swish' },
      { at: s + 1.25, kind: 'hangers' },
      { at: s + 1.4, kind: 'rustle' },
      { at: s + TRY.swap, kind: 'sparkle' },
      { at: s + TRY.open[0], kind: 'swish' },
    );
  }
  out.push(
    { at: CUE.notice, kind: 'stretch' },
    { at: CUE.take[1] - 0.2, kind: 'sparkle' },
    { at: CUE.total, kind: 'kaching' },
    { at: CUE.receipt[0], kind: 'printer' },
    { at: CUE.bag, kind: 'rustle' },
    { at: CUE.poof, kind: 'sparkle' },
    { at: CUE.poof, kind: 'swish' },
    { at: CUE.throw, kind: 'swish' },
    { at: CUE.land, kind: 'dice' },
    { at: CUE.nat20, kind: 'sparkle' },
  );
  return out.sort((a, b) => a.at - b.at);
}

export const ORGAN = organPart();
export const LEAD = leadPart();
export const DRUMS = drumPart();
export const EFFECTS = effects();

const PLAYERS: Record<FxKind, (bus: AudioNode, when: number) => void> = {
  bell: (b, w) => ding(b, w, 2093),
  step: fx.footstep,
  hangers: (b, w) => fx.hangers(b, w),
  swish: (b, w) => fx.swish(b, w),
  sparkle: fx.sparkle,
  rustle: fx.rustle,
  stretch: (b, w) => stretch(b, w, 1.2),
  kaching: fx.kaching,
  printer: (b, w) => fx.printer(b, w),
  dice: fx.diceRoll,
};

export function soundtrack(bus: AudioNode, t0: number): void {
  const drums = new GainNode(bus.context, { gain: 0.5 }); // brushes: soft
  drums.connect(bus);
  playKeyboardPart(bus, t0, ORGAN);
  playKeyboardPart(bus, t0, LEAD);
  playDrums(drums, t0, DRUMS, { smooth: true });
  playVocal(bus, t0, vocal);
  for (const e of EFFECTS) atTime(t0 + e.at, () => PLAYERS[e.kind](bus, t0 + e.at));
}

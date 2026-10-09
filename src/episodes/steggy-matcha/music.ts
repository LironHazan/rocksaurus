import { atTime } from '../../audio/schedule';
import { boop, ding } from '../../audio/sfx';
import * as fx from '../../audio/foley';
import { grand } from '../../audio/grand-piano';
import { slap, slapAmp, mouthPop, type SlapKind } from '../../audio/slap-bass';
import { keystrokes } from '../../world/screen-script';
import { CUE, PACE, SCENES } from './timeline';
import { ROOM_DOC } from './documents';

// Sitcom funk: a slap-bass groove that stops and starts, mouth pops in the gaps and the odd jazzy keyboard
// stab (an original groove in A mixolydian). Times are story seconds; it plays PACE times slower.

/** Story tempo (so ~111 BPM as heard). */
const BPM = 150;
/** Story seconds per eighth / sixteenth note. */
const EIGHTH = 30 / BPM;
const SIXTEENTH = EIGHTH / 2;
const BAR = 16 * SIXTEENTH;

/** [sixteenth in the bar, note, length in sixteenths, how it's played] */
type Hit = readonly [step: number, note: string, len: number, kind: SlapKind];
interface Phrase {
  bass: readonly Hit[];
  /** Keyboard stab: [sixteenth, chord]. */
  stab?: readonly [number, readonly string[]];
  /** Mouth pops in the gaps (sixteenths). */
  pops?: readonly number[];
}

const A9 = ['G3', 'B3', 'C#4', 'E4'];
const D9 = ['F#3', 'C4', 'E4', 'A4'];
const E7S9 = ['G#3', 'D4', 'G4'];

/** The hook: thumb on the root, pops on the octave, a bluesy C → C# on the way up. */
const P1: Phrase = {
  bass: [
    [0, 'A1', 2, 'slap'],
    [3, 'A2', 1, 'pop'],
    [4, 'E2', 1, 'slap'],
    [6, 'G2', 1, 'slap'],
    [7, 'A2', 1, 'pop'],
    [10, 'C3', 1, 'pop'],
    [11, 'C#3', 1, 'pop'],
    [12, 'E2', 2, 'slap'],
    [15, 'G2', 1, 'ghost'],
  ],
  stab: [14, A9],
};
/** The answer, then a stop: just mouth pops in the silence. */
const P2: Phrase = {
  bass: [
    [0, 'D2', 2, 'slap'],
    [2, 'D3', 1, 'pop'],
    [4, 'F#2', 1, 'slap'],
    [5, 'G2', 1, 'slap'],
    [6, 'G#2', 1, 'slap'],
    [7, 'A2', 2, 'pop'],
  ],
  stab: [7, D9],
  pops: [10, 13],
};
/** Turnaround back to the hook. */
const P3: Phrase = {
  bass: [
    [0, 'E2', 1, 'slap'],
    [2, 'E3', 1, 'pop'],
    [3, 'D3', 1, 'pop'],
    [4, 'B2', 1, 'slap'],
    [6, 'G2', 1, 'slap'],
    [8, 'A2', 1, 'slap'],
    [9, 'G2', 1, 'ghost'],
    [10, 'E2', 1, 'slap'],
    [12, 'A1', 3, 'slap'],
  ],
  stab: [12, E7S9],
};
/** The ending lick: a run down and a final slap with a stab. */
const END: Phrase = {
  bass: [
    [0, 'A1', 1, 'slap'],
    [2, 'A2', 1, 'pop'],
    [3, 'G2', 1, 'slap'],
    [4, 'E2', 1, 'slap'],
    [6, 'A1', 6, 'slap'],
  ],
  stab: [6, ['G3', 'B3', 'C#4', 'F#4']],
  pops: [13],
};

const scene = (id: string) => SCENES.find(s => s.id === id)!;
const sister = scene('sister');

/** Which phrase each bar plays: the groove at home and at the café, more stop-start while she pokes him. */
function phraseFor(bar: number, lastBar: number): Phrase {
  if (bar === lastBar) return END;
  const t = bar * BAR;
  const home = [P1, P2, P1, P3];
  const poking = [P2, P2, P1, P2];
  return (t >= sister.from && t < scene('cafe').from ? poking : home)[bar % 4]!;
}

interface Events {
  bass: { at: number; note: string; len: number; kind: SlapKind }[];
  stabs: { at: number; chord: readonly string[] }[];
  pops: number[];
}

/** Every bass note, stab and mouth pop, in story seconds. */
function groove(): Events {
  const bars = Math.floor(scene('cafe').to / BAR);
  const ev: Events = { bass: [], stabs: [], pops: [] };
  for (let bar = 0; bar < bars; bar++) {
    const p = phraseFor(bar, bars - 1);
    const a = bar * BAR;
    for (const [step, note, len, kind] of p.bass)
      ev.bass.push({ at: a + step * SIXTEENTH, note, len: len * SIXTEENTH, kind });
    if (p.stab) ev.stabs.push({ at: a + p.stab[0] * SIXTEENTH, chord: p.stab[1] });
    for (const s of p.pops ?? []) ev.pops.push(a + s * SIXTEENTH);
  }
  return ev;
}

export const GROOVE = groove();

/** Every keyboard note, so they can be rendered before playback. */
export const SCORE_NOTES = new Set(GROOVE.stabs.flatMap(s => s.chord));

export function soundtrack(bus: AudioNode, t0: number): void {
  const at = (s: number, play: (when: number) => void) => {
    const when = t0 + s * PACE;
    atTime(when, () => play(when));
  };
  const amp = slapAmp(bus);
  for (const b of GROOVE.bass) at(b.at, w => slap(amp, w, b.note, b.kind, b.len * PACE));
  for (const s of GROOVE.stabs) at(s.at, w => s.chord.forEach(n => grand(bus, w, n, 0.45, 0.22 * PACE)));
  for (const p of GROOVE.pops) at(p, w => mouthPop(bus, w));

  for (const k of keystrokes(ROOM_DOC).filter(k => k < sister.from)) at(k, w => fx.keyTap(bus, w));
  for (const n of CUE.nudges) {
    at(n, w => mouthPop(bus, w, 0.3)); // poke!
    at(n + 0.15, w => [0, 1, 2].forEach(i => boop(bus, w + i * 0.07, 1300 + i * 200, 1700 + i * 200, 0.06, 0.03))); // giggle
  }
  at(CUE.enter, w => ding(bus, w, 2093)); // door bell
  for (const d of [0, 0.12]) at(CUE.placeCups + d, w => boop(bus, w, 2600, 2500, 0.08, 0.04)); // cups on the table
  at(CUE.cheers, w => [0, 0.05].forEach(d => boop(bus, w + d, 2800, 2700, 0.1, 0.05))); // clink!
  for (const s of CUE.sips) at(s, w => fx.gulp(bus, w));
}

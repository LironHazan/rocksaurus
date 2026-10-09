import type { Look } from '../../props/fantasy-gear';

// Paris goes shopping at Rot Hotic for her Lord of the Rings D&D night. Times are video seconds.
// The music is a waltz at 120 BPM (a bar is 1.5 s), and the big moments land on bar lines.

export const BPM = 120;
export const BAR = 1.5;
export const DURATION = 34.5; // 23 bars

/** One try-on takes three bars: close the curtain, swap the look, open it, strike a pose. */
export const TRY_LEN = 4.5;
export const TRY_AT = [7.5, 12, 16.5] as const;
/** Offsets inside a try-on (seconds after its start). */
export const TRY = { close: [0.6, 1.1], swap: 1.6, open: [2.5, 3.0] } as const;

export const CUE = {
  bell: 0.45,
  door: [0.3, 1.0], // swings open (and shuts again once she is in)
  walkIn: [0.9, 3.0],
  browse: [3.0, 7.5],
  pick: 6.3, // pulls a coat off the rack
  counter: 22.5, // cut to the checkout
  notice: 23.5, // spots the ring in the bowl
  take: [24.0, 25.0], // reaches for it
  total: 25.5, // ka-ching: $6.66
  receipt: [25.7, 26.7],
  bag: 26.6,
  finale: 27.0, // cut to the hero shot
  poof: 28.5, // she puts on everything
  throw: 29.4, // the d20 leaves her paw
  land: 30.6, // first bounce
  nat20: 31.5, // it settles on a 20
} as const;

export type LookName = 'wizard' | 'ranger' | 'elf';
export const TRY_LOOKS: readonly LookName[] = ['wizard', 'ranger', 'elf'];

/** The look she is wearing at time t, and whether the curtain is open (0 closed … 1 open). */
/** What Paris wears at a moment, and how open the fitting-room curtain is (0 closed … 1 open). */
export interface Fitting {
  look: Look;
  curtain: number;
}

export function fitting(t: number): Fitting {
  if (t >= CUE.poof) return { look: 'party', curtain: 1 };
  let look: LookName | 'goth' = 'goth';
  let curtain = 1;
  TRY_AT.forEach((s, i) => {
    if (t < s) return;
    const [c0, c1] = [s + TRY.close[0], s + TRY.close[1]];
    const [o0, o1] = [s + TRY.open[0], s + TRY.open[1]];
    if (t >= s + TRY.swap) look = TRY_LOOKS[i]!;
    if (t >= c0 && t < o0) curtain = 1 - Math.min(1, (t - c0) / (c1 - c0)); // closes
    if (t >= o0 && t < s + TRY_LEN) curtain = Math.min(1, (t - o0) / (o1 - o0)); // opens
  });
  return { look, curtain };
}

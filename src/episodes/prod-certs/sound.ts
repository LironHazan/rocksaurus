import { atTime } from '../../audio/schedule';
import { ding } from '../../audio/sfx';
import { playSyllables } from '../../audio/babble';
import * as fx from '../../audio/foley';
import type { BedKind } from '../../audio/foley';
import { keystrokes } from '../../world/screen-script';
import { CUE, DURATION, FIX_SCRIPT, LAPTOP_SCRIPT, SYLLABLES } from './timeline';

// Natural sound only: crickets on the dark campus, the pager going off, phones ringing, keys, Taluzarus's restless
// feet, the cheer when prod comes back, morning birds, snores, Eilon's footsteps, one big collective sigh. And the
// voices: dino babble, the same syllables the mouths move to.

export interface Bed {
  from: number;
  to: number;
  kind: BedKind;
}

/** Background beds: a quiet room everywhere indoors. */
export const BEDS: readonly Bed[] = [{ from: CUE.campus[1], to: DURATION, kind: 'room' }];

export type FxKind =
  | 'cricket'
  | 'page'
  | 'thud'
  | 'key'
  | 'ring'
  | 'farRing'
  | 'vibrate'
  | 'step'
  | 'fixed'
  | 'cheer'
  | 'bird'
  | 'snore'
  | 'sigh';
export interface Fx {
  at: number;
  kind: FxKind;
}

/** Taluzarus never stands still: his feet, the whole night in the war room. */
export const FIDGET_STEP = 0.3;

export function effects(): Fx[] {
  const out: Fx[] = [
    { at: CUE.alert, kind: 'page' },
    { at: CUE.alert + 0.7, kind: 'page' },
    { at: CUE.alert + 1.4, kind: 'page' },
    { at: CUE.sitUp, kind: 'thud' }, // bolt upright
    // Sagish's call: ringing out (far), then Rorit's phone, right by her head
    { at: CUE.callRorit[0] + 0.3, kind: 'farRing' },
    { at: CUE.callRorit[0] + 1.2, kind: 'farRing' },
    { at: CUE.roritAnswers, kind: 'ring' },
    { at: CUE.roritAnswers, kind: 'vibrate' },
    // Rorit's calls to the seniors
    { at: CUE.taluzarus - 0.05, kind: 'ring' },
    { at: CUE.amazaurus, kind: 'ring' },
    { at: CUE.fixed, kind: 'fixed' },
    { at: CUE.fixed + 0.2, kind: 'cheer' },
    // morning: they've all dozed off; then Eilon; then the sigh
    { at: CUE.ask + 3.0, kind: 'sigh' },
  ];
  for (let t = 0.2; t < CUE.campus[1]; t += 0.55) out.push({ at: t, kind: 'cricket' });
  for (let t = CUE.bedroom[0] + 0.2; t < CUE.alert; t += 0.8) out.push({ at: t, kind: 'cricket' });
  for (const at of [...keystrokes(LAPTOP_SCRIPT), ...keystrokes(FIX_SCRIPT)]) out.push({ at, kind: 'key' });
  // Taluzarus's feet, in the war room until it's fixed; Eilon's footsteps in the morning
  for (let t = CUE.warRoom[0] + 0.3; t < CUE.fixed; t += FIDGET_STEP) out.push({ at: t, kind: 'step' });
  for (let t = CUE.eilon; t < CUE.eilon + 3.4; t += 0.42) out.push({ at: t, kind: 'step' });
  for (const at of [41.9, 42.6, 43.4, 44.8, 46.9]) out.push({ at, kind: 'bird' });
  for (const at of [42.2, 43.9, 45.6]) out.push({ at, kind: 'snore' });
  return out.sort((a, b) => a.at - b.at);
}
export const EFFECTS = effects();

const PLAYERS: Record<FxKind, (bus: AudioNode, when: number) => void> = {
  cricket: (b, w) => fx.cricket(soft(b, 0.6), w),
  page: fx.page,
  thud: fx.stomp,
  key: fx.keyTap,
  ring: fx.ring,
  farRing: (b, w) => fx.ring(soft(b, 0.35), w),
  vibrate: fx.vibrate,
  step: (b, w) => fx.stomp(soft(b, 0.35), w),
  fixed: (b, w) => [1046.5, 1318.5, 1568].forEach((f, i) => ding(b, w + i * 0.09, f)),
  cheer: (b, w) => fx.cheer(b, w, 1.8),
  bird: (b, w) => fx.bird(soft(b, 0.6), w, 0.9 + ((w * 7.1) % 0.3)),
  snore: fx.snore,
  sigh: fx.sigh,
};

/** Quieter: far away, or through a window. */
function soft(bus: AudioNode, gain: number): AudioNode {
  const g = new GainNode(bus.context, { gain });
  g.connect(bus);
  return g;
}

export function soundtrack(bus: AudioNode, t0: number): void {
  for (const b of BEDS) atTime(t0 + b.from, () => fx.bed(bus, t0 + b.from, b.to - b.from, b.kind));
  for (const e of EFFECTS) atTime(t0 + e.at, () => PLAYERS[e.kind](bus, t0 + e.at));
  playSyllables(bus, t0, SYLLABLES, atTime);
}

import { atTime } from '../../audio/schedule';
import { boop } from '../../audio/sfx';
import { playSyllables } from '../../audio/babble';
import { playBass } from '../../audio/bass';
import { playDrums } from '../../audio/drums';
import { playRiff } from '../../audio/guitar';
import * as fx from '../../audio/foley';
import type { BedKind } from '../../audio/foley';
import { TYPING } from '../../props/phone';
import { BASS, DRUMS, GUITAR } from './music';
import { CHAT, CUE, DURATION, MUSIC_AT, SYLLABLES } from './timeline';

// Natural sound in Omli's gym (the dumbbell, the buzz, Lulu's DM, his thumbs), Omli's heavy footsteps; then the
// audition itself: Omli's bass alone, Lulu's drums (the smooth kit), Rory's guitar, and the band whooping at the end.

export interface Bed {
  from: number;
  to: number;
  kind: BedKind;
}
export const BEDS: readonly Bed[] = [
  { from: 0, to: CUE.gym[1], kind: 'room' },
  { from: CUE.audition[0], to: DURATION, kind: 'room' },
];

export type FxKind = 'clank' | 'buzz' | 'pop' | 'sent' | 'tap' | 'step' | 'whoop';
export interface Fx {
  at: number;
  kind: FxKind;
}

export function effects(): Fx[] {
  const out: Fx[] = [
    // curls: the dumbbell's top and bottom clank, then he sets it down for the phone
    { at: 0.9, kind: 'clank' },
    { at: 1.95, kind: 'clank' },
    { at: CUE.pickUp - 0.1, kind: 'clank' },
    { at: CUE.buzz, kind: 'buzz' },
    { at: CUE.lastHit + 1.0, kind: 'whoop' },
    ...CHAT.map(m => ({ at: m.at, kind: m.from === 'Omli' ? ('sent' as const) : ('pop' as const) })),
  ];
  for (const m of CHAT.filter(c => c.from === 'Omli'))
    for (let t = m.at - TYPING + 0.05; t < m.at - 0.05; t += 0.14) out.push({ at: t, kind: 'tap' });
  for (let t = CUE.enter + 0.2; t < MUSIC_AT - 0.3; t += 0.45) out.push({ at: t, kind: 'step' });
  return out.sort((a, b) => a.at - b.at);
}
export const EFFECTS = effects();

const PLAYERS: Record<FxKind, (bus: AudioNode, when: number) => void> = {
  clank: (b, w) => fx.stomp(soft(b, 0.5), w),
  buzz: fx.vibrate,
  pop: (b, w) => boop(b, w, 620, 980, 0.09, 0.08),
  sent: (b, w) => boop(b, w, 900, 1300, 0.07, 0.06),
  tap: fx.keyTap,
  step: fx.stomp, // a big guy
  whoop: (b, w) => fx.cheer(b, w, 1.6),
};

function soft(bus: AudioNode, gain: number): AudioNode {
  const g = new GainNode(bus.context, { gain });
  g.connect(bus);
  return g;
}

export function soundtrack(bus: AudioNode, t0: number): void {
  for (const b of BEDS) atTime(t0 + b.from, () => fx.bed(bus, t0 + b.from, b.to - b.from, b.kind));
  for (const e of EFFECTS) atTime(t0 + e.at, () => PLAYERS[e.kind](bus, t0 + e.at));
  playSyllables(bus, t0, SYLLABLES, atTime);
  // the audition
  const band = new GainNode(bus.context, { gain: 0.9 });
  band.connect(bus);
  const guitar = new GainNode(bus.context, { gain: 0.6 }); // under the bass: it's Omli's audition
  guitar.connect(band);
  const drums = new GainNode(bus.context, { gain: 0.7 });
  drums.connect(band);
  playBass(band, t0 + MUSIC_AT, BASS);
  playDrums(drums, t0 + MUSIC_AT, DRUMS, { smooth: true });
  playRiff(guitar, t0 + MUSIC_AT, GUITAR);
}

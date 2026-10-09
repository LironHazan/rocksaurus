import { atTime } from '../../audio/schedule';
import { boop } from '../../audio/sfx';
import { sing } from '../../audio/voice';
import { playSyllables } from '../../audio/babble';
import * as fx from '../../audio/foley';
import type { BedKind } from '../../audio/foley';
import { TYPING } from '../../props/phone';
import { CHAT, CUE, DURATION, SYLLABLES } from './timeline';

// Natural sound only, no music: a quiet morning flat, then the campus plaza (birds, the fountain). On top: the
// group chat's buzz and pops, Lulu's typing, the stash, the wrapper, Rorit's bites, and the gossip itself: little
// sung syllables at talking pitch, the same syllables the mouths move to.

export interface Bed {
  from: number;
  to: number;
  kind: BedKind;
}

export const BEDS: readonly Bed[] = [
  { from: 0, to: CUE.arrive[0], kind: 'room' },
  { from: CUE.arrive[0], to: DURATION, kind: 'fountain' },
  { from: CUE.arrive[0], to: DURATION, kind: 'street' },
];

type FxKind =
  | 'step'
  | 'vibrate'
  | 'pop'
  | 'sent'
  | 'tap'
  | 'rustle'
  | 'sparkle'
  | 'bird'
  | 'lowBird'
  | 'tear'
  | 'munch'
  | 'gulp'
  | 'gasp'
  | 'giggle';
interface Fx {
  at: number;
  kind: FxKind;
}

/** Lulu's walks: when she's stepping (her feet land twice per 0.7 s cycle). */
const WALKS = [
  [0.2, CUE.buzz],
  [CUE.arrive[0], CUE.handoff[0]],
  [CUE.seat[0], CUE.seat[1] - 0.4],
] as const;

function effects(): Fx[] {
  const out: Fx[] = [
    { at: CUE.buzz, kind: 'vibrate' },
    ...CHAT.map(m => ({ at: m.at, kind: m.from === 'Lulu' ? ('sent' as const) : ('pop' as const) })),
    // the stash: digging in, the grab, held up high
    { at: CUE.grab - 0.5, kind: 'rustle' },
    { at: CUE.grab, kind: 'rustle' },
    { at: CUE.raise, kind: 'sparkle' },
    // the handoff: the bar changes paws, the wrapper rips, it's gone in four bites, a gulp
    { at: CUE.give, kind: 'rustle' },
    { at: CUE.tear, kind: 'tear' },
    { at: CUE.chomp[1] + 0.15, kind: 'gulp' },
    { at: CUE.gasp, kind: 'gasp' },
    { at: CUE.gasp + 0.06, kind: 'gasp' },
    { at: CUE.gasp + 0.11, kind: 'gasp' },
    // Silvi can't keep a straight face at "same time tomorrow?"
    { at: CUE.end[0] + 1.4, kind: 'giggle' },
  ];
  for (const [from, to] of WALKS) for (let t = from; t < to; t += 0.35) out.push({ at: t, kind: 'step' });
  for (let t = CUE.chomp[0]; t < CUE.chomp[1]; t += 0.38) out.push({ at: t, kind: 'munch' });
  // Lulu's thumbs on the glass
  for (const m of CHAT.filter(c => c.from === 'Lulu'))
    for (let t = m.at - TYPING + 0.05; t < m.at - 0.05; t += 0.12) out.push({ at: t, kind: 'tap' });
  // birds: one outside the flat's window, then the trees on the plaza
  for (const at of [1.2, 9.6, 19.4]) out.push({ at, kind: 'lowBird' });
  for (const at of [26.8, 32.9, 37.2, 43.0, 47.5, 50.6]) out.push({ at, kind: 'bird' });
  // the long look at the HQ: a morning chorus in the campus trees
  for (let t = CUE.arrive[0] + 0.2, i = 0; t < CUE.establish; t += 0.45 + (i++ % 3) * 0.2)
    out.push({ at: t, kind: 'bird' });
  return out.sort((a, b) => a.at - b.at);
}
export const EFFECTS = effects();

const PLAYERS: Record<FxKind, (bus: AudioNode, when: number) => void> = {
  step: (b, w) => fx.stomp(soft(b, 0.45), w),
  vibrate: fx.vibrate,
  pop: (b, w) => boop(b, w, 620, 980, 0.09, 0.08),
  sent: (b, w) => boop(b, w, 900, 1300, 0.07, 0.06),
  tap: fx.keyTap,
  rustle: fx.rustle,
  sparkle: fx.sparkle,
  bird: (b, w) => fx.bird(b, w, 0.9 + ((w * 7.1) % 0.3)),
  lowBird: (b, w) => fx.bird(soft(b, 0.5), w, 0.85),
  tear: fx.tear,
  munch: fx.munch,
  gulp: fx.gulp,
  gasp: fx.gasp,
  giggle: (b, w) => ['G4', 'E4', 'D4', 'C4'].forEach((n, i) => sing(b, w + i * 0.13, n, 'i', 0.25, 0.1)),
};

/** Quieter: for things heard through a window, or soft footfalls. */
function soft(bus: AudioNode, gain: number): AudioNode {
  const g = new GainNode(bus.context, { gain });
  g.connect(bus);
  return g;
}

export function soundtrack(bus: AudioNode, t0: number): void {
  for (const b of BEDS) atTime(t0 + b.from, () => fx.bed(bus, t0 + b.from, b.to - b.from, b.kind));
  for (const e of EFFECTS) atTime(t0 + e.at, () => PLAYERS[e.kind](bus, t0 + e.at));
  // the gossip: every syllable sung, quietly, at talking pitch
  playSyllables(bus, t0, SYLLABLES, atTime);
}

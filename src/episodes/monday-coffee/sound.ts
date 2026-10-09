import { cueSheet, every, quieter, type Cue, type Player } from '../../audio/cue-sheet';
import { ding } from '../../audio/sfx';
import * as fx from '../../audio/foley';
import { CHAT, CUE, DURATION, TYPING } from './timeline';

// Sound only, no music: the scene is carried by its natural sounds. Each location has a bed under it (the street
// and the playground at drop-off, a quiet room, the café's chatter) with little things happening on top: birds,
// a car going by, the chat's pops and buzzes, Rory's snores, the therapist's pen, the espresso machine.

type Kind =
  | 'bell'
  | 'pop'
  | 'vibrate'
  | 'tap'
  | 'softTap'
  | 'snore'
  | 'clink'
  | 'shutter'
  | 'thud'
  | 'bird'
  | 'lowBird'
  | 'car'
  | 'tick'
  | 'scribble'
  | 'steam'
  | 'stir'
  | 'saucer'
  | 'sigh';

/** Where a phone is when a message arrives: in a paw (a pop) or buzzing somewhere it can't be ignored. */
const buzzing = (t: number) => (t >= CUE.rory[0] && t < CUE.rory[1]) || (t >= CUE.therapy[0] && t < CUE.cafe[0]);
const indoors = (t: number) => t >= CUE.rory[0] && (t < CUE.cafe[0] || t >= CUE.end);

function cues(): Cue<Kind>[] {
  const out: Cue<Kind>[] = [
    // drop-off: the school bell, birds in the trees, the odd car
    { at: 0.5, kind: 'bell' },
    { at: 0.85, kind: 'bell' },
    { at: 2.0, kind: 'car' },
    { at: 12.5, kind: 'car' },
    { at: 19.6, kind: 'car' },
    ...CHAT.map(m => ({ at: m.at, kind: buzzing(m.at) ? ('vibrate' as const) : ('pop' as const) })),
    // Rory's room: a morning bird outside the window
    { at: CUE.rory[0] + 1.4, kind: 'lowBird' },
    // therapy: the pen, while Lulu talks; then furiously, after "FOMO"
    { at: CUE.therapy[0] + 0.6, kind: 'scribble' },
    { at: CUE.therapy[0] + 2.0, kind: 'scribble' },
    { at: CUE.fomo + 0.5, kind: 'scribble' },
    { at: CUE.fomo + 1.6, kind: 'scribble' },
    { at: CUE.fomo + 2.6, kind: 'scribble' },
    // the café: the espresso machine inside, a spoon, cheers, back on the saucers, the selfie
    { at: CUE.cafe[0] + 0.2, kind: 'steam' },
    { at: CUE.cafe[0] + 1.4, kind: 'stir' },
    { at: CUE.clink, kind: 'clink' },
    { at: CUE.clink + 0.75, kind: 'saucer' },
    { at: CUE.clink + 0.85, kind: 'saucer' },
    { at: CUE.selfie, kind: 'shutter' },
    { at: CUE.cafe[0] + 6.0, kind: 'car' },
    // and Lulu, left out, flops back on the couch with a sigh
    { at: CUE.flop, kind: 'sigh' },
    { at: CUE.flop + 0.3, kind: 'thud' },
  ];
  // birds wherever we're outdoors
  for (const at of [1.3, 4.1, 6.6, 10.2, 14.9, 17.8, CUE.cafe[0] + 0.9, CUE.cafe[0] + 4.6, CUE.cafe[0] + 7.4])
    out.push({ at, kind: 'bird' });
  // a clock ticking in the quiet rooms: Rory's bedroom, the therapist's office
  for (let t = CUE.rory[0] + 0.5; t < DURATION; t += 1) if (indoors(t)) out.push({ at: t, kind: 'tick' });
  for (const at of every(CUE.rory[0] + 0.3, CUE.rory[1] - 1, 1.6)) out.push({ at, kind: 'snore' });
  // thumbs on glass: a parent typing during the debate; Lulu typing furiously, mid-session
  for (const m of CHAT) {
    const lulu = m.from === 'Lulu';
    if (!lulu && (m.at < CUE.ask[0] || m.at >= CUE.rory[0])) continue;
    for (let t = m.at - TYPING + 0.05; t < m.at - 0.05; t += lulu ? 0.11 : 0.17)
      out.push({ at: t, kind: lulu ? 'tap' : 'softTap' });
  }
  return out;
}

/** Half volume: for things heard through a window, or thumbs that aren't furious. */
const HALF = 0.5;

const PLAYERS: Record<Kind, Player> = {
  bell: (b, w) => ding(b, w, 1568),
  pop: fx.chatPop,
  vibrate: fx.vibrate,
  tap: fx.keyTap,
  softTap: (b, w) => fx.keyTap(quieter(b, HALF), w),
  snore: fx.snore,
  clink: (b, w) => {
    ding(b, w, 2637);
    ding(b, w + 0.05, 3136);
  },
  shutter: fx.shutter,
  thud: fx.stomp,
  bird: (b, w) => fx.bird(b, w, 0.9 + ((w * 7.1) % 0.3)),
  lowBird: (b, w) => fx.bird(quieter(b, HALF), w, 0.85),
  car: fx.carPass,
  tick: fx.tick,
  scribble: fx.scribble,
  steam: fx.steam,
  stir: fx.stir,
  saucer: fx.saucer,
  sigh: fx.sigh,
};

export const SOUND = cueSheet({
  duration: DURATION,
  players: PLAYERS,
  cues: cues(),
  /** Background beds, one per location, cut with the picture. */
  beds: [
    { from: 0, to: CUE.rory[0], kind: 'street' }, // drop-off, then the debate on the pavement
    { from: 0, to: CUE.ask[0], kind: 'kids' }, // until the bell's rung and they're all inside
    { from: CUE.rory[0], to: CUE.therapy[0], kind: 'room' },
    { from: CUE.therapy[0], to: CUE.cafe[0], kind: 'room' },
    { from: CUE.cafe[0], to: CUE.end, kind: 'street' },
    { from: CUE.cafe[0], to: CUE.end, kind: 'cafe' },
    { from: CUE.end, to: DURATION, kind: 'room' },
  ],
});

export function soundtrack(bus: AudioNode, t0: number): void {
  SOUND.play(bus, t0);
}

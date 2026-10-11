import { cueSheet, every, quieter, type Bed, type Cue, type Player } from '../../audio/cue-sheet';
import { playSyllables } from '../../audio/babble';
import { boop, chatPop, chatSent, ding } from '../../audio/sfx';
import { sing } from '../../audio/voice';
import * as fx from '../../audio/foley';
import { CUE, CUTS, DURATION, HONKS, PERMISSIONS, PERM_EVERY, SYLLABLES, TICKET_TICKS, hazardOn } from './timeline';

// Natural sound, no music. In the Fesla: the jam's rumble and its horns, the call's rings, Frok's bleeps, the
// permissions ticking in, and when Frok goes wild, its horn, its hazards and the ticket counter. At the office: the
// room, keyboards, Amazaurus's steam, Lulu's steps and her laugh, the tea.

type Kind =
  | 'frok'
  | 'perm'
  | 'ring'
  | 'connect'
  | 'waiting'
  | 'honk'
  | 'jamHonk'
  | 'ticket'
  | 'hazard'
  | 'keys'
  | 'steam'
  | 'alert'
  | 'gasp'
  | 'step'
  | 'giggle'
  | 'clink'
  | 'sip';

/** Lulu's steps down the aisle with the tea (one per walk-cycle step, seconds). */
const STEP = 0.36;
/** The hazards tick each time they light. */
const HAZARD_STEP = 1 / 6;

function cues(): Cue<Kind>[] {
  const out: Cue<Kind>[] = [
    // Frok: the install chime, then its bleep whenever it speaks up
    ...[CUE.install, CUE.sidewalk[0], CUE.onIt, CUE.tag[0] + 0.2].map(at => ({ at, kind: 'frok' as const })),
    ...PERMISSIONS.map((_, i) => ({ at: CUE.perms[0] + i * PERM_EVERY, kind: 'perm' as const })),
    { at: CUE.dial, kind: 'ring' },
    { at: CUE.dial + 0.7, kind: 'ring' },
    { at: CUE.answer, kind: 'connect' },
    { at: CUE.waiting, kind: 'waiting' },
    { at: CUE.waiting + 0.6, kind: 'waiting' },
    // the jam: somebody always honks (the minivan's driver doesn't care)
    ...[4.6, 11.2, 17.0, 23.9].map(at => ({ at, kind: 'jamHonk' as const })),
    // Frok goes wild: its horn, its hazards, the counter
    ...HONKS.map(at => ({ at, kind: 'honk' as const })),
    ...TICKET_TICKS.map(at => ({ at, kind: 'ticket' as const })),
    ...every(CUE.flood[0], CUE.wild[1], HAZARD_STEP)
      .filter(at => hazardOn(at + 0.01))
      .map(at => ({ at, kind: 'hazard' as const })),
    // the office: Amazaurus boils over, then the flood lands on his screen
    { at: 34.8, kind: 'steam' },
    { at: CUE.swamped[0], kind: 'alert' },
    { at: CUE.swamped[0] + 0.3, kind: 'gasp' },
    { at: CUE.swamped[0] + 0.9, kind: 'steam' },
    // Lulu, with the tea; her laugh; the mug changes paws; his sip
    ...every(CUE.cube[0], CUE.arrive - 0.2, STEP).map(at => ({ at, kind: 'step' as const })),
    { at: CUE.laugh[0], kind: 'giggle' },
    { at: CUE.give + 0.45, kind: 'clink' },
    { at: CUE.sip + 0.3, kind: 'sip' },
  ];
  // colleagues typing, somewhere in the office
  for (const [from, to] of officeSpans())
    for (const at of every(from + 0.3, to - 0.3, 1.7)) out.push({ at, kind: 'keys' });
  return out;
}

/** The spans of the video at the office (the rest is in the Fesla). */
function officeSpans(): (readonly [number, number])[] {
  const spans: (readonly [number, number])[] = [];
  CUTS.forEach(([from, where], i) => {
    if (where === 'office') spans.push([from, CUTS[i + 1]?.[0] ?? DURATION]);
  });
  return spans;
}

const PLAYERS: Record<Kind, Player> = {
  frok: (b, w) => {
    boop(b, w, 880, 1320, 0.08, 0.05); // bee-
    boop(b, w + 0.1, 1320, 1760, 0.1, 0.05); // -boop!
  },
  perm: chatPop,
  ring: fx.ring,
  connect: chatSent,
  waiting: (b, w) => boop(b, w, 1400, 1400, 0.12, 0.04), // call waiting: a soft beep
  honk: (b, w) => fx.horn(b, w, 0.28),
  jamHonk: (b, w) => fx.horn(quieter(b, 0.35), w, 0.45),
  ticket: (b, w) => boop(b, w, 1600, 2100, 0.05, 0.03),
  hazard: fx.tick,
  keys: (b, w) => {
    for (let i = 0; i < 5; i++) fx.keyTap(quieter(b, 0.25), w + i * 0.11);
  },
  steam: (b, w) => fx.steam(b, w, 1.4),
  alert: (b, w) => {
    ding(b, w, 1046.5);
    ding(b, w + 0.18, 1318.5);
  },
  gasp: fx.gasp,
  step: (b, w) => fx.stomp(quieter(b, 0.45), w),
  giggle: (b, w) => ['C4', 'A3', 'G3', 'A3', 'F3'].forEach((n, i) => sing(b, w + i * 0.2, n, 'a', 0.3, 0.14)),
  clink: fx.saucer,
  sip: fx.gulp,
};

const BEDS: Bed[] = CUTS.map(([from, where], i) => ({
  from,
  to: CUTS[i + 1]?.[0] ?? DURATION,
  kind: where === 'car' ? 'street' : 'room',
}));

export const SOUND = cueSheet({ duration: DURATION, players: PLAYERS, cues: cues(), beds: BEDS });

export function soundtrack(bus: AudioNode, t0: number): void {
  SOUND.play(bus, t0);
  playSyllables(bus, t0, SYLLABLES);
}

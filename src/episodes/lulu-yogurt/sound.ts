import { cueSheet, every, quieter, type Cue, type Player } from '../../audio/cue-sheet';
import { playSyllables } from '../../audio/babble';
import { playBass } from '../../audio/bass';
import { playDrums } from '../../audio/drums';
import { playRiff } from '../../audio/guitar';
import { boop, thump } from '../../audio/sfx';
import * as fx from '../../audio/foley';
import { BASS, DRUMS, GUITAR } from './music';
import { CUE, DURATION, SYLLABLES } from './timeline';

// The groove under everything (heavy in Omli's car), quiet so the kitchen is still heard: Lulu's heavy, slow steps, the fridge door,
// the long sigh, Mirta's mop, the lid, the spoon, the "bleh", the bin; the road on the way home; her sips, and a
// snore.

type Kind = 'step' | 'fridge' | 'sigh' | 'mop' | 'lid' | 'spoon' | 'bleh' | 'bin' | 'car' | 'sip' | 'snore';

/** Lulu shuffles in, tired: one heavy step every 0.6 s. Out again after the bye, a little quicker. */
const WALKS = [
  [0.3, CUE.enter[1] - 0.4, 0.6],
  [CUE.toss + 0.9, CUE.bye[1], 0.45],
] as const;

function cues(): Cue<Kind>[] {
  const out: Cue<Kind>[] = [
    { at: CUE.open, kind: 'fridge' },
    { at: CUE.sigh, kind: 'sigh' },
    { at: CUE.lid, kind: 'lid' },
    ...CUE.bites.map(at => ({ at, kind: 'spoon' as const })),
    { at: CUE.yuck[0] + 0.15, kind: 'bleh' },
    { at: CUE.toss + 0.45, kind: 'bin' },
    { at: CUE.ride[0] + 1.6, kind: 'car' },
    { at: CUE.ride[0] + 4.2, kind: 'car' },
    ...CUE.sips.map(at => ({ at, kind: 'sip' as const })),
    { at: CUE.asleep + 0.6, kind: 'snore' },
  ];
  for (const [from, to, step] of WALKS) for (const at of every(from, to, step)) out.push({ at, kind: 'step' });
  // Mirta's mop: a swish each way while she works, until she stops to listen
  for (const at of every(CUE.mirta[0], CUE.mirta[0] + 2.2, 0.55)) out.push({ at, kind: 'mop' });
  for (const at of every(CUE.eat[0] + 0.4, CUE.bye[1] - 0.2, 0.8)) out.push({ at, kind: 'mop' });
  return out;
}

const PLAYERS: Record<Kind, Player> = {
  step: (b, w) => fx.stomp(quieter(b, 0.5), w),
  fridge: (b, w) => {
    thump(quieter(b, 0.4), w); // the seal lets go
    fx.bed(b, w, 7.4, 'room'); // and the fridge hums while it's open
  },
  sigh: (b, w) => fx.sigh(b, w, 1.8),
  mop: (b, w) => fx.swish(quieter(b, 0.35), w, 0.4),
  lid: fx.tear,
  spoon: fx.stir,
  bleh: (b, w) => boop(b, w, 320, 110, 0.7, 0.08), // a long, sinking "bleh"
  bin: thump,
  car: (b, w) => fx.carPass(quieter(b, 0.6), w),
  sip: fx.gulp,
  snore: fx.snore,
};

const SOUND = cueSheet({
  duration: DURATION,
  players: PLAYERS,
  cues: cues(),
  beds: [
    { from: 0, to: CUE.ride[0], kind: 'room' },
    { from: CUE.ride[0], to: CUE.bed[0], kind: 'street' },
    { from: CUE.bed[0], to: DURATION, kind: 'room' },
  ],
});

/** The groove sits under the kitchen: loud enough to feel, quiet enough to hear the spoon. */
const MUSIC_GAIN = 0.55;
const DRUMS_GAIN = 0.75;
/** The car's guitar: under the bass, so the groove stays Omli's. */
const GUITAR_GAIN = 0.5;

export function soundtrack(bus: AudioNode, t0: number): void {
  SOUND.play(bus, t0);
  playSyllables(bus, t0, SYLLABLES);
  const band = new GainNode(bus.context, { gain: MUSIC_GAIN });
  band.connect(bus);
  const drums = new GainNode(bus.context, { gain: DRUMS_GAIN });
  drums.connect(band);
  playBass(band, t0, BASS);
  playDrums(drums, t0, DRUMS, { smooth: true });
  const guitar = new GainNode(bus.context, { gain: GUITAR_GAIN });
  guitar.connect(band);
  playRiff(guitar, t0, GUITAR);
}

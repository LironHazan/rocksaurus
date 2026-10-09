import { cueSheet, every, quieter, type Cue, type Player } from '../../audio/cue-sheet';
import { playSyllables } from '../../audio/babble';
import { playBass } from '../../audio/bass';
import { playDrums } from '../../audio/drums';
import { playRiff } from '../../audio/guitar';
import * as fx from '../../audio/foley';
import { TYPING } from '../../props/phone';
import { BASS, DRUMS, GUITAR } from './music';
import { CHAT, CUE, DURATION, MUSIC_AT, SYLLABLES } from './timeline';

// Natural sound in Omli's gym (the dumbbell, the buzz, Lulu's DM, his thumbs), Omli's heavy footsteps; then the
// audition itself: Omli's bass alone, Lulu's drums (the smooth kit), Rory's guitar, and the band whooping at the end.

type Kind = 'clank' | 'buzz' | 'pop' | 'sent' | 'tap' | 'step' | 'whoop';

function cues(): Cue<Kind>[] {
  const out: Cue<Kind>[] = [
    // curls: the dumbbell's top and bottom clank, then he sets it down for the phone
    { at: 0.9, kind: 'clank' },
    { at: 1.95, kind: 'clank' },
    { at: CUE.pickUp - 0.1, kind: 'clank' },
    { at: CUE.buzz, kind: 'buzz' },
    { at: CUE.lastHit + 1.0, kind: 'whoop' },
    ...CHAT.map(m => ({ at: m.at, kind: m.from === 'Omli' ? ('sent' as const) : ('pop' as const) })),
  ];
  for (const m of CHAT.filter(c => c.from === 'Omli'))
    for (const at of every(m.at - TYPING + 0.05, m.at - 0.05, 0.14)) out.push({ at, kind: 'tap' });
  for (const at of every(CUE.enter + 0.2, MUSIC_AT - 0.3, 0.45)) out.push({ at, kind: 'step' });
  return out;
}

const PLAYERS: Record<Kind, Player> = {
  clank: (b, w) => fx.stomp(quieter(b, 0.5), w),
  buzz: fx.vibrate,
  pop: fx.chatPop,
  sent: fx.chatSent,
  tap: fx.keyTap,
  step: fx.stomp, // a big guy
  whoop: (b, w) => fx.cheer(b, w, 1.6),
};

const SOUND = cueSheet({
  duration: DURATION,
  players: PLAYERS,
  cues: cues(),
  beds: [
    { from: 0, to: CUE.gym[1], kind: 'room' },
    { from: CUE.audition[0], to: DURATION, kind: 'room' },
  ],
});

export function soundtrack(bus: AudioNode, t0: number): void {
  SOUND.play(bus, t0);
  playSyllables(bus, t0, SYLLABLES);
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

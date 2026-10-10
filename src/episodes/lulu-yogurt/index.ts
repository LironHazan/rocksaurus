import type { Episode } from '../../engine/types';
import { cuts, direct } from '../../engine/director';
import { withOutro } from '../outro';
import { CAPTIONS } from './captions';
import { createMirta } from './cast';
import { createKitchenLocation } from './kitchen';
import { createRideLocation } from './ride';
import { createBedLocation } from './bed';
import { createTiredLulu } from './pose';
import { soundtrack } from './sound';
import { CUE, DURATION } from './timeline';

// Beat sheet (video seconds; see timeline.ts for the cues and lines, sound.ts for the sound, music.ts for the car)
//   0–5        6 PM, the Papo Pako Shapeworks office kitchen: Lulu drags herself in
//   5–12.5     a week of specs for the coding agent: she rubs her eyes; in a thought bubble the pile of specs
//              grows, then the agent (a little devil bot) laughs. "Can't believe I stopped managing humans… to
//              manage bots"
//   12.5–16.5  her protein battery: 5%
//   16.5–25.5  the fridge, from inside: vegan protein (nope), peach (nope), caramel (NOPE), each one hopping. A sigh.
//   25.5–37.1  Mirta mops in. "Which one is the least yuck?" Lost in translation. "This… or this?" The peach.
//   37.1–40.5  the lid, two spoonfuls
//   40.5–43.5  the yuck: Lulu freezes, green, shivering
//   43.5–46.5  into the bin (by paw, not on Mirta's floor). "Bye bye 👋"
//   46.5–52.5  Omli drives her home, his stereo playing metal; her neck goes out the sunroof
//   52.5–58.5  7:30 PM, in bed with a protein shake: sip, sip… asleep
//   then the channel's end card (outro.ts)

type Where = 'kitchen' | 'ride' | 'bed';
const where = cuts<Where>([
  [0, 'kitchen'],
  [CUE.ride[0], 'ride'],
  [CUE.bed[0], 'bed'],
]);

const episode: Episode = {
  id: 'lulu-yogurt',
  title: 'The Last Yogurt 🍑',
  duration: DURATION,
  captions: CAPTIONS,

  setup(stage) {
    const lulu = createTiredLulu();
    return direct(
      stage,
      {
        kitchen: createKitchenLocation(lulu, createMirta()),
        ride: createRideLocation(lulu),
        bed: createBedLocation(lulu),
      },
      where,
    );
  },

  audio(bus, t0) {
    soundtrack(bus, t0);
  },
};

export default withOutro(episode);

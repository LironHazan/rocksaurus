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

// Beat sheet (video seconds; see timeline.ts for the cues and lines, music.ts for the groove)
//   0–5      6 PM, the Papo Pako Shapeworks office kitchen: Lulu drags herself in
//   5–14     a week of specs for the coding agent: she rubs her eyes; in a thought bubble the pile of specs
//            grows, then the agent (a little devil bot) laughs. "Can't believe I stopped managing humans… to
//            manage bots": held long enough to read
//   14–18    her protein battery: 5%
//   18–27    the fridge, from inside: vegan protein (nope), peach (nope), caramel (NOPE). A sigh.
//   27–38.6  Mirta mops in. "Which one is the least yuck?" Lost in translation. "This… or this?" The peach.
//   38.6–42  the lid, two spoonfuls
//   42–45    the band stops. So does Lulu: green, shivering
//   45–48    into the bin (by paw, not on Mirta's floor). "Bye bye 👋"
//   48–54    Omli drives her home; her neck goes out the sunroof
//   54–60    7:30 PM, in bed with a protein shake: sip, sip… asleep
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

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
//   5–8      a week of specs for the coding agent: she rubs her eyes; in her head the agent is a little devil
//   8–12     her protein battery: 5%
//   12–21    the fridge, from inside: vegan protein (nope), peach (nope), caramel (NOPE). A sigh.
//   21–32.6  Mirta mops in. "Which one is the least yuck?" She doesn't speak Lulu. "This… or this?" The peach.
//   32.6–36  the lid, two spoonfuls
//   36–39    the band stops. So does Lulu: green, shivering
//   39–42    into the bin (by paw, not on Mirta's floor). "Bye bye 👋"
//   42–51    Omli drives her home; her neck goes out the sunroof
//   51–57    7:30 PM, in bed with a protein shake: sip, sip… asleep
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

import type { Episode } from '../../engine/types';
import { cuts, direct } from '../../engine/director';
import { withOutro } from '../outro';
import { CAPTIONS } from './captions';
import { createAmazaurusAtWork, createOfficeLulu } from './cast';
import { createDriveLocation } from './drive';
import { createCubeLocation } from './cube';
import { soundtrack } from './sound';
import { CUTS, DURATION } from './timeline';

// Beat sheet (video seconds; see timeline.ts for the cues and lines, screens.ts for what the screens show)
//   0–7.6      8:30 AM, the highway, a jam. Rorit's Fesla just got Frok bot: permissions, everything ✅
//   7.6–22.4   she calls Lulu, hands-free: the traffic, the minivan in the fast lane; Frok offers the sidewalk 😈
//   22.4–36.6  call waiting: Amazaurus, in his cube. The infra won't be ready for validations; IT approved his ticket
//              and asked him to open 2 more for the actual work. His face goes red, then steams
//   36.6–43.6  Frok heard "open tickets": 2… 64… 4,096, hazards and horn. "FROK, NO!!"
//   43.6–45.4  Amazaurus's monitor: 4,096 new tickets. Tomato.
//   45.4–56.4  Lulu, with two teas: "Amazaurus, chill. Let me escalate, I'm still a manager by title 😂", and she
//              laughs; he sips, and cools down
//   56.4–59    the Fesla: Frok escalated too. To everyone. Rorit, facepalm
//   then the channel's end card (outro.ts)

const episode: Episode = {
  id: 'fesla-frok',
  title: 'Frok Goes Wild 🤖🚗',
  duration: DURATION,
  captions: CAPTIONS,

  setup(stage) {
    return direct(
      stage,
      {
        car: createDriveLocation(),
        office: createCubeLocation(createOfficeLulu(), createAmazaurusAtWork()),
      },
      cuts(CUTS),
    );
  },

  audio(bus, t0) {
    soundtrack(bus, t0);
  },
};

export default withOutro(episode);

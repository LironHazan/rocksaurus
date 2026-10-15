import type { Episode } from '../../engine/types';
import { cuts, direct, type Shot } from '../../engine/director';
import { ease, lerp, seg } from '../../engine/math';
import { createCampus } from '../../world/campus';
import { withOutro } from '../outro';
import { CAPTIONS } from './captions';
import { createRoomLocation } from './room';
import { soundtrack } from './sound';
import { CUE, CUTS, DURATION } from './timeline';

// Beat sheet (video seconds; see timeline.ts for the cues and lines)
//   0–4.2      the Papo Pako Shapeworks campus, morning
//   4.2–13.4   the meeting room. Statitezarus posts his design: #agentic-ai, #design-review, #architecture,
//              #platform, #random
//   13.4–17    the same two tagged every time: Dchozaurus (on the call) rolls his eyes, Igarzarus's phone buzzes
//   17–24.6    "So… any thoughts?" Igarzarus: "When can we port it from Ruby to Elm?" (every opportunity)
//   28.2–35.2  Dchozaurus: "Port the tests and guardrails first, will you?" Then he jumps: "I HAVE A BUG!!"
//   35.8–43.4  Igarzarus: "You, or the 999 agents?" Dchozaurus, up on his chair: "There's a bug ON THE FLOOR!!"
//   43.6–49.6  the door: Ogozaurus walks in. "Everything reached prod now?"
//   49.6–56    Lulu has no idea
//   then the channel's end card (outro.ts)

const episode: Episode = {
  id: 'meeting-room',
  title: 'Everything Reached Prod? 🪲',
  duration: DURATION,
  captions: CAPTIONS,

  setup(stage) {
    const campus = createCampus();
    const room = createRoomLocation(stage);
    const director = direct(
      stage,
      {
        campus: {
          scene: campus.scene,
          frame(t): Shot {
            const c = ease(seg(t, 0, CUE.campus[1]));
            return { cam: [lerp(2.5, 1, c), lerp(7, 6.2, c), lerp(32, 28, c)], look: [0, lerp(9.5, 8.2, c), -12] };
          },
        },
        room,
      },
      cuts(CUTS),
    );
    return {
      update: director.update,
      dispose() {
        room.dispose();
        director.dispose();
      },
    };
  },

  audio(bus, t0) {
    soundtrack(bus, t0);
  },
};

export default withOutro(episode);

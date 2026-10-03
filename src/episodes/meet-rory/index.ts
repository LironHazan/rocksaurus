import { ease, seg, lerp } from '../../engine/math';
import type { Episode } from '../../engine/types';
import { createRockStage } from '../../world/rock-stage';
import { createGuitarist } from '../../band/guitarist';
import { beatPulse } from '../../band/timing';
import { playRiff } from '../../audio/guitar';
import { playBass } from '../../audio/bass';
import { playDrums } from '../../audio/drums';
import { guitar, bass, drums, BEAT, RIFF_IN, POSE, DURATION } from './music';
import { CAPTIONS } from './captions';

// Beat sheet
//   0–2    close on the mohawk: one big open chord rings, four stick clicks
//   2–12   the riff with the band: headbanging, paws on the strings, lights on the beat
//   12–14  last chord, 🤘 paw up, lights flash out

const episode: Episode = {
  id: 'meet-rory',
  title: 'Meet Rory 🎸',
  duration: DURATION,
  captions: CAPTIONS,

  setup({ scene, camera }) {
    const lights = createRockStage(scene);
    const clock = {
      beat: BEAT,
      activity: (t: number) => (t >= POSE ? ('pose' as const) : ('play' as const)),
    };
    const rory = createGuitarist(guitar, clock);
    scene.add(rory.root);

    return {
      update(t) {
        rory.update(t);
        const hit = beatPulse(t, BEAT);
        lights.pulse(t < RIFF_IN ? 0.15 : t < POSE ? hit : Math.max(0, 1 - (t - POSE) * 0.6));

        let cam: [number, number, number], look: [number, number, number];
        if (t < RIFF_IN) {
          const k = ease(seg(t, 0, RIFF_IN));
          cam = [0.5, 3.3, lerp(6.0, 7.0, k)]; // close: the mohawk and the face
          look = [0, 2.8, 0];
        } else if (t < 6) {
          cam = [Math.sin(t * 0.4) * 0.5, 2.7, 9.2]; // the whole guitarist
          look = [0, 2.0, 0];
        } else if (t < 8) {
          cam = [-3.4, 1.7, 5.6]; // low, from the side: mohawk silhouette against the lights
          look = [0, 2.5, 0];
        } else if (t < 10.5) {
          cam = [1.5, 1.9, 4.6]; // paws on the strings
          look = [0, 1.5, 0.8];
        } else if (t < POSE) {
          const a = (t - 10.5) * 0.5;
          cam = [Math.sin(a) * 6.5, 3.2, Math.cos(a) * 6.5]; // orbit
          look = [0, 2.1, 0];
        } else {
          cam = [0, 3.0, 8.4]; // the pose
          look = [0, 2.3, 0];
        }
        camera.position.set(...cam);
        camera.lookAt(...look);
      },
    };
  },

  audio(bus, t0) {
    playRiff(bus, t0, guitar);
    playBass(bus, t0, bass);
    playDrums(bus, t0, drums);
  },
};

export default episode;

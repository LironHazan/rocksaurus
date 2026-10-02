import { seg, ease, lerp } from '../../engine/math';
import { createMeadow } from '../../world/meadow';
import { createRory, idle } from '../../characters/rory';
import { playScore } from '../../audio/score';
import { hop, thump } from '../../audio/sfx';
import { score } from './score';

// Beat sheet (seconds) — music bars are 2 s each, so every action lands on a bar.
//   0.0–2.4  hops in from the left
//   2.4–5.0  waves hello, head tilt
//   5.0–6.6  big happy jump with squash & stretch
//   6.6–9.5  tiny-arms hug, happy squint
//   9.5–12   settles, camera eases back

export default {
  id: 'rory-hello',
  title: 'Rory Says Hello',
  duration: 12,

  setup({ scene, camera }) {
    const world = createMeadow(scene);
    const rory = createRory();
    scene.add(rory.root);

    function update(t) {
      world.update(t);

      // walk-in hops
      const walk = seg(t, 0, 2.4);
      const x = lerp(-7, 0, ease(walk));
      let hopY = walk < 1 ? Math.abs(Math.sin(walk * Math.PI * 5)) * 0.55 : 0;
      rory.root.rotation.y = lerp((Math.PI / 2) * 0.85, 0, ease(seg(t, 1.9, 2.7)));

      // big jump
      const j = seg(t, 5.2, 6.2);
      if (j > 0 && j < 1) hopY = Math.sin(j * Math.PI) * 1.4;

      // squash: anticipation → stretch in air → landing
      let sq = 0;
      if (t > 4.9 && t < 5.2) sq = Math.sin(seg(t, 4.9, 5.2) * Math.PI) * 0.18;
      else if (j > 0 && j < 1) sq = -Math.sin(j * Math.PI) * 0.12;
      else if (t > 6.2 && t < 6.6) sq = Math.sin(seg(t, 6.2, 6.6) * Math.PI) * 0.2;
      if (walk < 1) sq += (1 - Math.abs(Math.sin(walk * Math.PI * 5))) * 0.08;

      rory.root.position.set(x, world.groundY(x, 0) + hopY, 0);
      rory.squash.scale.set(1 + sq * 0.6, 1 - sq, 1 + sq * 0.6);

      const hug = seg(t, 6.7, 7.2) * (1 - seg(t, 9.2, 9.7));
      idle(rory, t, { eyesOpen: lerp(1, 0.15, ease(hug)) });

      const tilt = ease(seg(t, 2.4, 3)) * (1 - ease(seg(t, 4.6, 5)));
      rory.head.rotation.z = Math.sin(t * 0.9) * 0.05 + tilt * 0.22;

      const excited = seg(t, 2.4, 3) * (1 - seg(t, 9, 10));
      rory.tail.rotation.y = Math.sin(t * (4 + excited * 6)) * (0.2 + excited * 0.15);

      // arms: rest → wave (right) → hug (both)
      const wave = seg(t, 2.5, 2.8) * (1 - seg(t, 4.6, 4.9));
      for (const a of rory.arms) {
        const s = a.userData.side;
        let rz = s * 0.35,
          rx = -0.5;
        if (s === 1) {
          rz = lerp(rz, 2.3 + Math.sin(t * 12) * 0.45, ease(wave));
          rx = lerp(rx, 0, ease(wave));
        }
        rz = lerp(rz, -s * 0.35, ease(hug));
        rx = lerp(rx, -1.3, ease(hug));
        a.rotation.set(rx, 0, rz);
      }

      // camera: slow push-in, then ease back
      const push = ease(seg(t, 0, 7)) - ease(seg(t, 9.5, 12)) * 0.6;
      camera.position.set(Math.sin(t * 0.25) * 0.4, 2.6 - push * 0.2, 10 - push * 2.2);
      camera.lookAt(x * 0.3, 1.9, 0);
    }

    return { update };
  },

  audio(bus, t0) {
    playScore(bus, t0, score);
    for (let k = 1; k <= 5; k++) hop(bus, t0 + 0.48 * k); // hop landings
    thump(bus, t0 + 6.2); // big-jump landing
  },
};

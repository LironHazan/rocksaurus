import { seg, ease, lerp } from '../../engine/math.js';
import { createRockStage } from '../../world/rock-stage.js';
import { createLulu, idleLulu } from '../../characters/lulu.js';
import { createDrumKit } from '../../props/drums.js';
import { addPonytail } from '../../props/ponytail.js';
import { addFlannel } from '../../props/flannel.js';
import { playDrums, drumHits } from '../../audio/drums.js';
import { drums, BEAT, BAND_IN, ENDING } from './music.js';

// Beat sheet
//   0–2    close on Lulu: four stick clicks to count the band in
//   2–4    drum fill (snare → toms)
//   4–14   Lulu's groove, lights flash, she headbangs with her whole neck
//   14–16  final crash, sticks in the air

const LEFT_HAND = ['snare', 'tom', 'floorTom', 'click'];
const RIGHT_HAND = ['hat', 'crash', 'click'];
const hits = drumHits(drums);
const byName = name => hits.filter(h => h.name === name).map(h => h.time);
/** 1 at a hit, decaying fast; 0 before the first hit. */
const recent = (t, times, rate = 16) => {
  let last = -Infinity;
  for (const h of times) { if (h <= t) last = h; else break; }
  return Math.exp(-(t - last) * rate);
};
const handTimes = names => hits.filter(h => names.includes(h.name)).map(h => h.time);

const LULU = { x: 0, z: -1.2 }; // center stage — it's her solo

export default {
  id: 'meet-lulu',
  title: 'Meet Lulu 🥁',
  duration: 16,

  setup({ scene, camera }) {
    const lights = createRockStage(scene);

    const kit = createDrumKit();
    kit.group.position.set(LULU.x, 0, LULU.z);
    kit.group.scale.setScalar(1.2);
    scene.add(kit.group);

    const lulu = createLulu();
    const hair = addPonytail(lulu);
    addFlannel(lulu);
    lulu.root.position.set(LULU.x, 0.54, LULU.z); // sitting on the (scaled) throne
    scene.add(lulu.root);

    const leftTimes = handTimes(LEFT_HAND), rightTimes = handTimes(RIGHT_HAND);
    const kickTimes = byName('kick');
    const kitParts = ['kick', 'snare', 'tom', 'floorTom', 'hat', 'crash'].map(n => [n, byName(n)]);

    function update(t) {
      const grooving = t >= BAND_IN && t < ENDING;
      const ending = t >= ENDING;
      const beatHit = Math.pow(1 - ((t / BEAT) % 1), 3);

      // ── Lulu ────────────────────────────────────────────────
      idleLulu(lulu, t, { eyesOpen: grooving ? 0.35 : ending ? 0.15 : 0.75, nod: grooving ? beatHit * 0.22 : 0 });
      for (const arm of lulu.arms) {
        const s = arm.userData.side;
        const strike = recent(t, s < 0 ? leftTimes : rightTimes);
        if (t < 2) arm.rotation.set(lerp(-2.1, -1.6, strike), 0, -s * 0.5);     // sticks up, clicking
        else if (ending) arm.rotation.set(-2.3, 0, -s * 0.3 + Math.sin(t * 8) * 0.1); // sticks in the air
        else arm.rotation.set(lerp(-0.6, 0.35, strike), 0, s * 0.15);
      }
      // ponytail swings a beat behind her headbang, and sways side to side
      hair.ponytail.rotation.x = 0.1 + (grooving ? Math.pow(1 - (((t - 0.12) / BEAT) % 1), 2) * 0.45 : Math.sin(t * 2) * 0.05);
      hair.ponytail.rotation.z = Math.sin(t * Math.PI / BEAT / 2) * (grooving ? 0.25 : 0.06);
      const kickFoot = lulu.feet.find(f => f.userData.side > 0);
      kickFoot.position.y = (1 - recent(t, kickTimes, 12)) * 0.12;
      lulu.setMouth(ending ? 1 : grooving ? recent(t, byName('snare'), 8) * 0.6 : 0);
      lulu.root.rotation.y = 0;

      for (const [name, times] of kitParts) kit.strike(name, recent(t, times, name === 'crash' ? 2.5 : 10));

      lights.pulse(grooving ? beatHit : ending ? Math.max(0, 1 - (t - ENDING)) : 0);

      // ── Camera ──────────────────────────────────────────────
      let cam, look;
      const L = LULU.x;
      if (t < 2) { cam = [L + 0.6, 4.4, 7.2]; look = [L, 4.0, -1]; }              // close-up: count-in
      else if (t < BAND_IN) { cam = [L - 0.3, 3.0, 8]; look = [L, 2.4, -0.5]; }    // the fill
      else if (t >= 8 && t < 10) { cam = [L - 3.8, 4.3, 6.6]; look = [L, 3.7, -1]; } // from her left
      else if (t >= 10 && t < 12) { cam = [L + 3.8, 4.4, 6.6]; look = [L, 3.7, -1]; } // from her right
      else {
        const push = ease(seg(t, 12, 16));
        cam = [L + Math.sin(t * 0.5) * 0.4, 3.5, lerp(9.2, 8.0, push)]; look = [L, 2.95, -0.6];
      }
      camera.position.set(...cam);
      camera.lookAt(...look);
    }

    return { update };
  },

  audio(bus, t0) {
    playDrums(bus, t0, drums);
  },
};

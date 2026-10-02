import { seg, ease, lerp } from '../../engine/math';
import { createRockStage } from '../../world/rock-stage';
import * as THREE from 'three';
import { createTyrannosaurus } from '../../characters/tyrannosaurus';
import { reachArm } from '../../characters/reach';
import { addCap } from '../../props/cap';
import { midi } from '../../audio/piano';
import { idle, resetPose } from '../../characters/rory';
import { createGuitar } from '../../props/guitar';
import { addSunglasses } from '../../props/sunglasses';
import { enableShadows } from '../../characters/materials';
import { playBass, bassTimes } from '../../audio/bass';
import { playDrums } from '../../audio/drums';
import { bass, drums, BEAT, GLASSES_DOWN, WINK } from './music';

// Beat sheet
//   0–2    close on Tiki Taka: laid-back bass intro, alone
//   2–10   the groove (light beat joins), slow cool nods, foot taps
//   10–12  slides his sunglasses down… and winks

const noteTimes = bassTimes(bass);
const recent = (t, times, rate = 14) => {
  let last = -Infinity;
  for (const h of times) {
    if (h <= t) last = h;
    else break;
  }
  return Math.exp(-(t - last) * rate);
};

export default {
  id: 'meet-tiki-taka',
  title: 'Meet Tiki Taka 🎸',
  duration: 12,

  setup({ scene, camera }) {
    const lights = createRockStage(scene);
    // Tiki Taka: a big blue Tyrannosaurus in a backwards cap and sunglasses
    const tiki = createTyrannosaurus();
    addCap(tiki, { scale: 0.72, position: [0, 0.5, 0.15], tilt: -0.05 });
    scene.add(tiki.root);

    const bassGuitar = createGuitar({ color: 0xff8c42, neck: 2.1, strings: 4 });
    bassGuitar.position.set(0.25, 1.45, 1.22);
    bassGuitar.rotation.set(0.05, 0, 1.0);
    bassGuitar.updateMatrix();
    const onBass = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(bassGuitar.matrix); // bass space → torso space
    enableShadows(bassGuitar);
    tiki.posture.add(bassGuitar);

    const glasses = addSunglasses(tiki.head, {
      eyes: [
        [-0.43, 0.2, 1.02],
        [0.43, 0.2, 1.02],
      ],
      size: 0.24,
    });
    const pluckArm = tiki.arms.find(a => a.userData.side === 1); // plucking paw: on the strings
    const fretArm = tiki.arms.find(a => a.userData.side === -1); // fretting paw: on the neck
    const noteAt = t => {
      let n = bass.notes[0];
      for (const x of bass.notes) if (noteTimes[bass.notes.indexOf(x)] <= t) n = x;
      return n;
    };

    function update(t) {
      const grooving = t >= 2 && t < GLASSES_DOWN;
      const beatHit = Math.pow(1 - ((t / BEAT) % 1), 3);

      resetPose(tiki);
      const winking = t >= WINK && t < WINK + 0.35;
      idle(tiki, t, { eyesOpen: 1 });
      if (winking) tiki.eyes[1].scale.y = 0.1;

      // cool, slow groove: nod on the beat, sway over two beats
      const groove = grooving ? 1 : t < 2 ? 0.4 : 0.3;
      tiki.head.rotation.x += 0.12 * beatHit * groove;
      tiki.head.rotation.z = Math.sin((t * Math.PI) / (BEAT * 2)) * 0.08 * groove;
      tiki.torso.rotation.z += Math.sin((t * Math.PI) / (BEAT * 2)) * 0.04 * groove;
      tiki.squash.scale.y = 1 - beatHit * 0.03 * groove;
      tiki.tail.rotation.y = Math.sin((t * Math.PI) / (BEAT * 2)) * 0.3;

      // right paw plucks on every note; left paw slides along the neck with the pitch
      const pluck = recent(t, noteTimes, 18);
      // forearm rests over the top edge of the body; paw hangs onto the strings between the pickups
      reachArm(pluckArm, onBass(0.02 - pluck * 0.05, 0.02, 0.3 - pluck * 0.025), onBass(0.62, 0.05, 0.32));
      const fret = THREE.MathUtils.clamp(1.35 - (midi(noteAt(t)[1]) - midi('E1')) * 0.05, 0.85, 1.4);
      reachArm(fretArm, onBass(0, fret, 0.22));

      // foot taps quarter notes
      const tapFoot = tiki.feet.find(f => f.userData.side > 0);
      tapFoot.position.y = grooving ? (1 - beatHit) * 0.1 : 0;

      // glasses slide down the snout, then a wink and a smirk
      const down = ease(seg(t, GLASSES_DOWN, GLASSES_DOWN + 0.4));
      glasses.position.set(0, -0.3 * down, 0.25 * down); // slides down the long snout
      if (t >= GLASSES_DOWN) {
        tiki.head.rotation.x += 0.1 * down; // chin tips down to look over them
        tiki.setMouth(winking ? 0.25 : 0);
      }

      lights.pulse(grooving ? beatHit * 0.8 : 0.15);

      // camera
      let cam, look;
      if (t < 2) {
        cam = [0.6, 3.5, 7.4];
        look = [0, 3.0, 0.4];
      } // face, laid-back intro
      else if (t < 7) {
        const k = ease(seg(t, 2, 7));
        cam = [Math.sin(t * 0.5) * 0.6, 3.1, lerp(10.5, 9.5, k)];
        look = [0, 2.5, 0];
      } else if (t < GLASSES_DOWN) {
        cam = [-3.6, 2.8, 6.0];
        look = [-0.2, 2.2, 0.8];
      } // side: hands and bass
      else {
        cam = [0.3, 3.4, 6.4];
        look = [0, 3.1, 0.8];
      } // close-up for the wink
      camera.position.set(...cam);
      camera.lookAt(...look);
    }

    return { update };
  },

  audio(bus, t0) {
    playBass(bus, t0, bass);
    playDrums(bus, t0, drums);
  },
};

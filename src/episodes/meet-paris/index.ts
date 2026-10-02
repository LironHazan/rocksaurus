import * as THREE from 'three';
import { seg, ease, lerp } from '../../engine/math';
import type { Episode } from '../../engine/types';
import { createRockStage } from '../../world/rock-stage';
import { createParasaurolophus } from '../../characters/parasaurolophus';
import { idle, resetPose } from '../../characters/rory';
import { reachArm, armOf } from '../../characters/reach';
import { createMicStand } from '../../props/mic-stand';
import { addGothOutfit } from '../../props/goth-outfit';
import { sungNotes, mouthOpenAt } from '../../audio/vowels';
import { playVocal } from '../../audio/voice';
import { playBass } from '../../audio/bass';
import { playDrums } from '../../audio/drums';
import { vocal, bass, drums, BEAT, SING_IN, BELT } from './music';

// Beat sheet
//   0–2    Paris grips the mic stand, eyes closed, nodding to the beat in her head
//   2–10   she sings: bill opens on every note, crest glows with her voice, eyes close on long notes
//   10–12  the belt: head back, free paw up, crest blazing

const notes = sungNotes(vocal);
const singingAt = (t: number) => notes.find(n => t >= n.start && t < n.end) ?? null;

const episode: Episode = {
  id: 'meet-paris',
  title: 'Meet Paris 🎤',
  duration: 12,

  setup({ scene, camera }) {
    const lights = createRockStage(scene);
    const paris = createParasaurolophus();
    addGothOutfit(paris);
    scene.add(paris.root);
    const stand = createMicStand();
    stand.group.position.set(0, 0, 1.85); // a little space between the mic and her bill
    scene.add(stand.group);

    const leftArm = armOf(paris, -1);
    const rightArm = armOf(paris, 1);
    const world = new THREE.Vector3();
    const standToTorso = (p: THREE.Vector3) => paris.torso.worldToLocal(stand.group.localToWorld(world.copy(p)));

    function update(t: number) {
      const beatHit = Math.pow(1 - ((t / BEAT) % 1), 3);
      const note = singingAt(t);
      const open = mouthOpenAt(notes, t);
      const belting = t >= BELT + 0.25;
      const longNote = note !== null && note.end - note.start >= 0.7;

      resetPose(paris);
      idle(paris, t, { eyesOpen: belting || longNote ? 0.15 : t < SING_IN ? 0.2 : 1 });

      // stance: nod with the beat, lean into the mic when singing, head back for the belt
      paris.head.rotation.x += belting ? -0.22 * ease(seg(t, BELT + 0.25, BELT + 0.7)) : beatHit * 0.1 - open * 0.08;
      paris.torso.rotation.x = open * 0.05;
      paris.squash.scale.y = 1 - beatHit * 0.025;
      paris.tail.rotation.y = Math.sin((t * Math.PI) / BEAT / 2) * 0.3;
      paris.setMouth(open);
      paris.setCrestGlow(open * (belting ? 1.6 : 1));

      // paws: both on the mic stand; for the belt the right paw goes up
      paris.root.updateMatrixWorld(true);
      stand.group.updateMatrixWorld(true);
      reachArm(leftArm, standToTorso(stand.grips[0]));
      if (belting) {
        const up = ease(seg(t, BELT + 0.25, BELT + 0.7));
        reachArm(rightArm, standToTorso(stand.grips[1]).lerp(new THREE.Vector3(0.95, 2.9, 0.7), up));
      } else {
        reachArm(rightArm, standToTorso(stand.grips[1]));
      }

      const tapFoot = paris.feet.find(f => f.userData.side > 0)!;
      tapFoot.position.y = (1 - beatHit) * 0.08;

      lights.pulse(belting ? 0.7 + 0.3 * Math.sin(t * 20) : beatHit * 0.7);

      // camera
      let cam: [number, number, number];
      let look: [number, number, number];
      if (t < SING_IN) {
        cam = [0, 3.2, 9.5];
        look = [0, 2.0, 0]; // wide: the stage
      } else if (t < 6) {
        const k = ease(seg(t, SING_IN, 6));
        cam = [lerp(2.6, 1.8, k), 3.0, lerp(6.4, 5.8, k)]; // 3/4: the crest sweeps back in view
        look = [0, 2.4, 0.2];
      } else if (t < 8) {
        cam = [4.6, 2.9, 1.2];
        look = [0, 2.6, 0]; // profile: that crest
      } else if (t < BELT) {
        cam = [0.5, 2.9, 4.6];
        look = [0, 2.6, 0.6]; // close
      } else {
        cam = [1.2, 2.0, 5.6];
        look = [0, 2.7, 0.2]; // low-ish hero angle for the belt
      }
      camera.position.set(...cam);
      camera.lookAt(...look);
    }

    return { update };
  },

  audio(bus, t0) {
    playVocal(bus, t0, vocal);
    playBass(bus, t0, bass); // soft, under the voice
    playDrums(bus, t0, drums);
  },
};

export default episode;

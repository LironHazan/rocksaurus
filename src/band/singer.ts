import * as THREE from 'three';
import { createParasaurolophus } from '../characters/parasaurolophus';
import { idle, resetPose } from '../characters/rory';
import { reachArm, armOf } from '../characters/reach';
import { createMicStand } from '../props/mic-stand';
import { addGothOutfit } from '../props/goth-outfit';
import { ease, seg } from '../engine/math';
import { sungNotes, mouthOpenAt, type VocalPart } from '../audio/vowels';
import { beatPulse } from './timing';
import type { Performer, SongClock } from './types';

/** Paris on vocals: bill opens with the vowels, crest glows, eyes close on long notes, paw up on the big notes. */
export function createSinger(part: VocalPart, clock: SongClock): Performer {
  const root = new THREE.Group();
  const paris = createParasaurolophus();
  addGothOutfit(paris);
  root.add(paris.root);
  const stand = createMicStand();
  stand.group.position.z = 1.85;
  root.add(stand.group);

  const notes = sungNotes(part);
  const leftArm = armOf(paris, -1);
  const rightArm = armOf(paris, 1);
  const world = new THREE.Vector3();
  const standToTorso = (p: THREE.Vector3) => paris.torso.worldToLocal(stand.group.localToWorld(world.copy(p)));
  const raisedPaw = new THREE.Vector3(0.95, 2.9, 0.7);

  return {
    root,
    update(t) {
      const act = clock.activity(t);
      const hit = beatPulse(t, clock.beat);
      const open = mouthOpenAt(notes, t);
      const note = notes.find(n => t >= n.start && t < n.end) ?? null;
      const longNote = note !== null && note.end - note.start >= 0.9;
      const belting = longNote && note.end - note.start >= 1.4;

      resetPose(paris);
      idle(paris, t, { eyesOpen: longNote || act === 'pose' ? 0.15 : 1 });
      paris.head.rotation.x += belting ? -0.22 : act === 'idle' ? hit * 0.08 : hit * 0.1 - open * 0.08;
      paris.torso.rotation.x = open * 0.05;
      paris.squash.scale.y = 1 - hit * 0.025;
      paris.tail.rotation.y = Math.sin((t * Math.PI) / clock.beat / 2) * 0.3;
      paris.setMouth(act === 'pose' ? Math.max(open, 0.6) : open);
      paris.setCrestGlow(open * (belting ? 1.6 : 1) + (act === 'pose' ? 0.8 : 0));

      root.updateMatrixWorld(true);
      reachArm(leftArm, standToTorso(stand.grips[0]));
      const up = belting && note ? ease(seg(t, note.start, note.start + 0.4)) : act === 'pose' ? 1 : 0;
      reachArm(rightArm, standToTorso(stand.grips[1]).lerp(raisedPaw, up));
      paris.feet.find(f => f.userData.side > 0)!.position.y = (1 - hit) * 0.08;
    },
  };
}

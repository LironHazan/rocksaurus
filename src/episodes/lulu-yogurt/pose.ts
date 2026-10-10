import * as THREE from 'three';
import { createLulu, reachLulu, resetLulu, walkLulu } from '../../characters/lulu';
import { reachArm, releaseArm } from '../../characters/reach';
import { idle, resetPose } from '../../characters/rory';
import type { CharacterRig } from '../../characters/types';
import { addPonytail } from '../../props/ponytail';
import { addFlannel } from '../../props/flannel';

// Lulu in her office flannel (she's too tired to change, even for bed), and the poses every location uses: back to
// neutral each frame, the walk cycle, a paw to a point, and the mouth's place in the world.

const tmp = new THREE.Vector3();

export function createTiredLulu() {
  const lulu = createLulu();
  const hair = addPonytail(lulu);
  addFlannel(lulu);
  const greenCheeks = new THREE.Color(0xa8d86a);
  const pinkCheeks = new THREE.Color(0xffb3c1);
  const cheekMat = lulu.cheeks[0]!.material;
  if (!(cheekMat instanceof THREE.MeshStandardMaterial)) throw new Error('Lulu’s cheeks are not a standard material');

  return {
    lulu,
    hair,
    /** Back to neutral: call first every frame. */
    reset() {
      resetLulu(lulu);
      cheekMat.color.copy(pinkCheeks);
      hair.ponytail.rotation.set(0.1, 0, 0);
      lulu.head.visible = true;
    },
    /** The walk cycle at `phase` (1 = one step), scaled by `amount`, the ponytail bouncing. */
    walk: (phase: number, amount = 1) => walkLulu(lulu, phase, amount, hair.ponytail),
    /** A paw to a world point (her arms stretch, so anything is in reach), the elbow bent out. */
    grip: (side: -1 | 1, world: THREE.Vector3) => reachLulu(lulu, side, world),
    /** Nauseous: `k` from 0 (fine) to 1 (green, cheeks puffed). */
    queasy(k: number) {
      cheekMat.color.copy(pinkCheeks).lerp(greenCheeks, k);
      for (const c of lulu.cheeks) c.scale.set(1 + k * 0.6, 0.7 + k * 0.5, 0.35 + k * 0.3);
    },
    /** Where her mouth is, in the world (call after `updateMatrixWorld`). */
    mouth: (out: THREE.Vector3) => lulu.face.localToWorld(out.set(0, -0.23, 0.74)),
  };
}

export type TiredLulu = ReturnType<typeof createTiredLulu>;

/** Any other rig back to neutral, idling, its feet back where they were built. */
export function restRig(rig: CharacterRig, feet: readonly THREE.Vector3[], t: number, eyesOpen = 1) {
  resetPose(rig);
  rig.root.position.set(0, 0, 0);
  rig.squash.rotation.set(0, 0, 0);
  rig.feet.forEach((f, i) => f.position.copy(feet[i]!));
  for (const arm of rig.arms) releaseArm(arm);
  idle(rig, t, { eyesOpen });
}

/** A rig's paw to a world point. */
export function reachTo(arm: THREE.Object3D, world: THREE.Vector3) {
  reachArm(arm, arm.parent!.worldToLocal(tmp.copy(world)));
}

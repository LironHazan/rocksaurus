import * as THREE from 'three';
import { createLulu } from '../../characters/lulu';
import { armOf, reachArm, releaseArm } from '../../characters/reach';
import { idle, resetPose } from '../../characters/rory';
import type { CharacterRig } from '../../characters/types';
import { addPonytail } from '../../props/ponytail';
import { addFlannel } from '../../props/flannel';

// Lulu in her office flannel (she's too tired to change, even for bed), and the poses every location uses: back to
// neutral each frame, the walk cycle, a paw to a point, and the mouth's place in the world.

const REST_ARM = -0.3;
const tmp = new THREE.Vector3();

export function createTiredLulu() {
  const lulu = createLulu();
  const hair = addPonytail(lulu);
  addFlannel(lulu);
  const feet = lulu.feet.map(f => f.position.clone());
  const greenCheeks = new THREE.Color(0xa8d86a);
  const pinkCheeks = new THREE.Color(0xffb3c1);
  const cheekMat = lulu.cheeks[0]!.material;
  if (!(cheekMat instanceof THREE.MeshStandardMaterial)) throw new Error('Lulu’s cheeks are not a standard material');

  return {
    lulu,
    hair,
    /** Back to neutral: call first every frame. */
    reset() {
      lulu.root.position.set(0, 0, 0);
      lulu.root.rotation.set(0, 0, 0);
      lulu.squash.rotation.set(0, 0, 0);
      lulu.squash.scale.set(1, 1, 1);
      lulu.head.rotation.set(0, 0, 0);
      lulu.tail.rotation.set(0, 0, 0);
      for (const a of lulu.arms) {
        releaseArm(a);
        a.rotation.set(REST_ARM, 0, a.userData.side * 0.15);
      }
      lulu.feet.forEach((f, i) => f.position.copy(feet[i]!));
      for (const c of lulu.cheeks) c.scale.set(1, 0.7, 0.35);
      for (const e of lulu.eyes) e.scale.set(1, 1, 1);
      for (const s of lulu.sticks) s.visible = false;
      lulu.setMouth(0);
      cheekMat.color.copy(pinkCheeks);
      hair.ponytail.rotation.set(0.1, 0, 0);
      lulu.head.visible = true;
    },
    /** The walk cycle at `phase` (1 = one step), scaled by `amount`. */
    walk(phase: number, amount = 1) {
      const p = Math.PI * phase;
      lulu.root.position.y += Math.abs(Math.sin(p)) * 0.18 * amount;
      for (const f of lulu.feet)
        f.position.y += Math.max(0, Math.sin(p + (f.userData.side > 0 ? 0 : Math.PI))) * 0.4 * amount;
      lulu.squash.rotation.z = Math.sin(p) * 0.06 * amount;
      lulu.tail.rotation.y = Math.sin(p) * 0.35 * amount;
      hair.ponytail.rotation.x = 0.1 + Math.abs(Math.sin(p - 0.5)) * 0.35 * amount;
    },
    /** A paw to a world point (her arms stretch, so anything is in reach), the elbow bent out. */
    grip(side: -1 | 1, world: THREE.Vector3) {
      const pivot = armOf(lulu, side);
      const target = lulu.body.worldToLocal(tmp.copy(world));
      const elbow = pivot.position.clone().lerp(target, 0.5);
      elbow.x += side * 0.3;
      elbow.y -= 0.15;
      reachArm(pivot, target, elbow);
    },
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

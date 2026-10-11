import type * as THREE from 'three';
import { idle, resetPose } from './rory';
import { releaseArm } from './reach';
import type { CharacterRig } from './types';

/**
 * Back to rest, then idling: the neutral pose, the rig at its origin, its feet back where they were built (`feet`, as
 * cloned after building), its arms let go of whatever they reached for. Call first every frame, then pose.
 */
export function restRig(
  rig: CharacterRig,
  feet: readonly THREE.Vector3[],
  t: number,
  idling: Parameters<typeof idle>[2] = {},
): void {
  resetPose(rig);
  rig.root.position.set(0, 0, 0);
  rig.squash.rotation.set(0, 0, 0);
  rig.feet.forEach((f, i) => f.position.copy(feet[i]!));
  for (const arm of rig.arms) releaseArm(arm);
  idle(rig, t, idling);
}

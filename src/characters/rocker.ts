import * as THREE from 'three';
import { createRory, idle } from './rory';
import { enableShadows } from './materials';
import { reachArm, armOf } from './reach';
import { createGuitar } from '../props/guitar';
import { addMohawk } from '../props/mohawk';
import { addTattoo } from '../props/tattoo';

type RoryRig = ReturnType<typeof createRory>;
export type GuitarRig = RoryRig & { guitar: THREE.Object3D };

/** Straps Rory's pink guitar on (attached to the torso, so it moves with him). */
export function addGuitar<T extends RoryRig>(rig: T): T & { guitar: THREE.Object3D } {
  const guitar = createGuitar({ color: 0xff5fa2 }); // pink
  guitar.position.set(-0.15, 1.05, 0.98);
  guitar.rotation.set(0.1, 0, 0.95);
  enableShadows(guitar);
  rig.torso.add(guitar);
  return Object.assign(rig, { guitar });
}

/** The arm on the neck side (−1) — rests on the strings in the old static poses. */
export const strumArm = (rig: RoryRig) => armOf(rig, -1);
/** The arm on the body side (1) — free for fist pumps in the old static poses. */
export const freeArm = (rig: RoryRig) => armOf(rig, 1);

export interface Playing {
  /** 0..1 right after a strum: the picking paw dips into the strings. */
  strum: number;
  /** Where the fretting paw is on the neck, 0 = near the body, 1 = near the head. */
  fret: number;
}

/**
 * Puts Rory's paws on the guitar like a real player: picking paw on the strings over the body with the forearm
 * resting on the guitar's edge, fretting paw on the neck. Call every frame after resetPose().
 */
export function playGuitar(rig: GuitarRig, { strum, fret }: Playing): void {
  const g = rig.guitar;
  g.updateMatrix();
  const onGuitar = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).applyMatrix4(g.matrix);
  reachArm(armOf(rig, 1), onGuitar(0.04 - strum * 0.06, -0.02, 0.3 - strum * 0.03), onGuitar(0.62, 0.05, 0.3));
  reachArm(armOf(rig, -1), onGuitar(0, THREE.MathUtils.lerp(1.0, 1.6, fret), 0.17));
}

/** Rory in his rock-star pose: guitar on, one tiny arm up, eyes shut, mouth open mid-"RAWR". */
export function createRockerRory(): GuitarRig {
  const rory = createRory();
  addTattoo(rory); // before posing: it's projected onto the rig at rest
  idle(rory, 0.3, { eyesOpen: 0.14 }); // happy squeezed-shut eyes
  const rocker = addGuitar(rory);
  addMohawk(rocker);
  rocker.setMouth(1);
  rocker.head.rotation.set(-0.18, 0, 0.22); // head thrown back, tilted
  rocker.torso.rotation.z = -0.06;
  freeArm(rocker).rotation.set(0.3, 0, 2.2); // 🤘 arm up
  strumArm(rocker).rotation.set(-0.9, 0, -0.2);
  rocker.tail.rotation.y = 0.3;
  return rocker;
}

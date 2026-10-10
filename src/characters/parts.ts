import * as THREE from 'three';
import { ball } from './materials';
import type { Vec3 } from './types';

/** A plush foot's shape, in the rig's units. */
export interface FootBuild {
  /** The sole: a squashed ball of `radius`, its centre `lift` above the ground, stretched by `stretch`. */
  radius: number;
  lift: number;
  stretch: Vec3;
  /** Three toes along the front: their radius, the gap between them, and the height and depth of the row. */
  toe: { radius: number; gap: number; y: number; z: number };
}

/** The big build's foot: Rory's and Paris's. */
export const BIG_FOOT: FootBuild = {
  radius: 0.4,
  lift: 0.2,
  stretch: [1, 0.6, 1.25],
  toe: { radius: 0.08, gap: 0.14, y: 0.17, z: 0.48 },
};

/**
 * A sole with three toes on top of its front, standing `at` (on the ground, for the right foot: `x` is mirrored for
 * the left); `userData.side` set so the rig finds it by side.
 */
export function createFoot(
  side: number,
  skin: THREE.Material,
  toes: THREE.Material,
  at: Readonly<Vec3>,
  { radius, lift, stretch, toe }: FootBuild,
): THREE.Group {
  const foot = new THREE.Group();
  foot.position.set(side * at[0], at[1], at[2]);
  foot.add(ball(radius, skin, [0, lift, 0], stretch));
  for (let k = -1; k <= 1; k++) foot.add(ball(toe.radius, toes, [k * toe.gap, toe.y, toe.z]));
  foot.userData.side = side;
  return foot;
}

/** Below this a mouth reads as shut: the closed smile shows instead of a sliver of open mouth. */
const MOUTH_SHUT = 0.05;
/** The open mouth's width when barely open, as a fraction of wide open: it stays round, never a slit. */
const MOUTH_MIN_WIDTH = 0.6;

/**
 * setMouth(k) for a face with a closed `smile` and an open `mouth`: 0 = closed smile, 1 = wide open. The open mouth
 * grows from `minWidth` and `minHeight` (fractions of wide open) to full size; a mouth that never quite closes (Silvi's)
 * passes a minimum height.
 */
export function mouthSetter(
  smile: THREE.Object3D,
  mouth: THREE.Object3D,
  minWidth = MOUTH_MIN_WIDTH,
  minHeight = 0,
): (k: number) => void {
  return k => {
    smile.visible = k < MOUTH_SHUT;
    mouth.visible = k >= MOUTH_SHUT;
    mouth.scale.set(minWidth + (1 - minWidth) * k, minHeight + (1 - minHeight) * k, 1);
  };
}

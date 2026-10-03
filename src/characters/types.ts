import type * as THREE from 'three';

export type Vec3 = [number, number, number];

/** An ellipsoid in a rig's local space: where it sits and its per-axis radii. */
export interface Ellipsoid {
  center: Vec3;
  radii: Vec3;
}

/**
 * Measurements a rig publishes so fitted props size themselves instead of every caller passing geometry.
 * Derived from the same constants that build the body, so the fit cannot drift from the shape.
 */
export interface RigFit {
  /** Upper body a shirt wraps (torso space). */
  torso: Ellipsoid;
  /** Head radii (head space, centered on the head origin). */
  head: Vec3;
}

/**
 * The rig every character exposes, so shared helpers (idle(), resetPose(), reachArm()) work on all of them.
 * Arms are shoulder pivots with a capsule child; feet are groups you can lift; `userData.side` is -1 (left) / 1 (right).
 */
export interface CharacterRig {
  root: THREE.Group;
  /** Squash & stretch around the feet. */
  squash: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  eyes: THREE.Group[];
  cheeks: THREE.Mesh[];
  arms: THREE.Group[];
  feet: THREE.Group[];
  tail: THREE.Group;
  /** Published by rigs that wear fitted props (clothes, hair), so props read the shape instead of the caller. */
  fit?: RigFit;
  /** 0 = closed, 1 = wide open. */
  setMouth(k: number): void;
  setFrown(on: boolean): void;
}

/** A rig that publishes its measurements — what fitted props (band tee, hair) require. */
export type FittedRig = CharacterRig & { fit: RigFit };

import type * as THREE from 'three';

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
  /** 0 = closed, 1 = wide open. */
  setMouth(k: number): void;
  setFrown(on: boolean): void;
}

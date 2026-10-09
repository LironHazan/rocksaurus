import * as THREE from 'three';
import { taperedTube } from '../props/tube';
import { ball } from './materials';
import type { Vec3 } from './types';

export interface TailSpec {
  /**
   * The tail's centre line, root to tip, in the tail group's space. The first point must be INSIDE the body, so the
   * tail grows out of it instead of being stuck on.
   */
  spine: readonly Vec3[];
  /** Radius where it leaves the body, and at the tip. */
  base: number;
  tip?: number;
  /** How the radius falls off along the tail (1 = straight cone, higher = thins out sooner). */
  taper?: number;
}

/**
 * A dinosaur tail: one smooth tube along `spine` that starts inside the body and tapers to a rounded tip. Every rig
 * builds its tail with this (never a cone stuck on the back, which shows a seam and looks detached). Returns the
 * meshes in a group; add it to the rig's `tail` pivot.
 */
export function growTail(material: THREE.Material, { spine, base, tip = 0.05, taper = 1.2 }: TailSpec): THREE.Group {
  const g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(spine.map(p => new THREE.Vector3(...p)));
  g.add(
    new THREE.Mesh(
      taperedTube(curve, s => tip + (base - tip) * (1 - s) ** taper, { segments: 40, radial: 24 }),
      material,
    ),
  );
  g.add(ball(tip * 1.3, material, [...spine.at(-1)!])); // rounded tip
  return g;
}

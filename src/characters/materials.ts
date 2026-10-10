import * as THREE from 'three';
import type { Vec3 } from './types';

/** Fuzzy plush fabric look: rough base + white sheen at grazing angles. */
export const plush = (color: THREE.ColorRepresentation) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.85,
    sheen: 1,
    sheenRoughness: 0.45,
    sheenColor: new THREE.Color(0xffffff),
  });

export const glossyEye = () => new THREE.MeshPhysicalMaterial({ color: 0x1b1b2e, roughness: 0.15, clearcoat: 1 });
export const shine = () => new THREE.MeshBasicMaterial({ color: 0xffffff });
export const blush = (color: THREE.ColorRepresentation) =>
  new THREE.MeshStandardMaterial({ color, roughness: 1, transparent: true, opacity: 0.85 });
export const matte = (color: THREE.ColorRepresentation) => new THREE.MeshStandardMaterial({ color, roughness: 0.6 });

/** Rings per sphere, as a share of its segments around: a little fewer, since the poles need fewer. */
const RINGS_PER_SEGMENT = 0.75;
/**
 * One sphere geometry per size and detail, shared by every ball that size: a rig is a few hundred balls in a handful
 * of sizes, and every geometry is a separate buffer on the GPU. Shared geometries are never edited (a ball changes
 * shape through its mesh's scale); disposing one when a Short ends is safe, as the renderer uploads it again if a
 * later Short uses it.
 */
const spheres = new Map<string, THREE.SphereGeometry>();
function sphere(r: number, seg: number): THREE.SphereGeometry {
  const key = `${r}:${seg}`;
  let g = spheres.get(key);
  if (!g) {
    g = new THREE.SphereGeometry(r, seg, Math.round(seg * RINGS_PER_SEGMENT));
    spheres.set(key, g);
  }
  return g;
}

/** Squashed sphere — the building block of every character. */
export function ball(
  r: number,
  mat: THREE.Material,
  pos: Readonly<Vec3>,
  scale: Readonly<Vec3> = [1, 1, 1],
  seg = 32,
): THREE.Mesh {
  const m = new THREE.Mesh(sphere(r, seg), mat);
  m.position.set(...pos);
  m.scale.set(...scale);
  return m;
}

export function enableShadows(obj: THREE.Object3D): void {
  obj.traverse(o => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
}

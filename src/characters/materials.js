import * as THREE from 'three';

/** Fuzzy plush fabric look: rough base + white sheen at grazing angles. */
export const plush = color =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.85,
    sheen: 1,
    sheenRoughness: 0.45,
    sheenColor: new THREE.Color(0xffffff),
  });

export const glossyEye = () => new THREE.MeshPhysicalMaterial({ color: 0x1b1b2e, roughness: 0.15, clearcoat: 1 });
export const shine = () => new THREE.MeshBasicMaterial({ color: 0xffffff });
export const blush = color => new THREE.MeshStandardMaterial({ color, roughness: 1, transparent: true, opacity: 0.85 });
export const matte = color => new THREE.MeshStandardMaterial({ color, roughness: 0.6 });

/** Squashed sphere — the building block of every character. */
export function ball(r, mat, pos, scale = [1, 1, 1], seg = 32) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)), mat);
  m.position.set(...pos);
  m.scale.set(...scale);
  return m;
}

export function enableShadows(obj) {
  obj.traverse(o => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
}

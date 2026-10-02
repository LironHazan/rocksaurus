import * as THREE from 'three';
import { plush, enableShadows } from '../characters/materials.js';

// Rory's head is an ellipsoid with these radii (see createRory: head ball 1.05 scaled 1.1 × 0.95 × 1).
const HEAD = { x: 1.155, y: 0.9975, z: 1.05 };

/**
 * Punk mohawk: a row of soft plush spikes along the middle of the head, front to back,
 * tallest in the middle. Replaces the little head bump.
 */
export function addMohawk(rig, { color = 0xff5fa2, spikes = 7 } = {}) {
  const mat = plush(color);
  const group = new THREE.Group();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < spikes; i++) {
    const k = i / (spikes - 1);                       // 0 = forehead, 1 = back of the head
    const phi = THREE.MathUtils.lerp(-0.5, 1.35, k);  // angle from the top of the head toward the back
    const surface = new THREE.Vector3(0, HEAD.y * Math.cos(phi), -HEAD.z * Math.sin(phi));
    const normal = new THREE.Vector3(0, surface.y / HEAD.y ** 2, surface.z / HEAD.z ** 2).normalize();
    const height = 0.5 + Math.sin(k * Math.PI) * 0.35;  // tallest in the middle
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.22, height, 20), mat);
    spike.scale.x = 0.8;                                 // flat blade, like gelled hair
    spike.quaternion.setFromUnitVectors(up, normal);
    spike.position.copy(surface).multiplyScalar(0.93).addScaledVector(normal, height / 2);
    group.add(spike);
  }
  enableShadows(group);
  rig.headBump.visible = false;
  rig.head.add(group);
  rig.mohawk = group;
  return group;
}

import * as THREE from 'three';
import { ball, enableShadows } from '../characters/materials.js';

/**
 * Cool rounded sunglasses over a rig's eyes. Pass the head group and the eye positions (head space).
 * Lenses are glossy black with a little colored sheen; arms go back toward the sides of the head.
 */
export function addSunglasses(head, { eyes = [[-0.42, 0.15, 0.9], [0.42, 0.15, 0.9]], size = 0.3, tint = 0x5a3aff } = {}) {
  const g = new THREE.Group();
  const lens = new THREE.MeshPhysicalMaterial({ color: 0x0c0c14, roughness: 0.05, clearcoat: 1, sheen: 1, sheenColor: new THREE.Color(tint) });
  const frame = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.4 });
  for (const [x, y, z] of eyes) {
    const s = Math.sign(x);
    g.add(ball(size, lens, [x, y, z + 0.08], [1.15, 0.85, 0.35], 32));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(size * 1.05, 0.025, 8, 32), frame);
    rim.scale.set(1.12, 0.85, 1);
    rim.position.set(x, y, z + 0.1);
    rim.rotation.y = s * 0.25;
    g.add(rim);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.7), frame);   // temple arm toward the ear
    arm.position.set(x + s * size * 1.05, y + 0.05, z - 0.3);
    arm.rotation.y = s * 0.35;
    g.add(arm);
  }
  const bridge = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 16, Math.PI), frame);
  bridge.position.set(0, eyes[0][1] + 0.05, eyes[0][2] + 0.16);
  g.add(bridge);
  enableShadows(g);
  head.add(g);
  return g;
}

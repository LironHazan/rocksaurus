import * as THREE from 'three';
import { ball, enableShadows } from '../../characters/materials';
import { createCeratops } from '../../characters/ceratops';

/** Mirta's colours: sage green, a light blue work shirt with white stripes, gold hoop earrings. */
const MIRTA_COLORS = {
  body: 0xa8d5b8,
  belly: 0xeef7ef,
  spots: 0x7fbf98,
  shirt: '#6fa8dc',
  stripes: '#e8f2fb',
  horn: 0xfff3e0,
  cheeks: 0xff9fb0,
  lips: 0xc24a6a,
  eyes: 0x8a5a2b, // brown iris
  gold: 0xf5c451,
};

/**
 * Mirta: the office's cleaner, the same build as Silvi, with her Papo Pako lanyard (Facilities), a red headscarf
 * knotted at the back, and her own language.
 */
export function createMirta() {
  const rig = createCeratops(MIRTA_COLORS, { badge: 'MIRTA', role: 'Facilities 🧽' });
  const scarf = new THREE.MeshStandardMaterial({ color: 0xd94a4a, roughness: 0.85, side: THREE.DoubleSide });
  // the top of the head, a little bigger than it (head radius 0.5): the scarf sits on it, tipped back
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), scarf);
  cap.scale.set(1, 0.95, 1.08);
  cap.position.set(0, 0.04, -0.05);
  cap.rotation.x = -0.35;
  rig.head.add(cap);
  rig.head.add(ball(0.11, scarf, [0, 0.12, -0.55], [1.2, 0.8, 0.7])); // the knot
  for (const s of [-1, 1]) rig.head.add(ball(0.08, scarf, [s * 0.09, 0.0, -0.62], [0.5, 1.4, 0.4])); // its ends
  enableShadows(rig.head);
  return rig;
}

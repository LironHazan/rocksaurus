import * as THREE from 'three';
import { ball } from '../characters/materials.js';

/**
 * Chunky toy electric guitar. Origin = center of the body, neck points +y.
 *   neck: neck length (1.5 guitar, ~2.1 bass) · strings: 6 guitar, 4 bass
 */
export function createGuitar({ color = 0xe63946, neck: neckLen = 1.5, strings = 6 } = {}) {
  const gloss = new THREE.MeshPhysicalMaterial({ color, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 });
  const white = new THREE.MeshStandardMaterial({ color: 0xfaf7f0, roughness: 0.4 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a3b, roughness: 0.6 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xd8d8e0, roughness: 0.25, metalness: 1 });

  const g = new THREE.Group();
  g.add(ball(0.55, gloss, [0, 0, 0], [1, 0.95, 0.28]));        // lower bout
  g.add(ball(0.42, gloss, [0, 0.52, 0], [1, 0.9, 0.28]));      // upper bout
  g.add(ball(0.3, white, [0.12, -0.05, 0.1], [1, 0.8, 0.15])); // pickguard
  for (const y of [-0.15, 0.2]) {                               // pickups
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.05), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    p.position.set(0, y, 0.16);
    g.add(p);
  }
  for (let i = 0; i < 2; i++) g.add(ball(0.05, metal, [0.3, -0.3 - i * 0.14, 0.15], [1, 1, 0.6], 12)); // knobs

  const nutY = 0.65 + neckLen - 0.02;
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.16, neckLen, 0.08), wood);
  neck.position.set(0, 0.65 + neckLen / 2, 0.04);
  g.add(neck);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.36, 0.08), gloss);
  head.position.set(0, nutY + 0.17, 0.04);
  g.add(head);
  const perSide = Math.ceil(strings / 2);
  for (const s of [-1, 1]) for (let i = 0; i < perSide; i++) g.add(ball(0.035, metal, [s * 0.17, nutY + 0.05 + i * (0.27 / perSide), 0.06], [1, 1, 1], 10)); // tuners

  // bridge, nut and six strings running from the bridge up the neck to the headstock
  const black = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.05), black);
  bridge.position.set(0, -0.36, 0.18);
  g.add(bridge);
  const nut = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.03, 0.03), white);
  nut.position.set(0, nutY, 0.09);
  g.add(nut);

  const stringMat = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.3, metalness: 0.8 });
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < strings; i++) {
    const k = i / (strings - 1) - 0.5;                       // -0.5 … 0.5 across the strings
    const from = new THREE.Vector3(k * 0.22, -0.36, 0.2);    // bridge (wider spacing)
    const to = new THREE.Vector3(k * 0.12, nutY, 0.105);     // nut (narrower)
    const dir = to.clone().sub(from);
    const thickness = (strings <= 4 ? 0.011 : 0.0075) - i * 0.0008; // lowest string thickest
    const str = new THREE.Mesh(new THREE.CylinderGeometry(thickness, thickness, dir.length(), 6), stringMat);
    str.position.copy(from).addScaledVector(dir, 0.5);
    str.quaternion.setFromUnitVectors(up, dir.normalize());
    g.add(str);
  }
  return g;
}

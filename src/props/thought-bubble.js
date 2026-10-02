import * as THREE from 'three';
import { ball } from '../characters/materials';
import { createPizza } from './pizza';

/** Cartoon thought bubble (faces +z) with a pizza slice in it. */
export function createThoughtBubble() {
  const white = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6,
    emissive: 0xffffff,
    emissiveIntensity: 0.25,
  });
  const g = new THREE.Group();
  g.add(ball(0.08, white, [-0.6, -0.8, 0]));
  g.add(ball(0.14, white, [-0.4, -0.52, 0]));
  g.add(ball(0.62, white, [0, 0, 0], [1.25, 1, 0.35]));
  const { slice } = createPizza({ radius: 0.55 });
  slice.rotation.set(Math.PI / 2, 0, Math.PI / 2); // flat face to camera, tip pointing down
  slice.position.z = 0.24;
  g.add(slice);
  return g;
}

/** "Idea!" light bulb. */
export function createLightbulb() {
  const g = new THREE.Group();
  g.add(
    ball(
      0.24,
      new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0xffd23a, emissiveIntensity: 1.4, roughness: 0.3 }),
      [0, 0, 0],
    ),
  );
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.09, 0.18, 16),
    new THREE.MeshStandardMaterial({ color: 0x9aa0aa, metalness: 0.8, roughness: 0.3 }),
  );
  base.position.y = -0.27;
  g.add(base);
  return g;
}

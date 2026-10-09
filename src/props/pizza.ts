import * as THREE from 'three';
import { enableShadows } from '../characters/materials';

const SLICE = Math.PI / 4; // one slice = 1/8 pizza
const DIR = Math.PI * 1.5; // the loose slice points toward -x

/**
 * Pepperoni pizza with one loose slice.
 * Returns { pizza, slice }: `pizza` is the rest, `slice` is a separate object whose origin is its
 * center of mass, so you can fly it around. Place `slice` at pizza position + sliceOffset to sit in the gap.
 */
export function createPizza({ radius = 0.75 } = {}) {
  const mat = (color: number, roughness: number) => new THREE.MeshStandardMaterial({ color, roughness });
  const crust = mat(0xe2a65a, 0.8),
    sauce = mat(0xd2462a, 0.6),
    cheese = mat(0xffd36b, 0.5),
    pep = mat(0xb3302a, 0.5);

  function layers(start: number, len: number) {
    const g = new THREE.Group();
    for (const [r, h, y, m] of [
      [radius, 0.08, 0.04, crust],
      [radius * 0.9, 0.02, 0.085, sauce],
      [radius * 0.86, 0.03, 0.1, cheese],
    ] as const) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48, 1, false, start, len), m);
      mesh.position.y = y;
      g.add(mesh);
    }
    return g;
  }
  function pepperoni(group: THREE.Group, r: number, theta: number) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.12, radius * 0.12, 0.03, 20), pep);
    p.position.set(radius * r * Math.sin(theta), 0.12, radius * r * Math.cos(theta));
    group.add(p);
  }

  const pizza = layers(DIR + SLICE / 2, Math.PI * 2 - SLICE);
  for (const th of [0.3, 1.1, 1.9, 2.7, 3.5, 5.7]) pepperoni(pizza, 0.62, th);
  for (const th of [0.7, 2.3, 3.8]) pepperoni(pizza, 0.3, th);

  const centroid = (2 * radius * Math.sin(SLICE / 2)) / (3 * (SLICE / 2));
  const inner = layers(DIR - SLICE / 2, SLICE);
  pepperoni(inner, 0.6, DIR);
  inner.position.x = centroid; // shift so the slice's own origin is its center
  const slice = new THREE.Group();
  slice.add(inner);

  enableShadows(pizza);
  enableShadows(slice);
  return { pizza, slice, sliceOffset: new THREE.Vector3(-centroid, 0, 0) };
}

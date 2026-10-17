import * as THREE from 'three';

// Behind the band, a sculpture of light: rings inside rings, turning slowly on their own axes, an eye at the
// middle. It breathes with the kick. Everything here is a pure function of t.

/** The rings: radius, how fast each turns (radians a second, about x and y), and its colour. */
const RINGS = [
  { r: 3.2, spin: [0.11, 0.17], color: 0x7b3fff },
  { r: 2.5, spin: [-0.19, 0.08], color: 0x3fd4ff },
  { r: 1.8, spin: [0.23, -0.21], color: 0xff3fa4 },
  { r: 1.2, spin: [-0.29, 0.31], color: 0xffd36b },
] as const;
/** How much the kick swells the sculpture (fraction of its size). */
const BREATH = 0.06;

export interface Sculpture {
  group: THREE.Group;
  /** Turn it to t, swelling with `kick` (0..1). */
  update(t: number, kick: number): void;
}

export function createSculpture(): Sculpture {
  const group = new THREE.Group();
  const rings = RINGS.map(({ r, color }) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.045, 10, 96),
      new THREE.MeshBasicMaterial({ color, toneMapped: false }),
    );
    group.add(ring);
    return ring;
  });
  const eye = new THREE.Group();
  eye.add(
    new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf2efe6 })),
    new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 12), new THREE.MeshBasicMaterial({ color: 0x7b3fff })),
  );
  eye.children[1]!.position.z = 0.3; // the iris, looking out
  eye.scale.z = 0.6;
  group.add(eye);
  return {
    group,
    update(t, kick) {
      rings.forEach((ring, i) => {
        const [x, y] = RINGS[i]!.spin;
        ring.rotation.set(t * x, t * y, 0);
      });
      group.scale.setScalar(1 + kick * BREATH);
    },
  };
}

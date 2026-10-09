import * as THREE from 'three';

/**
 * A barista apron: a curved panel over the front of a round body (a slice of the body ellipsoid), a neck
 * strap and a front pocket. `body` is the torso ellipsoid it hugs (center + radii, in torso space).
 */
export function addApron(
  torso: THREE.Object3D,
  { body = { center: [0, 1.2, 0] as const, radii: [1, 1.1, 0.95] as const }, color = 0x2d6a4f } = {},
): THREE.Group {
  const cloth = new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide });
  const g = new THREE.Group();
  const [cx, cy, cz] = body.center;
  const [rx, ry, rz] = body.radii;
  // front slice of the body: phi around +z, theta from the chest down to the hips
  const panel = new THREE.Mesh(new THREE.SphereGeometry(1.035, 40, 24, Math.PI / 2 - 0.85, 1.7, 0.75, 1.75), cloth);
  panel.scale.set(rx, ry, rz);
  panel.position.set(cx, cy, cz);
  g.add(panel);
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 8, 32, Math.PI), cloth);
  strap.position.set(cx, cy + ry * 0.62, cz + rz * 0.5);
  strap.rotation.x = -0.6;
  g.add(strap);
  const pocket = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.3, 0.04),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.8), roughness: 0.9 }),
  );
  pocket.position.set(cx, cy - ry * 0.25, cz + rz * 1.0);
  pocket.rotation.x = 0.25;
  g.add(pocket);
  g.traverse(o => {
    if (o instanceof THREE.Mesh) o.castShadow = o.receiveShadow = true;
  });
  torso.add(g);
  return g;
}

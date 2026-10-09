import * as THREE from 'three';

const MATCHA = 0x7bb661;
const FOAM = 0xb9dc8f;

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}

/** A café cup of matcha latte with a handle. Origin at its base. */
export function createMatchaCup(color = 0xf4f1ea): THREE.Group {
  const g = new THREE.Group();
  const ceramic = new THREE.MeshStandardMaterial({ color, roughness: 0.35 });
  const body = mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.32, 28, 1, true), ceramic);
  body.position.y = 0.16;
  ceramic.side = THREE.DoubleSide;
  const bottom = mesh(new THREE.CircleGeometry(0.15, 24), ceramic);
  bottom.rotation.x = -Math.PI / 2;
  const tea = mesh(
    new THREE.CircleGeometry(0.19, 28),
    new THREE.MeshStandardMaterial({ color: MATCHA, roughness: 0.8 }),
  );
  tea.rotation.x = -Math.PI / 2;
  tea.position.y = 0.28;
  // latte-art leaf
  const art = mesh(new THREE.CircleGeometry(0.07, 16), new THREE.MeshStandardMaterial({ color: FOAM, roughness: 0.9 }));
  art.rotation.x = -Math.PI / 2;
  art.scale.set(0.6, 1.3, 1);
  art.position.y = 0.282;
  const handle = mesh(new THREE.TorusGeometry(0.08, 0.025, 8, 16), ceramic);
  handle.position.set(0.21, 0.17, 0);
  g.add(body, bottom, tea, art, handle);
  return g;
}

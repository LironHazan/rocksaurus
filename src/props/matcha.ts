import * as THREE from 'three';

const MATCHA = 0x7bb661;
const FOAM = 0xb9dc8f;

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}

/** A matcha bowl (chawan) full of frothy green tea. Origin at its base. */
export function createMatchaBowl(): THREE.Group {
  const g = new THREE.Group();
  const profile = [
    [0.0, 0],
    [0.16, 0],
    [0.17, 0.04],
    [0.3, 0.1],
    [0.36, 0.26],
    [0.37, 0.36],
    [0.34, 0.36],
    [0.33, 0.27],
    [0.27, 0.13],
    [0.0, 0.1],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  g.add(
    mesh(new THREE.LatheGeometry(profile, 40), new THREE.MeshStandardMaterial({ color: 0x3b3f4a, roughness: 0.5 })),
  );
  const tea = mesh(new THREE.CircleGeometry(0.33, 32), new THREE.MeshStandardMaterial({ color: FOAM, roughness: 0.9 }));
  tea.rotation.x = -Math.PI / 2;
  tea.position.y = 0.31;
  g.add(tea);
  return g;
}

/** A bamboo matcha whisk (chasen), tines down. Origin at the tines' tip. */
export function createWhisk(): THREE.Group {
  const g = new THREE.Group();
  const bamboo = new THREE.MeshStandardMaterial({ color: 0xe3c98f, roughness: 0.7 });
  const tines = mesh(new THREE.CylinderGeometry(0.11, 0.05, 0.22, 20, 1, true), bamboo);
  tines.position.y = 0.11;
  const core = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 12), bamboo);
  core.position.y = 0.12;
  const handle = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 14), bamboo);
  handle.position.y = 0.37;
  g.add(tines, core, handle);
  return g;
}

/** A café cup of matcha latte with a handle. Origin at its base. */
export function createMatchaCup(color = 0xf4f1ea): THREE.Group {
  const g = new THREE.Group();
  const ceramic = new THREE.MeshStandardMaterial({ color, roughness: 0.35 });
  const body = mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.32, 28, 1, true), ceramic);
  body.position.y = 0.16;
  (body.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
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

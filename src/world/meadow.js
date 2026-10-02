import * as THREE from 'three';
import { rng } from '../engine/math';

const HILL_R = 40;

/** Pastel sky, rounded grassy hill, flowers and drifting clouds. */
export function createMeadow(scene, { seed = 7 } = {}) {
  {
    // sky gradient
    const c = document.createElement('canvas');
    c.width = 2;
    c.height = 256;
    const g = c.getContext('2d'),
      gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#9fd8ff');
    gr.addColorStop(0.6, '#d9f0ff');
    gr.addColorStop(1, '#fff1e2');
    g.fillStyle = gr;
    g.fillRect(0, 0, 2, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    scene.background = tex;
  }
  scene.fog = new THREE.Fog(0xe6f4ff, 18, 45);

  scene.add(new THREE.HemisphereLight(0xeaf6ff, 0xb5e3a1, 1.3));
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.2);
  sun.position.set(4, 9, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 6;
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -4, near: 1, far: 30 });
  scene.add(sun);

  const hill = new THREE.Mesh(
    new THREE.SphereGeometry(HILL_R, 96, 48),
    new THREE.MeshStandardMaterial({ color: 0xb5e3a1, roughness: 1 }),
  );
  hill.position.y = -HILL_R;
  hill.receiveShadow = true;
  scene.add(hill);

  /** Height of the hill surface at (x, z) — stand characters on this. */
  const groundY = (x, z) => Math.sqrt(Math.max(0, HILL_R * HILL_R - x * x - z * z)) - HILL_R;

  const r = rng(seed);
  const petalCols = [0xffb3c1, 0xffe08a, 0xc9b6e4, 0xffffff];
  const centerMat = new THREE.MeshStandardMaterial({ color: 0xffd25e, roughness: 0.8 });
  for (let i = 0; i < 40; i++) {
    const x = (r() - 0.5) * 22,
      z = -10 + r() * 13;
    if (Math.abs(x) < 2.2 && z > -2) continue; // keep the stage clear
    const f = new THREE.Group();
    const pm = new THREE.MeshStandardMaterial({ color: petalCols[i % 4], roughness: 0.9 });
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), pm);
      petal.scale.set(1, 0.5, 1);
      petal.position.set(Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1);
      f.add(petal);
    }
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), centerMat);
    c.position.y = 0.03;
    f.add(c);
    f.position.set(x, groundY(x, z) + 0.05, z);
    scene.add(f);
  }

  const clouds = [];
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    emissive: 0xffffff,
    emissiveIntensity: 0.35,
  });
  for (let i = 0; i < 5; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.8 + r() * 0.6, 20, 14), cloudMat);
      s.position.set(k * 0.9 - 1.3, (k % 2) * 0.35, r() * 0.3);
      c.add(s);
    }
    c.userData = { x0: -22 + i * 10, y: 7 + r() * 3, z: -22 - r() * 4, speed: 0.25 + r() * 0.2 };
    scene.add(c);
    clouds.push(c);
  }

  function update(t) {
    for (const c of clouds) {
      const u = c.userData;
      c.position.set(((u.x0 + t * u.speed + 25) % 50) - 25, u.y, u.z);
    }
  }

  return { groundY, update };
}

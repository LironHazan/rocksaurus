import * as THREE from 'three';

/** A square frame's bar thickness and depth, as a share of the rim (a bold, architect's frame). */
const SQUARE_BAR = 0.16;

/** A square rim of half-width `rim`: four bars round the lens. */
function squareRim(rim: number, material: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const bar = rim * SQUARE_BAR;
  for (const s of [-1, 1]) {
    const across = new THREE.Mesh(new THREE.BoxGeometry(rim * 2 + bar, bar, bar), material);
    across.position.y = s * rim;
    const down = new THREE.Mesh(new THREE.BoxGeometry(bar, rim * 2 + bar, bar), material);
    down.position.x = s * rim;
    g.add(across, down);
  }
  return g;
}

/**
 * Wire-frame glasses: round (very physicist) or square (`frames: 'square'`, bold). Rims sit over the eyes at
 * `eyeX` / `eyeY` / `eyeZ` in head space, tilted like the eyes (`yaw`); temples run back along the head.
 */
export interface GlassesOptions {
  eyeX?: number;
  eyeY?: number;
  eyeZ?: number;
  yaw?: number;
  rim?: number;
  color?: number;
  /** Round wire rims, or bold square frames. */
  frames?: 'round' | 'square';
}

export function addGlasses(
  head: THREE.Object3D,
  {
    eyeX = 0.22,
    eyeY = 0.1,
    eyeZ = 0.5,
    yaw = 0.3,
    rim = 0.15,
    color = 0x2a2a35,
    frames = 'round',
  }: GlassesOptions = {},
): THREE.Group {
  const wire = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.6 });
  const lens = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.05,
    transmission: 0.9,
    transparent: true,
    opacity: 0.25,
  });
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(s * eyeX, eyeY, eyeZ);
    eye.rotation.y = s * yaw;
    if (frames === 'square')
      eye.add(squareRim(rim, wire), new THREE.Mesh(new THREE.PlaneGeometry(rim * 2, rim * 2), lens));
    else
      eye.add(
        new THREE.Mesh(new THREE.TorusGeometry(rim, 0.016, 8, 32), wire),
        new THREE.Mesh(new THREE.CircleGeometry(rim, 32), lens),
      );
    const temple = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.45, 6), wire);
    temple.rotation.x = Math.PI / 2;
    temple.position.set(s * rim, 0, -0.22);
    eye.add(temple);
    g.add(eye);
  }
  const bridge = new THREE.Mesh(new THREE.TorusGeometry(eyeX - rim * 0.9, 0.014, 6, 16, Math.PI), wire);
  bridge.position.set(0, eyeY + 0.02, eyeZ + 0.05);
  g.add(bridge);
  head.add(g);
  return g;
}

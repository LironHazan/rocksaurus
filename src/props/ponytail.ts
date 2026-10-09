import * as THREE from 'three';
import { rng } from '../engine/math';
import { taperedTube, curve3 } from './tube';

// Lulu's head ellipsoid around the `face` group (see createLulu: head ball 0.6 scaled 1 × 0.9 × 1.1)
const HEAD = { x: 0.6, y: 0.54, z: 0.66 };

/** The hair, and the ponytail's pivot at the scrunchie: rotate it to make it swing. */
export interface Ponytail {
  group: THREE.Group;
  ponytail: THREE.Group;
}

/**
 * Loose ponytail: thick smooth locks combed back from the hairline and lifted off the head (not slicked
 * down), two loose face-framing pieces, and a relaxed ponytail at the back of the head with a scrunchie.
 * Works on any rig with a `face` group. Returns { group, ponytail } — rotate `ponytail`
 * (.x swing back/forth, .z side to side) to make it bounce, e.g. on the beat.
 */
export function addPonytail(
  rig: { face: THREE.Object3D; flower?: THREE.Object3D },
  { color = 0xe8562a, scrunchie = 0xff3fa4, seed = 7 } = {},
): Ponytail {
  const r = rng(seed);
  const hairMat = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.45,
    sheen: 0.8,
    sheenRoughness: 0.3,
    sheenColor: new THREE.Color(0xffc9a8),
    clearcoat: 0.25,
    clearcoatRoughness: 0.4,
  });
  const group = new THREE.Group();

  // a thin under-layer so no scalp shows between the locks
  const under = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.56), hairMat);
  under.scale.set(HEAD.x * 1.04, HEAD.y * 1.05, HEAD.z * 1.04);
  under.rotation.x = -0.95;
  under.position.set(0, 0.03, -0.04);
  group.add(under);

  // locks: thick, smooth strands combed from the hairline back to the ponytail, lifted off the head (loose)
  const BASE = new THREE.Vector3(0, 0.32, -0.64); // where they gather (scrunchie)
  const onHead = (d: THREE.Vector3, lift: number) => {
    // point on the head ellipsoid in direction d, pushed out by `lift`
    const k = 1 / Math.sqrt((d.x / HEAD.x) ** 2 + (d.y / HEAD.y) ** 2 + (d.z / HEAD.z) ** 2);
    return d.clone().multiplyScalar(k * lift);
  };
  const baseDir = BASE.clone().normalize();
  const LOCKS = 17;
  for (let i = 0; i < LOCKS; i++) {
    const a = -1.3 + (i / (LOCKS - 1)) * 2.6; // across the hairline, temple to temple
    const startDir = new THREE.Vector3(Math.sin(a), 0.3 + 0.32 * Math.cos(a), Math.cos(a) * 0.95).normalize();
    const pts = [];
    for (let j = 0; j <= 10; j++) {
      const t = j / 10;
      const d = startDir.clone().lerp(baseDir, t);
      d.y += Math.sin(Math.PI * t) * 0.35 * Math.cos(a * 0.8); // arc up over the crown
      d.normalize();
      const lift = 1.1 + Math.sin(Math.PI * t) * 0.06 + (r() - 0.5) * 0.015;
      pts.push(t < 1 ? onHead(d, lift) : BASE.clone());
    }
    const lock = new THREE.CatmullRomCurve3(pts);
    const thick = 0.085 + r() * 0.025;
    group.add(
      new THREE.Mesh(
        taperedTube(lock, t => thick * Math.min(1, 0.45 + t * 6) * (1 - 0.35 * t), { segments: 48, radial: 14 }),
        hairMat,
      ),
    );
  }

  // two loose face-framing pieces from the temples down past the jaw
  for (const sx of [-1, 1]) {
    const piece = curve3([
      [sx * 0.58, 0.3, 0.24],
      [sx * 0.7, 0.04, 0.27],
      [sx * 0.7, -0.26, 0.2],
      [sx * 0.62, -0.5, 0.16],
    ]);
    group.add(
      new THREE.Mesh(
        taperedTube(piece, s => 0.07 * Math.min(1, 0.5 + s * 5) * (1 - s * 0.75), { segments: 40, radial: 16 }),
        hairMat,
      ),
    );
  }

  // relaxed ponytail at the back of the head (pivot at the scrunchie so it can swing)
  const ponytail = new THREE.Group();
  ponytail.position.set(0, 0.32, -0.66);
  group.add(ponytail);

  // the tail drapes down the back and a little toward her right shoulder
  const tailCurve = curve3([
    [0, 0, 0],
    [0.02, 0.02, -0.2],
    [0.08, -0.2, -0.36],
    [0.2, -0.6, -0.4],
    [0.32, -1.0, -0.3],
    [0.38, -1.3, -0.16],
  ]);
  const fullness = (s: number) =>
    (0.16 + 0.1 * Math.sin(Math.PI * Math.min(1, s / 0.65))) * (1 - 0.6 * Math.pow(s, 1.5));
  // hidden core so no gaps show between the locks
  ponytail.add(
    new THREE.Mesh(
      taperedTube(tailCurve, s => Math.max(0.02, fullness(s) * 0.7 * (1 - Math.pow(s, 4)))),
      hairMat,
    ),
  );
  // locks: gathered at the scrunchie, gently twisting together, splitting a little at the ends
  const X = new THREE.Vector3(1, 0, 0);
  const TAIL_LOCKS = 14;
  for (let c = 0; c < TAIL_LOCKS; c++) {
    const phi = (c / TAIL_LOCKS) * Math.PI * 2;
    const len = 0.86 + r() * 0.14;
    const thick = 0.06 + r() * 0.02;
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12,
        s = Math.min(1, t * len);
      const p = tailCurve.getPointAt(s);
      const side = new THREE.Vector3().crossVectors(tailCurve.getTangentAt(s), X).normalize();
      const a = phi + s * 1.2; // gentle twist
      const off = fullness(s) * 0.72 + Math.pow(s, 3) * 0.12; // ends split apart a little
      pts.push(p.addScaledVector(X, Math.cos(a) * off).addScaledVector(side, Math.sin(a) * off));
    }
    ponytail.add(
      new THREE.Mesh(
        taperedTube(
          new THREE.CatmullRomCurve3(pts),
          t => Math.max(0.006, thick * Math.min(1, 0.5 + t * 5) * (1 - Math.pow(t, 1.6))),
          { segments: 48, radial: 12 },
        ),
        hairMat,
      ),
    );
  }

  // scrunchie around the base, lined up with the tail
  const bandMat = new THREE.MeshPhysicalMaterial({
    color: scrunchie,
    roughness: 0.6,
    sheen: 1,
    sheenColor: new THREE.Color(0xffffff),
    emissive: scrunchie,
    emissiveIntensity: 0.35,
  });
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.09, 16, 32), bandMat);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const ruffle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), bandMat);
    ruffle.position.set(Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0);
    band.add(ruffle);
  }
  band.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tailCurve.getTangentAt(0.05));
  band.position.copy(tailCurve.getPointAt(0.05));
  ponytail.add(band);

  group.traverse(o => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  rig.face.add(group);

  if (rig.flower) {
    // flower above her right ear
    rig.flower.position.set(HEAD.x * 1.12 + 0.02, 0.3, 0.1);
    rig.flower.scale.setScalar(1.2);
  }
  return { group, ponytail };
}

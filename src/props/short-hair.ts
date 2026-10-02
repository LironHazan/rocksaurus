import * as THREE from 'three';
import { rng } from '../engine/math';
import { taperedTube } from './tube';

export interface ShortHairOptions {
  /** Head ellipsoid radii (head space, centered at the head origin). */
  head: [number, number, number];
  color?: number;
  /** Tuft length (head units). */
  length?: number;
  seed?: number;
}

/**
 * Short hair made of many small pointed tufts that grow out from the crown and flow over the head and forward
 * into a fringe — overlapping clumps with direction and pointed tips, like stylized animation hair.
 */
export function addShortHair(
  head: THREE.Group,
  { head: [ax, ay, az], color = 0x2a1f18, length = 0.42, seed = 9 }: ShortHairOptions,
): THREE.Group {
  const r = rng(seed);
  const base = new THREE.Color(color);
  const materials = [0, 0.04, 0.08].map(
    lift =>
      new THREE.MeshPhysicalMaterial({
        color: base.clone().offsetHSL(0, 0, lift), // a few tones, so clumps separate visually
        roughness: 0.5,
        sheen: 1,
        sheenRoughness: 0.35,
        sheenColor: new THREE.Color(0x8a6a50),
      }),
  );
  const group = new THREE.Group();

  /** Point on the head surface in direction d, pushed out by k. */
  const surface = (d: THREE.Vector3, k: number) => {
    const n = d.clone().normalize();
    return n.multiplyScalar(k / Math.sqrt((n.x / ax) ** 2 + (n.y / ay) ** 2 + (n.z / az) ** 2));
  };
  const isFace = (d: THREE.Vector3) => d.z > 0.45 && d.y < 0.5; // keep the forehead, eyes and face clear

  // tufts: grow from the crown whorl outward along the scalp; front ones fall forward as a fringe
  const crown = new THREE.Vector3(0, 0.8, -0.6).normalize();
  const N = 220;
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N;
    const ring = Math.sqrt(1 - y * y);
    const th = i * 2.399963;
    const d = new THREE.Vector3(Math.cos(th) * ring, y, Math.sin(th) * ring);
    d.applyAxisAngle(new THREE.Vector3(1, 0, 0), -0.55); // tip the hair region back: high hairline, full at the back
    if (d.y < -0.05 || isFace(d)) continue;

    // flow: along the surface, away from the crown (perpendicular part of d − crown)
    const away = d.clone().sub(crown);
    const flow = away.sub(d.clone().multiplyScalar(away.dot(d))).normalize();
    if (!Number.isFinite(flow.x)) flow.set(0, 0, 1);
    const len = length * (0.75 + r() * 0.5);
    const d1 = d
      .clone()
      .addScaledVector(flow, len * 0.5)
      .normalize();
    const d2 = d.clone().addScaledVector(flow, len).normalize();
    const tip = surface(d2, 1.05 + r() * 0.05);
    if (isFace(d2)) tip.y += 0.04; // fringe tips stop above the eyes
    const curve = new THREE.CatmullRomCurve3([surface(d, 0.99), surface(d1, 1.12 + r() * 0.04), tip]);
    const thick = 0.045 + r() * 0.025;
    const mesh = new THREE.Mesh(
      taperedTube(curve, s => thick * Math.min(1, 0.6 + s * 4) * (1 - s * 0.92), { segments: 14, radial: 7 }),
      materials[Math.floor(r() * materials.length)],
    );
    group.add(mesh);
  }

  group.traverse(o => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = o.receiveShadow = true;
  });
  head.add(group);
  return group;
}

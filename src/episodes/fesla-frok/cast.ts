import * as THREE from 'three';
import { createLulu, resetLulu, walkLulu, type LuluRig } from '../../characters/lulu';
import { createOrnithomimus } from '../../characters/ornithomimus';
import { ball, matte, plush } from '../../characters/materials';
import { addPonytail } from '../../props/ponytail';
import { addFlannel } from '../../props/flannel';
import { addGlasses } from '../../props/glasses';

/** Amazarus: an Amargasaurus, a long-neck with two rows of spines down his neck. Sandy, in a blue flannel. */
const AMAZARUS_COLORS = {
  body: 0xe2a65a,
  belly: 0xfff0d8,
  spots: 0xb8733a,
  cheeks: 0xffa38a,
  flower: 0xe2a65a, // he has none (hidden)
  eyes: 0x6b4a2b,
};
/** Smaller than Lulu: his head clears the cube's walls, just. */
const AMAZARUS_SCALE = 0.9;
/** His face, at its reddest: tomato. */
const TOMATO = 0xff3b30;
/** Steam puffs over his head: how many, how fast they rise (loops per second) and how high (head units). */
const STEAM = { puffs: 6, rate: 0.9, rise: 1.1, size: 0.24, from: 0.4 } as const;

export interface Amazarus {
  rig: LuluRig;
  /** Back to neutral: call first every frame. */
  reset(): void;
  /** His face from calm (0) to tomato (1): redder, brows down, steam over his head from 0.4. */
  fume(k: number, t: number): void;
}

export function createAmazarus(): Amazarus {
  const rig = createLulu(AMAZARUS_COLORS);
  rig.root.scale.setScalar(AMAZARUS_SCALE);
  rig.flower.visible = false;
  // no lashes: the lashes are the capsules on the eyes
  for (const eye of rig.eyes)
    for (const part of eye.children)
      if (part instanceof THREE.Mesh && part.geometry instanceof THREE.CapsuleGeometry) part.visible = false;
  addFlannel(rig, { base: '#2f5f9e', band: '#14243d', accent: '#d9dde6', line: '#9fc3ff', tee: 0x3a3f4a });
  addGlasses(rig.face, { eyeX: 0.26, eyeY: 0.12, eyeZ: 0.62, rim: 0.16 });
  // his headset: a band over the top of his head, an ear cup each side, the mic out to his mouth
  const black = matte(0x22232a);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 8, 32, Math.PI), black);
  band.position.set(0, 0.02, -0.05);
  rig.face.add(band);
  for (const s of [-1, 1]) rig.face.add(ball(0.14, black, [s * 0.62, 0.02, -0.05], [0.5, 1, 1], 16));
  // the mic: a thin boom from his right ear cup round to the corner of his mouth
  const earCup = new THREE.Vector3(0.6, -0.05, 0);
  const mic = new THREE.Vector3(0.25, -0.32, 0.62);
  const reach = mic.clone().sub(earCup);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, reach.length(), 6), black);
  boom.position.copy(earCup).addScaledVector(reach, 0.5);
  boom.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), reach.normalize());
  rig.face.add(boom, ball(0.05, black, mic.toArray(), [1, 1, 1], 12));

  // the spines: two rows down the back of his neck, raked back, longest in the middle
  const spineMat = plush(0x7a3f1c);
  const spineGeo = new THREE.ConeGeometry(0.07, 1, 8).translate(0, 0.5, 0);
  rig.neck.forEach((seg, i) => {
    const length = [0.6, 0.85, 0.85, 0.6][i]!;
    for (const s of [-1, 1]) {
      const spine = new THREE.Mesh(spineGeo, spineMat);
      spine.scale.set(1, length, 1);
      spine.position.set(s * 0.1, 0.25, -0.28 + i * 0.025);
      spine.rotation.set(-0.7, 0, s * 0.45); // a V, so they show either side of his neck
      seg.add(spine);
    }
  });

  // his face: its own material, so it can go red without the rest of him
  const sandy = new THREE.Color(AMAZARUS_COLORS.body);
  const tomato = new THREE.Color(TOMATO);
  const faceMat = plush(AMAZARUS_COLORS.body);
  for (const part of rig.face.children.slice(0, 2)) if (part instanceof THREE.Mesh) part.material = faceMat;
  // brows: flat, then angry
  const brows = [-1, 1].map(s => {
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.16, 4, 8), matte(0x4a2e18));
    brow.position.set(s * 0.26, 0.36, 0.56);
    brow.rotation.z = Math.PI / 2;
    brow.userData.side = s;
    rig.face.add(brow);
    return brow;
  });
  const puffMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
  const puffs = Array.from({ length: STEAM.puffs }, (_, i) => {
    const p = ball(STEAM.size, puffMat, [0, 0, 0], [1, 1, 1], 12);
    p.userData.side = i % 2 ? 1 : -1;
    rig.face.add(p);
    return p;
  });

  return {
    rig,
    reset() {
      resetLulu(rig);
      faceMat.color.copy(sandy);
      for (const b of brows) b.rotation.set(0, 0, Math.PI / 2);
      for (const p of puffs) p.visible = false;
    },
    fume(k, t) {
      faceMat.color.copy(sandy).lerp(tomato, k);
      for (const b of brows) b.rotation.z = Math.PI / 2 - b.userData.side * 0.5 * k;
      for (const c of rig.cheeks) c.scale.set(1 + k * 0.4, 0.7 + k * 0.3, 0.35);
      const steam = Math.min(1, Math.max(0, (k - STEAM.from) / (1 - STEAM.from)));
      puffs.forEach((p, i) => {
        // each puff loops up from an ear, swelling as it rises, out of step with the others
        const u = (t * STEAM.rate + i / STEAM.puffs) % 1;
        p.visible = steam > 0;
        p.position.set(p.userData.side * (0.45 + u * 0.35), 0.45 + u * STEAM.rise, -0.1);
        p.scale.setScalar((0.6 + u) * steam);
      });
    },
  };
}

/** Lulu at the office: flannel, ponytail; back to neutral and walking, the ponytail bouncing. */
export function createOfficeLulu() {
  const rig = createLulu();
  const hair = addPonytail(rig);
  addFlannel(rig);
  return {
    rig,
    reset() {
      resetLulu(rig);
      hair.ponytail.rotation.set(0.1, 0, 0);
    },
    walk: (phase: number, amount = 1) => walkLulu(rig, phase, amount, hair.ponytail),
    hair,
  };
}
export type OfficeLulu = ReturnType<typeof createOfficeLulu>;

/** Rorit's work look: a coral blazer over her mint (no gym kit today), her blond ponytail. */
export const RORIT_SCALE = 0.85;
export function createRorit() {
  const rig = createOrnithomimus(undefined, { athleisure: false });
  rig.root.scale.setScalar(RORIT_SCALE);
  rig.clothe(new THREE.MeshPhysicalMaterial({ color: 0xff7a6b, roughness: 0.6, sheen: 0.5 }), 0.12, 0.72);
  const hair = addPonytail(rig, { color: 0xf2d36b, scrunchie: 0x4ee6ff, seed: 3 });
  return { rig, ponytail: hair.ponytail };
}

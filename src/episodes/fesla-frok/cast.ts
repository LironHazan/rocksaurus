import * as THREE from 'three';
import { createLulu, resetLulu, walkLulu } from '../../characters/lulu';
import { createOrnithomimus } from '../../characters/ornithomimus';
import { createAmazaurus } from '../../characters/amazaurus';
import type { StegosaurusRig } from '../../characters/stegosaurus';
import { ball, matte, plush } from '../../characters/materials';
import { restRig } from '../../characters/rest';
import { addPonytail } from '../../props/ponytail';
import { addFlannel } from '../../props/flannel';
import { textTexture } from '../../world/text-texture';

/** His face, at its reddest: tomato. */
const TOMATO = 0xff2a1a;
/** Steam puffs over his head: how many, how fast they rise (loops per second), how high and how big (head units),
 * and how mad he is (0..1) before they start. */
const STEAM = { puffs: 6, rate: 0.9, rise: 1.0, size: 0.22, from: 0.4 } as const;
/** How mad (0..1) before he grits his teeth, and before the anger mark pops up over his brow. */
const GRIT_FROM = 0.45;
const MARK_FROM = 0.6;

export interface Amazaurus {
  rig: StegosaurusRig;
  /** Back to neutral, idling: call first every frame. */
  reset(t: number): void;
  /**
   * Mad, from calm (0) to furious (1): his face goes tomato, brows down in a V, eyes narrowed, a frown and gritted
   * teeth (when he isn't talking), shaking; steam from 0.4, an anger mark from 0.6.
   */
  fume(k: number, t: number, talking: boolean): void;
}

/** A cartoon anger mark (💢), as a sprite. */
function angerMark(): THREE.Sprite {
  const map = textTexture(128, 128, (ctx, w, h) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${h * 0.8}px sans-serif`;
    ctx.fillText('💢', w / 2, h * 0.55);
  });
  return new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, toneMapped: false }));
}

/** Amazaurus (the calm senior from Prod Certs), on his headset, and how he looks when he isn't calm anymore. */
export function createAmazaurusAtWork(): Amazaurus {
  const rig = createAmazaurus();
  const { head } = rig;
  const feet = rig.feet.map(f => f.position.clone());
  // his headset: a band over the top of his head, an ear cup each side, the mic boom round to his mouth
  const black = matte(0x22232a);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.035, 8, 32, Math.PI), black);
  band.position.set(0, 0.02, -0.04);
  head.add(band);
  for (const s of [-1, 1]) head.add(ball(0.13, black, [s * 0.55, 0.0, -0.04], [0.5, 1, 1], 16));
  const earCup = new THREE.Vector3(0.53, -0.06, 0);
  const mic = new THREE.Vector3(0.22, -0.3, 0.6);
  const reach = mic.clone().sub(earCup);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, reach.length(), 6), black);
  boom.position.copy(earCup).addScaledVector(reach, 0.5);
  boom.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), reach.normalize());
  head.add(boom, ball(0.05, black, mic.toArray(), [1, 1, 1], 12));

  // his face (the skull and the snout): its own material, so it can go red without the rest of him
  const teal = faceColour(head).clone();
  const tomato = new THREE.Color(TOMATO);
  const faceMat = plush(teal);
  for (const part of head.children.slice(0, 2)) if (part instanceof THREE.Mesh) part.material = faceMat;
  // brows: thick, over his glasses; mad, they come down in a V
  const browMat = matte(0x173c40);
  const brows = [-1, 1].map(s => {
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.17, 4, 8), browMat);
    brow.userData.side = s;
    head.add(brow);
    return brow;
  });
  // gritted teeth: a white bar with a dark line through it, where his smile is
  const teeth = new THREE.Group();
  const enamel = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.16, 4, 8), matte(0xffffff));
  enamel.rotation.z = Math.PI / 2;
  const gap = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.008, 0.01), browMat);
  gap.position.z = 0.04;
  teeth.add(enamel, gap);
  teeth.position.set(0, -0.24, 0.6);
  teeth.rotation.x = -0.25;
  head.add(teeth);
  const mark = angerMark();
  mark.position.set(0.32, 0.42, 0.3);
  head.add(mark);
  const puffMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
  const puffs = Array.from({ length: STEAM.puffs }, (_, i) => {
    const p = ball(STEAM.size, puffMat, [0, 0, 0], [1, 1, 1], 12);
    p.userData.side = i % 2 ? 1 : -1;
    head.add(p);
    return p;
  });

  return {
    rig,
    reset(t) {
      restRig(rig, feet, t);
      faceMat.color.copy(teal);
      for (const b of brows) {
        b.position.set(b.userData.side * 0.22, 0.3, 0.47);
        b.rotation.set(0, 0, Math.PI / 2);
      }
      teeth.visible = false;
      mark.visible = false;
      for (const p of puffs) p.visible = false;
    },
    fume(k, t, talking) {
      // teal and red mix to a grey half way: the red comes in fast, so he's red, not grey, by the time he's mad
      faceMat.color.copy(teal).lerp(tomato, Math.sqrt(k));
      for (const b of brows) {
        // inner ends down: a V
        b.rotation.z = Math.PI / 2 + b.userData.side * 0.6 * k;
        b.position.y = 0.3 - 0.05 * k;
        b.position.x = b.userData.side * (0.22 - 0.03 * k);
      }
      for (const e of rig.eyes) e.scale.y *= 1 - 0.4 * k; // narrowed
      for (const c of rig.cheeks) c.scale.set(1 + k * 0.4, 0.7 + k * 0.3, 0.35);
      if (k > GRIT_FROM && !talking) {
        rig.setFrown(true);
        teeth.visible = true;
      }
      // he shakes with it
      head.rotation.z += Math.sin(t * 43) * 0.04 * k;
      rig.torso.position.x = Math.sin(t * 37) * 0.02 * k;
      mark.visible = k > MARK_FROM;
      mark.scale.setScalar(0.4 + Math.abs(Math.sin(t * 6)) * 0.08);
      const steam = Math.min(1, Math.max(0, (k - STEAM.from) / (1 - STEAM.from)));
      puffs.forEach((p, i) => {
        // each puff loops up from an ear, swelling as it rises, out of step with the others
        const u = (t * STEAM.rate + i / STEAM.puffs) % 1;
        p.visible = steam > 0;
        p.position.set(p.userData.side * (0.4 + u * 0.3), 0.4 + u * STEAM.rise, -0.1);
        p.scale.setScalar((0.6 + u) * steam);
      });
    },
  };
}

/** The colour of his skull, as built. */
function faceColour(head: THREE.Object3D): THREE.Color {
  const skull = head.getObjectByName('skull');
  if (skull instanceof THREE.Mesh && skull.material instanceof THREE.MeshStandardMaterial) return skull.material.color;
  throw new Error('Amazaurus has no skull');
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

import * as THREE from 'three';
import { ball } from '../../characters/materials';
import { createOrnithomimus, RORIT_COLORS, type OrnithomimusRig } from '../../characters/ornithomimus';
import { createStegosaurus, STEGGY_COLORS } from '../../characters/stegosaurus';
import { createRory } from '../../characters/rory';
import { addBandTee } from '../../props/band-tee';
import type { RigFit } from '../../characters/types';
import { addGlasses } from '../../props/glasses';
import { addPonytail } from '../../props/ponytail';
import { ROUND } from '../../world/interior';
import { textTexture } from '../../world/text-texture';

// The night shift: Sagish (on call), Rorit (DinOps), the seniors Taluzarus and Amazaurus, and Eilon (tech lead).
// Sagish, Rorit and Taluzarus share the slim Ornithomimus build; Amazaurus is a Stegosaurus, Eilon a little T-Rex.

const cloth = (color: number, roughness = 0.85) => new THREE.MeshStandardMaterial({ color, roughness });

/** Sagish: young, thin and brown, a little goatee, and his football shirt (sky blue and white stripes, #10). */
export function createSagish(): OrnithomimusRig {
  const rig = createOrnithomimus(
    {
      ...RORIT_COLORS,
      body: 0xa47148,
      belly: 0xe8cfae,
      spots: 0x7a4f2e,
      beak: 0xd9a877,
      eyes: 0x5a3a1a,
      soles: 0x2a6fdb,
    },
    { athleisure: false },
  );
  const stripes = textTexture(512, 256, (ctx, w, h) => {
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 ? '#ffffff' : '#7cc4f0';
      ctx.fillRect((i * w) / 16, 0, w / 16 + 1, h);
    }
    ctx.fillStyle = '#1b2a4a'; // the number, on the back (u = 0.75)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${h * 0.42}px ${ROUND}`;
    ctx.fillText('10', w * 0.75, h * 0.45);
  });
  const shirt = new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.75 });
  rig.clothe(shirt, 0.14, 0.7);
  rig.clothe(cloth(0x1b2a4a), 0.7, 1.0); // shorts
  for (const arm of rig.arms) {
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.24, 16), shirt);
    sleeve.position.y = -0.06;
    arm.add(sleeve);
  }
  // the goatee, and a swoop of hair
  const hair = cloth(0x3a2414, 0.6);
  const goatee = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 12), hair);
  goatee.rotation.x = Math.PI;
  goatee.position.set(0, -0.32, 0.42);
  rig.head.add(goatee);
  rig.head.add(ball(0.22, hair, [0.05, 0.3, 0.05], [1.3, 0.55, 1.2], 20));
  rig.head.add(ball(0.14, hair, [0.18, 0.28, 0.2], [1, 0.5, 1], 16));
  return rig;
}

/** Rorit, as ever: blond ponytail, gym clothes. */
export function createRorit(): OrnithomimusRig & { hair: { ponytail: THREE.Group } } {
  const rig = createOrnithomimus();
  const hair = addPonytail(rig, { color: 0xf2d36b, scrunchie: 0xc6ff3d, seed: 3 });
  return Object.assign(rig, { hair });
}

/** Taluzarus: tall and thin, in a grey hoodie, headphones round his neck. Never. Stops. Moving. */
export function createTaluzarus(): OrnithomimusRig {
  const rig = createOrnithomimus(
    {
      ...RORIT_COLORS,
      body: 0xff9a52,
      belly: 0xffe0c2,
      spots: 0xe07a30,
      beak: 0xffd08a,
      eyes: 0x2b6fd6,
      soles: 0xff4d4d,
    },
    { athleisure: false },
  );
  const hoodie = cloth(0x6b7280);
  rig.clothe(hoodie, 0.12, 0.8);
  rig.clothe(cloth(0x2a2f3a), 0.8, 1.0); // joggers
  for (const arm of rig.arms) {
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.3, 8, 16), hoodie);
    sleeve.position.y = -0.22;
    arm.add(sleeve);
  }
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), hoodie);
  hood.scale.set(1.1, 0.7, 0.9);
  hood.position.set(0, 2.6, -0.3);
  hood.rotation.x = -0.6;
  rig.torso.add(hood);
  // headphones round his neck
  const black = new THREE.MeshStandardMaterial({ color: 0x15151a, roughness: 0.4 });
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 8, 32), black);
  band.rotation.x = Math.PI / 2 + 0.3;
  band.position.set(0, 2.72, 0.05);
  rig.torso.add(band);
  for (const s of [-1, 1]) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 20), black);
    cup.rotation.z = Math.PI / 2;
    cup.position.set(s * 0.28, 2.66, 0.12);
    rig.torso.add(cup);
  }
  // messy hair
  const hair = cloth(0x5a3a1a, 0.6);
  for (const [x, z, r] of [
    [-0.12, 0.05, 0.16],
    [0.1, 0.1, 0.15],
    [0, -0.12, 0.17],
    [0.16, -0.06, 0.12],
  ] as const)
    rig.head.add(ball(r, hair, [x, 0.33, z], [1, 0.8, 1], 14));
  return rig;
}

/** The print on Amazaurus's tee: a crescent moon, a ringed planet and stars, on black. */
function space(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(w * 0.42, h * 0.48, h * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.4, h * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#b48cff';
  ctx.beginPath();
  ctx.arc(w * 0.72, h * 0.62, h * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e6d6ff';
  ctx.lineWidth = h * 0.02;
  ctx.beginPath();
  ctx.ellipse(w * 0.72, h * 0.62, h * 0.18, h * 0.05, -0.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  for (const [x, y, r] of [
    [0.15, 0.2, 0.015],
    [0.25, 0.75, 0.012],
    [0.62, 0.18, 0.018],
    [0.85, 0.3, 0.012],
    [0.88, 0.85, 0.015],
    [0.12, 0.55, 0.01],
    [0.55, 0.88, 0.01],
  ] as const) {
    ctx.beginPath();
    ctx.arc(w * x, h * y, h * r * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Amazaurus: a deep-teal Stegosaurus with round glasses and a black tee with the moon and stars. Very calm. */
export function createAmazaurus() {
  const rig = createStegosaurus({
    ...STEGGY_COLORS,
    body: 0x4fb6a8,
    belly: 0xdff5ef,
    plates: 0x2f7f86,
    plateTips: 0x5fb3b9,
    bowTie: 0x15151a,
    eyes: 0x6b4a2a,
    mustache: null,
  });
  addBandTee(rig, { text: '', color: 0x15151a, print: space, aspect: 0.62 });
  addGlasses(rig.head, { eyeX: 0.22, eyeY: 0.1, eyeZ: 0.52, rim: 0.15, color: 0x1b1b22 });
  return rig;
}

const EILON_COLORS = { body: 0xff9a7a, belly: 0xfff0e0, bumps: 0xe8765a, cheeks: 0xffb3c1 };

/** Rory's build, measured (see createRory): the body ellipsoid a shirt wraps, and the head. */
const RORY_FIT: RigFit = { torso: { center: [0, 1.2, 0], radii: [1, 1.1, 0.95] }, head: [1, 0.92, 1] };

/** Eilon: the tech lead. Short, blue eyes, always smiling; a plain grey tee and jeans. */
export function createEilon() {
  const rig = Object.assign(createRory(EILON_COLORS), { fit: RORY_FIT });
  const iris = new THREE.MeshPhysicalMaterial({ color: 0x3d8ef0, roughness: 0.15, clearcoat: 1 });
  const pupil = new THREE.MeshPhysicalMaterial({ color: 0x1b1b2e, roughness: 0.15, clearcoat: 1 });
  for (const eye of rig.eyes) {
    const eyeball = eye.children.find(c => c instanceof THREE.Mesh); // the first mesh in each eye is the eyeball
    if (eyeball instanceof THREE.Mesh) eyeball.material = iris;
    eye.add(ball(0.13, pupil, [0, -0.01, 0.08], [1, 1.1, 0.5]));
  }
  addBandTee(rig, { text: '', color: 0x9aa0a8 }); // plain grey
  // jeans: over the hips and thighs, cuffs rolled above the feet
  const denim = new THREE.MeshStandardMaterial({ color: 0x3b5a8c, roughness: 0.9 });
  const [cx, cy, cz] = RORY_FIT.torso.center;
  const [rx, ry, rz] = RORY_FIT.torso.radii;
  const hips = new THREE.Mesh(
    new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, Math.PI * 0.64, Math.PI * 0.36),
    denim,
  );
  hips.scale.set(rx * 1.03, ry * 1.03, rz * 1.03);
  hips.position.set(cx, cy, cz);
  rig.torso.add(hips);
  for (const thigh of rig.thighs) thigh.material = denim;
  for (const foot of rig.feet) {
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 8, 24), denim);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = 0.36;
    foot.add(cuff);
  }
  return rig;
}

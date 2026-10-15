import * as THREE from 'three';
import { createOrnithomimus, RORIT_COLORS, type OrnithomimusRig } from '../../characters/ornithomimus';
import { createTyrannosaurus, TIKI_COLORS } from '../../characters/tyrannosaurus';
import { ball } from '../../characters/materials';
import { addGlasses } from '../../props/glasses';
import { addJersey, TREX_BODY } from '../../props/soccer';
import { ROUND } from '../../world/interior';
import { textTexture } from '../../world/text-texture';

// The meeting: Statitezarus, Igarzarus and Dchozaurus share the slim Ornithomimus build (like Taluzarus in Prod
// Certs); Ogozaurus is a big T-Rex, Tiki Taka's build. Clothes are plain shapes and our own prints: no real logos.

/** Ogozaurus is slimmer than Tiki Taka: his width and depth, scaled. */
const OGO_SLIM = 0.78;
/** Statitezarus is short. */
export const STATITEZARUS_SCALE = 0.72;

type OrnithoColors = typeof RORIT_COLORS;
/** How much roomier their tees are than the rig's fitted clothes (across, up, front to back). */
const LOOSE = new THREE.Vector3(1.1, 1.02, 1.14);
/** Where the Ornithomimus mouth sits (head space: its z, and how high, just under the beak). */
const MOUTH = { z: 0.6, y: -0.15 } as const;

/** An Ornithomimus in work clothes: a shirt (with sleeves), trousers, no lashes. */
function dressed(colors: Partial<OrnithoColors>, shirt: number, trousers: number): OrnithomimusRig {
  const rig = createOrnithomimus({ ...RORIT_COLORS, ...colors }, { athleisure: false });
  const cloth = (c: number) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, side: THREE.DoubleSide });
  const top = cloth(shirt);
  rig.clothe(cloth(trousers), 0.72, 1.0);
  // a relaxed tee, not a second skin: roomier round the body, wide short sleeves, a soft crew collar
  rig.clothe(top, 0.12, 0.74).scale.multiply(LOOSE);
  for (const arm of rig.arms) arm.add(ball(0.15, top, [0, -0.1, 0], [1, 1.35, 1], 20)); // short, rounded sleeves
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 24), top);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 2.63, 0.02);
  rig.torso.add(collar);
  // the mouth (open, and the smile) up under the beak, so it opens from it in a close-up rather than hanging below
  for (const part of rig.head.children)
    if (part.position.z === MOUTH.z && part.position.y < MOUTH.y) part.position.y = MOUTH.y;
  // the lashes are the capsules on the eyes
  for (const eye of rig.eyes)
    for (const part of eye.children)
      if (part instanceof THREE.Mesh && part.geometry instanceof THREE.CapsuleGeometry) part.visible = false;
  return rig;
}

/** Round glasses, sized to the Ornithomimus head. */
const ornithoGlasses = (rig: OrnithomimusRig) =>
  addGlasses(rig.head, { eyeX: 0.2, eyeY: 0.1, eyeZ: 0.38, yaw: 0.4, rim: 0.13, color: 0x1b1b22 });

/** Hair: a few soft tufts on top of the head. */
function tufts(rig: OrnithomimusRig, colour: number, spots: readonly (readonly [number, number, number])[]) {
  const hair = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.6 });
  for (const [x, z, r] of spots) rig.head.add(ball(r, hair, [x, 0.33, z], [1, 0.8, 1], 14));
}

/** The superhero shield on his tee: a red-and-yellow diamond with an S (our own lettering, not anyone's logo). */
function shield(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const diamond = (inset: number) => {
    ctx.beginPath();
    ctx.moveTo(w * 0.2 + inset, h * 0.12 + inset);
    ctx.lineTo(w * 0.8 - inset, h * 0.12 + inset);
    ctx.lineTo(w * 0.95 - inset, h * 0.32);
    ctx.lineTo(w * 0.5, h * 0.92 - inset);
    ctx.lineTo(w * 0.05 + inset, h * 0.32);
    ctx.closePath();
  };
  ctx.fillStyle = '#e53935';
  diamond(0);
  ctx.fill();
  ctx.fillStyle = '#ffd23f';
  diamond(w * 0.06);
  ctx.fill();
  ctx.fillStyle = '#e53935';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${h * 0.5}px ${ROUND}`;
  ctx.fillText('S', w * 0.5, h * 0.45);
}

/** Statitezarus: short, in a blue superhero tee. Very keen on his design. */
export function createStatitezarus(): OrnithomimusRig {
  const rig = dressed(
    { body: 0xa8d46a, belly: 0xeef8d8, spots: 0x86b84a, beak: 0xffd08a, eyes: 0x5a3a1a },
    0x1f5fbf,
    0x2a3550,
  );
  rig.root.scale.setScalar(STATITEZARUS_SCALE);
  const print = new THREE.Mesh(
    new THREE.PlaneGeometry(0.46, 0.4),
    new THREE.MeshStandardMaterial({ map: textTexture(256, 220, shield, ['800 40px Fredoka']), transparent: true }),
  );
  print.position.set(0, 2.15, 0.66);
  print.rotation.x = -0.3; // lying on the chest's curve, not buried in it
  rig.torso.add(print);
  tufts(rig, 0x3a2414, [
    [0, 0, 0.17],
    [0.12, 0.08, 0.13],
  ]);
  return rig;
}

/** Igarzarus: light beige, in a black shirt. Has one question, and asks it every time. */
export function createIgarzarus(): OrnithomimusRig {
  const rig = dressed(
    { body: 0xe6cfb4, belly: 0xf8eedf, spots: 0xcdb497, beak: 0xffcf9e, eyes: 0x3d7bd9 },
    0x16161c,
    0x2f3542,
  );
  tufts(rig, 0x8a6a4a, [
    [-0.1, 0.05, 0.15],
    [0.1, 0.02, 0.15],
    [0, -0.12, 0.16],
  ]);
  return rig;
}

/** Dchozaurus: remote, on the call. Warm tan, dark wavy hair, glasses, a navy shirt. */
export function createDchozaurus(): OrnithomimusRig {
  const rig = dressed(
    { body: 0xc99a6a, belly: 0xf1dcc0, spots: 0xa97a4c, beak: 0xe9b98a, eyes: 0x4a2e18 },
    0x24365c,
    0x3a3a44,
  );
  ornithoGlasses(rig);
  tufts(rig, 0x1e1712, [
    [-0.14, 0.04, 0.16],
    [0.12, 0.08, 0.15],
    [0, -0.1, 0.18],
    [0.02, 0.14, 0.13],
  ]);
  return rig;
}

/** Ogozaurus: a big plum-purple T-Rex (his drink is the creamy one), with glasses, in a black football shirt with white shoulder stripes. */
export function createOgozaurus() {
  const rig = createTyrannosaurus({
    ...TIKI_COLORS,
    body: 0x8a5cc2,
    stripes: 0x6d44a3,
    belly: 0xeadcff,
    brow: 0x7a4fb5,
  });
  rig.root.scale.set(OGO_SLIM, 1, OGO_SLIM); // a slimmer build than Tiki Taka
  addGlasses(rig.head, { eyeX: 0.43, eyeY: 0.2, eyeZ: 1.13, yaw: 0.35, rim: 0.2, color: 0x1b1b22 });
  addJersey(rig, rig.posture, TREX_BODY, {
    color: 0x1b1b22,
    trim: 0xffffff,
    ink: '#ffffff',
    number: '10',
    style: { sponsor: 'SHAPEWORKS', accent: '#ffffff', badge: '#ffffff' },
  });
  return rig;
}

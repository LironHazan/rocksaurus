import * as THREE from 'three';
import { ball, enableShadows, plush } from '../characters/materials';
import { capsuleOf } from '../characters/reach';
import type { ParasaurolophusRig } from '../characters/parasaurolophus';
import { taperedTube } from './tube';

const std = (color: number, roughness = 0.7, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const metal = (color = 0xd8dce6) => std(color, 0.25, { metalness: 0.75, emissive: 0x18181c });
const felt = (color: number) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.95,
    sheen: 1,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(0x6a4a8a),
  });

/** What Paris wears on top of her goth dress. */
export type Look = 'goth' | 'wizard' | 'ranger' | 'elf' | 'party';

/** Which pieces each look includes. */
const LOOKS: Record<
  Look,
  { hat: boolean; cloak: number | null; bracers: boolean; ears: boolean; staff: boolean; sword: boolean }
> = {
  goth: { hat: false, cloak: null, bracers: false, ears: false, staff: false, sword: false },
  wizard: { hat: true, cloak: 0x2b2a35, bracers: false, ears: false, staff: true, sword: false },
  ranger: { hat: false, cloak: 0x1f3a2c, bracers: true, ears: false, staff: false, sword: true },
  elf: { hat: false, cloak: null, bracers: false, ears: true, staff: false, sword: false },
  party: { hat: true, cloak: 0x3a1f4a, bracers: true, ears: true, staff: true, sword: false },
};

export interface FantasyGear {
  setLook(look: Look): void;
  /** The staff is planted beside her in torso space; its orb glows. */
  staff: THREE.Group;
  /** Held up in a paw; sits in torso space. */
  sword: THREE.Group;
  /** Lights the staff's orb (0..1). */
  setStaffGlow(k: number): void;
}

/** A wizard hat with a bent tip. It sits over the front of her head; her crest sticks out of the back. */
function wizardHat(): THREE.Group {
  const g = new THREE.Group();
  const black = felt(0x15111c);
  const band = std(0x7b3fa0, 0.6);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.06, 48), black);
  brim.scale.z = 1.1;
  g.add(brim);
  const tip = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.03, 0),
    new THREE.Vector3(0, 0.55, -0.02),
    new THREE.Vector3(0, 1.05, -0.2),
    new THREE.Vector3(0, 1.4, -0.65),
    new THREE.Vector3(0, 1.45, -1.05),
  ]);
  g.add(
    new THREE.Mesh(
      taperedTube(tip, s => 0.56 * (1 - s) ** 0.9 + 0.015, { segments: 40, radial: 28 }),
      black,
    ),
  );
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.565, 0.07, 10, 40), band);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.12;
  g.add(ring);
  const buckle = ball(0.09, metal(), [0, 0.12, 0.6], [1.3, 1, 0.5], 14);
  g.add(buckle);
  for (const [x, y, z, s] of [
    [0.3, 0.45, 0.36, 0.07],
    [-0.32, 0.7, 0.18, 0.05],
    [0.1, 0.95, 0.05, 0.06],
  ] as const) {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(s), metal(0xffe9a8));
    star.position.set(x, y, z);
    g.add(star);
  }
  return g;
}

/** A cloak draped from her shoulders to the floor behind her, open at the front. */
function cloak() {
  const fabric = felt(0x2b2a35);
  fabric.side = THREE.DoubleSide;
  const geo = new THREE.CylinderGeometry(0.7, 1.5, 2.45, 64, 12, true, Math.PI - 2.15, 4.3);
  const p = geo.attributes.position!;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    const v = Math.max(0, 0.5 - y / 2.45); // 0 at the shoulders, 1 at the hem (clamped: float error makes the top row
    // a hair below 0, and a negative number to the power 0.8 is NaN)
    const r = 0.68 + 0.82 * v ** 0.8;
    const a = Math.atan2(x, z);
    const fold = 1 + 0.06 * Math.sin(a * 11) * v * v;
    p.setXYZ(i, Math.sin(a) * r * fold, y, Math.cos(a) * r * 0.9 * fold);
  }
  geo.computeVertexNormals();
  const group = new THREE.Group();
  const body = new THREE.Mesh(geo, fabric);
  body.position.y = 2.2 - 1.225;
  group.add(body);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.07, 10, 40, Math.PI * 1.3), fabric);
  collar.rotation.set(Math.PI / 2, 0, Math.PI * 0.35);
  collar.position.set(0, 2.2, 0.15);
  group.add(collar);
  group.add(ball(0.08, metal(), [0, 2.1, 0.62], [1, 1, 0.6], 14)); // the clasp
  return { group, fabric };
}

function spikedBracer(): THREE.Group {
  const g = new THREE.Group();
  const leather = std(0x1a1218, 0.55);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.05, 10, 28), leather);
  band.rotation.x = Math.PI / 2;
  g.add(band);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 8), metal());
    spike.position.set(Math.sin(a) * 0.19, 0, Math.cos(a) * 0.19);
    spike.lookAt(spike.position.clone().multiplyScalar(2));
    spike.rotateX(Math.PI / 2);
    g.add(spike);
  }
  return g;
}

function elfEars(color: number): THREE.Group[] {
  return [-1, 1].map(s => {
    const ear = new THREE.Group();
    ear.position.set(s * 0.46, 0.14, -0.04);
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 14), plush(color));
    outer.position.y = 0.3;
    ear.add(outer);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.5, 10), plush(0xff9eb5));
    inner.position.set(s * 0.045, 0.28, 0.05);
    ear.add(inner);
    ear.rotation.set(-0.35, 0, -s * 1.15); // out to the side, up and a little back
    return ear;
  });
}

function circlet(): THREE.Group {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.022, 8, 48), metal(0xffd36b));
  ring.rotation.x = Math.PI / 2;
  ring.scale.set(1, 1.2, 1);
  g.add(ring);
  g.add(
    ball(
      0.06,
      new THREE.MeshStandardMaterial({ color: 0x9d4dff, emissive: 0x6a1fd0, emissiveIntensity: 1.2 }),
      [0, 0.02, 0.55],
    ),
  );
  return g;
}

function staffProp() {
  const g = new THREE.Group();
  const wood = std(0x3a2418, 0.8);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 3.6, 12), wood);
  shaft.position.y = 1.8;
  g.add(shaft);
  for (let i = 0; i < 3; i++) {
    const claw = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 8, 20, Math.PI * 1.2), wood);
    claw.position.y = 3.62;
    claw.rotation.y = (i / 3) * Math.PI * 2;
    claw.rotation.x = 0.2;
    g.add(claw);
  }
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 24, 16),
    new THREE.MeshStandardMaterial({ color: 0x6fe0ff, emissive: 0x2bb8e0, emissiveIntensity: 0.5, roughness: 0.2 }),
  );
  orb.position.y = 3.68;
  g.add(orb);
  const light = new THREE.PointLight(0x5fd8ff, 0, 5, 1.6);
  light.position.y = 3.68;
  g.add(light);
  return { group: g, orb, light };
}

function swordProp(): THREE.Group {
  const g = new THREE.Group();
  // one flat outline, so the edges run straight into a proper point
  const outline = new THREE.Shape();
  outline.moveTo(-0.065, 0.1);
  outline.lineTo(-0.065, 1.8);
  outline.lineTo(0, 2.15);
  outline.lineTo(0.065, 1.8);
  outline.lineTo(0.065, 0.1);
  outline.closePath();
  const bladeGeo = new THREE.ExtrudeGeometry(outline, { depth: 0.03, bevelEnabled: false });
  bladeGeo.translate(0, 0, -0.015);
  const blade = new THREE.Mesh(bladeGeo, metal(0xe8ecf4));
  const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.5, 0.036), metal(0xaab2c4));
  fuller.position.y = 0.95;
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.09), std(0x1a1218, 0.4));
  guard.position.y = 0.18;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.34, 10), std(0x3a1f4a, 0.7));
  grip.position.y = 0;
  g.add(blade, fuller, guard, grip, ball(0.07, metal(0xffd36b), [0, -0.2, 0]));
  return g;
}

/**
 * Fantasy dress-up for Paris, on top of her goth dress: a wizard hat, a cloak, spiked bracers, elf ears and a
 * circlet, plus a staff and a sword. Everything starts hidden; pick a look with `setLook`.
 */
export function addFantasyGear(rig: ParasaurolophusRig): FantasyGear {
  const hat = wizardHat();
  hat.position.set(0, 0.34, 0.05);
  hat.rotation.x = 0.12;
  rig.head.add(hat);

  const { group: cloakGroup, fabric } = cloak();
  rig.torso.add(cloakGroup);

  const bracers = rig.arms.map(pivot => {
    const arm = capsuleOf(pivot);
    const b = spikedBracer();
    b.position.y = -0.1;
    arm.add(b);
    return b;
  });

  const ears = elfEars(0x4fd1c5);
  const crown = circlet();
  crown.position.set(0, 0.17, 0.02);
  for (const e of ears) rig.head.add(e);
  rig.head.add(crown);

  const { group: staff, orb, light } = staffProp();
  staff.position.set(1.05, 0, 0.55);
  rig.torso.add(staff);

  const sword = swordProp();
  sword.position.set(0.95, 1.9, 0.75);
  rig.torso.add(sword);

  enableShadows(hat);
  enableShadows(cloakGroup);

  function setLook(look: Look) {
    const l = LOOKS[look];
    hat.visible = l.hat;
    cloakGroup.visible = l.cloak !== null;
    if (l.cloak !== null) fabric.color.setHex(l.cloak);
    for (const b of bracers) b.visible = l.bracers;
    for (const e of ears) e.visible = l.ears;
    crown.visible = l.ears;
    staff.visible = l.staff;
    sword.visible = l.sword;
  }
  setLook('goth');

  return {
    setLook,
    staff,
    sword,
    setStaffGlow(k) {
      light.intensity = 6 * k;
      orb.material.emissiveIntensity = 0.5 + 1.6 * k;
    },
  };
}

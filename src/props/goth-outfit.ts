import * as THREE from 'three';
import { ball, enableShadows } from '../characters/materials';
import type { ParasaurolophusRig } from '../characters/parasaurolophus';

// Paris's body and neck (see createParasaurolophus)
const BODY = { c: new THREE.Vector3(0, 1.25, 0), r: new THREE.Vector3(0.95, 1.15, 0.9) };
const NECK = { c: new THREE.Vector3(0, 2.25, 0.2), r: 0.45 };

export interface GothOutfitOptions {
  /** Main fabric color. */
  fabric?: number;
  /** Accent (sheen, lacing, trim). */
  accent?: number;
}

/** Point on the body ellipsoid at height y and angle a around it (0 = front), pushed out by k. */
function onBody(y: number, a: number, k = 1.04): THREE.Vector3 {
  const h = (y - BODY.c.y) / BODY.r.y;
  const ring = Math.sqrt(Math.max(0, 1 - h * h));
  return new THREE.Vector3(Math.sin(a) * ring * BODY.r.x * k, y, Math.cos(a) * ring * BODY.r.z * k);
}

/**
 * Goth look for Paris: black velvet dress (fitted bodice + flared skirt with a ruffled hem and purple trim),
 * corset lacing down the front, a spiked choker with a pendant, long black sleeves, and smoky eyes with winged liner.
 */
export function addGothOutfit(
  rig: ParasaurolophusRig,
  { fabric = 0x15111c, accent = 0x7b3fa0 }: GothOutfitOptions = {},
) {
  const velvet = new THREE.MeshPhysicalMaterial({
    color: fabric,
    roughness: 0.85,
    sheen: 1,
    sheenRoughness: 0.35,
    sheenColor: new THREE.Color(accent),
    side: THREE.DoubleSide,
  });
  const trim = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.6 });
  const silver = new THREE.MeshStandardMaterial({
    color: 0xd8dce6,
    metalness: 0.7,
    roughness: 0.25,
    emissive: 0x222228,
  });
  const outfit = new THREE.Group();

  // bodice: fitted shell over the chest and waist
  const bodice = new THREE.Mesh(
    new THREE.SphereGeometry(1, 56, 32, 0, Math.PI * 2, Math.PI * 0.2, Math.PI * 0.42),
    velvet,
  );
  bodice.scale.copy(BODY.r).multiplyScalar(1.035);
  bodice.position.copy(BODY.c);
  outfit.add(bodice);

  // flared skirt with a ruffled hem
  const top = onBody(0.85, 0, 1).z / BODY.r.z; // ring radius factor at the waist
  const skirtGeo = new THREE.CylinderGeometry(BODY.r.x * top * 1.04, 1.25, 0.6, 72, 6, true);
  const p = skirtGeo.attributes.position!;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    const down = 0.5 - y / 0.6; // 0 at the waist, 1 at the hem
    const ruffle = 1 + 0.06 * Math.sin(Math.atan2(z, x) * 14) * down * down;
    p.setX(i, x * ruffle);
    p.setZ(i, z * ruffle);
  }
  skirtGeo.computeVertexNormals();
  const skirt = new THREE.Mesh(skirtGeo, velvet);
  skirt.position.set(0, 0.55, 0);
  skirt.scale.z = BODY.r.z / BODY.r.x;
  outfit.add(skirt);
  const hem = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.03, 8, 96), trim);
  hem.rotation.x = Math.PI / 2;
  hem.position.y = 0.25;
  hem.scale.y = BODY.r.z / BODY.r.x;
  outfit.add(hem);

  // corset lacing: criss-cross ribbon down the front
  const laces: THREE.Vector3[] = [];
  for (let y = 1.7; y >= 1.0; y -= 0.14) laces.push(onBody(y, -0.14, 1.06), onBody(y - 0.07, 0.14, 1.06));
  for (let i = 0; i < laces.length - 1; i++) {
    const a = laces[i]!,
      b = laces[i + 1]!;
    const lace = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, a.distanceTo(b), 6), trim);
    lace.position.copy(a).lerp(b, 0.5);
    lace.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    outfit.add(lace);
  }

  // spiked choker with a pendant
  const choker = new THREE.Group();
  choker.position.set(NECK.c.x, NECK.c.y - 0.16, NECK.c.z);
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(NECK.r * 0.98, 0.045, 10, 40),
    new THREE.MeshStandardMaterial({ color: 0x0c0a10, roughness: 0.4 }),
  );
  band.rotation.x = Math.PI / 2;
  choker.add(band);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.09, 8), silver);
    spike.position.set(Math.sin(a) * NECK.r * 1.06, 0, Math.cos(a) * NECK.r * 1.06);
    spike.lookAt(spike.position.clone().multiplyScalar(2));
    spike.rotateX(Math.PI / 2);
    choker.add(spike);
  }
  choker.add(ball(0.05, silver, [0, -0.1, NECK.r * 1.02], [1, 1.2, 0.5], 12));
  outfit.add(choker);

  rig.torso.add(outfit);

  // long black sleeves: children of the arm meshes, so they stretch with the arms
  const sleeveMat = velvet.clone();
  sleeveMat.side = THREE.FrontSide;
  for (const pivot of rig.arms) {
    const arm = pivot.children.find(c => (c as THREE.Mesh).geometry?.type === 'CapsuleGeometry') as
      THREE.Mesh | undefined;
    if (!arm) continue;
    const sleeve = new THREE.Mesh(arm.geometry, sleeveMat);
    sleeve.scale.set(1.15, 0.96, 1.15);
    arm.add(sleeve);
  }

  // smoky eyes + winged liner
  const shadow = new THREE.MeshStandardMaterial({ color: 0x3a1f4a, roughness: 0.9 });
  const liner = new THREE.MeshStandardMaterial({ color: 0x08060c, roughness: 0.5 });
  for (const eye of rig.eyes) {
    const s = Math.sign(eye.position.x);
    eye.add(ball(0.19, shadow, [0, 0.01, -0.03], [1.12, 1.18, 0.5], 20));
    const wing = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.16, 8), liner);
    wing.position.set(s * 0.18, 0.06, 0.03);
    wing.rotation.z = -s * (Math.PI / 2 - 0.45);
    eye.add(wing);
  }

  enableShadows(outfit);
  return outfit;
}

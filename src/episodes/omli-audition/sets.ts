import * as THREE from 'three';
import { box, createRoom, mat, picture, ROUND } from '../../world/interior';
import { createRockStage } from '../../world/rock-stage';
import { createSeat } from '../../props/furniture';

/** Where Omli stands in his home gym, and the bench his phone lies on. */
export const OMLI_SPOT = new THREE.Vector3(0, 0, 0.8);
export const BENCH_TOP = new THREE.Vector3(-2.6, 1.15, 1.2);

/** A dumbbell: a knurled bar between two heavy plates. Origin at its middle; the bar runs along x. */
export function createDumbbell(): THREE.Group {
  const g = new THREE.Group();
  const iron = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.5, metalness: 0.6 });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 12), mat(0xb8bcc8, 0.3, { metalness: 0.8 }));
  bar.rotation.z = Math.PI / 2;
  g.add(bar);
  for (const s of [-1, 1]) {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 8), iron);
    plate.rotation.z = Math.PI / 2;
    plate.position.x = s * 0.3;
    g.add(plate);
  }
  g.traverse(o => (o.castShadow = true));
  return g;
}

/**
 * Omli's home gym: rubber floor, a dumbbell rack, a weight bench (his phone on it), a big mirror, and a poster that
 * tells you everything about him.
 */
export function createGym() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x3a3a44);
  createRoom(scene, { wall: 0x4a4a56, floor: 0x26262c });
  scene.add(new THREE.HemisphereLight(0xffffff, 0x50505a, 1.3));
  const key = new THREE.DirectionalLight(0xfff0dc, 2.0);
  key.position.set(4, 9, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 5;
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 9, bottom: -2, near: 1, far: 30 });
  scene.add(key);

  // the rack, full of dumbbells
  const rack = box(4.4, 1.1, 0.9, mat(0x15151a, 0.5));
  rack.position.set(3.2, 0, -3.2);
  scene.add(rack);
  for (let i = 0; i < 5; i++) {
    const d = createDumbbell();
    d.position.set(1.4 + i * 0.9, 1.3, -3.2);
    d.rotation.y = Math.PI / 2;
    d.scale.setScalar(0.8 + i * 0.08);
    scene.add(d);
  }
  // the bench
  const pad = box(1.1, 0.25, 2.6, mat(0xc0392b, 0.6));
  pad.position.set(BENCH_TOP.x, BENCH_TOP.y - 0.25, BENCH_TOP.z - 0.6);
  const leg = box(0.2, BENCH_TOP.y - 0.25, 1.8, mat(0x15151a, 0.4));
  leg.position.set(BENCH_TOP.x, 0, BENCH_TOP.z - 0.6);
  scene.add(pad, leg);
  // the mirror, and the poster
  const mirror = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 3.6),
    new THREE.MeshStandardMaterial({ color: 0xc9d6e2, roughness: 0.05, metalness: 0.9 }),
  );
  mirror.position.set(-2.2, 4.4, -3.95);
  scene.add(mirror);
  const poster = picture(
    1.8,
    2.4,
    (ctx, w, h) => {
      ctx.fillStyle = '#111114';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ece6da';
      ctx.textAlign = 'center';
      ctx.font = `700 ${w * 0.15}px ${ROUND}`;
      ctx.fillText('NO PAIN', w / 2, h * 0.3);
      ctx.fillText('NO GAIN', w / 2, h * 0.48);
      ctx.font = `${w * 0.3}px ${ROUND}`;
      ctx.fillText('🤘💪', w / 2, h * 0.8);
    },
    { frame: 0xc0392b },
  );
  poster.position.set(3.4, 4.6, -3.95);
  scene.add(poster);
  return { scene };
}

/** Where everyone is on the stage for the audition (x, z, facing; the drums are on a riser). */
export const PLOT = {
  omli: { x: 0, z: 1.3, ry: 0, y: 0 },
  rory: { x: -3.3, z: 1.0, ry: 0.35, y: 0 },
  drums: { x: 1.8, z: -2.6, ry: -0.15, y: 0.5 },
  paris: { x: 4.3, z: 2.5, ry: -0.75, y: 0 },
  steggy: { x: 5.6, z: 1.2, ry: -0.9, y: 0 },
  tiki: { x: -5.6, z: 2.9, ry: 0.75, y: 0 },
} as const;
/** Where Omli walks on from (stage right). */
export const OMLI_ENTER = new THREE.Vector3(9, 0, 1.3);

/** The rehearsal: the Rocksaurus stage, a riser for the drums, Tiki's chair down front. */
export function createAuditionStage() {
  const scene = new THREE.Scene();
  const lights = createRockStage(scene);
  const riser = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, PLOT.drums.y, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x241433, roughness: 0.5, metalness: 0.2 }),
  );
  riser.position.set(PLOT.drums.x, PLOT.drums.y / 2, PLOT.drums.z + 0.4);
  riser.rotation.y = PLOT.drums.ry;
  riser.receiveShadow = true;
  scene.add(riser);
  const chair = createSeat({ width: 2.4, colour: 0x5a2a6a });
  chair.position.set(PLOT.tiki.x, 0, PLOT.tiki.z - 0.2);
  chair.rotation.y = PLOT.tiki.ry;
  scene.add(chair);
  return { scene, lights };
}

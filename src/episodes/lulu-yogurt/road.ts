import * as THREE from 'three';
import { box, cylinder, mat } from '../../world/interior';
import { sky } from '../../world/sky';
import { ball } from '../../characters/materials';

// The ride home: Omli's car stays at the origin, facing +x, and the street slides past it toward -x. Everything
// that moves is placed from t alone (a wrapped offset), so a seek lands on the same frame.

/** How fast the street goes by (units per second), and the loop it repeats over. */
const SPEED = 9;
const SPAN = 64;
const wrapX = (x: number) => -SPAN / 2 + ((((x + SPAN / 2) % SPAN) + SPAN) % SPAN);

/** The car: its body, the roof with the sunroof Lulu's neck goes through, and the seats. */
const CAR = { length: 7, width: 3.6, sill: 0.55, belt: 2.0, roof: 4.0 } as const;
/** Where they sit: Omli drives (in front, on our side); Lulu takes the whole back seat, under the sunroof. */
export const OMLI_SEAT = new THREE.Vector3(0.9, 0.45, 0.8);
export const LULU_SEAT = new THREE.Vector3(-1.7, 1.3, -0.2);
const WHEEL = 0.55;
const SUNROOF = { from: -2.6, to: -0.8, back: -1.3, front: 0.9 } as const;

function createCar() {
  const g = new THREE.Group();
  const paint = mat(0x2f6fb3, 0.35, { metalness: 0.4 });
  const { length, width, sill, belt, roof } = CAR;
  const body = box(length, belt - sill, width, paint);
  body.position.y = sill;
  g.add(body);
  // the cabin: four pillars, glass all round, and the roof around the sunroof
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xbfe3ff, roughness: 0.05, transparent: true, opacity: 0.22 });
  const cabin = { from: -3.0, to: 2.0 };
  for (const x of [cabin.from, cabin.to])
    for (const z of [-1, 1]) {
      const pillar = box(0.18, roof - belt, 0.18, paint);
      pillar.position.set(x, belt, (z * (width - 0.18)) / 2);
      g.add(pillar);
    }
  const side = new THREE.Mesh(new THREE.BoxGeometry(cabin.to - cabin.from, roof - belt, width - 0.1), glass);
  side.position.set((cabin.from + cabin.to) / 2, (roof + belt) / 2, 0);
  g.add(side);
  const half = width / 2;
  const roofParts: [number, number, number, number][] = [
    [cabin.from, SUNROOF.from, -half, half], // behind the sunroof
    [SUNROOF.to, cabin.to, -half, half], // in front of it
    [SUNROOF.from, SUNROOF.to, -half, SUNROOF.back], // the far edge
    [SUNROOF.from, SUNROOF.to, SUNROOF.front, half], // the near edge
  ];
  for (const [x0, x1, z0, z1] of roofParts) {
    const part = box(x1 - x0, 0.16, z1 - z0, paint);
    part.position.set((x0 + x1) / 2, roof, (z0 + z1) / 2);
    g.add(part);
  }
  // lights: headlights in front, red at the back
  for (const z of [-1, 1]) {
    const head = ball(
      0.22,
      new THREE.MeshBasicMaterial({ color: 0xfff6d0 }),
      [length / 2, 1.4, z * 1.2],
      [0.4, 1, 1.4],
    );
    const tail = ball(
      0.2,
      new THREE.MeshBasicMaterial({ color: 0xff3030 }),
      [-length / 2, 1.5, z * 1.3],
      [0.4, 0.8, 1.4],
    );
    g.add(head, tail);
  }
  // the seats, and Omli's steering wheel
  const seatMat = mat(0x2a2a30, 0.8);
  for (const [x, z, w] of [
    [OMLI_SEAT.x - 0.2, OMLI_SEAT.z, 1.4],
    [LULU_SEAT.x - 0.1, 0, 3.0],
  ] as const) {
    const seat = box(1.6, 0.3, w, seatMat);
    seat.position.set(x, sill + 0.1, z);
    g.add(seat);
  }
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 8, 28), mat(0x111114, 0.5));
  wheel.position.set(OMLI_SEAT.x + 1.25, 2.45, OMLI_SEAT.z);
  wheel.rotation.y = Math.PI / 2;
  wheel.rotation.x = 0.4;
  g.add(wheel);
  // the wheels: they turn with the road
  const wheels: THREE.Object3D[] = [];
  for (const x of [-2.3, 2.3])
    for (const z of [-1, 1]) {
      // its own geometry, centred on its axle (the shared cylinder() geometry stands on its base)
      const tyre = new THREE.Mesh(new THREE.CylinderGeometry(WHEEL, WHEEL, 0.4, 20), mat(0x16161a, 0.8));
      tyre.castShadow = tyre.receiveShadow = true;
      tyre.rotation.x = Math.PI / 2;
      tyre.position.set(x, WHEEL, z * (width / 2 - 0.1));
      const hub = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.06), mat(0xc0c4cc, 0.3, { metalness: 0.8 }));
      hub.position.y = 0.21;
      tyre.add(hub);
      g.add(tyre);
      wheels.push(tyre);
    }
  g.traverse(o => (o.castShadow = true));
  side.castShadow = false;
  return { group: g, wheels, steering: wheel };
}

/** A street lamp on the far side of the road. */
function lamp(): THREE.Group {
  const g = new THREE.Group();
  g.add(cylinder(0.1, 0.12, 6, mat(0x3a3a48, 0.5), 8));
  const arm = box(1.6, 0.12, 0.12, mat(0x3a3a48, 0.5));
  arm.position.set(0.7, 5.9, 0);
  g.add(arm, ball(0.26, new THREE.MeshBasicMaterial({ color: 0xffe2a0 }), [1.4, 5.85, 0], [1.2, 0.6, 1]));
  return g;
}

/** A block of flats in the back, with a few lit windows. */
function building(seed: number): THREE.Group {
  const g = new THREE.Group();
  const h = 7 + (seed % 3) * 3;
  g.add(box(6, h, 4, mat([0x2a2f4a, 0x33294a, 0x23324a][seed % 3]!, 0.9)));
  const lit = new THREE.MeshBasicMaterial({ color: 0xffd98a });
  for (let row = 1; row * 1.6 < h - 0.6; row++)
    for (let col = 0; col < 3; col++) {
      if ((row * 7 + col * 3 + seed) % 4 === 0) continue; // a few dark windows
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), lit);
      win.position.set(-1.6 + col * 1.6, row * 1.6, 2.01);
      g.add(win);
    }
  return g;
}

/** The night street: sky, road with dashes, lamps, flats behind; and the car, driving. */
export function createRide() {
  const scene = new THREE.Scene();
  scene.background = sky('#0b1030', '#2a2a6a', '#6a4a8a');
  scene.add(new THREE.HemisphereLight(0x8a9cff, 0x1a1530, 1.1));
  const moon = new THREE.DirectionalLight(0xb8c6ff, 1.6);
  moon.position.set(-6, 10, 8);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -8, right: 8, top: 8, bottom: -2, near: 1, far: 30 });
  scene.add(moon);
  const dash = new THREE.PointLight(0xaec3ff, 4, 5, 1.6); // the dashboard's glow on their faces
  dash.position.set(2.0, 2.6, 0.4);
  scene.add(dash);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 80), mat(0x1c2230, 1));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  const road = new THREE.Mesh(new THREE.PlaneGeometry(200, 7), mat(0x2b2b33, 0.9));
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.01;
  road.receiveShadow = true;
  scene.add(ground, road);

  const car = createCar();
  scene.add(car.group);

  /** Things that scroll past: each with its place along the loop and how far back it is (parallax: slower). */
  const scrollers: { obj: THREE.Object3D; x0: number; pace: number }[] = [];
  const add = (obj: THREE.Object3D, x0: number, pace: number) => {
    scene.add(obj);
    scrollers.push({ obj, x0, pace });
  };
  for (let i = 0; i < 16; i++) {
    const d = box(1.6, 0.02, 0.18, mat(0xf4f1ea, 0.6));
    d.position.set(0, 0.02, 2.6);
    add(d, i * 4, 1);
  }
  for (let i = 0; i < 4; i++) {
    const l = lamp();
    l.position.z = -4.5;
    add(l, i * 16, 1);
  }
  for (let i = 0; i < 8; i++) {
    const b = building(i);
    b.position.z = -14;
    add(b, i * 8, 0.5);
  }

  return {
    scene,
    car,
    /** Places the street and turns the wheels for time `t` (seconds into the ride). */
    drive(t: number) {
      for (const { obj, x0, pace } of scrollers) obj.position.x = wrapX(x0 - SPEED * pace * t);
      for (const w of car.wheels) w.rotation.y = -(SPEED * t) / WHEEL;
      car.group.position.y = Math.abs(Math.sin(t * 7)) * 0.025; // the road under the tyres
    },
  };
}

import * as THREE from 'three';
import { addKeyLight, box, cylinder, livePanel, mat } from '../../world/interior';
import { sky } from '../../world/sky';
import { ball } from '../../characters/materials';

// The morning jam. The Fesla stays at the origin, facing +x; everyone crawls along with it, so the other cars stay
// put (give or take a little stop-and-go) and the road, the trees and the city slide past toward -x, slowly. All of it
// is placed from t alone (a wrapped offset), so a seek lands on the same frame.

/** How fast the jam crawls (units per second), and the loop the roadside repeats over. */
const CRAWL = 1.4;
const SPAN = 72;
const wrapX = (x: number) => -SPAN / 2 + ((((x + SPAN / 2) % SPAN) + SPAN) % SPAN);

/** The Fesla: long, low and white, a glass canopy over the cabin. Units: Rorit (seated) is 3.5 tall. */
const FESLA = { length: 6.6, width: 3.2, sill: 0.5, belt: 1.65, wheel: 0.55 } as const;
/** Where Rorit sits (the seat's top, car space), on our side of the car, and her steering wheel in front of her. */
export const SEAT = new THREE.Vector3(-0.7, 1.0, 0.45);
const STEERING = new THREE.Vector3(0.75, 2.15, 0.45);
/** The touchscreen in the middle of the dash, tall like a tablet, turned toward her. */
const SCREEN = { w: 0.85, h: 1.15, px: 540, at: new THREE.Vector3(0.95, 2.3, -0.3), yaw: -1.15 } as const;
/** The hazard lights' two looks: off (dim amber) and blinking (bright). */
const HAZARD = { off: 0x6a4a20, on: 0xffa21f } as const;

interface Fesla {
  group: THREE.Group;
  steering: THREE.Object3D;
  /** The dash screen (faces into the cabin): `paint` draws it; `repaint()` when what it shows changed. */
  screen: THREE.Mesh;
  repaint(): void;
  /** The hazards, blinking (Frok, going wild). */
  flash(on: boolean): void;
  wheels: THREE.Object3D[];
}

function createFesla(paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): Fesla {
  const g = new THREE.Group();
  const { length, width, sill, belt, wheel: R } = FESLA;
  const pearl = mat(0xf4f6f8, 0.25, { metalness: 0.35 });
  const trim = mat(0x1d2026, 0.4);
  // the body: a slab with rounded ends
  const body = box(length - 1.6, belt - sill, width, pearl);
  body.position.y = sill;
  g.add(body);
  const mid = (sill + belt) / 2;
  g.add(ball(1, pearl, [length / 2 - 0.8, mid, 0], [0.95, (belt - sill) / 2, width / 2])); // the nose
  g.add(ball(1, pearl, [-length / 2 + 0.8, mid, 0], [0.95, (belt - sill) / 2, width / 2])); // the tail
  const skirt = box(length - 1.2, 0.18, width + 0.04, trim);
  skirt.position.y = sill;
  g.add(skirt);
  // the canopy: one dark glass dome over the cabin, so we see her through it
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x334455,
    roughness: 0.05,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), glass);
  canopy.scale.set(2.9, 2.2, width / 2 - 0.02);
  canopy.position.set(-0.2, belt, 0);
  g.add(canopy);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 6, 48), pearl);
  rim.rotation.x = Math.PI / 2;
  rim.scale.set(2.9, width / 2 - 0.02, 1);
  rim.position.set(-0.2, belt, 0);
  g.add(rim);
  // light bars: white in front, red at the back, and the four amber hazards at the corners
  g.add(
    ball(1, new THREE.MeshBasicMaterial({ color: 0xf5fbff }), [length / 2 - 0.1, belt - 0.25, 0], [0.12, 0.08, 1.2]),
  );
  g.add(
    ball(1, new THREE.MeshBasicMaterial({ color: 0xff2a3a }), [-length / 2 + 0.1, belt - 0.2, 0], [0.12, 0.08, 1.3]),
  );
  const amber = new THREE.MeshBasicMaterial({ color: HAZARD.off });
  for (const x of [-1, 1])
    for (const z of [-1, 1]) g.add(ball(0.2, amber, [x * (length / 2 - 0.25), belt - 0.3, z * 1.35]));
  // the cabin: her seat, the wheel, the screen
  const seatMat = mat(0x2b2d33, 0.7);
  const seat = box(1.4, SEAT.y - sill, 1.3, seatMat);
  seat.position.set(SEAT.x, sill, SEAT.z);
  const back = box(0.25, 1.6, 1.3, seatMat);
  back.position.set(SEAT.x - 0.85, SEAT.y, SEAT.z);
  back.rotation.z = 0.15;
  g.add(seat, back);
  const steering = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.05, 8, 28), trim);
  steering.position.copy(STEERING);
  steering.rotation.set(0, Math.PI / 2, 0.35);
  g.add(steering);
  const dash = box(0.6, 0.25, width - 0.4, trim);
  dash.position.set(1.3, belt - 0.1, 0);
  g.add(dash);
  const panel = livePanel(SCREEN.w, SCREEN.h, SCREEN.px, paint);
  panel.mesh.position.copy(SCREEN.at);
  panel.mesh.rotation.set(0, SCREEN.yaw, 0);
  const bezel = box(SCREEN.w + 0.08, SCREEN.h + 0.08, 0.04, trim);
  bezel.position.set(0, -(SCREEN.h + 0.08) / 2, -0.03);
  panel.mesh.add(bezel);
  g.add(panel.mesh);
  // the wheels, with aero discs: they turn with the road
  const wheels: THREE.Object3D[] = [];
  for (const x of [-2.15, 2.15])
    for (const z of [-1, 1]) {
      // its own geometry, centred on its axle (the shared cylinder() geometry stands on its base)
      const tyre = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.42, 24), mat(0x15161a, 0.8));
      tyre.rotation.x = Math.PI / 2;
      tyre.position.set(x, R, z * (width / 2 - 0.12));
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(R * 0.7, R * 0.7, 0.44, 5),
        mat(0xc9ced6, 0.3, { metalness: 0.7 }),
      );
      tyre.add(disc);
      g.add(tyre);
      wheels.push(tyre);
    }
  g.traverse(o => (o.castShadow = o !== canopy));
  return {
    group: g,
    steering,
    screen: panel.mesh,
    repaint: panel.repaint,
    flash(on) {
      amber.color.setHex(on ? HAZARD.on : HAZARD.off);
    },
    wheels,
  };
}

/** Another car in the jam: a body, a cabin with dark windows, wheels. `tall` makes it a minivan. */
function jamCar(colour: number, tall = false): THREE.Group {
  const g = new THREE.Group();
  const paint = mat(colour, 0.4, { metalness: 0.2 });
  const windows = mat(0x26303c, 0.15);
  const length = tall ? 6.8 : 6.0;
  const body = box(length, 1.2, 3.0, paint);
  body.position.y = 0.45;
  const cabinHeight = tall ? 1.9 : 1.2;
  const cabin = box(tall ? length - 1.4 : 3.4, cabinHeight, 2.8, windows);
  cabin.position.set(tall ? -0.5 : -0.4, 1.65, 0);
  const roof = box(tall ? length - 1.5 : 3.2, 0.15, 2.9, paint);
  roof.position.set(cabin.position.x, 1.65 + cabinHeight, 0);
  g.add(body, cabin, roof);
  for (const x of [-1, 1])
    for (const z of [-1, 1]) {
      const tyre = cylinder(0.5, 0.5, 0.4, mat(0x15161a, 0.8), 16);
      tyre.rotation.x = Math.PI / 2;
      tyre.position.set(x * (length / 2 - 1.1), 0.5, z * 1.3 + z * 0.2);
      g.add(tyre);
    }
  g.add(ball(0.15, new THREE.MeshBasicMaterial({ color: 0xff2a3a }), [-length / 2, 1.3, 1.1]));
  g.add(ball(0.15, new THREE.MeshBasicMaterial({ color: 0xff2a3a }), [-length / 2, 1.3, -1.1]));
  return g;
}

/** A roadside tree: a trunk and a round crown. */
function tree(seed: number): THREE.Group {
  const g = new THREE.Group();
  g.add(cylinder(0.18, 0.24, 1.8, mat(0x7a5236, 0.9), 8));
  const leaf = mat([0x5aa469, 0x4f9a5e, 0x6bb873][seed % 3]!, 0.8);
  g.add(ball(1.3, leaf, [0, 2.6, 0], [1, 1.1, 1], 16), ball(0.9, leaf, [0.6, 3.3, 0.2], [1, 1, 1], 16));
  return g;
}

/** An office block in the morning sun: glass, a few floors of windows. */
function tower(seed: number): THREE.Group {
  const g = new THREE.Group();
  const h = 12 + (seed % 4) * 4;
  g.add(box(7, h, 5, mat([0x9fb6cc, 0xb8c4d6, 0x8ea6bf, 0xc7cfd9][seed % 4]!, 0.5)));
  const pane = mat(0xdff1ff, 0.1, { metalness: 0.5 });
  for (let floor = 1; floor * 2 < h - 1; floor++) {
    const band = box(6.4, 0.8, 0.05, pane);
    band.position.set(0, floor * 2, 2.52);
    g.add(band);
  }
  return g;
}

/** The jam: the Fesla in the middle lane, a minivan ahead of it, cars all round, trees and towers behind. */
export function createTraffic(paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const scene = new THREE.Scene();
  scene.background = sky('#5ea8ef', '#a9d4fb', '#fdf0d8');
  scene.add(new THREE.HemisphereLight(0xdbeaff, 0x8a8070, 1.3));
  addKeyLight(scene, 0xfff1d6, 2.4, { from: [8, 12, 10], reach: 14, top: 10, bottom: -8 });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 120), mat(0x9bbf7a, 1));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  const road = new THREE.Mesh(new THREE.PlaneGeometry(240, 16), mat(0x3b3d44, 0.9));
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.01;
  road.receiveShadow = true;
  scene.add(ground, road);

  const fesla = createFesla(paint);
  scene.add(fesla.group);

  /** Cars in the jam (car space x, lane z) and how far each one's stop-and-go is out of step with ours. */
  const jam: { car: THREE.Group; x: number; phase: number }[] = [];
  const park = (car: THREE.Group, x: number, z: number, phase: number) => {
    car.position.z = z;
    scene.add(car);
    jam.push({ car, x, phase });
  };
  park(jamCar(0x8a6bbf, true), 8.8, 0, 0.6); // the minivan, doing 12 in the fast lane
  park(jamCar(0xe05a4f), -8.4, 0, 1.7);
  for (const [i, x] of [-13, -5, 3, 11].entries())
    park(jamCar([0x3d7bd9, 0xf2c14e, 0x5bbf8a, 0xd9dde3][i]!, i === 1), x, -5.2, i);
  for (const [i, x] of [-12, 12].entries()) park(jamCar([0xff8a5b, 0x4a4f5a][i]!), x, 5.2, 2 + i);

  /** Things the jam crawls past: each with its place along the loop and its parallax (further back: slower). */
  const roadside: { obj: THREE.Object3D; x0: number; pace: number }[] = [];
  const pass = (obj: THREE.Object3D, x0: number, z: number, pace: number) => {
    obj.position.z = z;
    scene.add(obj);
    roadside.push({ obj, x0, pace });
  };
  for (let i = 0; i < 18; i++) for (const z of [-2.6, 2.6]) pass(box(1.6, 0.02, 0.16, mat(0xf4f1ea, 0.6)), i * 4, z, 1);
  for (let i = 0; i < 9; i++) pass(tree(i), i * 8 + (i % 2) * 2, -10 - (i % 3), 1);
  for (let i = 0; i < 10; i++) pass(tower(i), i * 8, -26 - (i % 2) * 6, 0.4);

  /** How far the jam has crawled by t: mostly creeping, now and then a little lurch. */
  const crawled = (t: number) => CRAWL * t + 0.6 * Math.sin(t * 0.7);

  return {
    scene,
    fesla,
    /** Places the jam for time t. `wild` (0..1) shakes the Fesla: Frok, with permissions to everything. */
    drive(t: number, wild: number) {
      const d = crawled(t);
      for (const { obj, x0, pace } of roadside) obj.position.x = wrapX(x0 - d * pace);
      for (const { car, x, phase } of jam) car.position.x = x + 0.35 * Math.sin(t * 0.7 + phase);
      for (const w of fesla.wheels) w.rotation.y = -d / FESLA.wheel;
      fesla.group.position.y = wild * Math.abs(Math.sin(t * 17)) * 0.12;
      fesla.group.rotation.x = wild * Math.sin(t * 23) * 0.03;
    },
  };
}

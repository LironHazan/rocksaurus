import * as THREE from 'three';
import { addKeyLight, box, cylinder, livePanel, mat } from '../../world/interior';
import { sky } from '../../world/sky';
import { textTexture } from '../../world/text-texture';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { ball } from '../../characters/materials';

// The morning jam. The Fesla stays at the origin, facing +x; everyone crawls along with it, so the other cars stay
// put (give or take a little stop-and-go) and the road, the trees and the city slide past toward -x, slowly. All of it
// is placed from t alone (a wrapped offset), so a seek lands on the same frame.

/** How fast the jam crawls (units per second), and the loop the roadside repeats over. */
const CRAWL = 1.4;
const SPAN = 72;
const wrapX = (x: number) => -SPAN / 2 + ((((x + SPAN / 2) % SPAN) + SPAN) % SPAN);

/** The Fesla: a long pearl-white sedan, a closed glass cabin with a panoramic roof. Units: Rorit (seated) is 2.5
 * tall, her shoulders above the belt line. */
const FESLA = { length: 7.4, width: 3.0, belt: 1.15, wheelX: 2.35 } as const;
/** Every car's tyres (radius) and the arch cut round them (a little bigger). */
const TYRE = 0.6;
const ARCH = 0.75;
/** How round the Fesla body's edges are: its surface sits this much (× 0.6) outside the side profile. */
const BODY_ROUND = 0.35;
/** The Fesla's glasshouse: how round its edges are, the black frame's thickness, and the B-pillar (behind her). */
const CABIN_ROUND = 0.14;
const FRAME = 0.055;
const B_PILLAR = -1.55;
/** The glass's tint (what it multiplies the view through it by), and its place in the draw order: last. */
const GLASS_TINT = 0x7d93ab;
const LAST = 10;
/** Where Rorit sits (the seat's top, car space), on our side of the car, and her steering wheel in front of her. */
export const SEAT = new THREE.Vector3(-0.6, 1.0, 0.45);
const STEERING = { at: new THREE.Vector3(0.65, 1.95, 0.45), rim: 0.3 } as const;
/** Where her paws hold the wheel (wheel space): ten to two. */
const TEN_TO_TWO = { x: 0.26, y: 0.13 } as const;
/** The touchscreen in the middle of the dash, tall like a tablet, turned toward her. */
const SCREEN = { w: 0.85, h: 1.15, px: 540, at: new THREE.Vector3(0.95, 2.2, -0.3), yaw: -1.15 } as const;
/** The hazard lights' two looks: off (dim amber) and blinking (bright). */
const HAZARD = { off: 0x6a4a20, on: 0xffa21f } as const;

interface Fesla {
  group: THREE.Group;
  /** Where her paw goes on the wheel (world space), side -1 or 1. */
  grip(side: -1 | 1, out: THREE.Vector3): THREE.Vector3;
  /** The dash screen (faces into the cabin): `paint` draws it; `repaint()` when what it shows changed. */
  screen: THREE.Mesh;
  repaint(): void;
  /** The hazards, blinking (Frok, going wild). */
  flash(on: boolean): void;
  wheels: THREE.Object3D[];
}

/** A car's side, x along it (front at +x), y up: bumper to bumper over the wheel arches, the nose, hood and tail. */
interface Side {
  length: number;
  belt: number;
  /** Height of the nose's tip, and how far back the hood rises to the belt line. */
  nose: number;
  hood: number;
  wheelX: number;
}
function bodySide({ length, belt, nose, hood, wheelX }: Side): THREE.Shape {
  const h = length / 2;
  const floor = 0.3;
  const s = new THREE.Shape().moveTo(-h + 0.25, floor);
  for (const x of [-wheelX, wheelX]) {
    s.lineTo(x - ARCH, floor).lineTo(x - ARCH, TYRE);
    s.absarc(x, TYRE, ARCH, Math.PI, 0, true);
    s.lineTo(x + ARCH, floor);
  }
  s.lineTo(h - 0.3, floor);
  s.quadraticCurveTo(h + 0.05, floor + 0.05, h, nose); // the nose, round
  s.quadraticCurveTo(h - hood * 0.5, belt - 0.05, h - hood, belt); // the hood, up to the windscreen
  s.lineTo(-h + 0.6, belt);
  s.quadraticCurveTo(-h, belt - 0.02, -h - 0.02, belt - 0.4); // the tail
  s.quadraticCurveTo(-h - 0.05, floor + 0.1, -h + 0.25, floor);
  return s;
}
/** The glasshouse over the belt line: up the windscreen from `front`, along the roof, down the back to `back`. */
interface Cabin {
  front: number;
  back: number;
  roof: number;
  roofFront: number;
  roofBack: number;
}
function cabinSide(belt: number, { front, back, roof, roofFront, roofBack }: Cabin): THREE.Shape {
  return new THREE.Shape()
    .moveTo(front, belt)
    .quadraticCurveTo(roofFront + (front - roofFront) * 0.15, roof, roofFront, roof)
    .lineTo(roofBack, roof)
    .quadraticCurveTo(back + (roofBack - back) * 0.15, roof, back, belt)
    .lineTo(front, belt);
}
/** The same glasshouse's outline as a path (pushed out by the glass's rounded edge), for its black window frame. */
function cabinOutline(belt: number, cabin: Cabin): THREE.CurvePath<THREE.Vector3> {
  const out = CABIN_ROUND * 0.6;
  const { front, back, roof, roofFront, roofBack } = cabin;
  const at = (x: number, y: number) => new THREE.Vector3(x, y, 0);
  const path = new THREE.CurvePath<THREE.Vector3>();
  path.add(
    new THREE.QuadraticBezierCurve3(
      at(front + out, belt),
      at(roofFront + (front - roofFront) * 0.15 + out, roof + out),
      at(roofFront, roof + out),
    ),
  );
  path.add(new THREE.LineCurve3(at(roofFront, roof + out), at(roofBack, roof + out)));
  path.add(
    new THREE.QuadraticBezierCurve3(
      at(roofBack, roof + out),
      at(back + (roofBack - back) * 0.15 - out, roof + out),
      at(back - out, belt),
    ),
  );
  return path;
}

/** A side profile, extruded across `width` with its edges rounded (`round`), smooth-shaded. */
function rounded(profile: THREE.Shape, width: number, round: number): THREE.BufferGeometry {
  const depth = width - 2 * round;
  let g: THREE.BufferGeometry = new THREE.ExtrudeGeometry(profile, {
    depth,
    bevelEnabled: true,
    bevelThickness: round,
    bevelSize: round * 0.6,
    bevelSegments: 6,
    curveSegments: 20,
  }).translate(0, 0, -depth / 2);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g);
  g.clearGroups(); // the extrusion's cap and side groups index the vertices from before the merge
  g.computeVertexNormals();
  return g;
}

/** The badge on the nose: a chrome F, its top bar swept like a shield (our own mark, not anyone's logo). */
function badge(x: number): THREE.Mesh {
  const map = textTexture(128, 128, (ctx, w, h) => {
    const chrome = ctx.createLinearGradient(0, 0, 0, h);
    chrome.addColorStop(0, '#8a939e'); // dark chrome, so it reads on the white paint
    chrome.addColorStop(0.5, '#2a2f36');
    chrome.addColorStop(1, '#6d7680');
    ctx.fillStyle = chrome;
    // the swept top bar
    ctx.beginPath();
    ctx.moveTo(w * 0.12, h * 0.16);
    ctx.quadraticCurveTo(w * 0.5, h * 0.06, w * 0.88, h * 0.16);
    ctx.lineTo(w * 0.84, h * 0.26);
    ctx.quadraticCurveTo(w * 0.5, h * 0.18, w * 0.16, h * 0.26);
    ctx.fill();
    // the stem, narrowing to a point, and the short middle bar
    ctx.beginPath();
    ctx.moveTo(w * 0.42, h * 0.28);
    ctx.lineTo(w * 0.56, h * 0.27);
    ctx.lineTo(w * 0.5, h * 0.92);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.46);
    ctx.lineTo(w * 0.76, h * 0.44);
    ctx.lineTo(w * 0.72, h * 0.52);
    ctx.lineTo(w * 0.5, h * 0.54);
    ctx.fill();
  });
  const mark = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.5),
    new THREE.MeshStandardMaterial({ map, transparent: true, metalness: 0.6, roughness: 0.25 }),
  );
  mark.position.set(x + 0.04, 0.95, 0);
  mark.rotation.set(0, Math.PI / 2, 0);
  mark.rotateX(-0.45); // leaning back with the nose
  return mark;
}

/** A wheel: the tyre and an aero disc, centred on its axle (axle along z). */
function wheel(disc: THREE.Material, rubber: THREE.Material): THREE.Mesh {
  const tyre = new THREE.Mesh(new THREE.CylinderGeometry(TYRE, TYRE, 0.42, 28), rubber);
  tyre.rotation.x = Math.PI / 2;
  const face = new THREE.Mesh(new THREE.CylinderGeometry(TYRE * 0.72, TYRE * 0.72, 0.44, 28), disc);
  tyre.add(face);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(TYRE * 0.18, TYRE * 0.18, 0.46, 16), rubber);
  tyre.add(hub);
  for (let i = 0; i < 5; i++) {
    // five turbine spokes, so you can see it turn
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.46, TYRE * 0.55), rubber);
    spoke.position.set(0, 0, 0);
    spoke.rotation.y = (i / 5) * Math.PI * 2;
    spoke.translateZ(TYRE * 0.4);
    tyre.add(spoke);
  }
  tyre.castShadow = true;
  return tyre;
}

/** Her seat, in white leather: a cushion, a tall backrest raked back, a headrest, all rounded. */
function driverSeat(): THREE.Group {
  const leather = new THREE.MeshPhysicalMaterial({ color: 0xf2efe9, roughness: 0.55, sheen: 0.4 });
  const g = new THREE.Group();
  g.add(ball(1, leather, [SEAT.x, SEAT.y - 0.15, SEAT.z], [0.75, 0.16, 0.65], 24)); // the cushion
  const back = new THREE.Group();
  back.position.set(SEAT.x - 0.7, SEAT.y, SEAT.z);
  back.rotation.z = 0.18; // raked back
  back.add(ball(1, leather, [0, 0.85, 0], [0.16, 0.95, 0.62], 24)); // the backrest
  back.add(ball(1, leather, [0, 2.0, 0], [0.14, 0.24, 0.4], 20)); // the headrest
  g.add(back);
  const base = box(0.5, SEAT.y - 0.25, 0.9, mat(0x1d2026, 0.6));
  base.position.set(SEAT.x, 0, SEAT.z);
  g.add(base);
  return g;
}

/** The steering wheel: a slim rim, two spokes and a hub, facing her. */
function steeringWheel(material: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.TorusGeometry(STEERING.rim, 0.035, 10, 36), material));
  for (const s of [-1, 1]) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(STEERING.rim, 0.05, 0.03), material);
    spoke.position.x = (s * STEERING.rim) / 2;
    g.add(spoke);
  }
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 20).rotateX(Math.PI / 2), material));
  g.position.copy(STEERING.at);
  g.lookAt(SEAT.x + 0.4, SEAT.y + 1.6, SEAT.z); // tilted back toward her chest
  return g;
}

function createFesla(paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): Fesla {
  const g = new THREE.Group();
  const { length, width, belt, wheelX } = FESLA;
  const pearl = new THREE.MeshPhysicalMaterial({
    color: 0xf3f5f8,
    roughness: 0.25,
    metalness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });
  const trim = mat(0x16181d, 0.35);
  const body = new THREE.Mesh(
    rounded(bodySide({ length, belt, nose: 0.85, hood: 1.8, wheelX }), width, BODY_ROUND),
    pearl,
  );
  // one sweep of tinted glass from the windscreen over the roof to the tail: you see her through it
  // tinted glass: it multiplies whatever is behind it (her, the seat, the street) by a cool grey-blue, drawn after
  // everything else
  const glass = new THREE.MeshBasicMaterial({
    color: GLASS_TINT,
    blending: THREE.CustomBlending,
    blendSrc: THREE.ZeroFactor,
    blendDst: THREE.SrcColorFactor,
    depthWrite: false,
  });
  // a closed sedan cabin, all glass: the windscreen, the side windows and the panoramic roof, framed in black
  const cabin = { front: 1.8, back: -2.6, roof: 3.65, roofFront: 0.2, roofBack: -1.5 };
  const cabinWidth = width - 0.45;
  const canopy = new THREE.Mesh(rounded(cabinSide(belt - 0.05, cabin), cabinWidth, CABIN_ROUND), glass);
  canopy.renderOrder = LAST;
  g.add(body, canopy);
  const frame = cabinOutline(belt - 0.05, cabin);
  for (const z of [-1, 1]) {
    // the window frame each side, and the B-pillar behind her seat
    const edge = new THREE.Mesh(new THREE.TubeGeometry(frame, 80, FRAME, 8), trim);
    edge.position.z = z * (cabinWidth / 2 - CABIN_ROUND / 2);
    const pillar = box(0.16, cabin.roof - belt, 0.08, trim);
    pillar.position.set(B_PILLAR, belt - 0.05, z * (cabinWidth / 2 - 0.02));
    g.add(edge, pillar);
  }
  // the roof: black rails front and back of the glass panel, so it reads as a roof, not an open top
  for (const x of [cabin.roofFront + 0.1, cabin.roofBack - 0.1]) {
    const rail = box(0.14, 0.06, cabinWidth - 0.2, trim);
    rail.position.set(x, cabin.roof + CABIN_ROUND * 0.6 - 0.02, 0);
    g.add(rail);
  }
  const sill = box(cabin.front - cabin.back, 0.06, width - 0.3, trim);
  sill.position.set((cabin.front + cabin.back) / 2, belt - 0.06, 0);
  g.add(sill);
  g.add(badge(length / 2 + BODY_ROUND * 0.6 + 0.02));
  // light bars: one thin white line across the nose, a red one across the tail; amber hazards at the corners
  const nose = box(0.05, 0.05, width - 0.6, new THREE.MeshBasicMaterial({ color: 0xf5fbff }));
  nose.position.set(length / 2 + BODY_ROUND * 0.6, 0.76, 0);
  const tail = box(0.05, 0.07, width - 0.4, new THREE.MeshBasicMaterial({ color: 0xff2a3a }));
  tail.position.set(-length / 2 - BODY_ROUND * 0.6 - 0.02, 0.85, 0);
  g.add(nose, tail);
  const amber = new THREE.MeshBasicMaterial({ color: HAZARD.off });
  for (const x of [-1, 1])
    for (const z of [-1, 1])
      g.add(ball(0.14, amber, [x * (length / 2 - 0.2), 0.85, z * (width / 2 - 0.25)], [0.8, 0.6, 1]));
  // flush door handles and the mirrors
  for (const z of [-1, 1]) {
    for (const x of [0.4, -1.3]) {
      const handle = box(0.4, 0.05, 0.03, trim);
      handle.position.set(x, 1.0, z * (width / 2 + 0.02));
      g.add(handle);
    }
    g.add(ball(0.2, trim, [1.5, 1.4, z * (width / 2 + 0.05)], [0.6, 0.45, 0.6], 16));
  }
  // the cabin: her seat, the wheel, the screen
  const steering = steeringWheel(trim);
  g.add(driverSeat(), steering);
  const panel = livePanel(SCREEN.w, SCREEN.h, SCREEN.px, paint);
  panel.mesh.position.copy(SCREEN.at);
  panel.mesh.rotation.set(0, SCREEN.yaw, 0);
  const bezel = box(SCREEN.w + 0.08, SCREEN.h + 0.08, 0.04, trim);
  bezel.position.set(0, -(SCREEN.h + 0.08) / 2, -0.03);
  panel.mesh.add(bezel);
  g.add(panel.mesh);
  // the wheels: they turn with the road
  const disc = new THREE.MeshPhysicalMaterial({ color: 0x8d939c, roughness: 0.3, metalness: 0.8, clearcoat: 0.5 });
  const rubber = mat(0x141518, 0.8);
  const wheels: THREE.Object3D[] = [];
  for (const x of [-wheelX, wheelX])
    for (const z of [-1, 1]) {
      const w = wheel(disc, rubber);
      w.position.set(x, TYRE, z * (width / 2 - 0.15));
      g.add(w);
      wheels.push(w);
    }
  g.traverse(o => (o.castShadow = o !== canopy));
  return {
    group: g,
    grip(side, out) {
      return steering.localToWorld(out.set(side * TEN_TO_TWO.x, TEN_TO_TWO.y, 0));
    },
    screen: panel.mesh,
    repaint: panel.repaint,
    flash(on) {
      amber.color.setHex(on ? HAZARD.on : HAZARD.off);
    },
    wheels,
  };
}

/** The other cars in the jam: rounded, like real ones. Each is a side profile and a glasshouse. */
const JAM_CARS = {
  sedan: {
    side: { length: 6.6, belt: 1.45, nose: 1.0, hood: 1.6, wheelX: 2.1 },
    cabin: { front: 1.4, back: -2.5, roof: 2.6, roofFront: 0.4, roofBack: -1.3 },
  },
  hatch: {
    side: { length: 5.8, belt: 1.5, nose: 1.05, hood: 1.3, wheelX: 1.85 },
    cabin: { front: 1.5, back: -2.85, roof: 2.65, roofFront: 0.5, roofBack: -2.4 },
  },
  minivan: {
    side: { length: 7.0, belt: 1.55, nose: 1.15, hood: 1.0, wheelX: 2.3 },
    cabin: { front: 2.4, back: -3.4, roof: 3.15, roofFront: 1.3, roofBack: -3.1 },
  },
} as const satisfies Record<string, { side: Side; cabin: Cabin }>;
type JamCar = keyof typeof JAM_CARS;
const JAM_WIDTH = 3.0;

function jamCar(kind: JamCar, colour: number): THREE.Group {
  const { side, cabin } = JAM_CARS[kind];
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color: colour, roughness: 0.35, metalness: 0.2, clearcoat: 0.8 });
  const windows = new THREE.MeshPhysicalMaterial({ color: 0x1f2833, roughness: 0.1, clearcoat: 1 });
  g.add(new THREE.Mesh(rounded(bodySide(side), JAM_WIDTH, 0.4), paint));
  g.add(new THREE.Mesh(rounded(cabinSide(side.belt - 0.05, cabin), JAM_WIDTH - 0.5, 0.35), windows));
  const red = new THREE.MeshBasicMaterial({ color: 0xff2a3a });
  for (const z of [-1, 1]) g.add(ball(0.16, red, [-side.length / 2, side.belt - 0.25, z * 1.1], [0.5, 0.7, 1.4]));
  const hubcap = mat(0xb9bec6, 0.4, { metalness: 0.6 });
  const rubber = mat(0x141518, 0.8);
  for (const x of [-side.wheelX, side.wheelX])
    for (const z of [-1, 1]) {
      const w = wheel(hubcap, rubber);
      w.position.set(x, TYRE, z * (JAM_WIDTH / 2 - 0.15));
      g.add(w);
    }
  g.traverse(o => (o.castShadow = true));
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
  park(jamCar('minivan', 0x8a6bbf), 11, 0, 0.6); // the minivan, doing 12 in the fast lane
  park(jamCar('sedan', 0xe05a4f), -8.8, 0, 1.7);
  const farLane: [number, JamCar, number][] = [
    [-13, 'hatch', 0x3d7bd9],
    [-5, 'sedan', 0xf2c14e],
    [3, 'hatch', 0x5bbf8a],
    [11, 'sedan', 0xd9dde3],
  ];
  farLane.forEach(([x, kind, colour], i) => park(jamCar(kind, colour), x, -5.2, i));
  park(jamCar('hatch', 0xff8a5b), -12.5, 5.2, 2);
  park(jamCar('sedan', 0x4a4f5a), 12.5, 5.2, 3);

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
      for (const w of fesla.wheels) w.rotation.y = -d / TYRE;
      fesla.group.position.y = wild * Math.abs(Math.sin(t * 17)) * 0.12;
      fesla.group.rotation.x = wild * Math.sin(t * 23) * 0.03;
    },
  };
}

import * as THREE from 'three';
import {
  addKeyLight,
  box,
  createRoom,
  createWallClock,
  cylinder,
  livePanel,
  mat,
  paintWindowFrame,
  picture,
  ROUND,
} from '../../world/interior';
import { ball } from '../../characters/materials';
import { createLaptop } from '../../props/laptop';
import type { ShownLine } from '../../world/screen-script';

// The Papo Pako Shapeworks open office, 9 AM: rows of cubes with grey fabric walls, a window strip, a whiteboard with
// the deadline on it. Amazaurus's cube is in the middle (open toward us); Lulu's standing desk is off to the right.

/** Amazaurus's cube: its walls (x from -W to W, back at z = BACK, the sides reaching forward to FRONT) and height. */
const CUBE = { w: 3.2, back: -2.4, front: 0.8, height: 3.1 } as const;
/** The standing desks' height. */
const DESK_TOP = 1.36;
/** Where he stands (facing us), and where his monitor hangs on the cube's left wall. */
export const AMAZAURUS_SPOT = new THREE.Vector3(0.2, 0, -0.9);
/** His standing desk in front of him, with his MacBook on it facing him. */
const HIS_DESK = new THREE.Vector3(0.2, 0, 0.75);
/** He's short: his desk is low, so his MacBook's lid stays under his chin; the MacBook a little smaller. */
const HIS_DESK_TOP = 1.0;
const MACBOOK_SCALE = 0.75;
const MONITOR = { w: 1.9, h: 1.15, px: 720, at: new THREE.Vector3(-CUBE.w + 0.12, 2.4, -0.6) } as const;
/** Lulu's standing desk, and where she stands at it (facing us, a little toward the cube). */
export const LULU_DESK = new THREE.Vector3(9.5, 0, 0);
/** Where she stops at his cube with the tea: in the opening, on his right, turned to him. */
export const LULU_AT_CUBE = new THREE.Vector3(2.4, 0, 1.4);
/** Where she comes from: the aisle, off to the right. */
export const LULU_AISLE = new THREE.Vector3(8.5, 0, 2.2);

/** A cube: three fabric walls with aluminium caps, open toward +z. Origin in the middle of the floor. */
function cube(fabric: THREE.Material, cap: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const { w, back, front, height } = CUBE;
  const panel = (len: number, x: number, z: number, along: 'x' | 'z') => {
    const p = box(along === 'x' ? len : 0.14, height, along === 'x' ? 0.14 : len, fabric);
    p.position.set(x, 0, z);
    const top = box(along === 'x' ? len + 0.06 : 0.2, 0.08, along === 'x' ? 0.2 : len + 0.06, cap);
    top.position.set(x, height, z);
    g.add(p, top);
  };
  panel(w * 2, 0, back, 'x');
  for (const s of [-1, 1]) panel(front - back, s * w, (front + back) / 2, 'z');
  // the desk along the back wall, standing height for a long-neck
  const top = box(w * 2 - 0.4, 0.1, 1.1, mat(0xf2ede4, 0.55));
  top.position.set(0, 1.3, back + 0.7);
  g.add(top);
  for (const x of [-w + 0.5, w - 0.5]) {
    const leg = box(0.1, 1.3, 0.9, mat(0x2a2a35, 0.5));
    leg.position.set(x, 0, back + 0.7);
    g.add(leg);
  }
  return g;
}

/** A standing desk, `w` wide, `d` deep and `height` tall: a top on two legs. Origin on the floor under its middle. */
function standingDesk(w: number, d: number, height = DESK_TOP): THREE.Group {
  const g = new THREE.Group();
  const top = box(w, 0.12, d, mat(0xf2ede4, 0.55));
  top.position.y = height - 0.06;
  g.add(top);
  for (const x of [-1, 1]) {
    const leg = box(0.1, height - 0.06, d - 0.2, mat(0x2a2a35, 0.5));
    leg.position.x = x * (w / 2 - 0.2);
    g.add(leg);
  }
  return g;
}

/** What's on his MacBook: the infra, still pending. */
const TERMINAL: readonly ShownLine[] = [
  { text: '$ infra status --env validations', kind: 'prompt' },
  { text: 'cluster: not provisioned ⏳', kind: 'err' },
  { text: 'ticket INFRA-101: approved ✅', kind: 'ok' },
  { text: 'next: open INFRA-102, INFRA-103', kind: 'dim' },
];

/** A mug of tea: a mug, a handle, the tea, and the tea bag's string and tag hanging over the rim. Origin at its base. */
export function createMug(colour: number): THREE.Group {
  const g = new THREE.Group();
  const china = mat(colour, 0.35);
  g.add(cylinder(0.17, 0.15, 0.36, china, 24));
  const tea = cylinder(0.155, 0.155, 0.01, mat(0xb5651d, 0.3), 24);
  tea.position.y = 0.32;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 8, 16), china);
  handle.position.set(0.19, 0.19, 0);
  const string = cylinder(0.006, 0.006, 0.26, mat(0xf4f1ea, 0.8), 4);
  string.position.set(-0.15, 0.12, 0.05);
  const tag = box(0.09, 0.11, 0.01, mat(0xffd36b, 0.7));
  tag.position.set(-0.18, 0.04, 0.06);
  g.add(tea, handle, string, tag);
  return g;
}

/** A plant in a pot, by the window. */
function plant(): THREE.Group {
  const g = new THREE.Group();
  g.add(cylinder(0.45, 0.35, 0.8, mat(0xe07a5f, 0.8)));
  const leaf = mat(0x5aa469, 0.7);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    g.add(ball(0.42, leaf, [Math.cos(a) * 0.35, 1.3 + (i % 3) * 0.35, Math.sin(a) * 0.35], [0.6, 1.2, 0.6], 16));
  }
  return g;
}

export function createOffice(paintQueue: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9eef3);
  createRoom(scene, { wall: 0xe9eef3, floor: 0x7d879a, width: 34, depth: 18, back: -7 });
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8bcc8, 1.2));
  addKeyLight(scene, 0xfff1dc, 2.0, { from: [6, 12, 9], reach: 16, top: 9 });

  // the window strip: a bright morning city
  const view = picture(
    20,
    3,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#8cc8ff');
      g.addColorStop(1, '#e8f4ff');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (let x = 0, i = 0; x < w; i++) {
        const bw = 26 + ((i * 37) % 40);
        const bh = h * (0.3 + ((i * 53) % 40) / 100);
        ctx.fillStyle = i % 2 ? '#a9bcd2' : '#bccbdd';
        ctx.fillRect(x, h - bh, bw, bh);
        x += bw + 6;
      }
      paintWindowFrame(ctx, w, h);
    },
    { px: 1024, frame: 0xf4f4f4 },
  );
  view.position.set(0, 6.0, -6.95);
  scene.add(view);

  // the whiteboard: the deadline, circled
  const board = picture(
    3.6,
    2.2,
    (ctx, w, h) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1b2233';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${h * 0.14}px ${ROUND}`;
      ctx.fillText('VALIDATIONS', w / 2, h * 0.3);
      ctx.fillStyle = '#e5383b';
      ctx.font = `700 ${h * 0.2}px ${ROUND}`;
      ctx.fillText('FRIDAY!!', w / 2, h * 0.6);
      ctx.strokeStyle = '#e5383b';
      ctx.lineWidth = h * 0.025;
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.6, w * 0.32, h * 0.18, -0.05, 0, Math.PI * 2);
      ctx.stroke();
    },
    { frame: 0xc0c4cc },
  );
  board.position.set(-9, 3.4, -6.9);
  scene.add(board);
  const clock = createWallClock(0.6);
  clock.group.position.set(6.5, 7.6, -6.9);
  scene.add(clock.group);
  for (const x of [-15, 15]) {
    const p = plant();
    p.position.set(x * 0.95, 0, -5.8);
    scene.add(p);
  }

  // the cubes: his in the middle, neighbours either side and a row behind
  const fabric = mat(0x8693aa, 0.95);
  const cap = mat(0xc9ced6, 0.3, { metalness: 0.6 });
  for (const [x, z] of [
    [0, 0],
    [-7, 0],
    [-7, -4.5],
    [0, -4.5],
    [7, -4.5],
  ] as const) {
    const c = cube(fabric, cap);
    c.position.set(x, 0, z);
    scene.add(c);
  }
  // his monitor, on the left wall of his cube, facing in
  const monitor = livePanel(MONITOR.w, MONITOR.h, MONITOR.px, paintQueue);
  monitor.mesh.position.copy(MONITOR.at);
  monitor.mesh.rotation.y = Math.PI / 2;
  const bezel = box(MONITOR.w + 0.1, MONITOR.h + 0.1, 0.06, mat(0x1b1b24, 0.4));
  bezel.position.set(0, -(MONITOR.h + 0.1) / 2, -0.04);
  monitor.mesh.add(bezel);
  scene.add(monitor.mesh);
  const glow = new THREE.PointLight(0xbcd2ff, 2, 4, 2);
  glow.position.copy(MONITOR.at).add(new THREE.Vector3(1, 0, 0));
  scene.add(glow);

  // his standing desk, and his MacBook (the dark one, as in the war room) facing him, a terminal on it
  const hisDesk = standingDesk(2.4, 1.0, HIS_DESK_TOP);
  hisDesk.position.copy(HIS_DESK);
  const macbook = createLaptop({ header: 'infra', theme: 'terminal', color: 0x2a2a35 });
  macbook.group.position.set(-0.3, HIS_DESK_TOP, 0);
  macbook.group.rotation.y = Math.PI - 0.25; // turned a little, so the lid isn't square-on to us
  macbook.group.scale.setScalar(MACBOOK_SCALE);
  // stickers on the back of the lid (it's his)
  for (const [x, z, r, colour] of [
    [0.35, 0.35, 0.16, 0x4fb6a8],
    [-0.3, 0.6, 0.12, 0xffd36b],
    [0.1, 0.75, 0.09, 0xff6f91],
  ] as const) {
    const sticker = new THREE.Mesh(new THREE.CircleGeometry(r, 24).rotateX(-Math.PI / 2), mat(colour, 0.6));
    sticker.position.set(x, 0.056, z);
    macbook.lid.add(sticker);
  }
  macbook.screen.show(TERMINAL, true);
  hisDesk.add(macbook.group);
  scene.add(hisDesk);

  // Lulu's standing desk: her laptop
  const desk = standingDesk(3.2, 1.3);
  const laptop = box(1.0, 0.05, 0.7, mat(0xc0c4cc, 0.3, { metalness: 0.6 }));
  laptop.position.set(-0.4, DESK_TOP + 0.06, 0);
  const lid = box(1.0, 0.7, 0.04, mat(0xc0c4cc, 0.3, { metalness: 0.6 }));
  lid.position.set(-0.4, DESK_TOP + 0.09, -0.35);
  lid.rotation.x = -0.25;
  desk.add(laptop, lid);
  desk.position.set(LULU_DESK.x, 0, LULU_DESK.z + 1.6);
  scene.add(desk);

  return { scene, monitor: monitor.mesh, repaintMonitor: monitor.repaint };
}

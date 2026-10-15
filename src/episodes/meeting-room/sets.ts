import * as THREE from 'three';
import {
  addKeyLight,
  box,
  createRoom,
  createWallClock,
  cylinder,
  livePanel,
  mat,
  paintMorningSky,
  paintWindowFrame,
  picture,
  ROUND,
} from '../../world/interior';
import { ball } from '../../characters/materials';
import { createLaptop } from '../../props/laptop';
import { createPlant } from '../../props/furniture';
import { CHANNELS } from './timeline';

// The meeting room at Papo Pako Shapeworks: a long table, the big screen on the back wall (the chat on the left,
// the video call on the right), office chairs, a door on the left wall. And Dchozaurus's home office, which the
// call shows: a desk, a bookshelf, a plant, his chair, and (soon) a bug on the floor.

/** The big screen on the back wall: where it hangs, and its two halves (his design; the call, 4:3). */
export const SCREEN = { y: 4.7, z: -5.92 } as const;
const DESIGN = { x: -1.55, w: 4.1, h: 2.7 } as const;
/** Igarzarus's phone: its screen's size (portrait) and resolution. */
export const PHONE = { w: 0.9, h: 1.9, px: 540 } as const;
export const CALL = { x: 2.15, w: 3.0, h: 2.25 } as const;
/** The table (along z), its top's height. */
const TABLE = { from: -4.0, to: 2.2, width: 3.2, top: 1.25 } as const;
/** An office chair's seat top. */
export const CHAIR_TOP = 1.0;
/** Who sits where (and which way they face, radians about y; 0 faces +z, toward us). */
export const SEATS = {
  Statitezarus: { at: new THREE.Vector3(0, 0, -4.9), yaw: 0 }, // at the head of the table, under the screen
  Igarzarus: { at: new THREE.Vector3(2.7, 0, -0.9), yaw: -0.95 },
  Lulu: { at: new THREE.Vector3(-3.0, 0, 0.6), yaw: 0.95 },
} as const;
/** The door on the left wall (its hinge), and where Ogozaurus walks in from and stops. */
const DOOR = { hinge: new THREE.Vector3(-8.95, 0, -0.2), width: 2.4 } as const;
export const OGO_FROM = new THREE.Vector3(-11, 0, 1.0);
export const OGO_STOP = new THREE.Vector3(-6.3, 0, 1.6);

/** An office chair: a seat, a back, the gas lift and a five-star base. Faces +z; origin on the floor. */
function officeChair(colour: number): THREE.Group {
  const g = new THREE.Group();
  const fabric = mat(colour, 0.85);
  const metal = mat(0x2a2a30, 0.4, { metalness: 0.6 });
  const seat = box(1.3, 0.22, 1.2, fabric);
  seat.position.y = CHAIR_TOP - 0.22;
  const back = box(1.2, 1.5, 0.18, fabric);
  back.position.set(0, CHAIR_TOP + 0.1, -0.6);
  back.rotation.x = -0.1;
  const lift = cylinder(0.07, 0.07, CHAIR_TOP - 0.3, metal, 10);
  lift.position.y = 0.1;
  g.add(seat, back, lift);
  for (let i = 0; i < 5; i++) {
    const leg = box(0.08, 0.06, 0.6, metal);
    leg.position.y = 0.08;
    leg.rotation.y = (i / 5) * Math.PI * 2;
    leg.translateZ(0.3);
    g.add(leg, ball(0.07, metal, [Math.sin((i / 5) * Math.PI * 2) * 0.6, 0.07, Math.cos((i / 5) * Math.PI * 2) * 0.6]));
  }
  return g;
}

const font = (size: number, weight = 700) => `${weight} ${size}px ${ROUND}`;

/** His design, shared on the big screen: the title and a little diagram (999 agents and an orchestrator). */
function paintDesign(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f7f8fb';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#1b2233';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = font(h * 0.08);
  ctx.fillText('🧩 Agent Orchestrator v3', w * 0.05, h * 0.11);
  ctx.fillStyle = '#6b7186';
  ctx.font = font(h * 0.045, 600);
  ctx.fillText('Design · Statitezarus · reviewers: Dchozaurus, Igarzarus', w * 0.05, h * 0.2);
  const node = (x: number, y: number, label: string, fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(w * x, h * y, w * 0.24, h * 0.14, h * 0.03);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = font(h * 0.05);
    ctx.fillText(label, w * (x + 0.12), h * (y + 0.07));
  };
  ctx.strokeStyle = '#9aa0ad';
  ctx.lineWidth = h * 0.01;
  for (const x of [0.17, 0.5, 0.83]) {
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.56);
    ctx.lineTo(w * x, h * 0.72);
    ctx.stroke();
  }
  node(0.38, 0.42, 'orchestrator', '#4b6bd6');
  node(0.05, 0.72, 'agent', '#5bbf8a');
  node(0.38, 0.72, 'agent', '#5bbf8a');
  node(0.71, 0.72, 'agent ×999', '#e5383b');
}

/** The messenger on Igarzarus's phone (dark mode): his chats, the newest on top, as it is when Statitezarus has
 * posted in `posts` channels. Each post: the same design, the same two tags, one more unread badge. */
export function paintChatList(ctx: CanvasRenderingContext2D, w: number, h: number, posts: number) {
  ctx.fillStyle = '#0b141a';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#1f2c34';
  ctx.fillRect(0, 0, w, h * 0.14);
  ctx.fillStyle = '#e9edef';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = font(w * 0.05, 600);
  ctx.fillText('9:41', w * 0.07, h * 0.03);
  ctx.font = font(w * 0.09);
  ctx.fillText('Chats', w * 0.06, h * 0.095);
  const row = h * 0.115;
  for (let i = 0; i < posts; i++) {
    const channel = CHANNELS[posts - 1 - i]!; // the newest post on top
    const y = h * 0.15 + i * row;
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.arc(w * 0.13, y + row / 2, w * 0.075, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b1b22';
    ctx.textAlign = 'center';
    ctx.font = font(w * 0.08);
    ctx.fillText('#', w * 0.13, y + row / 2);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e9edef';
    ctx.font = font(w * 0.058);
    ctx.fillText(`# ${channel}`, w * 0.26, y + row * 0.32);
    ctx.font = font(w * 0.045, 500);
    ctx.fillStyle = '#8696a0';
    ctx.fillText('Statitezarus: 🧩 New design', w * 0.26, y + row * 0.58);
    ctx.fillStyle = '#ffd36b';
    ctx.fillText('@Dchozaurus @Igarzarus 🙏', w * 0.26, y + row * 0.8);
    ctx.fillStyle = '#00a884'; // the unread badge
    ctx.beginPath();
    ctx.arc(w * 0.9, y + row * 0.55, w * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b141a';
    ctx.textAlign = 'center';
    ctx.font = font(w * 0.045);
    ctx.fillText('1', w * 0.9, y + row * 0.56);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#222d34';
    ctx.fillRect(w * 0.26, y + row - 1, w * 0.74, 2);
  }
}

/** A phone: a dark rounded body and its screen (a live panel, facing +z). Origin at the screen's centre. */
export function createChatPhone(paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const group = new THREE.Group();
  const body = box(PHONE.w + 0.08, PHONE.h + 0.08, 0.08, mat(0x2c2c30, 0.3, { metalness: 0.5 }));
  body.position.set(0, -(PHONE.h + 0.08) / 2, -0.05);
  const screen = livePanel(PHONE.w, PHONE.h, PHONE.px, paint);
  screen.mesh.position.z = 0.0;
  group.add(body, screen.mesh);
  return { group, repaint: screen.repaint };
}

/** The meeting room, with the big screen's two halves: his design and the call (`callMat`). */
export function createMeetingRoom() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9eef3);
  createRoom(scene, { wall: 0xe7ecf2, floor: 0x6f7a8e, width: 18, depth: 16, back: -6 });
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8bcc8, 1.15));
  addKeyLight(scene, 0xfff3e2, 2.0, { from: [5, 11, 9], reach: 10, top: 9 });

  // the big screen: one bezel, the chat on the left, the call on the right
  const bezel = box(DESIGN.w + CALL.w + 0.5, DESIGN.h + 0.3, 0.12, mat(0x15161c, 0.4));
  bezel.position.set((DESIGN.x + CALL.x) / 2 - 0.1, SCREEN.y - (DESIGN.h + 0.3) / 2, SCREEN.z - 0.06);
  const design = picture(DESIGN.w, DESIGN.h, paintDesign, { px: 900, frame: null, emissive: true });
  design.position.set(DESIGN.x, SCREEN.y, SCREEN.z);
  const callMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const call = new THREE.Mesh(new THREE.PlaneGeometry(CALL.w, CALL.h), callMat);
  call.position.set(CALL.x, SCREEN.y, SCREEN.z + 0.02);
  const nameTag = picture(
    1.3,
    0.26,
    (ctx, w, h) => {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${h * 0.55}px ${ROUND}`;
      ctx.textBaseline = 'middle';
      ctx.fillText('Dchozaurus 🎧', w * 0.06, h * 0.55);
    },
    { frame: null, emissive: true },
  );
  nameTag.position.set(CALL.x - CALL.w / 2 + 0.7, SCREEN.y - CALL.h / 2 + 0.2, SCREEN.z + 0.03);
  scene.add(bezel, design, call, nameTag);

  // the table, and the chairs round it
  const table = box(TABLE.width, 0.12, TABLE.to - TABLE.from, mat(0xe9e2d6, 0.5));
  table.position.set(0, TABLE.top - 0.12, (TABLE.from + TABLE.to) / 2);
  scene.add(table);
  for (const z of [TABLE.from + 0.8, TABLE.to - 0.8]) {
    const leg = box(TABLE.width - 0.6, TABLE.top - 0.12, 0.2, mat(0x2a2a35, 0.5));
    leg.position.set(0, 0, z);
    scene.add(leg);
  }
  for (const [who, colour] of [
    ['Statitezarus', 0x3a4256],
    ['Igarzarus', 0x3a4256],
  ] as const) {
    const chair = officeChair(colour);
    chair.position.copy(SEATS[who].at);
    chair.rotation.y = SEATS[who].yaw;
    scene.add(chair);
  }
  // Lulu needs a bigger chair
  const lulusChair = officeChair(0x5a4a7a);
  lulusChair.scale.set(1.5, 1, 1.5);
  lulusChair.position.copy(SEATS.Lulu.at);
  lulusChair.rotation.y = SEATS.Lulu.yaw;
  scene.add(lulusChair);
  // Statitezarus's laptop, on the table in front of him, facing him
  const laptop = createLaptop({ header: 'design.md', theme: 'document', color: 0xc0c4cc });
  laptop.group.position.set(0, TABLE.top, -3.75);
  laptop.group.scale.setScalar(0.8);
  laptop.group.rotation.y = Math.PI;
  scene.add(laptop.group);

  // the window, the clock, a plant
  const view = picture(
    5,
    2.6,
    (ctx, w, h) => {
      paintMorningSky(ctx, w, h);
      paintWindowFrame(ctx, w, h);
    },
    { frame: 0xf4f4f4 },
  );
  view.position.set(8.95, 4.4, -1.5);
  view.rotation.y = -Math.PI / 2;
  const clock = createWallClock(0.55);
  clock.group.position.set(5.6, 7.0, -5.9);
  const plant = createPlant();
  plant.position.set(7.4, 0, -4.8);
  scene.add(view, clock.group, plant);

  // the door: a frame on the left wall, and the door itself (hinged at its back edge, swings into the room)
  const frame = box(0.2, 4.0, DOOR.width + 0.3, mat(0xf4f4f4, 0.6));
  frame.position.set(DOOR.hinge.x, 0, DOOR.hinge.z + DOOR.width / 2);
  const opening = box(0.22, 3.8, DOOR.width, mat(0x3a3f4a, 0.9)); // the corridor beyond, dark
  opening.position.set(DOOR.hinge.x - 0.02, 0, DOOR.hinge.z + DOOR.width / 2);
  const door = new THREE.Group();
  door.position.copy(DOOR.hinge);
  const leaf = box(0.1, 3.8, DOOR.width, mat(0x8a5a3a, 0.6));
  leaf.position.set(0.12, 0, DOOR.width / 2);
  door.add(leaf, ball(0.08, mat(0xd9d9d9, 0.3, { metalness: 0.8 }), [0.22, 1.8, DOOR.width - 0.25]));
  scene.add(frame, opening, door);

  return { scene, callMat, call, door };
}

/** The bug on his floor: a little beetle, red with black spots, legs ticking. Origin on the floor, facing +x. */
function createBug() {
  const g = new THREE.Group();
  const shell = mat(0xd63a2f, 0.35);
  const black = mat(0x15151a, 0.5);
  g.add(ball(0.22, shell, [0, 0.16, 0], [1.2, 0.7, 1]));
  g.add(ball(0.1, black, [0.24, 0.13, 0], [0.8, 0.8, 0.9])); // head
  for (const [x, z] of [
    [-0.08, 0.1],
    [0.06, -0.1],
    [-0.12, -0.08],
  ] as const)
    g.add(ball(0.05, black, [x, 0.3, z], [1, 0.4, 1]));
  const legs: THREE.Mesh[] = [];
  for (const s of [-1, 1])
    for (const x of [-0.12, 0, 0.12]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 4), black);
      leg.position.set(x, 0.08, s * 0.2);
      leg.rotation.x = s * 1.1;
      g.add(leg);
      legs.push(leg);
    }
  return { group: g, legs };
}

/** Where Dchozaurus sits at home (his chair, facing his webcam at +z), and the bug's patch of floor. */
export const HOME_CHAIR = new THREE.Vector3(0, 0, 0);
export const BUG_PATH = { from: -1.4, to: 1.6, z: 1.3 } as const;

/** His home office, as his webcam sees it: a plain white room, nothing in it but his chair (and, soon, a bug). */
export function createHomeOffice() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf6f6f4);
  createRoom(scene, { wall: 0xf6f6f4, floor: 0xe6e3dd, width: 12, depth: 10, back: -2.5 });
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d4cc, 1.3));
  addKeyLight(scene, 0xfffaf2, 1.6, { from: [-4, 8, 6], reach: 6, top: 7 });
  const chair = officeChair(0x2a2f3a);
  chair.position.copy(HOME_CHAIR);
  scene.add(chair);
  const bug = createBug();
  scene.add(bug.group);
  return { scene, bug };
}

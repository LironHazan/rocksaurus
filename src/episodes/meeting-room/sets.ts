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
import { createLaptop, laptopWith, LAPTOP_SCREEN } from '../../props/laptop';
import { createPlant } from '../../props/furniture';
import { CHANNELS } from './timeline';

// The meeting room at Papo Pako Shapeworks: a long table, the big screen on the back wall (the chat on the left,
// the video call on the right), office chairs, a door on the left wall. And Dchozaurus's home office, which the
// call shows: a desk, a bookshelf, a plant, his chair, and (soon) a bug on the floor.

/** The big screen on the back wall: where it hangs, and its two halves (his design; the call, 4:3). */
export const SCREEN = { y: 4.7, z: -5.92 } as const;
const DESIGN = { x: -1.55, w: 4.1, h: 2.7 } as const;
/** The resolution "Hack" is painted at (texels across). */
const HACK_PX = 900;
/** Igarzarus's and Lulu's laptops on the table, each turned to its owner (radians about y). */
const LAPTOPS = {
  Igarzarus: { at: new THREE.Vector3(1.05, 0, -0.85), yaw: 1.6 },
  Lulu: { at: new THREE.Vector3(-1.05, 0, 0.6), yaw: -Math.PI / 2 },
} as const;
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
const DOOR = { hinge: new THREE.Vector3(-8.95, 0, -0.4), width: 3.0, height: 5.0 } as const; // sized for a T-Rex
/** The meeting room's size (createRoom's), and the corridor behind its door. */
const ROOM = { width: 18, depth: 16, height: 9, back: -6 } as const;
const CORRIDOR = { length: 6 } as const;
export const OGO_FROM = new THREE.Vector3(-12.5, 0, 1.1);
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

/** "Hack", the team chat on Igarzarus's laptop (purple sidebar, our own app): his channels, and the one
 * Statitezarus just posted in, as it is when he has posted in `posts` channels. Each post: the same design, the
 * same two tags, one more unread channel. */
export function paintHack(ctx: CanvasRenderingContext2D, w: number, h: number, posts: number) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  // the sidebar: the workspace, then the channels
  const side = w * 0.32;
  ctx.fillStyle = '#4a154b';
  ctx.fillRect(0, 0, side, h);
  ctx.fillStyle = '#ffffff';
  ctx.font = font(h * 0.075);
  ctx.fillText('Hack ▾', side * 0.1, h * 0.09);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(0, h * 0.16, side, 2);
  const current = Math.max(0, posts - 1);
  CHANNELS.forEach((c, i) => {
    const y = h * (0.25 + i * 0.1);
    const unread = i < posts;
    if (unread && i === current) {
      ctx.fillStyle = '#1164a3';
      ctx.fillRect(0, y - h * 0.045, side, h * 0.09);
    }
    ctx.fillStyle = unread ? '#ffffff' : '#c9b8cc';
    ctx.font = font(h * 0.052, unread ? 800 : 500);
    ctx.fillText(`# ${c}`, side * 0.1, y);
    if (unread) {
      ctx.fillStyle = '#e01e5a';
      ctx.beginPath();
      ctx.roundRect(side * 0.8, y - h * 0.03, side * 0.13, h * 0.06, h * 0.03);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = font(h * 0.04);
      ctx.fillText('1', side * 0.845, y);
    }
  });
  // the channel: its name, and his post
  const x = side + w * 0.03;
  ctx.fillStyle = '#1d1c1d';
  ctx.font = font(h * 0.07);
  ctx.fillText(`# ${CHANNELS[current]}`, x, h * 0.09);
  ctx.fillStyle = '#e1e1e1';
  ctx.fillRect(side, h * 0.16, w - side, 2);
  if (posts === 0) {
    ctx.fillStyle = '#616061';
    ctx.font = font(h * 0.05, 500);
    ctx.fillText('Statitezarus is typing…', x, h * 0.9);
    return;
  }
  ctx.fillStyle = '#a8d46a'; // his avatar
  ctx.beginPath();
  ctx.roundRect(x, h * 0.22, h * 0.11, h * 0.11, h * 0.02);
  ctx.fill();
  ctx.fillStyle = '#1d1c1d';
  ctx.font = font(h * 0.055);
  ctx.fillText('Statitezarus', x + h * 0.14, h * 0.25);
  ctx.fillStyle = '#616061';
  ctx.font = font(h * 0.04, 500);
  ctx.fillText('9:41 AM', x + h * 0.14 + ctx.measureText('Statitezarus  ').width * 1.4, h * 0.25);
  ctx.fillStyle = '#1d1c1d';
  ctx.font = font(h * 0.05, 500);
  ctx.fillText('🧩 New design: Agent Orchestrator v3', x + h * 0.14, h * 0.34);
  ctx.fillText('Please review 🙏', x + h * 0.14, h * 0.43);
  // the mentions, highlighted
  ctx.font = font(h * 0.05, 700);
  let tx = x + h * 0.14;
  for (const tag of ['@Dchozaurus', '@Igarzarus']) {
    const tw = ctx.measureText(tag).width;
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(tx - 4, h * 0.48, tw + 8, h * 0.08);
    ctx.fillStyle = '#1264a3';
    ctx.fillText(tag, tx, h * 0.52);
    tx += tw + 18;
  }
  // the message box at the bottom
  ctx.strokeStyle = '#bbbbbb';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, h * 0.82, w - side - w * 0.06, h * 0.12);
  ctx.fillStyle = '#868686';
  ctx.font = font(h * 0.045, 500);
  ctx.fillText(`Message #${CHANNELS[current]}`, x + w * 0.02, h * 0.88);
}

/** The meeting room: the big screen (his design, and the call: `callMat`), the table with the laptops (Igarzarus's
 * shows "Hack", painted by `paintChat`: `hack`), the chairs, the door. */
export function createMeetingRoom(paintChat: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9eef3);
  createRoom(scene, { wall: 0xe7ecf2, floor: 0x6f7a8e, ...ROOM });
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
  // Igarzarus's laptop, with "Hack" open; Lulu's
  const hackPanel = livePanel(LAPTOP_SCREEN.w, LAPTOP_SCREEN.h, HACK_PX, paintChat);
  const hack = laptopWith(hackPanel.mesh, 0xc0c4cc);
  const lulus = createLaptop({ header: 'drums.md', theme: 'document', color: 0x9a7fc9 });
  for (const [l, who] of [
    [hack, 'Igarzarus'],
    [lulus, 'Lulu'],
  ] as const) {
    l.group.position.set(LAPTOPS[who].at.x, TABLE.top, LAPTOPS[who].at.z);
    l.group.rotation.y = LAPTOPS[who].yaw;
    scene.add(l.group);
  }

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

  // the door: a doorway cut in the left wall (the room's own wall comes out; ours goes round the opening), a frame,
  // the door itself (hinged at its back edge, swinging into the room), and a dim corridor beyond
  const leftWall = scene.children.find(o => o instanceof THREE.Mesh && o.position.x === -ROOM.width / 2);
  if (leftWall) scene.remove(leftWall);
  const wallMat = mat(0xe7ecf2, 0.95);
  const { hinge, width: doorWidth, height: doorHeight } = DOOR;
  const doorEnd = hinge.z + doorWidth;
  const wallPiece = (z0: number, z1: number, y0: number, y1: number) => {
    const piece = box(0.12, y1 - y0, z1 - z0, wallMat);
    piece.position.set(hinge.x - 0.06, y0, (z0 + z1) / 2);
    scene.add(piece);
  };
  wallPiece(ROOM.back, hinge.z, 0, ROOM.height); // behind the doorway
  wallPiece(doorEnd, ROOM.back + ROOM.depth, 0, ROOM.height); // in front of it
  wallPiece(hinge.z, doorEnd, doorHeight, ROOM.height); // over it
  const trim = mat(0xf4f4f4, 0.6);
  for (const z of [hinge.z - 0.1, doorEnd + 0.1]) {
    const jamb = box(0.22, doorHeight, 0.2, trim);
    jamb.position.set(hinge.x, 0, z);
    scene.add(jamb);
  }
  const header = box(0.22, 0.2, doorWidth + 0.4, trim);
  header.position.set(hinge.x, doorHeight, hinge.z + doorWidth / 2);
  scene.add(header);
  const door = new THREE.Group();
  door.position.copy(hinge);
  const leaf = box(0.1, doorHeight, doorWidth, mat(0x8a5a3a, 0.6));
  leaf.position.set(0.12, 0, doorWidth / 2);
  door.add(leaf, ball(0.08, mat(0xd9d9d9, 0.3, { metalness: 0.8 }), [0.22, 1.8, doorWidth - 0.25]));
  scene.add(door);
  // the corridor: its floor, its far wall, its sides
  const corridorFloor = box(CORRIDOR.length, 0.02, doorWidth + 3, mat(0x4a5162, 0.9));
  corridorFloor.position.set(hinge.x - CORRIDOR.length / 2, 0, hinge.z + doorWidth / 2);
  const corridorWall = mat(0xb9c0cc, 0.95);
  const far = box(0.12, ROOM.height, doorWidth + 3, corridorWall);
  far.position.set(hinge.x - CORRIDOR.length, 0, hinge.z + doorWidth / 2);
  scene.add(corridorFloor, far);
  for (const z of [hinge.z - 1.5, doorEnd + 1.5]) {
    const side = box(CORRIDOR.length, ROOM.height, 0.12, corridorWall);
    side.position.set(hinge.x - CORRIDOR.length / 2, 0, z);
    scene.add(side);
  }

  return { scene, callMat, call, door, hack: { ...hack, screen: hackPanel.mesh, repaint: hackPanel.repaint } };
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

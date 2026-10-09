import * as THREE from 'three';
import { box, createRoom, createWallClock, cylinder, mat, picture, ROUND } from '../../world/interior';
import { textTexture } from '../../world/text-texture';
import type { Flavour } from './timeline';

/** The fridge: its middle (x), its back against the wall, and its size. */
export const FRIDGE = { x: -3.2, back: -4, w: 2.6, h: 4.8, d: 1.8 } as const;
const FRONT = FRIDGE.back + FRIDGE.d;
/** The shelf the three yogurts are on, and where each one stands (left to right: vegan, peach, caramel). */
const SHELF_Y = 2.6;
export const CUP_AT: Record<Flavour, THREE.Vector3> = {
  vegan: new THREE.Vector3(FRIDGE.x - 0.65, SHELF_Y, FRONT - 0.3),
  peach: new THREE.Vector3(FRIDGE.x, SHELF_Y, FRONT - 0.3),
  caramel: new THREE.Vector3(FRIDGE.x + 0.65, SHELF_Y, FRONT - 0.3),
};
/** How far the door swings open (radians), toward the left and the camera. */
export const DOOR_OPEN = 1.9;
/** The bin next to the fridge, where the peach ends up (never on Mirta's floor): its middle at the rim height. */
export const BIN = new THREE.Vector3(-0.4, 1.3, -1.0);
const BIN_RADIUS = 0.6;

const LABELS: Record<Flavour, { colour: string; lines: readonly string[] }> = {
  vegan: { colour: '#5aa469', lines: ['VEGAN', 'PROTEIN 🌱'] },
  peach: { colour: '#ff9a5a', lines: ['PEACH', '🍑'] },
  caramel: { colour: '#a8652f', lines: ['CARAMEL', '🍮'] },
};
/** A yogurt cup for a dinosaur's paw: base to lid. */
export const CUP_HEIGHT = 0.36;
const CUP_TOP = 0.17;
const CUP_BOTTOM = 0.14;

export interface Yogurt {
  group: THREE.Group;
  /** The foil lid, hinged at its back edge: `rotation.x` negative peels it up. */
  lid: THREE.Group;
}

/** A yogurt cup: a tapered tub with the flavour on its label and a foil lid. Origin at its base. */
export function createYogurt(flavour: Flavour): Yogurt {
  const { colour, lines } = LABELS[flavour];
  const group = new THREE.Group();
  group.add(cylinder(CUP_TOP, CUP_BOTTOM, CUP_HEIGHT, mat(0xfbfaf6, 0.5)));
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(CUP_TOP + 0.004, CUP_BOTTOM + 0.004, CUP_HEIGHT * 0.7, 32, 1, true, -1.3, 2.6),
    new THREE.MeshStandardMaterial({
      roughness: 0.6,
      map: textTexture(
        512,
        256,
        (ctx, w, h) => {
          ctx.fillStyle = colour;
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `700 ${h * 0.24}px ${ROUND}`;
          lines.forEach((l, i) => ctx.fillText(l, w / 2, h * (0.32 + i * 0.36)));
        },
        ['700 40px Fredoka'],
      ),
    }),
  );
  label.position.y = CUP_HEIGHT * 0.45;
  group.add(label);
  const lid = new THREE.Group();
  lid.position.set(0, CUP_HEIGHT, -CUP_TOP);
  const foil = new THREE.Mesh(
    new THREE.CylinderGeometry(CUP_TOP + 0.02, CUP_TOP + 0.02, 0.02, 32),
    new THREE.MeshStandardMaterial({ color: colour, roughness: 0.3, metalness: 0.6 }),
  );
  foil.position.z = CUP_TOP;
  lid.add(foil);
  group.add(lid);
  group.traverse(o => (o.castShadow = true));
  return { group, lid };
}

/** A teaspoon, sized up for a dinosaur. Origin at the end of the handle; the bowl is at +y. */
export function createSpoon(): THREE.Group {
  const g = new THREE.Group();
  const steel = mat(0xd8dce4, 0.25, { metalness: 0.9 });
  const handle = cylinder(0.025, 0.03, 0.5, steel, 8);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 8), steel);
  bowl.scale.set(1, 1.4, 0.4);
  bowl.position.y = 0.56;
  g.add(handle, bowl);
  return g;
}

/** Mirta's mop: a long handle with a shaggy head, and her yellow bucket. Origin at the mop head, on the floor. */
export function createMop() {
  const mop = new THREE.Group();
  const handle = cylinder(0.05, 0.05, 3.4, mat(0x3a7bd5, 0.4), 10);
  handle.position.y = 0.15;
  mop.add(handle);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 10), mat(0xf2efe6, 1));
  head.scale.set(1.2, 0.4, 0.8);
  head.position.y = 0.15;
  mop.add(head);
  mop.traverse(o => (o.castShadow = true));
  const bucket = new THREE.Group();
  bucket.add(cylinder(0.55, 0.45, 0.8, mat(0xffd23f, 0.5)));
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), mat(0x9fc9e8, 0.1));
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.7;
  bucket.add(water);
  return { mop, bucket };
}

/** The protein battery card's size in the world (2:1, like its canvas). */
const BATTERY_CARD = { w: 1.8, h: 0.9 } as const;

/**
 * The protein battery over Lulu's head: a dark card, PROTEIN on top, a battery outline with a red sliver of charge,
 * and 5% in red. A sprite, so it always faces the camera; not tone-mapped, so the colours stay as drawn.
 */
export function createBattery(): THREE.Sprite {
  const map = textTexture(
    512,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#1b1530';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#ff6fa8'; // a pink frame
      ctx.lineWidth = h * 0.05;
      ctx.strokeRect(h * 0.025, h * 0.025, w - h * 0.05, h * 0.95);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${h * 0.2}px ${ROUND}`;
      ctx.fillText('PROTEIN', w * 0.5, h * 0.22);
      // the battery: outline, terminal nub, and what's left of the charge
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = h * 0.045;
      ctx.strokeRect(w * 0.1, h * 0.42, w * 0.52, h * 0.42);
      ctx.fillRect(w * 0.62, h * 0.54, w * 0.035, h * 0.18);
      ctx.fillStyle = '#ff3b3b';
      ctx.fillRect(w * 0.125, h * 0.47, w * 0.05, h * 0.32);
      ctx.font = `700 ${h * 0.26}px ${ROUND}`;
      ctx.fillText('5%', w * 0.81, h * 0.64);
    },
    ['700 40px Fredoka'],
  );
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, toneMapped: false }));
  sprite.scale.set(BATTERY_CARD.w, BATTERY_CARD.h, 1);
  return sprite;
}

/** The thought bubble's size in the world (its canvas is 4:3). */
const BUBBLE = { w: 2.4, h: 1.8 } as const;

/**
 * A robot head with devil horns and a smirk (or laughing), centred on (x, y), `r` wide: the coding agent, as Lulu
 * sees it by now.
 */
function drawDevilBot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, laughing: boolean) {
  ctx.fillStyle = '#d6332f'; // the horns
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + s * r * 0.55, y - r * 0.55);
    ctx.lineTo(x + s * r * 0.85, y - r * 1.15);
    ctx.lineTo(x + s * r * 0.25, y - r * 0.62);
    ctx.fill();
  }
  ctx.fillStyle = '#8a93a6'; // the head
  ctx.fillRect(x - r * 0.75, y - r * 0.62, r * 1.5, r * 1.24);
  ctx.fillStyle = '#2a2f3d'; // the screen face
  ctx.fillRect(x - r * 0.6, y - r * 0.45, r * 1.2, r * 0.9);
  ctx.fillStyle = '#ff3b3b'; // glowing eyes, slanted
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + s * r * 0.12, y - r * 0.12);
    ctx.lineTo(x + s * r * 0.45, y - r * 0.28);
    ctx.lineTo(x + s * r * 0.42, y - r * 0.02);
    ctx.fill();
  }
  if (laughing) {
    // mouth wide open, and the laugh itself
    ctx.beginPath();
    ctx.moveTo(x - r * 0.35, y + r * 0.1);
    ctx.quadraticCurveTo(x, y + r * 0.6, x + r * 0.35, y + r * 0.1);
    ctx.fill();
    ctx.font = `700 ${r * 0.42}px ${ROUND}`;
    ctx.textAlign = 'center';
    ctx.fillText('HA HA', x, y + r * 1.0);
  } else {
    ctx.strokeStyle = '#ff3b3b'; // the smirk
    ctx.lineWidth = r * 0.07;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.3, y + r * 0.18);
    ctx.quadraticCurveTo(x + r * 0.05, y + r * 0.38, x + r * 0.35, y + r * 0.1);
    ctx.stroke();
  }
  ctx.strokeStyle = '#8a93a6'; // the antenna
  ctx.beginPath();
  ctx.moveTo(x, y - r * 0.62);
  ctx.lineTo(x, y - r * 0.9);
  ctx.stroke();
  ctx.fillStyle = '#ff3b3b';
  ctx.beginPath();
  ctx.arc(x, y - r * 0.95, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

/** Every version she wrote this week, oldest first. */
export const SPEC_PAGES = ['SPEC v1', 'SPEC v3', 'PLAN v5', 'SPEC v9', 'PLAN v12'] as const;

/** The first `count` spec pages, piled up from (x, y): each new version lands on top, a little higher. */
function drawSpecs(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, count: number) {
  SPEC_PAGES.slice(0, count).forEach((label, i) => {
    ctx.save();
    ctx.translate(x + (i % 2 ? 1 : -1) * size * 0.06, y - i * size * 0.08);
    ctx.rotate((i % 2 ? 1 : -1) * 0.08 * (i + 1));
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#9aa0aa';
    ctx.lineWidth = size * 0.02;
    ctx.fillRect(-size * 0.35, -size * 0.45, size * 0.7, size * 0.9);
    ctx.strokeRect(-size * 0.35, -size * 0.45, size * 0.7, size * 0.9);
    ctx.fillStyle = '#c9ccd4';
    for (let line = 0; line < 4; line++)
      ctx.fillRect(-size * 0.25, -size * 0.05 + line * size * 0.1, size * 0.5, size * 0.03);
    ctx.fillStyle = '#1b1b22';
    ctx.font = `700 ${size * 0.13}px ${ROUND}`;
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, -size * 0.22);
    ctx.restore();
  });
}

export interface SpecsBubble {
  sprite: THREE.Sprite;
  /** How many spec pages are piled up, and whether the agent is laughing. Repaints only when that changes. */
  show(pages: number, laughing: boolean): void;
}

/**
 * What Lulu's thinking about after a week of it: a thought bubble with the pile of specs and plans she wrote, and the
 * coding agent as a little devil bot (red horns, red eyes, a smirk) who laughs at the end. A sprite, so it faces the
 * camera.
 */
export function createSpecsBubble(): SpecsBubble {
  let pages = 1;
  let laughing = false;
  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    // the cloud: overlapping puffs, and the little ones that lead down to her head
    for (const [x, y, r] of [
      [0.5, 0.42, 0.3],
      [0.27, 0.45, 0.22],
      [0.73, 0.45, 0.22],
      [0.38, 0.25, 0.2],
      [0.62, 0.25, 0.2],
      [0.5, 0.6, 0.2],
      [0.16, 0.86, 0.05],
      [0.24, 0.76, 0.07],
    ] as const) {
      ctx.beginPath();
      ctx.arc(x * w, y * h, r * h, 0, Math.PI * 2);
      ctx.fill();
    }
    drawSpecs(ctx, w * 0.33, h * 0.5, h * 0.34, pages);
    drawDevilBot(ctx, w * 0.67, h * 0.4, h * 0.2, laughing);
  };
  const map = textTexture(512, 384, draw, ['700 40px Fredoka']);
  const canvas = map.image;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, toneMapped: false, transparent: true }));
  sprite.scale.set(BUBBLE.w, BUBBLE.h, 1);
  return {
    sprite,
    show(nextPages, nextLaughing) {
      if (nextPages === pages && nextLaughing === laughing) return;
      pages = nextPages;
      laughing = nextLaughing;
      draw(canvas.getContext('2d')!, canvas.width, canvas.height);
      map.needsUpdate = true;
    },
  };
}

/** Drink colours for the cans and bottles: sodas, juices, sparkling water. */
const DRINKS = [0xe63946, 0x2a9d8f, 0xf4a261, 0x3a86ff, 0x8ac926, 0xff6fa8, 0xffd23f] as const;

/** A can: a short cylinder in a colour, a silver top. Origin at its base. */
function can(colour: number): THREE.Group {
  const g = new THREE.Group();
  g.add(cylinder(0.11, 0.11, 0.34, mat(colour, 0.35, { metalness: 0.5 }), 16));
  const top = cylinder(0.1, 0.11, 0.03, mat(0xd8dce4, 0.3, { metalness: 0.9 }), 16);
  top.position.y = 0.34;
  g.add(top);
  return g;
}

/** A bottle: a body, a neck, a cap. Origin at its base. */
function bottle(colour: number, height: number): THREE.Group {
  const g = new THREE.Group();
  const glass = mat(colour, 0.15, { transparent: true, opacity: 0.85 });
  g.add(cylinder(0.13, 0.13, height * 0.7, glass, 16));
  const neck = cylinder(0.05, 0.13, height * 0.25, glass, 16);
  neck.position.y = height * 0.7;
  const cap = cylinder(0.055, 0.055, height * 0.06, mat(0xffffff, 0.4), 12);
  cap.position.y = height * 0.95;
  g.add(neck, cap);
  return g;
}

/** A carton (milk, oat milk): a box with a gable top. Origin at its base. */
function carton(colour: number): THREE.Group {
  const g = new THREE.Group();
  g.add(box(0.3, 0.6, 0.3, mat(colour, 0.6)));
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.21, 0.15, 4, 1), mat(colour, 0.6));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 0.67;
  g.add(roof);
  return g;
}

/**
 * Everything else in the fridge (it's full; just not of anything Lulu wants): cans and bottles on the bottom two
 * shelves, cartons and kombucha on top, and more of the bad yogurts beside the three she judges. Nothing stands
 * behind those three: the camera films them from the back of the fridge.
 */
function stock(scene: THREE.Scene) {
  const { x, back } = FRIDGE;
  const place = (o: THREE.Object3D, dx: number, y: number, z: number) => {
    o.position.set(x + dx, y, z);
    scene.add(o);
  };
  // the bottom: tall bottles at the back, cans in front
  for (let i = 0; i < 6; i++) place(bottle(DRINKS[i % DRINKS.length]!, 0.95), -0.95 + i * 0.38, 0.3, back + 0.45);
  for (let i = 0; i < 7; i++) place(can(DRINKS[(i + 3) % DRINKS.length]!), -0.95 + i * 0.32, 0.3, FRONT - 0.35);
  // the next shelf: two rows of cans, and Rorit's lunch
  for (let i = 0; i < 6; i++) place(can(DRINKS[(i + 1) % DRINKS.length]!), -0.95 + i * 0.32, 1.4, FRONT - 0.3);
  for (let i = 0; i < 3; i++) place(can(DRINKS[(i + 5) % DRINKS.length]!), 0.15 + i * 0.32, 1.4, back + 0.5);
  const lunch = box(0.8, 0.4, 0.6, mat(0xffffff, 0.4, { transparent: true, opacity: 0.85 }));
  place(lunch, -0.6, 1.4, back + 0.6);
  const tag = picture(
    0.7,
    0.24,
    (ctx, cw, ch) => {
      ctx.fillStyle = '#fff59d';
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = '#1b1b22';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${ch * 0.5}px ${ROUND}`;
      ctx.fillText("RORIT'S. DON'T.", cw / 2, ch / 2);
    },
    { frame: null },
  );
  place(tag, -0.6, 1.6, back + 0.93);
  // the yogurt shelf: more of the same three, stacked at the sides
  for (const [dx, flavour] of [
    [-1.0, 'vegan'],
    [1.0, 'caramel'],
  ] as const)
    for (const level of [0, 1]) place(createYogurt(flavour).group, dx, SHELF_Y + level * CUP_HEIGHT, FRONT - 0.3);
  // the top: oat milk, milk, a row of kombucha
  place(carton(0xc9b48a), -0.85, 3.8, back + 0.6);
  place(carton(0x9ec9f0), -0.45, 3.8, back + 0.6);
  for (let i = 0; i < 4; i++) place(bottle(0xd98c3a, 0.75), 0.05 + i * 0.3, 3.8, FRONT - 0.4);
}

/**
 * The fridge: white, with a Papo Pako orange trim, a glass door (it's full, and you can see it), glass shelves, a
 * light that comes on when it opens. The door is hinged on its left edge.
 */
function createFridge(scene: THREE.Scene) {
  const body = mat(0xf7f6f2, 0.4);
  const inside = mat(0xffffff, 0.5);
  const trim = mat(0xff7a1a, 0.5);
  const { x, back, w, h, d } = FRIDGE;
  const wall = 0.12;
  const panels: [number, number, number, number, number, number, THREE.Material][] = [
    [w, h, wall, x, 0, back + wall / 2, inside], // back
    [wall, h, d, x - w / 2 + wall / 2, 0, back + d / 2, body], // sides
    [wall, h, d, x + w / 2 - wall / 2, 0, back + d / 2, body],
    [w, wall, d, x, h - wall, back + d / 2, body], // top
    [w, 0.3, d, x, 0, back + d / 2, trim], // the kick plate, in orange
  ];
  for (const [pw, ph, pd, px, py, pz, m] of panels) {
    const p = box(pw, ph, pd, m);
    p.position.set(px, py, pz);
    scene.add(p);
  }
  const header = box(w, 0.35, d, trim); // an orange band over the door
  header.position.set(x, h, back + d / 2);
  scene.add(header);
  for (const y of [1.4, SHELF_Y, 3.8]) {
    const shelf = box(w - wall * 2, 0.04, d - 0.2, mat(0xcfe6f5, 0.1, { transparent: true, opacity: 0.6 }));
    shelf.position.set(x, y - 0.04, back + d / 2 - 0.05);
    scene.add(shelf);
  }
  stock(scene);

  const light = new THREE.PointLight(0xfff4e0, 0, 6, 1.4);
  light.position.set(x, h - 0.6, back + 1.2);
  scene.add(light);

  // the door: a white frame round a glass pane; the handle, and a sticky note on the glass
  const door = new THREE.Group();
  door.position.set(x - w / 2, 0, FRONT);
  const rail = 0.16;
  for (const [fw, fh, fx, fy] of [
    [w, rail, w / 2, 0.3], // bottom
    [w, rail, w / 2, h - rail], // top
    [rail, h - 0.3, rail / 2, 0.3], // hinge side
    [rail, h - 0.3, w - rail / 2, 0.3], // handle side
  ] as const) {
    const part = box(fw, fh, 0.14, body);
    part.position.set(fx, fy, 0.07);
    door.add(part);
  }
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(w - rail * 2, h - 0.3 - rail),
    new THREE.MeshPhysicalMaterial({ color: 0xdff1ff, roughness: 0.05, transparent: true, opacity: 0.18 }),
  );
  glass.position.set(w / 2, 0.3 + (h - 0.3 - rail) / 2, 0.07);
  const handle = box(0.12, 1.6, 0.14, mat(0x8a8f99, 0.3, { metalness: 0.8 }));
  handle.position.set(w - 0.3, 2.0, 0.22);
  const note = picture(
    0.7,
    0.7,
    (ctx, cw, ch) => {
      ctx.fillStyle = '#ffd36b';
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = '#1b1b22';
      ctx.textAlign = 'center';
      ctx.font = `700 ${ch * 0.16}px ${ROUND}`;
      ctx.fillText('LABEL', cw / 2, ch * 0.3);
      ctx.fillText('YOUR FOOD', cw / 2, ch * 0.5);
      ctx.font = `${ch * 0.22}px ${ROUND}`;
      ctx.fillText('😡', cw / 2, ch * 0.78);
    },
    { frame: null },
  );
  note.position.set(0.55, h - 0.75, 0.08); // up in the corner, clear of the yogurt shelf
  note.rotation.z = 0.08;
  door.add(glass, handle, note);
  scene.add(door);
  return { door, light };
}

/**
 * The office kitchen at Papo Pako Shapeworks, 6 PM: warm walls with an orange stripe, the big fridge on the left, a
 * counter with the coffee machine and an empty fruit bowl, the wordmark poster, a wall clock, the bin, and a window
 * going orange.
 */
export function createKitchen() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfbf3ea);
  createRoom(scene, { wall: 0xfbf3ea, floor: 0xcfc9bf });
  scene.add(new THREE.HemisphereLight(0xfff6ea, 0x8a7a6a, 1.1));
  const key = new THREE.DirectionalLight(0xffe6cc, 1.9);
  key.position.set(4, 9, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 5;
  Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -2, near: 1, far: 30 });
  scene.add(key);

  const stripe = box(16, 0.35, 0.04, mat(0xff7a1a, 0.6));
  stripe.position.set(0, 2.6, -3.97);
  scene.add(stripe);

  const fridge = createFridge(scene);

  const counter = box(5.6, 1.9, 1.4, mat(0x4a5568, 0.6));
  counter.position.set(3.6, 0, -3.3);
  const top = box(5.7, 0.12, 1.5, mat(0xf4f1ea, 0.35));
  top.position.set(3.6, 1.9, -3.3);
  const machine = box(1.0, 1.3, 0.9, mat(0x1b1b22, 0.4));
  machine.position.set(2.0, 2.02, -3.4);
  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    mat(0xffffff, 0.4),
  );
  bowl.position.set(4.6, 2.5, -3.2);
  scene.add(counter, top, machine, bowl);

  const poster = picture(
    2.6,
    1.3,
    (ctx, cw, ch) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = '#ff7a1a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${ch * 0.32}px ${ROUND}`;
      ctx.fillText('papo pako', cw / 2, ch * 0.4);
      ctx.font = `600 ${ch * 0.12}px ${ROUND}`;
      ctx.fillText('S H A P E W O R K S', cw / 2, ch * 0.72);
    },
    { frame: 0xff7a1a },
  );
  poster.position.set(3.0, 5.4, -3.95);
  const view = picture(
    2.4,
    2.0,
    (ctx, cw, ch) => {
      const g = ctx.createLinearGradient(0, 0, 0, ch);
      g.addColorStop(0, '#5a6fb8');
      g.addColorStop(0.6, '#f29a6b');
      g.addColorStop(1, '#ffd08a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cw, ch);
    },
    { frame: 0xffffff, emissive: true },
  );
  view.position.set(6.4, 5.0, -3.95);
  const clock = createWallClock(0.55);
  clock.set(18, 0);
  clock.group.position.set(-0.4, 6.2, -3.92);
  scene.add(poster, view, clock.group);

  // the bin: open at the top, so you see the peach go in
  const metal = mat(0x6b7280, 0.5, { side: THREE.DoubleSide });
  const binWall = new THREE.Mesh(new THREE.CylinderGeometry(BIN_RADIUS, BIN_RADIUS * 0.85, BIN.y, 28, 1, true), metal);
  binWall.position.set(BIN.x, BIN.y / 2, BIN.z);
  const binFloor = new THREE.Mesh(new THREE.CircleGeometry(BIN_RADIUS * 0.85, 28), metal);
  binFloor.rotation.x = -Math.PI / 2;
  binFloor.position.set(BIN.x, 0.02, BIN.z);
  binWall.castShadow = true;
  scene.add(binWall, binFloor);

  return { scene, ...fridge };
}

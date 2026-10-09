import * as THREE from 'three';
import { ROUND } from '../world/interior';
import { textTexture } from '../world/text-texture';
import { reachArm, sideOf } from '../characters/reach';

/** One message in a group chat. */
export interface ChatLine {
  from: string;
  text: string;
  /** The clock time it was sent, e.g. '8:12'. */
  time: string;
}

export interface ChatView {
  lines: readonly ChatLine[];
  /** Someone else typing (shown under the group name). */
  typing: string | null;
  /** What the phone's owner is typing right now (shown in the message bar). */
  draft: string;
  /** A message just arrived (0..1): the screen is a touch brighter. */
  flash: number;
  /** The clock in the status bar. */
  clock: string;
}

export interface ChatStyle {
  title: string;
  subtitle: string;
  /** Name colour per member. */
  colours: Record<string, string>;
  owner: string;
}

// a messenger in dark mode: deep teal-grey chrome, a doodled wallpaper, green bubbles for your own messages
const C = {
  bar: '#1f2c34',
  wall: '#0b141a',
  doodle: 'rgba(255,255,255,0.045)',
  in: '#202c33',
  out: '#005c4b',
  text: '#e9edef',
  meta: '#8696a0',
  accent: '#00a884',
  tick: '#53bdeb',
  chip: '#182229',
};
const W = 540,
  H = 1170;
const FONT = (size: number, weight = 600) => `${weight} ${size}px ${ROUND}`;
/** The screen is laid out at W × H and painted at twice that, so text stays crisp when it fills the frame. */
const RES = 2;

let wallpaper: HTMLCanvasElement | null = null;
/** The doodle wallpaper, drawn once: little coffee cups, bones, stars and squiggles. */
function doodles(): HTMLCanvasElement {
  if (wallpaper) return wallpaper;
  wallpaper = document.createElement('canvas');
  wallpaper.width = 180;
  wallpaper.height = 180;
  const ctx = wallpaper.getContext('2d')!;
  ctx.strokeStyle = C.doodle;
  ctx.fillStyle = C.doodle;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  // a cup
  ctx.strokeRect(20, 30, 26, 24);
  ctx.beginPath();
  ctx.arc(50, 42, 7, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  // a bone
  ctx.beginPath();
  ctx.moveTo(100, 30);
  ctx.lineTo(140, 55);
  ctx.stroke();
  for (const [x, y] of [
    [98, 26],
    [102, 34],
    [138, 51],
    [142, 59],
  ] as const)
    ctx.fillRect(x - 4, y - 4, 8, 8);
  // a star
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2,
      r = i % 2 ? 6 : 14;
    ctx.lineTo(50 + Math.cos(a) * r, 130 + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.stroke();
  // a squiggle
  ctx.beginPath();
  ctx.moveTo(110, 120);
  ctx.bezierCurveTo(125, 100, 140, 150, 160, 125);
  ctx.stroke();
  return wallpaper;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const rows: string[] = [];
  let row = '';
  for (const word of text.split(' ')) {
    const next = row ? `${row} ${word}` : word;
    if (ctx.measureText(next).width > max && row) {
      rows.push(row);
      row = word;
    } else row = next;
  }
  rows.push(row);
  return rows;
}

function paintChat(ctx: CanvasRenderingContext2D, view: ChatView, style: ChatStyle) {
  ctx.setTransform(RES, 0, 0, RES, 0, 0);
  ctx.fillStyle = C.wall;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = ctx.createPattern(doodles(), 'repeat')!;
  ctx.fillRect(0, 0, W, H);

  // status bar: the time, the Dynamic Island, signal and battery
  ctx.fillStyle = C.bar;
  ctx.fillRect(0, 0, W, 210);
  ctx.fillStyle = '#ffffff';
  ctx.font = FONT(30, 700);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(view.clock, 92, 48);
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.roundRect(W / 2 - 88, 22, 176, 52, 26);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 4; i++) ctx.fillRect(388 + i * 11, 58 - i * 6, 7, 8 + i * 6); // signal
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(446, 38, 50, 24, 6); // battery
  ctx.stroke();
  ctx.fillRect(450, 42, 34, 16);
  ctx.fillRect(498, 45, 4, 10);

  // header: back, the group's picture, name, members (or who is typing), call buttons
  ctx.textAlign = 'left';
  ctx.fillStyle = C.accent;
  ctx.font = FONT(56, 400);
  ctx.fillText('‹', 16, 146);
  ctx.fillStyle = '#ffd36b';
  ctx.beginPath();
  ctx.arc(92, 146, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.font = FONT(40, 400);
  ctx.fillText('🦖', 92, 149);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.text;
  ctx.font = FONT(32, 700);
  ctx.fillText(style.title, 142, 128);
  ctx.font = FONT(23);
  if (view.typing) {
    ctx.fillStyle = C.accent;
    ctx.fillText(`${view.typing} is typing…`, 142, 166);
  } else {
    ctx.fillStyle = C.meta;
    ctx.fillText(style.subtitle, 142, 166);
  }
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(424, 132, 32, 24, 5); // video
  ctx.moveTo(458, 144);
  ctx.lineTo(472, 134);
  ctx.lineTo(472, 154);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath(); // phone
  ctx.arc(506, 144, 14, Math.PI * 0.55, Math.PI * 1.45);
  ctx.stroke();

  // the message bar: what you're typing, and a send (or mic) button
  const BAR_Y = H - 92;
  ctx.fillStyle = C.bar;
  ctx.fillRect(0, BAR_Y - 22, W, 114);
  ctx.fillStyle = C.in;
  ctx.beginPath();
  ctx.roundRect(16, BAR_Y - 8, W - 112, 64, 32);
  ctx.fill();
  ctx.font = FONT(29);
  ctx.fillStyle = view.draft ? C.text : C.meta;
  let shown = view.draft ? `${view.draft}|` : 'Message';
  while (ctx.measureText(shown).width > W - 170 && shown.length > 1) shown = shown.slice(1);
  ctx.fillText(shown, 40, BAR_Y + 24);
  ctx.fillStyle = C.accent;
  ctx.beginPath();
  ctx.arc(W - 52, BAR_Y + 24, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.wall;
  ctx.beginPath();
  if (view.draft) {
    ctx.moveTo(W - 64, BAR_Y + 8); // send
    ctx.lineTo(W - 34, BAR_Y + 24);
    ctx.lineTo(W - 64, BAR_Y + 40);
    ctx.lineTo(W - 58, BAR_Y + 24);
  } else {
    ctx.roundRect(W - 59, BAR_Y + 6, 14, 24, 7); // mic
    ctx.rect(W - 53, BAR_Y + 30, 2, 10);
  }
  ctx.fill();

  // messages, newest just above the bar, stacked upward
  const MAX = W * 0.8;
  let y = BAR_Y - 40;
  for (let i = view.lines.length - 1; i >= 0 && y > 260; i--) {
    const line = view.lines[i]!;
    const mine = line.from === style.owner;
    const firstOfRun = view.lines[i - 1]?.from !== line.from;
    ctx.font = FONT(36);
    const rows = wrap(ctx, line.text, MAX - 40);
    const textW = Math.max(...rows.map(r => ctx.measureText(r).width));
    const lastW = ctx.measureText(rows.at(-1)!).width;
    const nameH = !mine && firstOfRun ? 34 : 0;
    ctx.font = FONT(26, 700);
    const nameW = nameH ? ctx.measureText(line.from).width : 0;
    const metaW = mine ? 112 : 78;
    const fitsBeside = lastW + metaW < MAX - 40;
    const h = rows.length * 45 + 22 + nameH + (fitsBeside ? 0 : 26);
    const w = Math.min(MAX, Math.max(textW + (rows.length === 1 && fitsBeside ? metaW : 0), nameW) + 40);
    const x = mine ? W - 18 - w : 18;
    const top = y - h;
    ctx.fillStyle = mine ? C.out : C.in;
    ctx.beginPath();
    ctx.roundRect(x, top, w, h, 16);
    ctx.fill();
    if (firstOfRun) {
      // the little tail at the top corner
      ctx.beginPath();
      if (mine) {
        ctx.moveTo(x + w - 12, top);
        ctx.lineTo(x + w + 14, top);
        ctx.lineTo(x + w, top + 20);
      } else {
        ctx.moveTo(x + 12, top);
        ctx.lineTo(x - 14, top);
        ctx.lineTo(x, top + 20);
      }
      ctx.fill();
    }
    if (nameH) {
      ctx.fillStyle = style.colours[line.from] ?? C.accent;
      ctx.font = FONT(26, 700);
      ctx.fillText(line.from, x + 20, top + 28);
    }
    ctx.fillStyle = C.text;
    ctx.font = FONT(36);
    rows.forEach((r, k) => ctx.fillText(r, x + 20, top + nameH + 33 + k * 45));
    // the time, and two blue ticks on your own
    ctx.font = FONT(21);
    ctx.fillStyle = mine ? 'rgba(233,237,239,0.6)' : C.meta;
    ctx.textAlign = 'right';
    ctx.fillText(line.time, x + w - (mine ? 46 : 14), top + h - 16);
    ctx.textAlign = 'left';
    if (mine) {
      ctx.strokeStyle = C.tick;
      ctx.lineWidth = 2.5;
      for (const dx of [0, 8]) {
        ctx.beginPath();
        ctx.moveTo(x + w - 38 + dx, top + h - 17);
        ctx.lineTo(x + w - 33 + dx, top + h - 12);
        ctx.lineTo(x + w - 23 + dx, top + h - 23);
        ctx.stroke();
      }
    }
    y = top - (view.lines[i - 1]?.from === line.from ? 8 : 18);
  }
  // the date chip, while there's room for it
  if (y > 300) {
    ctx.fillStyle = C.chip;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 60, 232, 120, 40, 12);
    ctx.fill();
    ctx.fillStyle = C.meta;
    ctx.font = FONT(22, 600);
    ctx.textAlign = 'center';
    ctx.fillText('Today', W / 2, 253);
    ctx.textAlign = 'left';
  }
  if (view.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${0.08 * view.flash})`;
    ctx.fillRect(0, 0, W, H);
  }
}

/** A rounded rectangle centred on the origin, for the phone's body and its screen. */
function rounded(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

export interface Phone {
  group: THREE.Group;
  /** The phone's height (for framing close-ups). */
  height: number;
  /** Shows a chat; only repaints when what it shows changes. */
  show(view: ChatView): void;
}

/**
 * A big phone (dinosaur paws) in the style of a modern iPhone, screen facing +z: a metal frame with rounded
 * corners, a thin black bezel, an edge-to-edge screen with the Dynamic Island, side buttons, and a camera bump
 * on the back. The screen shows a group chat. `height` is the phone's height.
 */
export function createPhone(style: ChatStyle, { height = 1.0, colour = 0x2c2c30 } = {}): Phone {
  const group = new THREE.Group();
  const w = height * (W / H) + height * 0.04;
  const depth = height * 0.05;
  const radius = w * 0.18;
  const frameGeo = new THREE.ExtrudeGeometry(rounded(w, height, radius), {
    depth,
    bevelEnabled: true,
    bevelSize: depth * 0.25,
    bevelThickness: depth * 0.25,
    bevelSegments: 4,
    curveSegments: 12,
  });
  frameGeo.translate(0, 0, -depth / 2);
  const metal = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.3, metalness: 0.75 });
  const body = new THREE.Mesh(frameGeo, metal);
  body.castShadow = true;
  group.add(body);
  // the black glass front, a hair proud of the frame
  const front = new THREE.Mesh(
    new THREE.ShapeGeometry(rounded(w * 0.985, height * 0.99, radius * 0.97), 12),
    new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.08, metalness: 0.2 }),
  );
  front.position.z = depth / 2 + depth * 0.26;
  group.add(front);

  // the screen: a rounded shape with its UVs stretched over the chat canvas
  const sw = w * 0.92,
    sh = height * 0.955;
  const screenGeo = new THREE.ShapeGeometry(rounded(sw, sh, radius * 0.85), 12);
  const uv = screenGeo.attributes.uv!;
  const pos = screenGeo.attributes.position!;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / sw + 0.5, pos.getY(i) / sh + 0.5);
  let key = '';
  let current: ChatView = { lines: [], typing: null, draft: '', flash: 0, clock: '8:10' };
  const draw = (ctx: CanvasRenderingContext2D) => paintChat(ctx, current, style);
  const tex = textTexture(W * RES, H * RES, draw, ['700 40px Fredoka', '600 40px Fredoka']);
  tex.anisotropy = 16;
  // close-ups show the screen at roughly its own size: plain linear filtering keeps small text sharp (mipmaps blur it)
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  const screen = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.position.z = front.position.z + 0.002;
  group.add(screen);

  // side buttons, and the camera bump on the back
  const button = (x: number, y: number, len: number) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(depth * 0.5, len, depth * 0.6), metal);
    b.position.set(x, y, 0);
    group.add(b);
  };
  button(-w / 2 - depth * 0.3, height * 0.28, height * 0.06); // action button
  button(-w / 2 - depth * 0.3, height * 0.17, height * 0.1); // volume
  button(-w / 2 - depth * 0.3, height * 0.05, height * 0.1);
  button(w / 2 + depth * 0.3, height * 0.18, height * 0.14); // side button
  const bump = new THREE.Mesh(
    new THREE.ExtrudeGeometry(rounded(w * 0.42, w * 0.42, w * 0.1), { depth: depth * 0.3, bevelEnabled: false }),
    new THREE.MeshStandardMaterial({ color: colour, roughness: 0.2, metalness: 0.6 }),
  );
  bump.rotation.y = Math.PI;
  bump.position.set(-w * 0.24, height * 0.33, -depth / 2 - depth * 0.2);
  group.add(bump);
  const lensMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.05, metalness: 0.9 });
  for (const [dx, dy] of [
    [0.09, 0.09],
    [0.09, -0.09],
    [-0.09, 0],
  ] as const) {
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.075, w * 0.075, depth * 0.35, 24), lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(-w * 0.24 + w * dx, height * 0.33 + w * dy, -depth / 2 - depth * 0.45);
    group.add(lens);
  }

  return {
    group,
    height,
    show(view) {
      const next = `${view.lines.length}|${view.typing}|${view.draft}|${view.flash.toFixed(1)}|${view.clock}`;
      if (next === key) return;
      key = next;
      current = view;
      const canvas = tex.image;
      draw(canvas.getContext('2d')!);
      tex.needsUpdate = true;
    },
  };
}

/** A message in a scripted chat: it lands at `at` (seconds), after its sender has typed it for `TYPING` seconds. */
export interface TimedChatLine extends ChatLine {
  at: number;
}

/** How long someone types before their message lands. */
export const TYPING = 1.1;

/** The chat at time t: what's been sent, what's being typed (and how much of it), and the arrival flash. */
export function chatState<L extends TimedChatLine>(chat: readonly L[], t: number, startClock: string) {
  const lines = chat.filter(m => m.at <= t);
  const next = chat.find(m => m.at > t);
  const pending =
    next && next.at - t <= TYPING
      ? { from: next.from, text: next.text, progress: Math.min(1, (TYPING - (next.at - t)) / (TYPING - 0.15)) }
      : null;
  const last = lines.at(-1);
  return { lines, pending, flash: last ? Math.max(0, 1 - (t - last.at) / 0.4) : 0, clock: last?.time ?? startClock };
}

/** What `owner`'s phone shows at t: others typing under the group name, their own typing in the message bar. */
export function chatView(chat: readonly TimedChatLine[], t: number, owner: string, startClock: string): ChatView {
  const { lines, pending, flash, clock } = chatState(chat, t, startClock);
  const mine = pending?.from === owner;
  const letters = mine ? Array.from(pending.text) : [];
  return {
    lines,
    flash,
    clock,
    typing: pending && !mine ? pending.from : null,
    draft: letters.slice(0, Math.ceil(letters.length * (pending?.progress ?? 0))).join(''),
  };
}

export interface HoldOptions {
  /** How far out in front of the shoulders, and how far up, the phone is held (world units). */
  forward?: number;
  up?: number;
  /** Where the paws grip its sides (fractions of its height from the middle) and how far apart. */
  grip?: number;
  spread?: number;
  typing?: boolean;
}

/**
 * Holds a phone in both paws in front of the chest, screen toward the face; thumbs tap while `typing`. The paws sit
 * on the phone's sides, so they don't cover the newest message.
 */
export function holdPhone(
  rig: { root: THREE.Object3D; arms: readonly THREE.Object3D[]; head: THREE.Object3D },
  phone: Phone,
  t: number,
  { forward = 0.9, up = 0.1, grip = 0.05, spread = 0.4, typing = false }: HoldOptions = {},
): void {
  rig.root.updateMatrixWorld(true);
  const [l, r] = rig.arms;
  const mid = l!
    .getWorldPosition(new THREE.Vector3())
    .add(r!.getWorldPosition(new THREE.Vector3()))
    .multiplyScalar(0.5);
  const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(rig.root.getWorldQuaternion(new THREE.Quaternion()));
  phone.group.position
    .copy(mid)
    .addScaledVector(fwd, forward)
    .add(new THREE.Vector3(0, up, 0));
  phone.group.lookAt(rig.head.getWorldPosition(new THREE.Vector3()));
  phone.group.updateMatrixWorld(true);
  for (const arm of rig.arms) {
    const side = sideOf(arm);
    const tap = typing ? Math.max(0, Math.sin(t * 22 + side * 1.7)) * 0.04 : 0;
    // the phone faces its owner, so its +x is on their right: mirror the side
    const edge = phone.group.localToWorld(
      new THREE.Vector3(-side * phone.height * spread, phone.height * grip + tap, 0.02),
    );
    reachArm(arm, arm.parent!.worldToLocal(edge));
  }
}

/** A shot through the owner's eyes onto the screen (hide their head first); returns camera and target. */
export function phonePov(phone: Phone, camera: THREE.Camera) {
  phone.group.updateMatrixWorld(true);
  const p = phone.group.getWorldPosition(new THREE.Vector3());
  const n = new THREE.Vector3(0, 0, 1).transformDirection(phone.group.matrixWorld);
  const screenUp = new THREE.Vector3(0, 1, 0).transformDirection(phone.group.matrixWorld);
  camera.up.copy(screenUp);
  // close enough that the phone fills most of the frame's width, with room under it for the captions
  const cam = p.clone().addScaledVector(n, phone.height * 1.3);
  const look = p.clone().addScaledVector(screenUp, -phone.height * 0.1);
  return { cam: [cam.x, cam.y, cam.z] as const, look: [look.x, look.y, look.z] as const };
}

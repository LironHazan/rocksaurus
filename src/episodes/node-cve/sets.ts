import * as THREE from 'three';
import { addKeyLight, box, createRoom, createScreen, cylinder, mat, picture, ROUND } from '../../world/interior';

// Yashinozarus's corner: a long desk, his keyboard, one big monitor turned to him, a whiteboard of boxes and arrows
// behind him (every system in the company, drawn by him), and a poster. And the sign Lulu tapes to her monitor.

/** His desk: its top's height and where its front edge is (he sits behind it at the origin, facing +z). */
const DESK = { top: 1.35, z: 1.75, width: 3.6, depth: 1.1 } as const;
/** His keyboard, on the desk in front of him. */
export const KEYBOARD = new THREE.Vector3(0, DESK.top + 0.08, 1.5);
/** His monitor: on the desk to his left, turned to his face. */
const MONITOR = { at: new THREE.Vector3(-1.55, 2.35, 1.75), w: 1.9, h: 1.15, face: new THREE.Vector3(0, 2.3, 0.9) };

const font = (size: number, weight = 700) => `${weight} ${size}px ${ROUND}`;

/** The whiteboard: every system in the company, boxes and arrows, in his tidy hand; one box circled in red. */
function paintWhiteboard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#fbfbf8';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#2b4a8a';
  ctx.fillStyle = '#2b4a8a';
  ctx.lineWidth = w * 0.006;
  ctx.font = font(w * 0.034, 600);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const boxes = [
    [0.2, 0.22, 'gateway'],
    [0.5, 0.22, 'auth'],
    [0.8, 0.22, 'billing'],
    [0.2, 0.55, 'checkout'],
    [0.5, 0.55, 'node services'],
    [0.8, 0.55, 'agents ×666'],
    [0.5, 0.85, 'npm 📦'],
  ] as const;
  for (const [x, y, label] of boxes) {
    ctx.strokeRect(w * (x - 0.12), h * (y - 0.08), w * 0.24, h * 0.16);
    ctx.fillText(label, w * x, h * y);
  }
  for (const [a, b] of [
    [0, 3],
    [1, 4],
    [2, 5],
    [3, 4],
    [4, 6],
    [5, 4],
  ] as const) {
    const [x1, y1] = boxes[a]!;
    const [x2, y2] = boxes[b]!;
    ctx.beginPath();
    ctx.moveTo(w * x1, h * (y1 + 0.08));
    ctx.lineTo(w * x2, h * (y2 - 0.08));
    ctx.stroke();
  }
  // the one that matters today
  ctx.strokeStyle = '#d63a3a';
  ctx.lineWidth = w * 0.008;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.85, w * 0.17, h * 0.11, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#2b4a8a';
  ctx.font = font(w * 0.04);
  ctx.textAlign = 'left';
  ctx.fillText('ARCHITECTURE v47', w * 0.03, h * 0.06);
}

/** His poster: a riff on his favourite album, for the job he actually does. */
function paintPoster(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#121214';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#e8e8ea';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font(w * 0.13);
  ctx.fillText('MASTER', w / 2, h * 0.3);
  ctx.font = font(w * 0.09, 600);
  ctx.fillText('OF ALL', w / 2, h * 0.43);
  ctx.font = font(w * 0.13);
  ctx.fillText('TRADES', w / 2, h * 0.56);
  ctx.font = font(w * 0.3);
  ctx.fillText('🧠', w / 2, h * 0.8);
}

/** Yashinozarus's corner, and his screen. */
export function createArchitectCorner() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd8dde6);
  createRoom(scene, { wall: 0xd8dde6, floor: 0x8a6e52, width: 14, depth: 12, back: -3.2 });
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8a898, 1.1));
  addKeyLight(scene, 0xfff0dc, 2.0, { from: [4, 8, 8], reach: 6, top: 7 });

  const desk = new THREE.Group();
  const top = box(DESK.width, 0.12, DESK.depth, mat(0x3a3f4a, 0.5));
  top.position.y = DESK.top;
  desk.add(top);
  for (const x of [-1, 1]) {
    const leg = box(0.1, DESK.top, DESK.depth - 0.1, mat(0x1e2128, 0.5));
    leg.position.x = (x * (DESK.width - 0.2)) / 2;
    desk.add(leg);
  }
  desk.position.z = DESK.z;
  scene.add(desk);
  const keyboard = box(1.1, 0.06, 0.36, mat(0x23252c, 0.5));
  keyboard.position.copy(KEYBOARD).setY(DESK.top + 0.06);
  scene.add(keyboard);
  const mug = cylinder(0.15, 0.14, 0.3, mat(0x121214, 0.5));
  mug.position.set(1.1, DESK.top + 0.06, 1.6);
  scene.add(mug);

  const monitor = new THREE.Group();
  const bezel = box(MONITOR.w + 0.12, MONITOR.h + 0.12, 0.08, mat(0x16171c, 0.4));
  bezel.position.set(0, -(MONITOR.h + 0.12) / 2, -0.05);
  const screen = createScreen(MONITOR.w, MONITOR.h, { header: 'terminal' });
  // the stand: from the desk up to the screen's bottom edge (box and cylinder stand on their base)
  const rise = MONITOR.at.y - DESK.top - MONITOR.h / 2;
  const stand = cylinder(0.05, 0.05, rise, mat(0x9aa0ad, 0.3, { metalness: 0.6 }));
  stand.position.set(0, -MONITOR.h / 2 - rise, -0.12);
  monitor.add(bezel, screen.mesh, stand);
  monitor.position.copy(MONITOR.at);
  monitor.lookAt(MONITOR.face);
  scene.add(monitor);
  const glow = new THREE.PointLight(0x9db4ff, 2.5, 4, 2);
  glow.position.copy(MONITOR.at).add(new THREE.Vector3(0.4, 0, -0.4));
  scene.add(glow);

  const board = picture(5.6, 3.0, paintWhiteboard, { px: 1024, frame: 0xc9ccd2 });
  board.position.set(0.6, 4.4, -3.15);
  const poster = picture(1.7, 2.3, paintPoster);
  poster.position.set(-4.6, 4.2, -3.15);
  scene.add(board, poster);
  return { scene, screen, monitor };
}

/** The sign Lulu tapes to her monitor after the second time: a yellow sticky note, in marker. */
export function createSign(): THREE.Group {
  return picture(
    0.95,
    0.62,
    (ctx, w, h) => {
      ctx.fillStyle = '#ffe36b';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1b1b22';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = font(h * 0.2, 800);
      ctx.fillText('AI AGENT =', w / 2, h * 0.32);
      ctx.fillText('LOOP + TOOLS', w / 2, h * 0.62);
      ctx.font = font(h * 0.14, 600);
      ctx.fillText('(please)', w / 2, h * 0.86);
    },
    { px: 384, frame: null },
  );
}

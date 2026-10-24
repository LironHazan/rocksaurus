import * as THREE from 'three';
import { addKeyLight, box, createRoom, createScreen, cylinder, mat, picture, ROUND } from '../../world/interior';

// Yashinozarus's corner: a long desk, his keyboard, one big monitor turned to him, a whiteboard behind him (the
// whole backend, drawn by him: VPC, EKS, Kafka, Postgres), and a poster. And the sign Lulu tapes to her monitor.

/** His desk: its top's height and where its front edge is (he sits behind it at the origin, facing +z). */
const DESK = { top: 1.35, z: 1.75, width: 3.6, depth: 1.1 } as const;
/** His keyboard, on the desk in front of him. */
export const KEYBOARD = new THREE.Vector3(0, DESK.top + 0.08, 1.5);
/** His monitor: on the desk to his left, turned to his face. */
const MONITOR = { at: new THREE.Vector3(-1.55, 2.35, 1.75), w: 1.9, h: 1.15, face: new THREE.Vector3(0, 2.3, 0.9) };

const font = (size: number, weight = 700) => `${weight} ${size}px ${ROUND}`;

/** The whiteboard: the company's backend in his tidy hand. The internet comes in through a load balancer to a VPC;
 * inside it an EKS cluster runs the services on k8s, which talk to Kafka and Postgres. The Node.js services are
 * circled in red: today's CVE. Positions are shares of the board. */
function paintWhiteboard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#fbfbf8';
  ctx.fillRect(0, 0, w, h);
  const ink = '#2b4a8a';
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = w * 0.004;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const rect = (x: number, y: number, bw: number, bh: number) => ctx.strokeRect(w * x, h * y, w * bw, h * bh);
  const label = (x: number, y: number, text: string, size = 0.026, weight = 600) => {
    ctx.font = font(w * size, weight);
    ctx.fillText(text, w * x, h * y);
  };
  const arrow = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.moveTo(w * x1, h * y1);
    ctx.lineTo(w * x2, h * y2);
    ctx.stroke();
    const a = Math.atan2(h * (y2 - y1), w * (x2 - x1));
    const head = w * 0.012;
    ctx.beginPath();
    ctx.moveTo(w * x2, h * y2);
    ctx.lineTo(w * x2 - head * Math.cos(a - 0.5), h * y2 - head * Math.sin(a - 0.5));
    ctx.lineTo(w * x2 - head * Math.cos(a + 0.5), h * y2 - head * Math.sin(a + 0.5));
    ctx.closePath();
    ctx.fill();
  };

  ctx.textAlign = 'left';
  label(0.03, 0.06, 'PLATFORM v47', 0.034, 700);
  ctx.textAlign = 'center';
  // the internet, and the load balancer in front of everything
  label(0.5, 0.06, '🌍 internet');
  rect(0.42, 0.11, 0.16, 0.08);
  label(0.5, 0.15, 'ALB');
  arrow(0.5, 0.08, 0.5, 0.11);
  // the VPC: a dashed boundary round the rest
  ctx.setLineDash([w * 0.012, w * 0.008]);
  rect(0.04, 0.24, 0.92, 0.72);
  ctx.setLineDash([]);
  ctx.textAlign = 'left';
  label(0.06, 0.28, 'VPC · 3 AZs', 0.024);
  ctx.textAlign = 'center';
  // EKS, its nodes and the services on them
  rect(0.08, 0.33, 0.5, 0.58);
  label(0.33, 0.37, 'EKS ☸ k8s', 0.028, 700);
  const pods = [
    [0.12, 0.44, 'gateway'],
    [0.34, 0.44, 'auth'],
    [0.12, 0.6, 'checkout'],
    [0.34, 0.6, 'billing'],
    [0.12, 0.76, 'node svc ×12'],
    [0.34, 0.76, 'agents ×666'],
  ] as const;
  for (const [x, y, name] of pods) {
    rect(x, y, 0.2, 0.1);
    label(x + 0.1, y + 0.05, name, 0.022);
  }
  arrow(0.5, 0.19, 0.22, 0.44);
  // Kafka and Postgres, beside the cluster
  rect(0.64, 0.36, 0.28, 0.24);
  label(0.78, 0.41, 'Kafka', 0.028, 700);
  label(0.78, 0.48, 'orders · events', 0.02);
  label(0.78, 0.54, '3 brokers', 0.02);
  rect(0.64, 0.68, 0.28, 0.16);
  label(0.78, 0.76, 'Postgres (RDS)', 0.024);
  arrow(0.54, 0.49, 0.64, 0.47);
  arrow(0.54, 0.65, 0.64, 0.5);
  arrow(0.54, 0.81, 0.64, 0.77);
  // today's problem
  ctx.strokeStyle = '#d63a3a';
  ctx.lineWidth = w * 0.006;
  ctx.beginPath();
  ctx.ellipse(w * 0.22, h * 0.81, w * 0.14, h * 0.09, 0, 0, Math.PI * 2);
  ctx.stroke();
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

  const board = picture(5.0, 2.8, paintWhiteboard, { px: 1024, frame: 0xc9ccd2 });
  board.position.set(-0.6, 4.4, -3.15); // right behind him, all of it in his shots
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

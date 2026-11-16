import * as THREE from 'three';
import {
  addKeyLight,
  box,
  createRoom,
  createWallClock,
  cylinder,
  deskMonitor,
  livePanel,
  mat,
  picture,
  ROUND,
} from '../../world/interior';
import { ball } from '../../characters/materials';

// The DevOps floor: one long room, everyone in a row facing the room. Rorit's desk on the left (her monitor shows her
// mail), Amazaurus and Eilon in the middle, Eter's desk on the right: the Narnia plan on the wall behind her and a
// desk calendar. A sign, a wall clock, a poster, a plant.

/** Where each of them stands (they all face +z), and where Lulu comes in from and stops, by Eter's desk. */
export const SPOTS = {
  Rorit: new THREE.Vector3(-3.6, 0, 0),
  Amazaurus: new THREE.Vector3(-1.2, 0, 0),
  Eilon: new THREE.Vector3(1.2, 0, 0),
  Eter: new THREE.Vector3(3.6, 0, 0),
} as const;
export const LULU_ENTRY = new THREE.Vector3(10, 0, 10);
export const LULU_STOP = new THREE.Vector3(6.6, 0, 1.4);

/** The shared desk: its top's height, how far in front of them, and its size (all four along it). */
const DESK = { top: 1.6, z: 1.4, width: 10.4, depth: 1.1 } as const;
/** Their office chairs, behind each of them: the seat's height and size, the back's height. */
const CHAIR = { seat: 1.2, size: 1.0, back: 1.4 } as const;
/** Rorit's monitor, on her desk to her right, and its size. */
const MONITOR = { x: -1.1, y: 2.7, w: 1.9, h: 1.2 } as const;
/** The calendar on Eter's desk, to her left: where (from her spot) and its size. */
const CALENDAR = { x: 0.9, w: 0.8, h: 0.62 } as const;
/** The room's back wall (z). */
const BACK = -4;

const font = (size: number, weight = 700) => `${weight} ${size}px ${ROUND}`;

/** The one long desk they share, with a front panel (box stands on its base). */
function desk(): THREE.Group {
  const g = new THREE.Group();
  const top = box(DESK.width, 0.12, DESK.depth, mat(0xf2efe8, 0.5));
  top.position.y = DESK.top;
  const panel = box(DESK.width - 0.2, DESK.top - 0.3, 0.06, mat(0x3a4a5c, 0.6));
  panel.position.set(0, 0.3, DESK.depth / 2 - 0.05);
  g.add(top, panel);
  for (const x of [-1, 1]) {
    const leg = box(0.1, DESK.top, DESK.depth - 0.1, mat(0x2a2d35, 0.5));
    leg.position.x = (x * (DESK.width - 0.2)) / 2;
    g.add(leg);
  }
  g.position.set(0, 0, DESK.z);
  return g;
}

/** An office chair behind `at`: a pole, a seat, a back (box and cylinder stand on their base). */
function chair(at: THREE.Vector3): THREE.Group {
  const g = new THREE.Group();
  const dark = mat(0x23262e, 0.6);
  const pole = cylinder(0.08, 0.08, CHAIR.seat, mat(0x9aa0ad, 0.3, { metalness: 0.6 }));
  const foot = cylinder(0.55, 0.55, 0.08, dark);
  const seat = box(CHAIR.size, 0.15, CHAIR.size, dark);
  seat.position.y = CHAIR.seat;
  const back = box(CHAIR.size, CHAIR.back, 0.12, dark);
  back.position.set(0, CHAIR.seat + 0.2, -CHAIR.size / 2);
  g.add(pole, foot, seat, back);
  g.position.set(at.x, 0, at.z - 0.3);
  return g;
}

/** Rorit's screen, the way it looks at t: the inbox, then Chuks's email arriving (bold, on top), then opened; in the
 * grind, her terminal: the hardcoded domains, the certs, and the tests (the domain's hardcoded in them too). */
export type MailState = 'inbox' | 'new' | 'open' | 'grind';
/** Her terminal in the grind. */
const GRIND = [
  ['$ grep -rl papopakoshapeworks.com | wc -l', '#7fe0b0'],
  ['4812', '#ff6b5a'],
  ['$ certs reissue --all', '#7fe0b0'],
  ['✓ 61/200 · ✗ 3 failed (cert-manager)', '#ffd36b'],
  ['$ npm test', '#7fe0b0'],
  ['✗ 312 failed: expected papopakoshapeworks.com', '#ff6b5a'],
] as const;

function paintGrind(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#12141c';
  ctx.fillRect(0, 0, w, h);
  ctx.textBaseline = 'middle';
  ctx.font = font(h * 0.055, 600);
  GRIND.forEach(([text, colour], i) => {
    ctx.fillStyle = colour;
    ctx.fillText(text, w * 0.04, h * (0.12 + i * 0.15));
  });
}
const INBOX = [
  ['Silvi', 'Pizza Friday is BACK 🍕'],
  ['Eilon', 'Standup notes 😄'],
  ['Prometheus', 'Resolved: disk 81% → 79%'],
] as const;
const MAIL = { side: 0.22, ink: '#1f2430', faint: '#7a8090', accent: '#2f6be5', warn: '#d6452f' } as const;

function paintMail(ctx: CanvasRenderingContext2D, w: number, h: number, state: MailState) {
  if (state === 'grind') {
    paintGrind(ctx, w, h);
    return;
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const side = w * MAIL.side;
  ctx.fillStyle = '#eef1f7';
  ctx.fillRect(0, 0, side, h);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = MAIL.accent;
  ctx.font = font(h * 0.07);
  ctx.fillText('DinoMail', w * 0.025, h * 0.08);
  ctx.font = font(h * 0.045, 600);
  ctx.fillStyle = MAIL.ink;
  ['📥 Inbox', '⭐ Starred', '📤 Sent', '🗑️ Trash'].forEach((f, i) =>
    ctx.fillText(f, w * 0.025, h * (0.22 + i * 0.09)),
  );
  const x = side + w * 0.03;
  if (state === 'open') {
    ctx.fillStyle = MAIL.warn;
    ctx.font = font(h * 0.062);
    ctx.fillText('⚠️ Narnia compliance: new domain name', x, h * 0.09);
    ctx.fillStyle = MAIL.faint;
    ctx.font = font(h * 0.042, 600);
    ctx.fillText('From: Chuks · To: DevOps', x, h * 0.18);
    ctx.fillStyle = MAIL.ink;
    ctx.font = font(h * 0.05, 500);
    const body = [
      'Hi team,',
      'To be Narnia compliant, every service must',
      'move to a new, Narnia-approved domain:',
      'papopakoshapeworks.com → papopakoshapeworks.na',
      'That’s all 200 microservices. New certs too.',
      'Deadline: yesterday.',
      'Thanks! 🦁 Chuks',
    ];
    body.forEach((l, i) => ctx.fillText(l, x, h * (0.27 + i * 0.105)));
    return;
  }
  const rows = state === 'new' ? [['Chuks', '⚠️ Narnia compliance: new domain name'] as const, ...INBOX] : INBOX;
  rows.forEach(([from, subject], i) => {
    const y = h * (0.12 + i * 0.16);
    const fresh = state === 'new' && i === 0;
    if (fresh) {
      ctx.fillStyle = '#fff1d6';
      ctx.fillRect(side, y - h * 0.07, w - side, h * 0.14);
    }
    ctx.fillStyle = fresh ? MAIL.warn : MAIL.ink;
    ctx.font = font(h * 0.05, fresh ? 800 : 600);
    ctx.fillText(from, x, y - h * 0.025);
    ctx.fillStyle = fresh ? MAIL.ink : MAIL.faint;
    ctx.font = font(h * 0.042, fresh ? 700 : 500);
    ctx.fillText(subject, x, y + h * 0.035);
  });
}

/** The Narnia plan on the wall behind Eter: the name's done; the real work isn't. */
function paintPlan(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#fbfbf8';
  ctx.fillRect(0, 0, w, h);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2f6b45';
  ctx.font = font(h * 0.11, 800);
  ctx.fillText('NARNIA COMPLIANCE 🦁', w * 0.05, h * 0.12);
  ctx.fillStyle = '#1f2430';
  ctx.font = font(h * 0.072, 600);
  [
    '✅ Kickoff',
    '✅ papopakoshapeworks.na (approved, 24 h ⚡)',
    '⬜ Reissue 200 TLS certs 🔐',
    '⬜ Replace 4,812 hardcoded domains 😱',
    '⬜ Update DNS, Helm, configs, README',
  ].forEach((l, i) => ctx.fillText(l, w * 0.06, h * (0.28 + i * 0.115)));
  ctx.fillStyle = '#d6452f';
  ctx.font = font(h * 0.07, 700);
  ctx.fillText('⏳ ETA: unknown', w * 0.1, h * 0.9);
}

/** The disaster-movie poster: "JUST A DNS CHANGE", in flames. Our own drawing. */
function paintDisaster(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#1a0a0a');
  sky.addColorStop(0.55, '#8a1f0f');
  sky.addColorStop(1, '#ff8a1f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // a burning server rack: its silhouette, its blinking lights, and the flames over it
  ctx.fillStyle = '#0b0b0f';
  ctx.fillRect(w * 0.32, h * 0.5, w * 0.36, h * 0.36);
  ctx.fillStyle = '#ff3b2f';
  for (let i = 0; i < 6; i++) ctx.fillRect(w * 0.37, h * (0.54 + i * 0.05), w * 0.04, h * 0.015);
  ctx.fillStyle = '#ffb02e';
  ctx.font = font(w * 0.22);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔥🔥🔥', w / 2, h * 0.47);
  ctx.fillStyle = '#ffffff';
  ctx.font = font(w * 0.13, 800);
  ctx.fillText('JUST A', w / 2, h * 0.11);
  ctx.font = font(w * 0.15, 800);
  ctx.fillText('DNS CHANGE', w / 2, h * 0.21);
  ctx.fillStyle = '#ffd36b';
  ctx.font = font(w * 0.065, 600);
  ctx.fillText('What could possibly go wrong?', w / 2, h * 0.3);
  ctx.fillStyle = '#ffffff';
  ctx.font = font(w * 0.07, 700);
  ctx.fillText('IN PROD THIS FRIDAY', w / 2, h * 0.93);
}

/** The DevOps floor: the room, the desks, Rorit's mail, the plan, the calendar. */
export function createDevopsFloor() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe3e8ee);
  createRoom(scene, { wall: 0xe3e8ee, floor: 0x9c7b5c, width: 26, depth: 16, back: BACK });
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc8b8a8, 1.1));
  addKeyLight(scene, 0xfff0dc, 2.0, { from: [4, 9, 9], reach: 9, top: 8 });

  scene.add(desk(), ...Object.values(SPOTS).map(chair));

  // Rorit's monitor: on her desk to her right; index.ts turns it to her face
  let mailState: MailState = 'inbox';
  const mail = livePanel(MONITOR.w, MONITOR.h, 1024, (ctx, w, h) => paintMail(ctx, w, h, mailState));
  const monitor = deskMonitor(mail.mesh, MONITOR.w, MONITOR.h, MONITOR.y - DESK.top - MONITOR.h / 2);
  monitor.position.set(SPOTS.Rorit.x + MONITOR.x, MONITOR.y, SPOTS.Rorit.z + DESK.z);
  scene.add(monitor);

  // the calendar on Eter's desk: a red top, the day (or year) under it
  let day = '';
  const page = livePanel(CALENDAR.w, CALENDAR.h, 512, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d6452f';
    ctx.fillRect(0, 0, w, h * 0.28);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = font(h * 0.16, 800);
    ctx.fillText('NARNIA', w / 2, h * 0.14);
    ctx.fillStyle = '#1f2430';
    ctx.font = font(h * (day.length > 8 ? 0.24 : 0.3), 800);
    ctx.fillText(day, w / 2, h * 0.64);
  });
  const calendar = new THREE.Group();
  calendar.add(page.mesh);
  page.mesh.position.y = CALENDAR.h / 2;
  calendar.position.set(SPOTS.Eter.x + CALENDAR.x, DESK.top + 0.06, SPOTS.Eter.z + DESK.z + 0.2);
  calendar.rotation.x = -0.25; // tilted back on its stand
  scene.add(calendar);

  const plan = picture(3.6, 2.4, paintPlan, { px: 1024, frame: 0xc9ccd2 });
  plan.position.set(SPOTS.Eter.x, 6.0, BACK + 0.05); // above her afro
  const sign = picture(3.2, 1.0, (ctx, w, h) => {
    ctx.fillStyle = '#1f2430';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = font(h * 0.5, 800);
    ctx.fillText('DevOps 🦖', w / 2, h * 0.52);
  });
  sign.position.set(-2.4, 6.6, BACK + 0.05);
  const poster = picture(2.2, 3.0, paintDisaster, { px: 768 });
  poster.position.set(-5.4, 4.8, BACK + 0.05); // behind Rorit: in her shots
  scene.add(plan, sign, poster);

  const clock = createWallClock(0.6);
  clock.group.position.set(0.6, 6.6, BACK + 0.1);
  scene.add(clock.group);

  // a plant in the corner by Rorit's desk
  const pot = cylinder(0.45, 0.35, 0.9, mat(0xc66b3d, 0.7));
  pot.position.set(-7.2, 0, -2.2);
  const leaves = mat(0x3f8f4a, 0.7);
  for (const [x, y, z, r] of [
    [0, 1.4, 0, 0.6],
    [0.35, 1.9, 0.1, 0.45],
    [-0.3, 2.0, -0.1, 0.45],
  ] as const)
    pot.add(ball(r, leaves, [x, y, z]));
  scene.add(pot);

  return {
    scene,
    monitor,
    clock,
    calendar,
    showMail(state: MailState) {
      if (state === mailState) return;
      mailState = state;
      mail.repaint();
    },
    showDay(text: string) {
      if (text === day) return;
      day = text;
      page.repaint();
    },
  };
}

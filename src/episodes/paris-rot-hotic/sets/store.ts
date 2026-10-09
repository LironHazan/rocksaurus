import * as THREE from 'three';
import { rng } from '../../../engine/math';
import { box, createRoom, cylinder, mat, ROUND } from '../../../world/interior';
import { textTexture } from '../../../world/text-texture';
import { ball } from '../../../characters/materials';

// Where things are, for the choreography. +x is to the right as seen from the camera; the back wall is at z = -4.
export const RACK = { x0: -2.4, x1: 3.4, z: -2.9, pole: 3.0 };
export const BOOTH = { x: -6.2, width: 2.6, front: -2.5 };
export const COUNTER = { x: 7.0, front: 6.5, z0: -1, z1: 3.1, top: 1.55 };
export const DOOR = { x: -8.95, z: 1.6 };

const FONT = "'Metal Mania'";
const FONT_LOAD = `40px ${FONT}`; // what document.fonts.load needs, so the signs repaint once the font arrives

const printTexture = (emoji: string) =>
  textTexture(128, 128, (ctx, w, h) => {
    ctx.font = `${h * 0.78}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, w / 2, h / 2 + 4);
  });

function shirtShape(long: boolean): THREE.Shape {
  const s = new THREE.Shape();
  if (long) {
    // a long coat: narrow shoulders, wide hem
    const pts: [number, number][] = [
      [-0.2, 0.78],
      [-0.42, 0.7],
      [-0.5, 0.4],
      [-0.4, 0.38],
      [-0.4, -0.55],
      [0.4, -0.55],
      [0.4, 0.38],
      [0.5, 0.4],
      [0.42, 0.7],
      [0.2, 0.78],
      [0, 0.7],
    ];
    s.moveTo(...pts[0]!);
    for (const p of pts.slice(1)) s.lineTo(...p);
    return s;
  }
  const pts: [number, number][] = [
    [-0.12, 0.74],
    [-0.24, 0.74],
    [-0.52, 0.56],
    [-0.46, 0.38],
    [-0.22, 0.5],
    [-0.22, 0],
    [0.22, 0],
    [0.22, 0.5],
    [0.46, 0.38],
    [0.52, 0.56],
    [0.24, 0.74],
    [0.12, 0.74],
    [0, 0.66],
  ];
  s.moveTo(...pts[0]!);
  for (const p of pts.slice(1)) s.lineTo(...p);
  return s;
}

/** A neon sign: glowing letters on a dark board. `setGlow(k)` dims and brightens it (flicker). */
function neonSign() {
  const g = new THREE.Group();
  const tex = textTexture(
    1024,
    300,
    (ctx, w, h) => {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.font = `${h * 0.62}px ${FONT}, 'Bungee', sans-serif`;
      // glow, then the tube
      ctx.shadowColor = '#ff2fb4';
      ctx.shadowBlur = 40;
      ctx.fillStyle = '#ff2fb4';
      ctx.fillText('ROT HOTIC', w / 2, h * 0.5);
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#ffd1f1';
      ctx.fillText('ROT HOTIC', w / 2, h * 0.5);
      ctx.shadowColor = '#32e6ff';
      ctx.shadowBlur = 22;
      ctx.strokeStyle = '#32e6ff';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.roundRect(24, 24, w - 48, h - 48, 40);
      ctx.stroke();
    },
    [FONT_LOAD],
  );
  const material = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(7, 2.05), material);
  face.position.set(0, -1.05, 0);
  g.add(face);
  const light = new THREE.PointLight(0xff3fbf, 18, 11, 1.6);
  light.position.set(0, -1, 1.4);
  g.add(light);
  return {
    group: g,
    setGlow(k: number) {
      material.color.setScalar(0.45 + 0.55 * k);
      light.intensity = 6 + 14 * k;
    },
  };
}

/** A clothes rack with a pole and a row of hanging shirts and coats. Returns the garments so they can be pushed aside. */
function rack(x0: number, x1: number, z: number, seed: number) {
  const g = new THREE.Group();
  const r = rng(seed);
  const metalMat = mat(0x8a8794, 0.35, { metalness: 0.7 });
  const pole = cylinder(0.04, 0.04, x1 - x0, metalMat, 10);
  pole.rotation.z = Math.PI / 2; // lies along -x from its origin
  pole.position.set(x1, RACK.pole, z);
  g.add(pole);
  for (const x of [x0 + 0.1, x1 - 0.1]) {
    const leg = cylinder(0.05, 0.05, RACK.pole, metalMat, 10);
    leg.position.set(x, 0, z);
    g.add(leg);
    const foot = cylinder(0.3, 0.3, 0.05, metalMat, 20);
    foot.position.set(x, 0, z);
    g.add(foot);
  }
  const colors = [0x0b0a10, 0x3a1a52, 0x5a0f24, 0x143a40, 0x2a2a3a, 0x6a2a7a, 0x1a1a22, 0x7a1d3a];
  const prints = ['🦇', '💀', '🕷️', '⛓️', '🖤', '🌙'].map(printTexture);
  const tee = new THREE.ExtrudeGeometry(shirtShape(false), { depth: 0.07, bevelEnabled: false });
  const coat = new THREE.ExtrudeGeometry(shirtShape(true), { depth: 0.08, bevelEnabled: false });
  const garments: { group: THREE.Group; x: number }[] = [];
  const count = Math.floor((x1 - x0 - 0.4) / 0.27);
  for (let i = 0; i < count; i++) {
    const item = new THREE.Group();
    const long = r() < 0.3;
    const fabric = new THREE.MeshStandardMaterial({ color: colors[Math.floor(r() * colors.length)]!, roughness: 0.9 });
    const body = new THREE.Mesh(long ? coat : tee, fabric);
    body.position.set(0, long ? -0.95 : -0.85, -0.035);
    body.castShadow = true;
    item.add(body);
    if (!long && r() < 0.8) {
      const print = new THREE.Mesh(
        new THREE.PlaneGeometry(0.22, 0.22),
        new THREE.MeshBasicMaterial({ map: prints[Math.floor(r() * prints.length)]!, transparent: true }),
      );
      print.position.set(0, -0.5, 0.04);
      item.add(print);
    }
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 14, Math.PI * 1.4), metalMat);
    hook.position.set(0, -0.02, 0);
    item.add(hook);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6), metalMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, -0.12, 0);
    item.add(bar);
    const x = x0 + 0.3 + i * 0.27;
    item.position.set(x, RACK.pole, z + (i % 2) * 0.04);
    item.rotation.y = (r() - 0.5) * 0.12;
    g.add(item);
    garments.push({ group: item, x });
  }
  return { group: g, garments };
}

/** The wall of shelves with boots, skulls and candles. */
function shelves(x0: number, x1: number) {
  const g = new THREE.Group();
  const wood = mat(0x241a2a, 0.7);
  const r = rng(11);
  const boot = mat(0x0d0b10, 0.45);
  const silver = mat(0xc8ccd8, 0.3, { metalness: 0.7 });
  for (const y of [1.3, 2.7, 4.1]) {
    const board = box(x1 - x0, 0.08, 0.7, wood);
    board.position.set((x0 + x1) / 2, y, -3.65);
    g.add(board);
    for (let x = x0 + 0.35; x < x1 - 0.2; x += 0.62) {
      const pick = r();
      const item = new THREE.Group();
      if (pick < 0.4) {
        const shaft = box(0.3, 0.55, 0.3, boot);
        const toe = ball(0.17, boot, [0, 0.1, 0.2], [1, 0.8, 1.3]);
        item.add(shaft, toe);
        for (let k = 0; k < 3; k++) item.add(ball(0.025, silver, [0.0, 0.15 + k * 0.14, 0.17], [1, 1, 1], 8));
      } else if (pick < 0.7) {
        const skull = ball(0.2, mat(0xe8e2d4, 0.7), [0, 0.22, 0], [1, 1.05, 1], 20);
        const jaw = ball(0.13, mat(0xe8e2d4, 0.7), [0, 0.07, 0.07], [1, 0.6, 0.9], 14);
        const eyes = [-1, 1].map(s => ball(0.05, mat(0x08060a), [s * 0.08, 0.25, 0.17], [1, 1.2, 0.6], 10));
        item.add(skull, jaw, ...eyes);
      } else {
        const candle = cylinder(0.07, 0.07, 0.4, mat(0xcfc6b0, 0.8), 12);
        const flame = ball(0.045, new THREE.MeshBasicMaterial({ color: 0xffb347 }), [0, 0.46, 0], [1, 1.6, 1], 10);
        item.add(candle, flame);
      }
      item.position.set(x, y + 0.04, -3.6);
      item.rotation.y = (r() - 0.5) * 0.5;
      g.add(item);
    }
  }
  return g;
}

/** A fitting room: mirror, side walls, and a curtain in two halves. `setOpen(k)`: 0 closed → 1 open. */
function fittingRoom() {
  const g = new THREE.Group();
  const frame = mat(0x120d18, 0.6);
  const left = BOOTH.x - BOOTH.width / 2,
    right = BOOTH.x + BOOTH.width / 2;
  for (const x of [left, right]) {
    const wall = box(0.12, 4.4, 1.55, frame);
    wall.position.set(x, 0, (BOOTH.front - 4) / 2);
    g.add(wall);
  }
  const lintel = box(BOOTH.width + 0.12, 0.4, 1.55, frame);
  lintel.position.set(BOOTH.x, 4.4, (BOOTH.front - 4) / 2);
  g.add(lintel);
  const mirrorTex = textTexture(256, 512, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, '#2a3358');
    gr.addColorStop(0.5, '#556096');
    gr.addColorStop(1, '#1b2142');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.moveTo(w * 0.1, 0);
    ctx.lineTo(w * 0.45, 0);
    ctx.lineTo(w * 0.05, h);
    ctx.lineTo(-w * 0.3, h);
    ctx.fill();
  });
  const mirror = new THREE.Mesh(
    new THREE.PlaneGeometry(BOOTH.width - 0.5, 3.8),
    new THREE.MeshBasicMaterial({ map: mirrorTex, toneMapped: false }),
  );
  mirror.position.set(BOOTH.x, 2.2, -3.95);
  g.add(mirror);
  const mirrorFrame = box(BOOTH.width - 0.3, 4.0, 0.06, mat(0x7b3fa0, 0.5, { metalness: 0.4 }));
  mirrorFrame.position.set(BOOTH.x, 0.2, -3.97);
  g.add(mirrorFrame);

  const velvet = new THREE.MeshPhysicalMaterial({
    color: 0x4b1f66,
    roughness: 0.9,
    sheen: 1,
    sheenColor: new THREE.Color(0xb48cff),
    side: THREE.DoubleSide,
  });
  const half = BOOTH.width / 2;
  const panel = (edge: number, dir: 1 | -1) => {
    const pivot = new THREE.Group();
    pivot.position.set(edge, 0, BOOTH.front);
    const geo = new THREE.PlaneGeometry(half, 4.1, 28, 1);
    const p = geo.attributes.position!;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 22) * 0.07); // pleats
    geo.computeVertexNormals();
    const cloth = new THREE.Mesh(geo, velvet);
    cloth.position.set((dir * half) / 2, 2.1, 0);
    cloth.castShadow = true;
    pivot.add(cloth);
    return pivot;
  };
  const l = panel(left, 1),
    r = panel(right, -1);
  g.add(l, r);
  const rod = cylinder(0.03, 0.03, BOOTH.width, mat(0xc8ccd8, 0.3, { metalness: 0.8 }), 10);
  rod.rotation.z = Math.PI / 2; // lies along -x from its origin
  rod.position.set(right, 4.22, BOOTH.front);
  g.add(rod);
  const sign = textTexture(
    512,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#0b0910';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#c9a8ff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${h * 0.5}px ${FONT}, sans-serif`;
      ctx.fillText('FITTING CRYPT', w / 2, h / 2);
    },
    [FONT_LOAD],
  );
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 0.55),
    new THREE.MeshBasicMaterial({ map: sign, toneMapped: false }),
  );
  plaque.position.set(BOOTH.x, 4.75, BOOTH.front + 0.8);
  g.add(plaque);
  const bulb = new THREE.PointLight(0x7fe9ff, 14, 8, 1.7);
  bulb.position.set(BOOTH.x, 3.6, BOOTH.front + 0.4);
  g.add(bulb);
  return {
    group: g,
    /** 0 closed … 1 open; `wobble` shakes the panels (someone is changing behind them). */
    setOpen(k: number, wobble = 0) {
      const s = 1 - 0.82 * k; // bunches toward the sides
      l.scale.x = r.scale.x = s;
      l.rotation.y = wobble;
      r.rotation.y = -wobble;
    },
  };
}

/** The checkout counter: register, a bowl with a ring in it (free with purchase, allegedly), and a receipt slot. */
function counter() {
  const g = new THREE.Group();
  const length = COUNTER.z1 - COUNTER.z0;
  const body = box(0.95, COUNTER.top, length, mat(0x1d1226, 0.55));
  body.position.set(COUNTER.x, 0, (COUNTER.z0 + COUNTER.z1) / 2);
  g.add(body);
  const top = box(1.15, 0.1, length + 0.2, mat(0x2f1f3a, 0.3, { metalness: 0.3 }));
  top.position.set(COUNTER.x - 0.05, COUNTER.top, (COUNTER.z0 + COUNTER.z1) / 2);
  g.add(top);
  const edge = box(0.05, 0.1, length + 0.2, new THREE.MeshBasicMaterial({ color: 0xff2fb4 }));
  edge.position.set(COUNTER.front - 0.05, COUNTER.top - 0.1, (COUNTER.z0 + COUNTER.z1) / 2);
  g.add(edge); // a magenta LED strip along the front

  const topY = COUNTER.top + 0.1;
  const register = new THREE.Group();
  register.position.set(COUNTER.x, topY, 0);
  const regBody = box(0.7, 0.45, 0.9, mat(0x0d0b12, 0.4));
  register.add(regBody);
  const display = (text: string) =>
    textTexture(
      256,
      128,
      (ctx, w, h) => {
        ctx.fillStyle = '#0a1a10';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#5dffa0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `700 ${h * 0.5}px ${ROUND}`;
        ctx.fillText(text, w / 2, h / 2);
      },
      ['700 40px Fredoka'],
    );
  const screens = [display('$0.00'), display('$6.66')].map(map => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.4),
      new THREE.MeshBasicMaterial({ map, toneMapped: false }),
    );
    m.rotation.set(-0.35, -Math.PI / 2, 0);
    m.position.set(-0.36, 0.78, 0);
    register.add(m);
    return m;
  });
  const stem = box(0.12, 0.35, 0.12, mat(0x0d0b12, 0.4));
  stem.position.set(0, 0.45, 0);
  register.add(stem);
  g.add(register);

  const bowl = new THREE.Group();
  bowl.position.set(COUNTER.x - 0.1, topY, 1.5);
  bowl.add(cylinder(0.42, 0.28, 0.2, mat(0x3a2418, 0.6)));
  const velvetCushion = cylinder(0.36, 0.36, 0.05, mat(0x6a0f2a, 0.9), 24);
  velvetCushion.position.y = 0.17;
  bowl.add(velvetCushion);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.1, 0.03, 14, 32),
    new THREE.MeshStandardMaterial({
      color: 0xffc83a,
      emissive: 0xff9a1a,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.2,
    }),
  );
  ring.position.y = 0.32;
  ring.rotation.x = Math.PI / 2 - 0.4;
  bowl.add(ring);
  const glow = new THREE.PointLight(0xffb02e, 0, 5, 1.8);
  glow.position.y = 0.6;
  bowl.add(glow);
  const card = textTexture(
    384,
    192,
    (ctx, w, h) => {
      ctx.fillStyle = '#f2ead8';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2a1a10';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${h * 0.27}px ${ROUND}`;
      ctx.fillText('ONE RING', w / 2, h * 0.3);
      ctx.fillText('FREE WITH', w / 2, h * 0.55);
      ctx.fillText('PURCHASE', w / 2, h * 0.8);
    },
    ['700 40px Fredoka'],
  );
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshBasicMaterial({ map: card }));
  sign.position.set(0.05, 0.55, 0.55);
  sign.rotation.set(-0.2, -Math.PI / 2, 0);
  bowl.add(sign);
  g.add(bowl);

  // the receipt printer
  const slot = box(0.45, 0.16, 0.5, mat(0x15121c, 0.5));
  slot.position.set(COUNTER.x - 0.1, topY, -0.4);
  g.add(slot);
  return { group: g, register, screens, bowl, ring, glow, topY };
}

/** A glass door with a bell, on the left wall. `setOpen(k)` swings it. */
function door() {
  const g = new THREE.Group();
  const frame = mat(0x120d18, 0.5);
  const pivot = new THREE.Group();
  pivot.position.set(DOOR.x, 0, DOOR.z - 1.2);
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 3.9, 2.4),
    new THREE.MeshPhysicalMaterial({ color: 0x9fb8ff, transparent: true, opacity: 0.22, roughness: 0.1 }),
  );
  glass.position.set(0, 1.95, 1.2);
  pivot.add(glass);
  const rail = box(0.14, 0.12, 2.4, frame);
  rail.position.set(0, 3.9, 1.2);
  pivot.add(rail);
  const handle = cylinder(0.04, 0.04, 0.8, mat(0xc8ccd8, 0.3, { metalness: 0.8 }), 10);
  handle.position.set(0.12, 1.4, 2.1);
  pivot.add(handle);
  const hang = textTexture(
    256,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#0b0910';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff6bd0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${h * 0.32}px ${FONT}, sans-serif`;
      ctx.fillText('OPEN', w / 2, h * 0.32);
      ctx.font = `${h * 0.17}px ${ROUND}`;
      ctx.fillStyle = '#c9a8ff';
      ctx.fillText('(spiritually closed)', w / 2, h * 0.72);
    },
    [FONT_LOAD],
  );
  const placard = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.45),
    new THREE.MeshBasicMaterial({ map: hang, toneMapped: false }),
  );
  placard.rotation.y = Math.PI / 2;
  placard.position.set(0.1, 2.6, 1.2);
  pivot.add(placard);
  g.add(pivot);
  const bell = ball(0.09, mat(0xffc83a, 0.3, { metalness: 0.8 }), [DOOR.x + 0.25, 4.15, DOOR.z], [1, 1.1, 1], 12);
  g.add(bell);
  return {
    group: g,
    setOpen(k: number) {
      pivot.rotation.y = -k * 1.35;
      bell.rotation.z = Math.sin(k * 40) * 0.3 * (k > 0 && k < 1 ? 1 : 0);
    },
  };
}

/** Swaps the solid left wall for one with a doorway in it, so Paris comes in through the door, not the wall. */
function cutDoorway(scene: THREE.Scene) {
  const solid = scene.children.find(o => o.position.x === -9 && (o as THREE.Mesh).isMesh)!;
  const wallMat = (solid as THREE.Mesh).material;
  scene.remove(solid);
  const z0 = DOOR.z - 1.2,
    z1 = DOOR.z + 1.2,
    H = 14,
    top = 3.95;
  const piece = (za: number, zb: number, ya: number, yb: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(zb - za, yb - ya), wallMat);
    m.rotation.y = Math.PI / 2;
    m.position.set(-9, (ya + yb) / 2, (za + zb) / 2);
    m.receiveShadow = true;
    scene.add(m);
  };
  piece(-4, z0, 0, H);
  piece(z1, 12, 0, H);
  piece(z0, z1, top, H);
  const night = new THREE.PointLight(0x6f86ff, 6, 8, 1.6); // moonlight from the street
  night.position.set(-11, 3, DOOR.z);
  scene.add(night);
}

/** Rot Hotic: a goth clothing store. Everything is black; even the receipts. */
export function createStore() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07050b);
  scene.fog = new THREE.Fog(0x07050b, 16, 34);
  createRoom(scene, { wall: 0x1a1124, floor: 0x120d18, width: 18, depth: 16, height: 14, back: -4 });
  cutDoorway(scene);

  // checkered floor
  const tiles = textTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#0f0b15';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1c1426';
    ctx.fillRect(0, 0, w / 2, h / 2);
    ctx.fillRect(w / 2, h / 2, w / 2, h / 2);
  });
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping;
  tiles.repeat.set(9, 8);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 16),
    new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.35, metalness: 0.2 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.01, 4);
  floor.receiveShadow = true;
  scene.add(floor);

  // wallpaper stripes on the back wall
  const paper = textTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#1a1124';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#231632';
    for (let x = 0; x < w; x += 64) ctx.fillRect(x, 0, 32, h);
    ctx.font = '36px sans-serif';
    ctx.globalAlpha = 0.16;
    for (let y = 40; y < h; y += 128) for (let x = 16; x < w; x += 128) ctx.fillText('🦇', x + ((y / 128) % 2) * 64, y);
  });
  paper.wrapS = paper.wrapT = THREE.RepeatWrapping;
  paper.repeat.set(4, 2);
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 14),
    new THREE.MeshStandardMaterial({ map: paper, roughness: 0.9 }),
  );
  wall.position.set(0, 7, -3.98);
  scene.add(wall);

  scene.add(new THREE.HemisphereLight(0xa88aea, 0x1a1024, 1.0));
  const key = new THREE.DirectionalLight(0xf2e4ff, 2.0);
  key.position.set(3, 9, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 5;
  Object.assign(key.shadow.camera, { left: -11, right: 11, top: 10, bottom: -3, near: 1, far: 30 });
  scene.add(key);
  // soft fills from the front so the characters are lit, not just outlined by the neon
  for (const [x, y, z, color, power] of [
    [-3, 6, 8, 0xffe6ff, 40],
    [4, 5, 8, 0xc9d8ff, 32],
  ] as const) {
    const fill = new THREE.PointLight(color, power, 26, 1.3);
    fill.position.set(x, y, z);
    scene.add(fill);
  }
  const warm = new THREE.PointLight(0xffa24a, 12, 12, 1.7);
  warm.position.set(COUNTER.front - 1, 3.4, 0.6);
  scene.add(warm);

  const sign = neonSign();
  sign.group.position.set(-0.4, 8.2, -3.88);
  scene.add(sign.group);

  const posters = [
    { text: 'NO REFUNDS\nONLY REGRETS', x: -3.4, y: 4.7, color: '#ff6bd0' },
    { text: 'BLACK IS\nA PERSONALITY', x: 4.2, y: 4.8, color: '#7fe9ff' },
  ];
  for (const p of posters) {
    const tex = textTexture(
      256,
      320,
      (ctx, w, h) => {
        ctx.fillStyle = '#0a0810';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 8;
        ctx.strokeRect(12, 12, w - 24, h - 24);
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${h * 0.12}px ${FONT}, sans-serif`;
        p.text.split('\n').forEach((line, i) => ctx.fillText(line, w / 2, h * (0.38 + i * 0.16)));
      },
      [FONT_LOAD],
    );
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 2.1),
      new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }),
    );
    m.position.set(p.x, p.y, -3.9);
    scene.add(m);
  }

  const rackA = rack(RACK.x0, RACK.x1, RACK.z, 5);
  scene.add(rackA.group);
  scene.add(shelves(3.9, 8.4));
  const booth = fittingRoom();
  scene.add(booth.group);
  const till = counter();
  scene.add(till.group);
  const entrance = door();
  scene.add(entrance.group);

  return { scene, sign, garments: rackA.garments, booth, till, entrance };
}

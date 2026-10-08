import * as THREE from 'three';
import { rng } from '../../engine/math';
import { box, cylinder, mat, picture, ROUND } from '../../world/interior';
import { textTexture } from '../../world/text-texture';
import { createTree } from '../../world/school';
import { createProteinBar, BAR_LENGTH, type ProteinBar } from '../../props/protein-bar';
import { sky } from '../monday-coffee/sets';

// ── Lulu's emergency protein stash ─────────────────────────────

const FLAVOURS = [
  ['#e2582b', 'Choc Fudge Brownie'],
  ['#3a7bd5', 'Cookies & Cream'],
  ['#d6336c', 'Raspberry Riff'],
  ['#2b2b35', 'Black Metal Mocha'],
  ['#f2a900', 'Salted Caramel'],
  ['#2f9e6a', 'Mint Choc Chip'],
] as const;

const CRATE = { w: 1.6, h: 0.5, d: 0.75 };
/** Bars stand on end in the crate (long side up, label to the front). */
export const UPRIGHT = new THREE.Euler(0, Math.PI / 2, Math.PI / 2);
const slot = (col: number, row: number) =>
  new THREE.Vector3(-CRATE.w / 2 + 0.17 + col * 0.255, 0.06 + BAR_LENGTH / 2, CRATE.d / 2 - 0.2 - row * 0.3);
/** Where the bar she grabs stands: front row, among the Choc Fudge (crate space). */
export const STASH_TOP = slot(0, 0);

/**
 * Lulu's emergency protein stash: a wooden crate on the kitchen counter with bars standing in neat rows, one
 * flavour per row, labels to the front, and a chalkboard tag: 40 g protein. Origin at the crate's base. `bar` is the one she
 * grabs (a separate prop, so it can leave the crate).
 */
export function createStash(): { group: THREE.Group; bar: ProteinBar } {
  const group = new THREE.Group();
  const wood = mat(0xd6a86a, 0.8);
  const dark = mat(0xa8784a, 0.85);
  // the crate: a floor and slatted sides, corner posts
  const floor = box(CRATE.w, 0.06, CRATE.d, dark);
  group.add(floor);
  for (const [w, d, x, z] of [
    [CRATE.w, 0.05, 0, CRATE.d / 2],
    [CRATE.w, 0.05, 0, -CRATE.d / 2],
    [0.05, CRATE.d, CRATE.w / 2, 0],
    [0.05, CRATE.d, -CRATE.w / 2, 0],
  ] as const)
    for (const y of [0.04, 0.24]) {
      const slat = box(w, 0.16, d, wood);
      slat.position.set(x, y, z);
      group.add(slat);
    }
  for (const x of [-1, 1])
    for (const z of [-1, 1]) {
      const post = box(0.07, CRATE.h, 0.07, dark);
      post.position.set((x * (CRATE.w - 0.04)) / 2, 0, (z * (CRATE.d - 0.04)) / 2);
      group.add(post);
    }
  // the bars: a row per flavour (front to back), standing on end
  for (let col = 0; col < 6; col++)
    for (let row = 0; row < 2; row++) {
      if (col === 0 && row === 0) continue; // the one she grabs
      const [colour, flavour] = FLAVOURS[row === 0 ? col : (col + 3) % FLAVOURS.length]!;
      const b = createProteinBar({ colour, flavour });
      b.group.position.copy(slot(col, row));
      b.group.rotation.copy(UPRIGHT);
      group.add(b.group);
    }
  const bar = createProteinBar();
  bar.group.position.copy(STASH_TOP);
  bar.group.rotation.copy(UPRIGHT);
  group.add(bar.group);
  // the chalkboard tag on the front
  const tag = picture(
    1.0,
    0.3,
    (ctx, w, h) => {
      ctx.fillStyle = '#23302a';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${h * 0.42}px ${ROUND}`;
      ctx.fillText('40 g protein', w / 2, h * 0.55);
    },
    { frame: 0x8a5a3a },
  );
  tag.position.set(0, 0.24, CRATE.d / 2 + 0.06);
  group.add(tag);
  return { group, bar };
}

// ── Papo Pako Shapeworks: the campus ───────────────────────────

/** The bench outside the HQ (faces +z) and where each of them sits on it. */
export const BENCH = { x: 0, z: 1.2, width: 7.4, top: 1.05 };
export const SEATS = { lulu: -2.3, rorit: -0.2, silvi: 1.9 } as const;
/** Where Lulu walks in from (the left), and where she stops to hand the bar over: just in front of Rorit. */
export const LULU_ENTER = new THREE.Vector3(-12, 0, 3.6);
export const LULU_HANDOFF = new THREE.Vector3(-1.4, 0, 2.95);

const ORANGE = '#ff7a1a';

/** The wordmark: "papo pako" over a spaced-out SHAPEWORKS, in orange. */
function drawLogo(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = ORANGE;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${h * 0.56}px ${ROUND}`;
  ctx.fillText('papo pako', w / 2, h * 0.38);
  ctx.font = `600 ${h * 0.2}px ${ROUND}`;
  ctx.fillText('S H A P E W O R K S', w / 2, h * 0.84);
}

/** A curtain-wall facade: sky-blue glass between white floor bands, with thin mullions. */
function glassFacade(floors: number, bays: number): THREE.Texture {
  const tex = textTexture(512, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#9fd0f0');
    g.addColorStop(0.5, '#5f98c4');
    g.addColorStop(1, '#a9d8f5');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // the sky's reflection: soft diagonal streaks
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    for (let i = -2; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(i * w * 0.25, h);
      ctx.lineTo(i * w * 0.25 + w * 0.12, h);
      ctx.lineTo(i * w * 0.25 + w * 0.42, 0);
      ctx.lineTo(i * w * 0.25 + w * 0.3, 0);
      ctx.fill();
    }
    ctx.fillStyle = '#f4f6f8';
    for (let f = 0; f <= floors; f++) ctx.fillRect(0, (f * h) / floors - 6, w, 12);
    ctx.fillStyle = 'rgba(40,60,80,0.55)';
    for (let b = 0; b <= bays; b++) ctx.fillRect((b * w) / bays - 1.5, 0, 3, h);
  });
  tex.anisotropy = 8;
  return tex;
}

function tower(w: number, h: number, d: number, floors: number, bays: number): THREE.Group {
  const g = new THREE.Group();
  const glass = new THREE.MeshStandardMaterial({ map: glassFacade(floors, bays), roughness: 0.15, metalness: 0.35 });
  const white = mat(0xf4f6f8, 0.6);
  const body = box(w, h, d, glass);
  g.add(body);
  const roof = box(w + 0.4, 0.5, d + 0.4, white);
  roof.position.y = h;
  g.add(roof);
  return g;
}

function planter(x: number, z: number, tree: THREE.Group, scene: THREE.Scene) {
  const p = box(2, 0.7, 2, mat(0xe9e4dc, 0.7));
  p.position.set(x, 0, z);
  scene.add(p);
  const soil = box(1.8, 0.05, 1.8, mat(0x4a3a2c, 1));
  soil.position.set(x, 0.66, z);
  scene.add(soil);
  tree.position.set(x, 0.7, z);
  scene.add(tree);
}

/** Ornamental grasses: a tuft of thin blades. */
function grasses(r: () => number): THREE.Group {
  const g = new THREE.Group();
  const m = mat(0x9db86a, 0.9);
  for (let i = 0; i < 14; i++) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.04, 1.1 + r() * 0.5, 4), m);
    const a = r() * Math.PI * 2;
    blade.position.set(Math.cos(a) * 0.15, 0.5, Math.sin(a) * 0.15);
    blade.rotation.set(Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35);
    g.add(blade);
  }
  return g;
}

/**
 * The campus of Papo Pako Shapeworks, a fancy tech company: a glass HQ with the big orange wordmark up top, a
 * glass entrance with a canopy, a monument sign out front, wings either side, planters with trees, a fountain,
 * Silvi's sign of the day's wellbeing activities, and the bench out front where the three of them sit.
 */
export function createCampus() {
  const scene = new THREE.Scene();
  scene.background = sky('#7fbef5', '#cfe6fb', '#fff1dc');
  scene.fog = new THREE.Fog(0xdcebfa, 40, 90);
  scene.add(new THREE.HemisphereLight(0xeef6ff, 0xb8b0a0, 1.2));
  const sun = new THREE.DirectionalLight(0xfff0d8, 2.4);
  sun.position.set(8, 14, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 5;
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 14, bottom: -6, near: 1, far: 50 });
  scene.add(sun);

  // the plaza: big pale stone slabs, lawn strips either side
  const slabs = textTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#e6e1d8';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d2cbbf';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (i * h) / 2);
      ctx.lineTo(w, (i * h) / 2);
      ctx.moveTo((i * w) / 2, 0);
      ctx.lineTo((i * w) / 2, h);
      ctx.stroke();
    }
  });
  slabs.wrapS = slabs.wrapT = THREE.RepeatWrapping;
  slabs.repeat.set(20, 10);
  const plaza = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 40),
    new THREE.MeshStandardMaterial({ map: slabs, roughness: 0.85 }),
  );
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.z = -2;
  plaza.receiveShadow = true;
  scene.add(plaza);
  for (const x of [-16, 16]) {
    const lawn = box(14, 0.08, 9, mat(0x7cbf5a, 0.95));
    lawn.position.set(x, 0, 2);
    scene.add(lawn);
  }

  // the HQ: glass, white floor bands; the orange wordmark mounted on the glass, top right
  const hq = tower(26, 17, 9, 5, 12);
  hq.position.set(0, 0, -16);
  scene.add(hq);
  const SIGN_W = 19,
    SIGN_H = 3.8;
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(SIGN_W, SIGN_H),
    new THREE.MeshStandardMaterial({
      transparent: true,
      roughness: 0.4,
      emissive: 0xff7a1a,
      emissiveIntensity: 0.25,
      map: textTexture(1024, 205, (ctx, w, h) => drawLogo(ctx, w, h), ['700 40px Fredoka', '600 40px Fredoka']),
    }),
  );
  sign.position.set(0, 14.4, -11.45);
  scene.add(sign);
  // the entrance: a glass atrium with a white canopy
  const atrium = box(
    6,
    4.2,
    1.2,
    new THREE.MeshPhysicalMaterial({ color: 0xcfe8f7, roughness: 0.05, transmission: 0.5, metalness: 0.2 }),
  );
  atrium.position.set(-4, 0, -11.1);
  scene.add(atrium);
  for (const x of [-6.9, -1.1]) {
    const post = box(0.25, 4.6, 0.25, mat(0xf4f6f8, 0.5));
    post.position.set(x, 0, -9.0);
    scene.add(post);
  }
  const canopy = box(7, 0.25, 3.2, mat(0xf4f6f8, 0.5));
  canopy.position.set(-4, 4.6, -10.0);
  scene.add(canopy);

  // the wings: lower, white with ribbon windows
  const left = tower(16, 10, 10, 3, 8);
  left.position.set(-22, 0, -12);
  left.rotation.y = 0.35;
  scene.add(left);
  const right = tower(14, 12, 10, 4, 7);
  right.position.set(22, 0, -13);
  right.rotation.y = -0.35;
  scene.add(right);

  // the monument sign out front: a long white stone block, the logo in orange
  const monument = box(6.4, 1.6, 0.8, mat(0xf7f5f0, 0.6));
  monument.position.set(-8, 0, -4);
  scene.add(monument);
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 1.2),
    new THREE.MeshStandardMaterial({
      transparent: true,
      roughness: 0.5,
      map: textTexture(1024, 205, (ctx, w, h) => drawLogo(ctx, w, h), ['700 40px Fredoka', '600 40px Fredoka']),
    }),
  );
  plate.position.set(-8, 0.82, -3.58);
  scene.add(plate);

  // a round fountain
  const pool = cylinder(2.2, 2.3, 0.6, mat(0xf0ece4, 0.6), 40);
  pool.position.set(10, 0, -5);
  scene.add(pool);
  const water = cylinder(
    2.0,
    2.0,
    0.05,
    new THREE.MeshStandardMaterial({ color: 0x6fc3e8, roughness: 0.1, metalness: 0.2 }),
    40,
  );
  water.position.set(10, 0.5, -5);
  scene.add(water);
  const jet = cylinder(
    0.05,
    0.18,
    2.2,
    new THREE.MeshStandardMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.55 }),
  );
  jet.position.set(10, 0.5, -5);
  scene.add(jet);

  // planters with trees, grasses
  const r = rng(91);
  const trees = [createTree(r), createTree(r), createTree(r)];
  planter(-6.2, -0.8, trees[0]!, scene);
  planter(6.0, -1.2, trees[1]!, scene);
  planter(-13, -5, trees[2]!.clone(), scene);
  for (const [x, z] of [
    [-4.4, 0.0],
    [4.2, -0.2],
    [-11, 0.5],
    [13, 0.2],
  ] as const) {
    const tuft = grasses(r);
    tuft.position.set(x, 0, z);
    scene.add(tuft);
  }

  // the bench: thick wooden slats on two concrete blocks, a low back
  const bench = new THREE.Group();
  const wood = mat(0xb07a4a, 0.7);
  for (let i = 0; i < 5; i++) {
    const slat = box(BENCH.width, 0.12, 0.3, wood);
    slat.position.set(0, BENCH.top - 0.12, -0.7 + i * 0.34);
    bench.add(slat);
  }
  for (let i = 0; i < 3; i++) {
    const back = box(BENCH.width, 0.22, 0.12, wood);
    back.position.set(0, BENCH.top + 0.4 + i * 0.32, -0.95);
    back.rotation.x = -0.1;
    bench.add(back);
  }
  for (const x of [-BENCH.width / 2 + 0.6, BENCH.width / 2 - 0.6]) {
    const leg = box(0.7, BENCH.top - 0.12, 1.6, mat(0xc9c4ba, 0.85));
    leg.position.set(x, 0, -0.05);
    bench.add(leg);
    const upright = box(0.2, 1.3, 0.14, mat(0x6b6b70, 0.4));
    upright.position.set(x, BENCH.top - 0.12, -1.0);
    bench.add(upright);
  }
  bench.position.set(BENCH.x, 0, BENCH.z);
  scene.add(bench);

  // Silvi's sign: today's wellbeing
  const board = picture(
    1.6,
    2.2,
    (ctx, w, h) => {
      ctx.fillStyle = '#1e2a22';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffb36b';
      ctx.textAlign = 'center';
      ctx.font = `700 ${w * 0.11}px ${ROUND}`;
      ctx.fillText('TODAY ✨', w / 2, h * 0.14);
      ctx.fillStyle = '#ffffff';
      ctx.font = `600 ${w * 0.085}px ${ROUND}`;
      ['🧘 Goat yoga', '🍵 Kombucha bar', '🙏 Gratitude wall', '🎸 Air guitar hour'].forEach((l, i) =>
        ctx.fillText(l, w / 2, h * (0.32 + i * 0.16)),
      );
    },
    { frame: 0xb07a4a },
  );
  board.position.set(5.3, 1.3, 2.4);
  board.rotation.set(-0.15, -0.35, 0);
  scene.add(board);

  return { scene };
}

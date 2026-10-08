import * as THREE from 'three';
import { rng } from '../../engine/math';
import { ball, enableShadows } from '../../characters/materials';
import { box, createRoom, createWallClock, cylinder, mat, picture, ROUND } from '../../world/interior';
import { textTexture } from '../../world/text-texture';
import { createSchool, createTree, type SchoolOptions } from '../../world/school';
import { createSeat } from '../../props/furniture';

// Where things are, for the choreography. Every set faces the camera at +z.

/** The school's front door, where the kids go in. */
export const SCHOOL_DOOR = new THREE.Vector3(0, 0, -4.2);
/** Where the parent stands on the pavement, and where their kid starts walking from. */
export const PARENT_SPOT = new THREE.Vector3(-2.4, 0, 3.0);
export const KID_START = new THREE.Vector3(-1.2, 0, 2.6);

/** Three kids, three schools. */
export const SCHOOLS = {
  tiki: { name: 'School of Rock' },
  paris: {
    name: 'St. Raven’s Academy',
    font: "'Cinzel', serif",
    weight: '700',
    ink: '#e9e1f5',
    board: '#2a2233',
    wall: 0x8f86a3,
    roof: 0x2b2a35,
    door: 0x3b2d4a,
  },
  steggy: {
    name: 'Little Einsteins Lab School',
    font: 'Fredoka, sans-serif',
    weight: '700',
    ink: '#1f5f8b',
    board: '#ffffff',
    wall: 0xcfe6f2,
    roof: 0x3a9a8f,
    door: 0x3a9a8f,
  },
} satisfies Record<string, SchoolOptions>;

/** The therapist's office: Lulu's couch on the left, the therapist's armchair on the right. */
export const COUCH = { x: -2.6, z: 0.2, yaw: 0.75 };
export const ARMCHAIR = { x: 3.0, z: 0.6, yaw: -0.95 };

/** The street café on Elm St: a bistro table on the pavement and three big armchairs. */
export const CAFE_TABLE = new THREE.Vector3(0, 0, 1.4);
export const CAFE_CHAIRS = {
  tiki: { x: -2.9, z: 1.8, yaw: 1.2 },
  paris: { x: 0, z: -1.0, yaw: 0 },
  steggy: { x: 2.9, z: 1.8, yaw: -1.2 },
};

/** A vertical sky gradient, for `scene.background`. */
export function sky(top: string, mid: string, bottom: string): THREE.Texture {
  return textTexture(4, 256, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, top);
    gr.addColorStop(0.6, mid);
    gr.addColorStop(1, bottom);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
  });
}

/** Monday 8:10 AM outside a school: low warm sun, the pavement, a picket fence with the gate open. */
export function createSchoolGate(options: SchoolOptions, seed = 31) {
  const scene = new THREE.Scene();
  scene.background = sky('#8fc9ff', '#d7ecff', '#ffe9cc');
  scene.fog = new THREE.Fog(0xe4f0ff, 30, 70);
  scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x9fcf8a, 1.2));
  const sun = new THREE.DirectionalLight(0xffe2b8, 2.4); // low morning sun
  sun.position.set(-8, 7, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 5;
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 12, bottom: -8, near: 1, far: 40 });
  scene.add(sun);

  const grass = new THREE.Mesh(new THREE.PlaneGeometry(120, 80), mat(0x6cbf5c, 1));
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  scene.add(grass);
  // the pavement in front, the path up to the door
  const stone = mat(0xd9d4c8, 0.9);
  const pavement = box(40, 0.06, 4.2, stone);
  pavement.position.set(0, 0, 3.4);
  scene.add(pavement);
  const path = box(2.6, 0.05, 5.4, stone);
  path.position.set(0, 0, -1.6);
  scene.add(path);
  const road = box(40, 0.04, 5, mat(0x4a4d55, 0.8));
  road.position.set(0, 0, 8);
  scene.add(road);

  const school = createSchool(options);
  school.position.set(0, 0, -6.2); // its front wall (and the door) at z = -4.2
  scene.add(school);

  // white picket fence along the front, open where the path goes through
  const white = mat(0xffffff, 0.6);
  for (let x = -16; x <= 16; x += 0.55) {
    if (Math.abs(x) < 1.5) continue;
    const picket = box(0.14, 1.0, 0.06, white);
    picket.position.set(x, 0, 1.2);
    scene.add(picket);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 4), white);
    tip.rotation.y = Math.PI / 4;
    tip.position.set(x, 1.09, 1.2);
    scene.add(tip);
  }
  for (const s of [-1, 1]) {
    const rail = box(14.5, 0.08, 0.04, white);
    rail.position.set(s * 8.75, 0.55, 1.17);
    scene.add(rail);
    const post = box(0.3, 1.5, 0.3, white);
    post.position.set(s * 1.6, 0, 1.2);
    scene.add(post);
    scene.add(ball(0.18, white, [s * 1.6, 1.6, 1.2]));
  }

  const r = rng(seed);
  const trees = [createTree(r), createTree(r), createTree(r)];
  [-13, -9.5, 9, 12.5, -17, 16].forEach((x, i) => {
    const t = trees[i % 3]!.clone();
    t.position.set(x, 0, -3 - (i % 2) * 2.5);
    t.rotation.y = r() * 6;
    t.scale.setScalar(1.3 + r() * 0.4);
    scene.add(t);
  });
  // a bike rack, because every school has one
  const steel = mat(0xb8bcc6, 0.3, { metalness: 0.7 });
  for (let i = 0; i < 4; i++) {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.04, 8, 20, Math.PI), steel);
    hoop.position.set(5 + i * 0.6, 0, -1.6);
    hoop.rotation.y = Math.PI / 2;
    scene.add(hoop);
  }
  enableShadows(scene);
  return { scene };
}

/** A painted frame with text: diplomas, posters, a menu. */
function sign(w: number, h: number, lines: readonly [string, string, number][], bg: string, frame = 0x6b4a2b) {
  return picture(
    w,
    h,
    (ctx, cw, ch) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, cw, ch);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      lines.forEach(([text, colour, size], i) => {
        ctx.fillStyle = colour;
        ctx.font = size > 0 ? `700 ${ch * size}px ${ROUND}` : `${ch * -size}px 'Metal Mania', serif`;
        ctx.fillText(text, cw / 2, ch * ((i + 1) / (lines.length + 1)));
      });
    },
    { frame },
  );
}

/** Dr. Shell's office: calm sage walls, a long couch, an armchair, tissues, a plant, diplomas and a clock at 8:30. */
export function createTherapy() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcfdac6);
  createRoom(scene, { wall: 0xcfdac6, floor: 0xa47652, width: 18, height: 10 });
  scene.add(new THREE.HemisphereLight(0xfff8ec, 0x8a6a50, 1.15));
  const key = new THREE.DirectionalLight(0xffe7c4, 2.0); // morning sun through the window
  key.position.set(-6, 8, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 5;
  Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -3, near: 1, far: 30 });
  scene.add(key);
  const lampLight = new THREE.PointLight(0xffc98a, 8, 9, 1.6);
  lampLight.position.set(5.6, 4.2, -1.6);
  scene.add(lampLight);

  const rug = new THREE.Mesh(new THREE.CircleGeometry(3.6, 48), mat(0xe6d3b3, 1));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0.2, 0.02, 0.6);
  rug.scale.y = 0.7;
  rug.receiveShadow = true;
  scene.add(rug);

  const couch = createSeat({ width: 5.2, colour: 0x6f8fb4 });
  couch.position.set(COUCH.x, 0, COUCH.z);
  couch.rotation.y = COUCH.yaw;
  scene.add(couch);
  const armchair = createSeat({ width: 2.6, colour: 0x9a5b4b });
  armchair.position.set(ARMCHAIR.x, 0, ARMCHAIR.z);
  armchair.rotation.y = ARMCHAIR.yaw;
  scene.add(armchair);

  // a low table with a box of tissues (essential) and a glass of water
  const table = new THREE.Group();
  const top = cylinder(0.85, 0.85, 0.1, mat(0xe9dcc6, 0.5), 32);
  top.position.y = 0.9;
  table.add(top);
  table.add(cylinder(0.12, 0.2, 0.9, mat(0x4a3020, 0.6), 12));
  const tissues = box(0.6, 0.32, 0.36, mat(0x9ad1d4, 0.7));
  tissues.position.set(-0.2, 1.0, 0);
  table.add(tissues);
  const tissue = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 6), mat(0xffffff, 0.9));
  tissue.position.set(-0.2, 1.45, 0);
  table.add(tissue);
  const glass = cylinder(0.12, 0.1, 0.36, mat(0xcfe8ff, 0.05, { transparent: true, opacity: 0.5 }), 16);
  glass.position.set(0.35, 1.0, 0.1);
  table.add(glass);
  table.position.set(0.4, 0, 1.4);
  scene.add(table);

  // the window, morning outside
  const view = picture(
    3.6,
    2.6,
    (ctx, w, h) => {
      const gr = ctx.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#9fd2ff');
      gr.addColorStop(1, '#fff1d8');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#7cc46a';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(w * (0.1 + i * 0.17), h * 0.85, h * (0.18 + (i % 2) * 0.06), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, w, h);
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();
    },
    { frame: 0xf4f4f4 },
  );
  view.position.set(-3.8, 5.2, -3.95);
  scene.add(view);

  // diplomas and a calm poster on the back wall
  const phd = sign(
    1.6,
    1.2,
    [
      ['Dr. Shell', '#3a2a1a', 0.16],
      ['PhD in Feelings', '#6b4a2b', 0.11],
      ['🦕', '#000', 0.22],
    ],
    '#fbf3df',
    0xc9a24a,
  );
  phd.position.set(1.4, 5.6, -3.95);
  scene.add(phd);
  const calm = sign(
    1.6,
    2.2,
    [
      ['KEEP', '#2f4f6f', 0.14],
      ['CALM', '#2f4f6f', 0.14],
      ['AND', '#2f4f6f', 0.08],
      ['BREATHE', '#2f4f6f', 0.12],
    ],
    '#e7f0f7',
    0x2f4f6f,
  );
  calm.position.set(3.6, 5.4, -3.95);
  scene.add(calm);

  const clock = createWallClock(0.55);
  clock.group.position.set(-0.6, 6.4, -3.9);
  clock.set(8, 30);
  scene.add(clock.group);

  // bookshelf, floor lamp, a big plant
  const shelf = new THREE.Group();
  const wood = mat(0x6b4a2b, 0.6);
  const frame = box(2.4, 4.4, 0.7, wood);
  shelf.add(frame);
  const r = rng(5);
  for (let row = 0; row < 4; row++) {
    let x = -1.05;
    while (x < 1.0) {
      const w = 0.12 + r() * 0.14;
      const book = box(
        w,
        0.55 + r() * 0.25,
        0.5,
        mat([0x8a3b3b, 0x2f5f8a, 0xd9a441, 0x4f7f5a, 0x7a5a9a][Math.floor(r() * 5)]!, 0.8),
      );
      book.position.set(x + w / 2, 0.25 + row * 1.05, 0.12);
      shelf.add(book);
      x += w + 0.02;
    }
  }
  shelf.position.set(6.4, 0, -3.3);
  scene.add(shelf);
  const lamp = new THREE.Group();
  lamp.add(cylinder(0.04, 0.04, 4.0, mat(0x2a2a30, 0.4), 8));
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 0.6, 24, 1, true), mat(0xf6ead2, 0.9));
  shade.position.y = 4.1;
  lamp.add(shade);
  lamp.position.set(5.6, 0, -1.6);
  scene.add(lamp);
  const plant = new THREE.Group();
  plant.add(cylinder(0.5, 0.4, 0.9, mat(0xe07a5f, 0.8)));
  const leaf = mat(0x4f9a5a, 0.8);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    plant.add(ball(0.45, leaf, [Math.cos(a) * 0.4, 1.4 + (i % 3) * 0.45, Math.sin(a) * 0.4], [0.5, 1.4, 0.5], 14));
  }
  plant.position.set(-7.2, 0, -2.6);
  scene.add(plant);

  enableShadows(scene);
  return { scene };
}

/** A coffee cup on a saucer; `drink` colours the top. */
export function createCup(cup: number, drink: number): THREE.Group {
  const g = new THREE.Group();
  const saucer = cylinder(0.32, 0.26, 0.05, mat(cup, 0.3), 28);
  g.add(saucer);
  const body = cylinder(0.2, 0.15, 0.32, mat(cup, 0.3), 28);
  body.position.y = 0.05;
  g.add(body);
  const top = cylinder(0.185, 0.185, 0.01, mat(drink, 0.4), 28);
  top.position.y = 0.33;
  g.add(top);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 8, 16), mat(cup, 0.3));
  handle.position.set(0.22, 0.22, 0);
  g.add(handle);
  enableShadows(g);
  return g;
}

/** A shopfront window: a warm interior glimpsed through glass, with a frame and mullions. */
function shopWindow(w: number, h: number, frame: number, glow = '#ffd9a0') {
  return picture(
    w,
    h,
    (ctx, cw, ch) => {
      const gr = ctx.createLinearGradient(0, 0, cw * 0.4, ch);
      gr.addColorStop(0, '#cfe6f5');
      gr.addColorStop(0.35, glow);
      gr.addColorStop(1, '#6b4a2b');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, cw, ch);
      // shelves and lights inside
      ctx.fillStyle = 'rgba(60,35,20,0.5)';
      for (const y of [0.45, 0.65]) ctx.fillRect(cw * 0.08, ch * y, cw * 0.84, ch * 0.03);
      ctx.fillStyle = 'rgba(255,240,200,0.9)';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(cw * (0.2 + i * 0.2), ch * 0.18, ch * 0.03, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; // reflection
      ctx.beginPath();
      ctx.moveTo(cw * 0.1, ch);
      ctx.lineTo(cw * 0.3, ch);
      ctx.lineTo(cw * 0.7, 0);
      ctx.lineTo(cw * 0.5, 0);
      ctx.fill();
    },
    { frame },
  );
}

/** A storefront building: walls, a row of upper windows with flower boxes, and its shop window below. */
function building(width: number, height: number, wall: number, trim: number, shop: string) {
  const g = new THREE.Group();
  const body = box(width, height, 3, mat(wall, 0.9));
  body.position.z = -1.5;
  g.add(body);
  const cornice = box(width + 0.4, 0.4, 3.4, mat(trim, 0.6));
  cornice.position.set(0, height, -1.5);
  g.add(cornice);
  for (let i = 0; i < Math.floor(width / 2.6); i++) {
    const x = -width / 2 + 1.4 + i * 2.6;
    const win = shopWindow(1.4, 1.9, trim, '#fff0d0');
    win.position.set(x, height - 2.2, 0.02);
    g.add(win);
    const flowers = box(1.5, 0.35, 0.4, mat(0x6b4a2b, 0.8));
    flowers.position.set(x, height - 3.4, 0.2);
    g.add(flowers);
    for (let k = 0; k < 4; k++)
      g.add(
        ball(
          0.16,
          mat([0xff6b8b, 0xffd36b, 0xffffff, 0xc79bff][k]!, 0.8),
          [x - 0.5 + k * 0.33, height - 2.95, 0.25],
          [1, 0.8, 1],
          10,
        ),
      );
  }
  const front = shopWindow(width - 1.6, 2.6, trim);
  front.position.set(0, 1.9, 0.02);
  g.add(front);
  const label = picture(
    width - 1.6,
    0.6,
    (ctx, cw, ch) => {
      ctx.fillStyle = `#${new THREE.Color(trim).getHexString()}`;
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${ch * 0.6}px ${ROUND}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(shop, cw / 2, ch * 0.55);
    },
    { frame: null },
  );
  label.position.set(0, 3.6, 0.04);
  g.add(label);
  return g;
}

/**
 * The new café on Elm St, a sunny Monday morning: a cream shopfront with big windows and a striped awning,
 * neighbours either side (a bakery and a bookshop), trees in planters, a street lamp with the street sign, and
 * a round table on the pavement with three very big armchairs.
 */
export function createStreetCafe() {
  const scene = new THREE.Scene();
  scene.background = sky('#8fc9ff', '#d7ecff', '#fff1dc');
  scene.fog = new THREE.Fog(0xe4f0ff, 30, 70);
  scene.add(new THREE.HemisphereLight(0xeef6ff, 0xb0a08a, 1.25));
  const sun = new THREE.DirectionalLight(0xffe6c0, 2.3);
  sun.position.set(-7, 10, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 5;
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 12, bottom: -6, near: 1, far: 40 });
  scene.add(sun);

  // pavement (with paving lines), kerb, road
  const paving = textTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d8d2c6';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c4bdaf';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (i * h) / 4);
      ctx.lineTo(w, (i * h) / 4);
      ctx.moveTo((i * w) / 4, 0);
      ctx.lineTo((i * w) / 4, h);
      ctx.stroke();
    }
  });
  paving.wrapS = paving.wrapT = THREE.RepeatWrapping;
  paving.repeat.set(12, 3);
  const pavement = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 10),
    new THREE.MeshStandardMaterial({ map: paving, roughness: 0.9 }),
  );
  pavement.rotation.x = -Math.PI / 2;
  pavement.position.set(0, 0.02, 1);
  pavement.receiveShadow = true;
  scene.add(pavement);
  const kerb = box(60, 0.18, 0.4, mat(0xbdb6a8, 0.8));
  kerb.position.set(0, 0, 6.1);
  scene.add(kerb);
  const road = box(60, 0.02, 12, mat(0x4a4d55, 0.85));
  road.position.set(0, 0, 12.2);
  scene.add(road);

  // the café: cream walls, black trim, two big windows either side of the door
  const cafe = new THREE.Group();
  const wall = box(11, 8, 3, mat(0xf3e9d8, 0.9));
  wall.position.z = -1.5;
  cafe.add(wall);
  for (const x of [-3.0, 3.0]) {
    const win = shopWindow(3.6, 3.2, 0x1d1a20);
    win.position.set(x, 2.3, 0.02);
    cafe.add(win);
  }
  const door = box(1.6, 3.4, 0.1, mat(0x1d1a20, 0.5));
  door.position.set(0, 0, 0.02);
  cafe.add(door);
  const doorGlass = box(1.1, 1.8, 0.02, mat(0xcfe6f5, 0.1, { transparent: true, opacity: 0.7 }));
  doorGlass.position.set(0, 1.4, 0.09);
  cafe.add(doorGlass);
  const name = picture(
    7,
    1.2,
    (ctx, cw, ch) => {
      ctx.fillStyle = '#1d1a20';
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = '#f3e9d8';
      ctx.font = `700 ${ch * 0.55}px 'Cinzel', serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CAFÉ NOIR', cw / 2, ch * 0.55);
    },
    { frame: null },
  );
  name.position.set(0, 6.6, 0.04);
  cafe.add(name);
  // the striped awning, sloping out over the pavement, with a scalloped valance
  const stripes = textTexture(256, 64, (ctx, w, h) => {
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 ? '#f3e9d8' : '#1d1a20';
      ctx.fillRect((i * w) / 16, 0, w / 16, h);
    }
  });
  const awning = new THREE.Mesh(
    new THREE.PlaneGeometry(10.4, 2.4),
    new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.9, side: THREE.DoubleSide }),
  );
  awning.rotation.x = -Math.PI / 2 + 0.45;
  awning.position.set(0, 4.95, 1.1);
  cafe.add(awning);
  for (let i = 0; i < 16; i++) {
    const flap = new THREE.Mesh(
      new THREE.CircleGeometry(0.33, 16, Math.PI, Math.PI),
      mat(i % 2 ? 0xf3e9d8 : 0x1d1a20, 0.9),
    );
    flap.position.set(-5.2 + 0.325 + i * 0.65, 4.42, 2.18);
    cafe.add(flap);
  }
  const menuBoard = picture(
    1.1,
    1.6,
    (ctx, cw, ch) => {
      ctx.fillStyle = '#1a1a1c';
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = `700 ${ch * 0.09}px ${ROUND}`;
      ['TODAY', 'Black coffee', 'Blacker coffee', 'Matcha', '(fine, Steggy)'].forEach((l, i) =>
        ctx.fillText(l, cw / 2, ch * (0.18 + i * 0.17)),
      );
    },
    { frame: 0x6b4a2b },
  );
  menuBoard.position.set(4.3, 0.9, 2.6);
  menuBoard.rotation.x = -0.2;
  cafe.add(menuBoard);
  cafe.position.z = -3.5;
  scene.add(cafe);

  const bakery = building(8, 9, 0xd98a6a, 0x7a3b2b, 'BAKERY');
  bakery.position.set(-9.5, 0, -3.5);
  scene.add(bakery);
  const books = building(8, 7.5, 0x8fb0d0, 0x2f4f6f, 'BOOKS');
  books.position.set(9.5, 0, -3.5);
  scene.add(books);

  // trees in planters, the street lamp with the street sign
  const r = rng(77);
  const trees = [createTree(r), createTree(r)];
  for (const [x, i] of [
    [-6.4, 0],
    [7.0, 1],
  ] as const) {
    const planter = box(1.6, 0.8, 1.6, mat(0x6b5a4a, 0.8));
    planter.position.set(x, 0, 4.4);
    scene.add(planter);
    const t = trees[i]!.clone();
    t.position.set(x, 0.8, 4.4);
    t.scale.setScalar(1.15);
    scene.add(t);
  }
  const lamp = new THREE.Group();
  const iron = mat(0x1d1a20, 0.4, { metalness: 0.5 });
  lamp.add(cylinder(0.08, 0.12, 5.6, iron, 10));
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.6, 6), iron);
  head.position.y = 5.9;
  head.rotation.x = Math.PI;
  lamp.add(head);
  const streetSign = picture(
    1.6,
    0.42,
    (ctx, cw, ch) => {
      ctx.fillStyle = '#1f6f4f';
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${ch * 0.6}px ${ROUND}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Elm St', cw / 2, ch * 0.55);
    },
    { frame: 0xffffff },
  );
  streetSign.position.set(0.8, 4.3, 0);
  lamp.add(streetSign);
  lamp.position.set(-10.5, 0, 5.2);
  scene.add(lamp);

  // the bistro table and the three very big armchairs
  const table = new THREE.Group();
  const top = cylinder(1.25, 1.25, 0.1, mat(0x2a2a30, 0.35, { metalness: 0.6 }), 40);
  top.position.y = 1.35;
  table.add(top);
  table.add(cylinder(0.08, 0.08, 1.35, iron, 12));
  const foot = cylinder(0.6, 0.6, 0.06, iron, 24);
  table.add(foot);
  table.position.copy(CAFE_TABLE);
  scene.add(table);
  const chairColours = { tiki: 0xc98f5a, paris: 0x3b2d4a, steggy: 0x5f9a7a };
  for (const [who, spot] of Object.entries(CAFE_CHAIRS)) {
    const chair = createSeat({ width: 3.0, colour: chairColours[who as keyof typeof chairColours] });
    chair.position.set(spot.x, 0, spot.z);
    chair.rotation.y = spot.yaw;
    chair.scale.setScalar(1.15); // BIG chairs
    scene.add(chair);
  }
  enableShadows(scene);
  return { scene };
}

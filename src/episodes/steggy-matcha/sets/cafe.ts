import * as THREE from 'three';
import { box, createRoom, cylinder, mat, picture, ROUND } from '../../../world/interior';
import { createLaptop } from '../../../props/laptop';
import { createMatchaCup } from '../../../props/matcha';
import { ball } from '../../../characters/materials';

export const TABLE_TOP = 1.65;
export const TABLE = new THREE.Vector3(0, 0, 0.5);
/** They sit facing each other across a round café table: Steggy on the right, Rory on the left. */
export const STEGGY_SEAT = new THREE.Vector3(1.95, 0.75, 0.5);
export const RORY_SEAT = new THREE.Vector3(-1.95, 0.75, 0.5);
/** Where Rory stands at the bar before bringing the matcha over. */
export const RORY_BAR = new THREE.Vector3(-3.1, 0, -2.1);
export const DOOR_SPOT = new THREE.Vector3(6.2, 0, -2.6);

function chalkboard(): THREE.Group {
  return picture(
    3.4,
    2.3,
    (ctx, w, h) => {
      ctx.fillStyle = '#1f2a24';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f4f1ea';
      ctx.textAlign = 'center';
      ctx.font = `700 ${h * 0.12}px ${ROUND}`;
      ctx.fillText('MENU', w / 2, h * 0.16);
      ctx.textAlign = 'left';
      ctx.font = `600 ${h * 0.075}px ${ROUND}`;
      const rows: [string, string, string][] = [
        ['Matcha 🍵', 'healthy', '#b9dc8f'],
        ['Prog-presso', 'in 7/8', '#f4f1ea'],
        ['Polyrhythm chai', '5 over 4', '#f4f1ea'],
        ['20-min epic latte', 'refills', '#f4f1ea'],
        ['4/4 decaf', 'not served', '#ff8a8a'],
      ];
      rows.forEach(([item, price, color], i) => {
        const y = h * (0.34 + i * 0.13);
        ctx.fillStyle = color;
        ctx.fillText(item, w * 0.07, y);
        ctx.textAlign = 'right';
        ctx.fillText(price, w * 0.93, y);
        ctx.textAlign = 'left';
      });
    },
    { frame: 0x6b4a2b },
  );
}

/**
 * The coffee shop where Rory works: a bar with the espresso machine at the back, a chalkboard menu with prog
 * drinks, a round table with two stools, a pendant lamp, plants, the door with a bell, and two matcha.
 */
export function createCafe() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf1e4d3);
  createRoom(scene, { wall: 0xf1e4d3, floor: 0x8a5a3b });

  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x7a5a40, 1.05));
  const key = new THREE.DirectionalLight(0xffe8cc, 1.9);
  key.position.set(3, 9, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 5;
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 9, bottom: -2, near: 1, far: 30 });
  scene.add(key);

  // brick back wall
  const bricks = picture(
    16,
    9,
    (ctx, w, h) => {
      ctx.fillStyle = '#e8d3bd';
      ctx.fillRect(0, 0, w, h);
      const bw = w / 28,
        bh = h / 30;
      for (let r = 0; r < 30; r++)
        for (let c = -1; c < 29; c++) {
          ctx.fillStyle = (r * 7 + c * 3) % 5 ? '#b5674d' : '#a45a43';
          ctx.fillRect(c * bw + (r % 2 ? bw / 2 : 0) + 2, r * bh + 2, bw - 4, bh - 4);
        }
    },
    { px: 1024, frame: null },
  );
  bricks.position.set(0, 4.5, -3.99);
  scene.add(bricks);

  const menu = chalkboard();
  menu.position.set(-2.6, 5.2, -3.9);
  scene.add(menu);

  // back counter with the espresso machine and matcha tins (behind Rory)
  const back = box(4.2, 1.5, 1, mat(0x3d2a1e, 0.6));
  back.position.set(-3.4, 0, -3.3);
  scene.add(back);
  const machine = box(1.3, 1, 0.8, mat(0xc8ccd4, 0.2, { metalness: 0.8 }));
  machine.position.set(-3.9, 1.5, -3.3);
  scene.add(machine);
  for (let i = 0; i < 4; i++) {
    const tin = cylinder(0.14, 0.14, 0.35, mat(i % 2 ? 0x2d6a4f : 0x7bb661, 0.4), 16);
    tin.position.set(-2.6 + i * 0.35, 1.5, -3.25);
    scene.add(tin);
  }

  // round café table and two stools
  const table = new THREE.Group();
  const top = cylinder(1.05, 1.05, 0.1, mat(0xd9c3a5, 0.4), 40);
  top.position.y = TABLE_TOP - 0.1;
  table.add(top, cylinder(0.09, 0.09, TABLE_TOP - 0.1, mat(0x2a2a35, 0.4, { metalness: 0.5 }), 12));
  const base = cylinder(0.6, 0.6, 0.06, mat(0x2a2a35, 0.4, { metalness: 0.5 }), 24);
  table.add(base);
  table.position.copy(TABLE);
  scene.add(table);
  for (const seat of [STEGGY_SEAT, RORY_SEAT]) {
    const stool = new THREE.Group();
    stool.add(cylinder(0.08, 0.1, seat.y - 0.1, mat(0x2a2a35, 0.4, { metalness: 0.5 }), 10));
    const cushion = cylinder(0.75, 0.75, 0.12, mat(0x8a3b3b, 0.7));
    cushion.position.y = seat.y - 0.12;
    stool.add(cushion);
    stool.position.set(seat.x, 0, seat.z - 0.1);
    scene.add(stool);
  }

  // pendant lamps
  for (const z of [0.5]) {
    const cord = cylinder(0.015, 0.015, 3.2, mat(0x222222, 0.5), 6);
    cord.position.set(0, 5.4, z);
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.4, 24, 1, true),
      mat(0x2a2a35, 0.4, { side: THREE.DoubleSide }),
    );
    shade.position.set(0, 5.3, z);
    const bulb = ball(0.12, new THREE.MeshBasicMaterial({ color: 0xfff1c1 }), [0, 5.15, z]);
    const light = new THREE.PointLight(0xffc98a, 6, 7, 1.6);
    light.position.set(0, 5, z);
    scene.add(cord, shade, bulb, light);
  }

  // plants and the door
  for (const [x, z] of [
    [4.6, -3.2],
    [-5.9, 1.5],
  ] as const) {
    const pot = cylinder(0.4, 0.32, 0.7, mat(0xe07a5f, 0.8));
    pot.position.set(x, 0, z);
    scene.add(pot);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      scene.add(
        ball(
          0.38,
          mat(0x5aa469, 0.7),
          [x + Math.cos(a) * 0.3, 1.1 + (i % 3) * 0.3, z + Math.sin(a) * 0.3],
          [0.6, 1.2, 0.6],
          14,
        ),
      );
    }
  }
  const door = box(1.8, 3.8, 0.1, mat(0x6b4a2b, 0.6));
  door.position.set(DOOR_SPOT.x, 0, -3.93);
  scene.add(door);
  const glass = box(1.2, 1.6, 0.02, mat(0xcfe8ff, 0.1, { transparent: true, opacity: 0.6 }));
  glass.position.set(DOOR_SPOT.x, 1.9, -3.86);
  scene.add(glass);

  // two matcha (Rory brings them over) and Steggy's laptop
  const cups = [createMatchaCup(0xf4f1ea), createMatchaCup(0xffd36b)];
  const laptop = createLaptop({ header: 'article_FINAL_v4.docx' });
  laptop.group.scale.setScalar(0.7);
  scene.add(...cups, laptop.group);

  return { scene, cups, laptop };
}

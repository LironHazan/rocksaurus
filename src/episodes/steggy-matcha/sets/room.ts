import * as THREE from 'three';
import { rng } from '../../../engine/math';
import { addKeyLight, box, createRoom, cylinder, mat, picture, ROUND } from '../../../world/interior';
import { createLaptop } from '../../../props/laptop';
import { createStageKeyboard } from '../../../props/stage-keyboard';

export const DESK_TOP = 1.3;

/**
 * A tall bookcase packed with CD jewel cases, spines out (plain colored spines, no band artwork).
 * Origin at the floor, centered; faces +z.
 */
function cdShelf(width: number, rows: number, seed: number): THREE.Group {
  const g = new THREE.Group();
  const wood = mat(0x5a3d2b, 0.7);
  const rowH = 0.62,
    depth = 0.6,
    height = rows * rowH + 0.15;
  for (const s of [-1, 1]) {
    const side = box(0.1, height, depth, wood);
    side.position.x = (s * (width - 0.1)) / 2;
    g.add(side);
  }
  for (let r = 0; r <= rows; r++) {
    const shelf = box(width, 0.06, depth, wood);
    shelf.position.y = r * rowH;
    g.add(shelf);
  }
  const back = box(width, height, 0.04, mat(0x3d2a1e, 0.8));
  back.position.z = -depth / 2;
  g.add(back);

  // the collection: one instanced mesh for the cases, one for the little printed bands on the spines
  const r = rng(seed);
  const caseW = 0.075;
  const perRow = Math.floor((width - 0.25) / caseW);
  const count = perRow * rows;
  const cases = new THREE.InstancedMesh(new THREE.BoxGeometry(caseW * 0.92, 0.5, 0.48), mat(0xffffff, 0.35), count);
  const bands = new THREE.InstancedMesh(new THREE.BoxGeometry(caseW * 0.7, 0.05, 0.01), mat(0xffffff, 0.5), count * 2);
  const spines = [0x16161c, 0x2a0e3a, 0x5a0f1c, 0x1d2b4a, 0x2f3b2f, 0x3a3a44, 0x0b0b10, 0x6b1d6b];
  const inks = [0xd8d0c0, 0xffd36b, 0xff6b6b, 0x9db4ff, 0xc9b6e4];
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  let i = 0;
  for (let row = 0; row < rows; row++)
    for (let k = 0; k < perRow; k++, i++) {
      const x = -width / 2 + 0.13 + k * caseW + caseW / 2;
      const y = row * rowH + 0.03 + 0.25;
      const lean = r() < 0.04 ? (r() - 0.5) * 0.3 : 0; // a few lean over
      m.makeRotationZ(lean).setPosition(x, y, 0.02);
      cases.setMatrixAt(i, m);
      cases.setColorAt(i, c.set(spines[Math.floor(r() * spines.length)]!));
      for (let b = 0; b < 2; b++) {
        m.makeTranslation(x, y - 0.12 + b * (0.1 + r() * 0.14), 0.27);
        bands.setMatrixAt(i * 2 + b, m);
        bands.setColorAt(i * 2 + b, c.set(inks[Math.floor(r() * inks.length)]!));
      }
    }
  cases.castShadow = cases.receiveShadow = true;
  g.add(cases, bands);
  return g;
}

/** A simple rainbow Pride flag: six stripes. */
function prideFlag(w: number, h: number): THREE.Group {
  return picture(
    w,
    h,
    (ctx, cw, ch) => {
      ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'].forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(0, (i * ch) / 6, cw, ch / 6 + 1);
      });
    },
    { frame: null },
  );
}

/**
 * Steggy's room at his dad's place: a wall of metal CDs, his keyboard, a Pride flag, his PhD on the
 * wall, a low desk with his laptop, a kid-size bed, and the door his sister comes in by.
 */
export function createSteggyRoom() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd9e8dc);
  createRoom(scene, { wall: 0xd9e8dc, floor: 0xb08a62 });

  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x8a7060, 1.1));
  addKeyLight(scene, 0xfff0dc, 2);
  const lamp = new THREE.PointLight(0xffc98a, 5, 6, 1.6);
  lamp.position.set(-1.2, 2.6, 1.6);
  scene.add(lamp);

  const left = cdShelf(3.4, 6, 3);
  left.position.set(-4.0, 0, -3.65);
  scene.add(left);

  // his keyboard on the other side of the room
  const keyboard = createStageKeyboard();
  keyboard.group.position.set(2.5, 0, -2.6);
  keyboard.group.rotation.y = Math.PI; // keys toward the room
  scene.add(keyboard.group);

  const flag = prideFlag(2.6, 1.65);
  flag.position.set(-0.55, 5.0, -3.97);
  scene.add(flag);

  const diploma = picture(1.5, 1.1, (ctx, w, h) => {
    ctx.fillStyle = '#fbf6e8';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#b08d3c';
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = '#3a2a1a';
    ctx.textAlign = 'center';
    ctx.font = `700 ${h * 0.12}px Georgia, serif`;
    ctx.fillText('Ph.D. in Physics', w / 2, h * 0.38);
    ctx.font = `${h * 0.08}px Georgia, serif`;
    ctx.fillText('S. Stegosaurus', w / 2, h * 0.58);
    ctx.fillStyle = '#c1121f';
    ctx.beginPath();
    ctx.arc(w * 0.78, h * 0.76, h * 0.09, 0, Math.PI * 2);
    ctx.fill();
  });
  diploma.position.set(-4.0, 5.5, -3.95);
  scene.add(diploma);

  // door (hinged on its left edge)
  const door = new THREE.Group();
  const panel = box(1.7, 3.8, 0.1, mat(0xf4efe6, 0.6));
  panel.position.x = 0.85;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), mat(0xc9a227, 0.3, { metalness: 0.7 }));
  knob.position.set(1.5, 1.8, 0.1);
  door.add(panel, knob);
  door.position.set(5.0, 0, -3.92);
  scene.add(door);

  // kid-size bed by the left wall (he never moved out)
  const bed = new THREE.Group();
  bed.add(box(2.2, 0.55, 4.2, mat(0x6b8f9e, 0.7)));
  const mattress = box(2.1, 0.35, 4.1, mat(0x4d7ea8, 0.9));
  mattress.position.y = 0.55;
  const pillow = box(1.6, 0.25, 0.8, mat(0xffffff, 0.9));
  pillow.position.set(0, 0.9, -1.5);
  bed.add(mattress, pillow);
  bed.position.set(-6.7, 0, -0.6);
  scene.add(bed);

  // more CDs that don't fit anywhere: stacks on the floor and a box from 2003
  const r = rng(5);
  for (const [x, z, n] of [
    [-2.0, -2.6, 9],
    [-1.6, -2.9, 6],
    [4.6, -1.2, 11],
  ] as const) {
    for (let k = 0; k < n; k++) {
      const cd = box(0.5, 0.075, 0.45, mat([0x16161c, 0x5a0f1c, 0x2a0e3a, 0x3a3a44][k % 4]!, 0.35));
      cd.position.set(x + (r() - 0.5) * 0.06, k * 0.075, z);
      cd.rotation.y = (r() - 0.5) * 0.3;
      scene.add(cd);
    }
  }
  const crate = box(1.2, 0.8, 0.9, mat(0xc49a6c, 0.95));
  crate.position.set(-4.9, 0, 1.4);
  scene.add(crate);
  const label = picture(
    1,
    0.4,
    (ctx, w, h) => {
      ctx.fillStyle = '#c49a6c';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2a1a10';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${h * 0.42}px ${ROUND}`;
      ctx.fillText('CDs (2003)', w / 2, h / 2);
    },
    { px: 256, frame: null },
  );
  label.position.set(-4.9, 0.45, 1.86);
  scene.add(label);

  // low desk, floor cushion, laptop facing Steggy, desk lamp
  const desk = new THREE.Group();
  const top = box(3, 0.1, 1.1, mat(0xe8dcc8, 0.5));
  top.position.y = DESK_TOP - 0.1;
  desk.add(top);
  for (const x of [-1.4, 1.4])
    for (const z of [-0.45, 0.45]) {
      const leg = cylinder(0.05, 0.05, DESK_TOP - 0.1, mat(0x2a2a35, 0.5), 8);
      leg.position.set(x, 0, z);
      desk.add(leg);
    }
  desk.position.set(0, 0, 1.8);
  scene.add(desk);
  const cushion = cylinder(1.05, 1.1, 0.25, mat(0x6b4f9e, 0.95));
  cushion.position.set(0, 0, -0.1);
  scene.add(cushion);
  const deskLamp = new THREE.Group();
  deskLamp.add(cylinder(0.18, 0.2, 0.06, mat(0x2a2a35, 0.4)));
  const arm = cylinder(0.025, 0.025, 0.9, mat(0x2a2a35, 0.4), 8);
  deskLamp.add(arm);
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.3, 20, 1, true),
    mat(0x2d6a4f, 0.5, { side: THREE.DoubleSide }),
  );
  shade.position.set(0, 0.95, 0);
  deskLamp.add(shade);
  deskLamp.position.set(-1.2, DESK_TOP, 2.0);
  scene.add(deskLamp);

  const laptop = createLaptop({ header: 'article_FINAL_v3.docx' });
  laptop.group.scale.setScalar(0.7); // sized so Steggy's face stays visible over the lid
  laptop.group.position.set(0, DESK_TOP, 1.65);
  laptop.group.rotation.y = Math.PI; // keys toward Steggy, screen faces him
  scene.add(laptop.group);

  return { scene, door, laptop, keyboard };
}

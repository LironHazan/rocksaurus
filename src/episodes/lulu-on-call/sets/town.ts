import * as THREE from 'three';
import { rng, lerp } from '../../../engine/math';
import { box, cylinder, mat, picture, ROUND } from '../../../world/interior';
import { ball } from '../../../characters/materials';
import { textTexture } from '../../../world/text-texture';

/** Props scroll past along z in a loop this long (Lulu stays near z = 0 walking toward +z, and the town moves past her toward -z). */
const SPAN = 70;
const FAR = -52;
const wrapZ = (z: number) => FAR + ((((z - FAR) % SPAN) + SPAN) % SPAN);

interface Scroller {
  obj: THREE.Object3D;
  z0: number;
  /** Own speed along +z (cars drive; houses don't). */
  speed: number;
}

function house(r: () => number): THREE.Group {
  const g = new THREE.Group();
  const w = 1.1 + r() * 0.8,
    h = 0.9 + r() * 0.8,
    d = 1 + r() * 0.5;
  const colors = [0xffd6a5, 0xcaffbf, 0x9bf6ff, 0xffc6ff, 0xfdffb6, 0xbdb2ff];
  g.add(box(w, h, d, mat(colors[Math.floor(r() * colors.length)]!, 0.8)));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, 0.8, 4), mat(0xc0565b, 0.7));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = h + 0.4;
  roof.castShadow = true;
  g.add(roof);
  const lit = new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xffc94a, emissiveIntensity: 0.8 });
  for (const x of [-w * 0.25, w * 0.25]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), lit);
    win.position.set(x, h * 0.6, d / 2 + 0.01);
    g.add(win);
  }
  g.userData.lit = lit;
  return g;
}

function tree(r: () => number): THREE.Group {
  const g = new THREE.Group();
  g.add(cylinder(0.08, 0.1, 0.5, mat(0x8b5e3c, 0.9), 8));
  const leaves = mat(r() > 0.5 ? 0x5aa469 : 0x76c893, 0.8);
  g.add(ball(0.45 + r() * 0.2, leaves, [0, 0.9, 0], [1, 1.15, 1], 14));
  return g;
}

function car(color: number): THREE.Group {
  const g = new THREE.Group();
  const body = box(0.55, 0.25, 1, mat(color, 0.4));
  body.position.y = 0.1;
  const cab = box(0.48, 0.2, 0.55, mat(0xdff3ff, 0.2));
  cab.position.set(0, 0.35, -0.05);
  g.add(body, cab);
  for (const x of [-0.28, 0.28])
    for (const z of [-0.32, 0.32]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), mat(0x222222, 0.8));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.1, z);
      g.add(wheel);
    }
  return g;
}

function lamp(): THREE.Group {
  const g = new THREE.Group();
  g.add(cylinder(0.04, 0.05, 1.7, mat(0x3a3a48, 0.5), 8));
  const bulb = ball(
    0.12,
    new THREE.MeshStandardMaterial({ color: 0xfff1c1, emissive: 0xffd36b, emissiveIntensity: 0.2 }),
    [0, 1.75, 0],
  );
  g.add(bulb);
  g.userData.bulb = bulb;
  return g;
}

/** Road sign on a post (faces +z). */
function sign(text: string, sub: string): THREE.Group {
  const g = new THREE.Group();
  g.add(cylinder(0.05, 0.05, 1.6, mat(0x9aa0ad, 0.4), 8));
  const board = picture(
    1.6,
    0.7,
    (ctx, w, h) => {
      ctx.fillStyle = '#1f7a4d';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${h * 0.34}px ${ROUND}`;
      ctx.fillText(text, w / 2, h * 0.38);
      ctx.font = `600 ${h * 0.24}px ${ROUND}`;
      ctx.fillText(sub, w / 2, h * 0.72);
    },
    { frame: null },
  );
  board.position.y = 1.9;
  g.add(board);
  return g;
}

/** Lulu's apartment block: a door built for a long-neck. */
function apartment(): THREE.Group {
  const g = new THREE.Group();
  g.add(box(5.5, 6.5, 3, mat(0xf2c6a0, 0.85)));
  const door = box(2.2, 5, 0.1, mat(0x6b4f7a, 0.6));
  door.position.set(0, 0, 1.5);
  g.add(door);
  const plate = picture(
    1.8,
    0.6,
    (ctx, w, h) => {
      ctx.fillStyle = '#16121f';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffd36b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${h * 0.5}px ${ROUND}`;
      ctx.fillText('HOME 🤘', w / 2, h / 2);
    },
    { frame: 0xffffff },
  );
  plate.position.set(0, 5.6, 1.56);
  g.add(plate);
  const lit = new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xffc94a, emissiveIntensity: 0.6 });
  for (const x of [-1.9, 1.9])
    for (const y of [2.2, 4.4]) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.9), lit);
      win.position.set(x, y, 1.51);
      g.add(win);
    }
  return g;
}

const SKY = {
  day: ['#8ec5ff', '#ffd7a8', '#ffeacc'],
  dusk: ['#3b3a7a', '#e2709a', '#ffb07a'],
} as const;

/**
 * A tiny pastel town along a road (Lulu is huge here). She walks toward +z; call update(t, travel, arriveAt, k):
 * `travel` is how far she has walked (units), `k` 0..1 is the time-lapse from 6:00 to 6:30 (sunset).
 */
export function createTown() {
  const scene = new THREE.Scene();
  const sky = textTexture(2, 256, () => {});
  const skyCanvas = sky.image as HTMLCanvasElement;
  scene.background = sky;
  scene.fog = new THREE.Fog(0xffd7a8, 18, 52);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x9fd18b, 1.1);
  const sun = new THREE.DirectionalLight(0xffe2b0, 2.3);
  sun.position.set(8, 9, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 4;
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 });
  scene.add(hemi, sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 160), mat(0x9fd18b, 1));
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = -20;
  ground.receiveShadow = true;
  const road = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 160), mat(0x5a5a68, 0.9));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.01, -20);
  road.receiveShadow = true;
  scene.add(ground, road);

  const r = rng(21);
  const scrollers: Scroller[] = [];
  const add = (obj: THREE.Object3D, x: number, z0: number, speed = 0) => {
    obj.position.x = x;
    scene.add(obj);
    scrollers.push({ obj, z0, speed });
  };
  const dash = mat(0xfff3c4, 0.6);
  for (let z = 0; z < SPAN; z += 2.5) {
    const d = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 1.1), dash);
    d.rotation.x = -Math.PI / 2;
    d.position.y = 0.02;
    add(d, 0, z);
  }
  const lits: THREE.MeshStandardMaterial[] = [];
  const bulbs: THREE.Mesh[] = [];
  for (const s of [-1, 1])
    for (let z = 0; z < SPAN; z += 3.2 + r() * 1.2) {
      const h = house(r);
      h.rotation.y = -s * (Math.PI / 2); // front door to the road
      lits.push(h.userData.lit as THREE.MeshStandardMaterial);
      add(h, s * (3.4 + r() * 1.6), z);
      if (r() > 0.4) add(tree(r), s * (2.3 + r() * 0.3), z + 1.6);
    }
  for (let z = 0; z < SPAN; z += 7) {
    const l = lamp();
    bulbs.push(l.userData.bulb as THREE.Mesh);
    add(l, -1.95, z);
  }
  for (const [i, color] of [0xe63946, 0x3a86ff, 0xffbe0b, 0x8338ec].entries()) add(car(color), 1.2, i * 17, 3.5); // the next lane over, slower than her
  for (let z = 0; z < SPAN; z += 9) add(tree(r), (r() > 0.5 ? 1 : -1) * (8 + r() * 6), z);

  const start = sign('HOME', '20 km');
  start.position.set(2.2, 0, 0);
  start.rotation.y = -0.3;
  scene.add(start);
  const home = apartment();
  home.rotation.y = Math.PI / 2; // door faces the road (+x)
  scene.add(home);

  const c0 = new THREE.Color(),
    c1 = new THREE.Color();
  const mix = (a: string, b: string, k: number) => '#' + c0.set(a).lerp(c1.set(b), k).getHexString();

  /** `arriveAt`: how far she walks before her building is right beside her. */
  function update(t: number, travel: number, arriveAt: number, k: number) {
    for (const s of scrollers) s.obj.position.z = wrapZ(s.z0 - travel + s.speed * t);
    start.position.z = 1.5 - travel; // the "HOME 20 km" sign, passed in the first seconds
    start.visible = start.position.z > FAR;
    home.position.set(-5.4, 0, arriveAt - travel); // comes up ahead of her, reached on arrival
    home.visible = home.position.z < 30;

    // sunset time-lapse
    const g = skyCanvas.getContext('2d')!;
    const grad = g.createLinearGradient(0, 0, 0, 256);
    SKY.day.forEach((c, i) => grad.addColorStop(i / 2, mix(c, SKY.dusk[i]!, k)));
    g.fillStyle = grad;
    g.fillRect(0, 0, 2, 256);
    sky.needsUpdate = true;
    (scene.fog as THREE.Fog).color.set(mix('#ffd7a8', '#c97a95', k));
    sun.intensity = lerp(2.3, 1.0, k);
    sun.color.set(mix('#ffe2b0', '#ff9a6b', k));
    sun.position.set(8, lerp(9, 3, k), 4);
    hemi.intensity = lerp(1.1, 0.7, k);
    for (const l of lits) l.emissiveIntensity = lerp(0.3, 1.6, k);
    for (const b of bulbs) (b.material as THREE.MeshStandardMaterial).emissiveIntensity = lerp(0.1, 2.5, k);
  }

  return { scene, update };
}

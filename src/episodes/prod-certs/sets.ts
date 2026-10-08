import * as THREE from 'three';
import { box, createRoom, createScreen, createWallClock, cylinder, mat, picture } from '../../world/interior';
import { createLaptop } from '../../props/laptop';
import { createSeat } from '../../props/furniture';
import { createCup } from '../monday-coffee/sets';
import { textTexture } from '../../world/text-texture';

/** Where people are in the war room (camera looks toward -z). */
export const DESK = { x: 0, z: 0.7, top: 1.9, width: 5.0, depth: 1.6 };
/** Taluzarus's patch of floor, past the end of the desk: he wanders round it, never through the desk. */
export const FIDGET = { x: 4.2, z: 1.0, rx: 0.8, rz: 0.55 };
export const AMAZ_SEAT = new THREE.Vector3(-0.3, 0, -0.9);
export const BEANBAG = new THREE.Vector3(-4.4, 0, 1.8);
export const BEANBAG_TOP = 1.0;

/**
 * The war room at Papo Pako Shapeworks: a big status wall, a long desk with Amazaurus's laptop (and the night's
 * energy drinks and pizza), a beanbag, a wall clock, and a window that goes from city lights to sunrise
 * (`setDay(k)`, which also brings the morning light in).
 */
export function createWarRoom() {
  const scene = new THREE.Scene();
  createRoom(scene, { wall: 0xd9dde6, floor: 0x7d6e60 });
  const hemi = new THREE.HemisphereLight(0xa8b0e0, 0x50505a, 1.1);
  // the office lights, on all night
  const ceiling = new THREE.DirectionalLight(0xf0f2ff, 0.9);
  ceiling.position.set(1, 9, 9);
  scene.add(ceiling);
  const sun = new THREE.DirectionalLight(0xffe0b0, 0);
  sun.position.set(-7, 8, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 5;
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -2, near: 1, far: 30 });
  scene.add(hemi, sun);

  // the status wall
  const frame = box(6.4, 3.6, 0.15, mat(0x16161c, 0.4));
  frame.position.set(0.6, 3.8, -3.95);
  scene.add(frame);
  const dashboard = createScreen(6, 3.2, { header: 'status · prod', px: 1024 });
  dashboard.mesh.position.set(0.6, 5.6, -3.86);
  scene.add(dashboard.mesh);
  const dashGlow = new THREE.PointLight(0xff3b3b, 3, 7, 1.6);
  dashGlow.position.set(0.6, 5.2, -2.4);
  scene.add(dashGlow);

  // the window: city lights at night, sunrise in the morning
  const nightView = picture(
    3.2,
    2.6,
    (ctx, w, h) => {
      ctx.fillStyle = '#0b1030';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 9; i++) {
        const bw = w / 9,
          bh = h * (0.3 + ((i * 37) % 40) / 100);
        ctx.fillStyle = '#1c2250';
        ctx.fillRect(i * bw, h - bh, bw - 4, bh);
        ctx.fillStyle = '#ffd36b';
        for (let k = 0; k < 6; k++)
          if ((i * 7 + k * 3) % 4 === 0) ctx.fillRect(i * bw + 8 + (k % 2) * 18, h - bh + 14 + k * 22, 8, 10);
      }
    },
    { frame: 0xf4f6f8, emissive: true },
  );
  nightView.position.set(-4.6, 5.2, -3.95);
  scene.add(nightView);
  const dayTex = textTexture(256, 208, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#8fc4ff');
    g.addColorStop(0.6, '#ffd2a0');
    g.addColorStop(1, '#ffb27a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff2c8';
    ctx.beginPath();
    ctx.arc(w * 0.3, h * 0.7, h * 0.14, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 9; i++) {
      const bw = w / 9,
        bh = h * (0.3 + ((i * 37) % 40) / 100);
      ctx.fillStyle = '#9a8fb0';
      ctx.fillRect(i * bw, h - bh, bw - 2, bh);
    }
  });
  const dayView = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 2.6),
    new THREE.MeshBasicMaterial({ map: dayTex, toneMapped: false, transparent: true, opacity: 0 }),
  );
  dayView.position.set(-4.6, 5.2, -3.86);
  scene.add(dayView);

  const clock = createWallClock(0.55);
  clock.group.position.set(4.9, 6.3, -3.9);
  scene.add(clock.group);

  // the desk: a long white top on black legs
  const desk = new THREE.Group();
  const top = box(DESK.width, 0.12, DESK.depth, mat(0xf2f0eb, 0.5));
  top.position.y = DESK.top - 0.12;
  desk.add(top);
  for (const x of [-DESK.width / 2 + 0.15, DESK.width / 2 - 0.15]) {
    const leg = box(0.12, DESK.top - 0.12, 1.4, mat(0x1b1b22, 0.5));
    leg.position.x = x;
    desk.add(leg);
  }
  desk.position.set(DESK.x, 0, DESK.z);
  scene.add(desk);
  // Amazaurus's laptop, facing him (keys toward -z), and his chair
  const laptop = createLaptop({ header: 'warroom', theme: 'terminal', color: 0x2a2a35 });
  laptop.group.position.set(AMAZ_SEAT.x, DESK.top, DESK.z - 0.2);
  laptop.group.rotation.y = Math.PI;
  laptop.group.scale.setScalar(0.95);
  scene.add(laptop.group);
  const laptopGlow = new THREE.PointLight(0xaec3ff, 4, 5, 1.6);
  laptopGlow.position.set(AMAZ_SEAT.x, DESK.top + 1, DESK.z - 0.9);
  scene.add(laptopGlow);
  const chair = createSeat({ width: 2.4, colour: 0x3a3f55 });
  chair.position.copy(AMAZ_SEAT);
  scene.add(chair);
  // the night's damage: energy drinks and a pizza box
  const cans = [0x2bd96b, 0xff4d8d, 0x2bd96b, 0x3d8ef0].map((c, i) => {
    const can = cylinder(0.11, 0.11, 0.36, mat(c, 0.3, { metalness: 0.6 }), 16);
    can.position.set(0.9 + (i % 2) * 0.3, DESK.top, DESK.z - 0.4 + Math.floor(i / 2) * 0.35);
    return can;
  });
  scene.add(...cans);
  const pizza = box(1.1, 0.12, 1.1, mat(0xd9b98a, 0.9));
  pizza.position.set(1.85, DESK.top, DESK.z + 0.15);
  pizza.rotation.y = 0.3;
  scene.add(pizza);
  // Amazaurus's tea
  const tea = createCup(0xf4f1ea, 0xc8915a);
  tea.position.set(AMAZ_SEAT.x - 1.1, DESK.top, DESK.z - 0.3);
  scene.add(tea);

  // a beanbag, a plant
  const beanbag = new THREE.Mesh(new THREE.SphereGeometry(1.3, 32, 20), mat(0xff8a3d, 0.95));
  beanbag.scale.set(1, 0.6, 1);
  beanbag.position.set(BEANBAG.x, 0.6, BEANBAG.z);
  beanbag.castShadow = beanbag.receiveShadow = true;
  scene.add(beanbag);
  const pot = cylinder(0.45, 0.35, 0.9, mat(0xf4f6f8, 0.6));
  pot.position.set(6.2, 0, -2.6);
  scene.add(pot);
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), mat(0x3f8f4a, 0.8));
    const a = (i / 6) * Math.PI * 2;
    leaf.scale.set(0.5, 1.4, 0.3);
    leaf.position.set(6.2 + Math.cos(a) * 0.3, 1.5, -2.6 + Math.sin(a) * 0.3);
    leaf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
    scene.add(leaf);
  }

  return {
    scene,
    dashboard,
    dashGlow,
    laptop,
    laptopGlow,
    clock,
    tea,
    /** 0 = night (the screens light the room), 1 = morning sun through the window. */
    setDay(k: number) {
      (dayView.material as THREE.MeshBasicMaterial).opacity = k;
      sun.intensity = 2.2 * k;
      hemi.color.set(0xa8b0e0).lerp(new THREE.Color(0xffffff), k);
      hemi.intensity = 1.1 + 0.3 * k;
      ceiling.intensity = 0.9 + 0.5 * k;
      scene.background = new THREE.Color(0x0b1030).lerp(new THREE.Color(0xd9dde6), k);
    },
  };
}

/** A plain glowing backdrop for phone calls: a coloured wash behind whoever's answering. */
export function createCallBackdrop() {
  const scene = new THREE.Scene();
  const hemi = new THREE.HemisphereLight(0xffffff, 0x202030, 0.9);
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 6, 8);
  const rim = new THREE.PointLight(0xffffff, 18, 14, 1.4);
  rim.position.set(-3, 5, -3);
  scene.add(hemi, key, rim);
  return {
    scene,
    setColour(c: number) {
      scene.background = new THREE.Color(c).multiplyScalar(0.35);
      rim.color.set(c);
    },
  };
}

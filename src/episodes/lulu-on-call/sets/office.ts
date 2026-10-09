import * as THREE from 'three';
import { box, createRoom, createScreen, createWallClock, cylinder, mat, picture, ROUND } from '../../../world/interior';
import { ball } from '../../../characters/materials';

/** Where Lulu stands at her desk (she faces +z, toward the camera). */
export const DESK_SPOT = new THREE.Vector3(0, 0, 0);

/**
 * Lulu's office at 6 PM: a desk sized for a long-neck (monitor on a very tall arm), a sunset skyline
 * through the window, a wall clock, a plant, and a poster that tells you everything about her.
 */
export function createOffice() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdde6ef);
  createRoom(scene, { wall: 0xdde6ef, floor: 0xb98b5e });

  scene.add(new THREE.HemisphereLight(0xffffff, 0xc8b8a8, 1.1));
  const key = new THREE.DirectionalLight(0xffe2c0, 2.2); // late sun through the window
  key.position.set(-5, 8, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 5;
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 8, bottom: -2, near: 1, far: 30 });
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xc8dcff, 0.6);
  fill.position.set(6, 4, 6);
  scene.add(fill);

  // window: sunset over the city
  const view = picture(
    4.4,
    3,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#ff9e7a');
      g.addColorStop(0.55, '#ffd59a');
      g.addColorStop(1, '#ffe9c9');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff4d6';
      ctx.beginPath();
      ctx.arc(w * 0.7, h * 0.6, h * 0.12, 0, Math.PI * 2);
      ctx.fill();
      let x = 0,
        i = 0;
      while (x < w) {
        const bw = 30 + ((i * 37) % 50),
          bh = h * (0.25 + ((i * 53) % 40) / 100);
        ctx.fillStyle = i % 2 ? '#7b6b8f' : '#8d7ba0';
        ctx.fillRect(x, h - bh, bw, bh);
        ctx.fillStyle = '#ffe6a3';
        for (let wy = h - bh + 10; wy < h - 10; wy += 18)
          for (let wx = x + 6; wx < x + bw - 8; wx += 12) if ((wx + wy + i) % 3) ctx.fillRect(wx, wy, 5, 8);
        x += bw + 4;
        i++;
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
  view.position.set(-3.3, 4.6, -3.95);
  scene.add(view);

  // poster: the most metal thing in a startup office
  const poster = picture(2, 2.7, (ctx, w, h) => {
    ctx.fillStyle = '#16121f';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffd36b';
    ctx.textAlign = 'center';
    ctx.font = `700 ${w * 0.17}px ${ROUND}`;
    ctx.fillText('SEEK AND', w / 2, h * 0.32);
    ctx.fillText('DEPLOY!', w / 2, h * 0.5);
    ctx.font = `${w * 0.3}px ${ROUND}`;
    ctx.fillText('🤘', w / 2, h * 0.8);
  });
  poster.position.set(5.6, 4.3, -3.95);
  scene.add(poster);

  const clock = createWallClock(0.6);
  clock.group.position.set(0.2, 7.1, -3.9);
  scene.add(clock.group);

  const plant = new THREE.Group();
  plant.add(cylinder(0.45, 0.35, 0.8, mat(0xe07a5f, 0.8)));
  const leaf = mat(0x5aa469, 0.7);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    plant.add(ball(0.42, leaf, [Math.cos(a) * 0.35, 1.3 + (i % 3) * 0.35, Math.sin(a) * 0.35], [0.6, 1.2, 0.6], 16));
  }
  plant.position.set(-5.2, 0, -2.4);
  scene.add(plant);

  // desk in front of Lulu (her belly needs room)
  const desk = new THREE.Group();
  const wood = mat(0xf2ede4, 0.55);
  const top = box(3.6, 0.14, 1.4, wood);
  top.position.y = 1.25;
  desk.add(top);
  for (const x of [-1.65, 1.65]) {
    const leg = box(0.12, 1.25, 1.2, mat(0x2a2a35, 0.5));
    leg.position.set(x, 0, 0);
    desk.add(leg);
  }
  const keyboard = box(1.3, 0.06, 0.42, mat(0x2a2a35, 0.5));
  keyboard.position.set(0, 1.39, -0.25);
  desk.add(keyboard);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 12; c++) {
      const k = box(0.08, 0.03, 0.08, mat(0xe8e8ee, 0.6));
      k.position.set(-0.55 + c * 0.1, 1.45, -0.38 + r * 0.12);
      desk.add(k);
    }
  const mug = cylinder(0.16, 0.15, 0.32, mat(0x16121f, 0.5));
  mug.position.set(-1.2, 1.39, 0.1);
  desk.add(mug);
  const mugLabel = picture(
    0.22,
    0.16,
    (ctx, w, h) => {
      ctx.fillStyle = '#16121f';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff6b8b';
      ctx.font = `700 ${h * 0.45}px ${ROUND}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('METAL', w / 2, h / 2);
    },
    { px: 128, frame: null },
  );
  mugLabel.position.set(-1.2, 1.55, 0.27);
  desk.add(mugLabel);
  desk.position.set(DESK_SPOT.x, 0, DESK_SPOT.z + 1.75);
  scene.add(desk);

  // monitor on a very tall arm, at long-neck eye level, facing Lulu
  const monitor = new THREE.Group();
  const bezel = box(2.3, 1.45, 0.1, mat(0x1b1b24, 0.4));
  bezel.position.set(0, -0.725, -0.06);
  const screen = createScreen(2.15, 1.3, { header: 'agent' });
  screen.mesh.position.z = 0.0;
  const pole = cylinder(0.06, 0.06, 1.95, mat(0x9aa0ad, 0.3, { metalness: 0.6 }));
  pole.position.set(0, -0.7 - 1.95, -0.16); // behind the screen, down to the desk
  monitor.add(bezel, screen.mesh, pole);
  monitor.position.set(1.45, 3.95, 1.75);
  monitor.lookAt(0, 4.2, 0.4); // facing Lulu's eyes
  scene.add(monitor);
  const glow = new THREE.PointLight(0x9db4ff, 3, 4, 2);
  glow.position.set(1.1, 3.9, 1.9);
  scene.add(glow);

  return { scene, screen, monitor, clock };
}

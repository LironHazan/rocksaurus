import * as THREE from 'three';
import { box, createRoom, mat, picture, ROUND } from './interior';
import { createDrumKit } from '../props/drums';
import { createShaker } from '../props/shaker';

export const SHAKE_SPOT = new THREE.Vector3(-1.6, 0, 0.4);
export const MAT_SPOT = new THREE.Vector3(2.2, 0.06, 0.9);

/** Lulu's living room in the evening: kitchen counter, yoga mat, her drum kit in the corner. */
export function createHome() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3e1d0);
  createRoom(scene, { wall: 0xf3e1d0, floor: 0xa47551 });

  scene.add(new THREE.HemisphereLight(0xfff1e0, 0x8a6a50, 1.0));
  const key = new THREE.DirectionalLight(0xffe0c0, 1.8);
  key.position.set(3, 9, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 5;
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 9, bottom: -2, near: 1, far: 30 });
  scene.add(key);
  const lampLight = new THREE.PointLight(0xffb36b, 8, 9, 1.6);
  lampLight.position.set(-5, 4.5, -1);
  scene.add(lampLight);

  // window: dusk
  const view = picture(
    3.6,
    2.6,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#2d2f6b');
      g.addColorStop(0.6, '#b85a8a');
      g.addColorStop(1, '#ff9a6b');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, w, h);
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();
    },
    { frame: 0xffffff },
  );
  view.position.set(0.6, 4.8, -3.95);
  scene.add(view);

  // gig poster
  const poster = picture(1.7, 2.4, (ctx, w, h) => {
    ctx.fillStyle = '#2a0e4a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff6bd0';
    ctx.textAlign = 'center';
    ctx.font = `700 ${w * 0.15}px ${ROUND}`;
    ctx.fillText('ROCKSAURUS', w / 2, h * 0.25);
    ctx.fillStyle = '#ffd36b';
    ctx.font = `600 ${w * 0.1}px ${ROUND}`;
    ctx.fillText('LIVE · SOLD OUT', w / 2, h * 0.42);
    ctx.font = `${w * 0.32}px ${ROUND}`;
    ctx.fillText('🦕🥁', w / 2, h * 0.72);
  });
  poster.position.set(4.6, 4.4, -3.95);
  scene.add(poster);

  // kitchen counter + the shaker
  const counter = box(3, 1.7, 1.4, mat(0x6b8f9e, 0.6));
  counter.position.set(-4.6, 0, -1.6);
  const counterTop = box(3.1, 0.1, 1.5, mat(0xf4f1ea, 0.35));
  counterTop.position.set(-4.6, 1.7, -1.6);
  scene.add(counter, counterTop);
  const bottle = createShaker();
  scene.add(bottle);

  const yoga = box(2.4, 0.05, 4.4, mat(0x9b5de5, 0.9));
  yoga.position.set(MAT_SPOT.x, 0, MAT_SPOT.z - 0.6);
  scene.add(yoga);

  // her kit, waiting in the corner
  const kit = createDrumKit();
  kit.group.position.set(5, 0, -2.3);
  kit.group.rotation.y = -0.5;
  kit.group.scale.setScalar(0.8);
  scene.add(kit.group);

  return {
    scene,
    shaker: bottle,
    counterTop: new THREE.Vector3(-3.6, 1.75, -1.3),
    window: view,
    kit: kit.group,
    key,
    lamp: lampLight,
  };
}

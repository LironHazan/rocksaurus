import * as THREE from 'three';
import { createRockStage } from '../world/rock-stage.js';
import { createRockerRory } from './rocker.js';

const $ = id => document.getElementById(id);

/** Renders the rock scene once at the given size and returns it as a bitmap. */
function render3D({ width, height, fov, camPos, lookAt, roryX = 0 }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  createRockStage(scene);
  const rory = createRockerRory();
  rory.root.position.x = roryX;
  rory.root.rotation.y = 0.45; // 3/4 turn so the mohawk shows
  scene.add(rory.root);

  const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 200);
  camera.position.set(...camPos);
  camera.lookAt(...lookAt);
  renderer.render(scene, camera);

  const out = document.createElement('canvas');
  out.width = width; out.height = height;
  out.getContext('2d').drawImage(renderer.domElement, 0, 0);
  renderer.dispose();
  return out;
}

function title(ctx, text, x, y, maxWidth, size) {
  ctx.save();
  ctx.font = `${size}px Bungee`;
  const w = ctx.measureText(text).width;
  if (w > maxWidth) { size *= maxWidth / w; ctx.font = `${size}px Bungee`; }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.shadowColor = '#ff3fa4';
  ctx.shadowBlur = size * 0.35;
  ctx.lineWidth = size * 0.16;
  ctx.strokeStyle = '#1a0828';
  ctx.strokeText(text, x, y);
  ctx.shadowBlur = 0;
  const gr = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  gr.addColorStop(0, '#fff3a8'); gr.addColorStop(0.5, '#ffd36b'); gr.addColorStop(1, '#ff8a3d');
  ctx.fillStyle = gr;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function tagline(ctx, text, x, y, size) {
  ctx.save();
  ctx.font = `700 ${size}px Fredoka`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.22;
  ctx.strokeStyle = '#1a0828';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x, y);
  ctx.restore();
}

await document.fonts.load('100px Bungee');
await document.fonts.load('700 50px Fredoka');

// --- Profile: Rory's upper body and guitar, centered for the circle crop
const profile3D = render3D({ width: 800, height: 800, fov: 34, camPos: [0.3, 2.6, 7.6], lookAt: [0, 2.15, 0] });

// --- Banner: Rory sits inside the always-visible center strip, title to his left
const BW = 2560, BH = 1440, SAFE_W = 1546, SAFE_H = 423;
const banner3D = render3D({ width: BW, height: BH, fov: 18, camPos: [0, 2.2, 36], lookAt: [0, 1.85, 0], roryX: 3.6 });

function draw() {
  const p = $('profile');
  p.width = p.height = 800;
  p.getContext('2d').drawImage(profile3D, 0, 0);

  const b = $('banner');
  b.width = BW; b.height = BH;
  const ctx = b.getContext('2d');
  ctx.drawImage(banner3D, 0, 0);
  const sx = (BW - SAFE_W) / 2, sy = (BH - SAFE_H) / 2;
  const textCx = sx + SAFE_W * 0.36;
  title(ctx, $('name').value.toUpperCase(), textCx, BH / 2 - 40, SAFE_W * 0.62, 150);
  tagline(ctx, $('tagline').value, textCx, BH / 2 + 95, 58);
  if ($('safe').checked) {
    ctx.strokeStyle = '#3fd4ff'; ctx.lineWidth = 4; ctx.setLineDash([18, 12]);
    ctx.strokeRect(sx, sy, SAFE_W, SAFE_H);
    ctx.strokeStyle = '#ffffff55'; ctx.strokeRect(0, sy, BW, SAFE_H); // desktop visible area
  }
}
draw();
for (const id of ['name', 'tagline', 'safe']) $(id).oninput = draw;

function download(canvas, filename) {
  canvas.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }, 'image/png');
}
$('dl-profile').onclick = () => download($('profile'), 'channel-profile.png');
$('dl-banner').onclick = () => {
  const safe = $('safe').checked;
  if (safe) { $('safe').checked = false; draw(); }   // never export the guide lines
  download($('banner'), 'channel-banner.png');
  if (safe) { $('safe').checked = true; draw(); }
};

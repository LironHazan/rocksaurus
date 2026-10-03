import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { createRockStage } from '../../world/rock-stage';
import { createRockerRory } from '../../characters/rocker';
import { disposeObject } from '../../engine/dispose';

export const PROFILE_SIZE = 800;
export const BANNER = { width: 2560, height: 1440, safeWidth: 1546, safeHeight: 423 } as const;

interface ShotOptions {
  width: number;
  height: number;
  fov: number;
  camPos: [number, number, number];
  lookAt: [number, number, number];
  roryX?: number;
}

/** Renders the rock-stage scene with Rory once, at the given size, into a plain 2D canvas. */
async function renderShot({ width, height, fov, camPos, lookAt, roryX = 0 }: ShotOptions): Promise<HTMLCanvasElement> {
  const renderer = new WebGPURenderer({ antialias: true });
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
  // renderAsync (not render) so the frame is submitted before the canvas is copied below: this is a one-shot
  // render read straight back as pixels, unlike the stage's continuous loop.
  await renderer.renderAsync(scene, camera);

  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  out.getContext('2d')?.drawImage(renderer.domElement, 0, 0);
  disposeObject(scene);
  await renderer.dispose(); // ends in device.destroy() (or loseContext() on the WebGL fallback)
  return out;
}

/** The two 3D renders the art is built from (slow — render once, reuse while editing text). */
export async function renderArtBackgrounds() {
  const [profile, banner] = await Promise.all([
    // Rory's upper body and guitar, centered for YouTube's circle crop
    renderShot({
      width: PROFILE_SIZE,
      height: PROFILE_SIZE,
      fov: 34,
      camPos: [0.3, 2.6, 7.6],
      lookAt: [0, 2.15, 0],
    }),
    // Rory inside the always-visible center strip, title to his left
    renderShot({
      width: BANNER.width,
      height: BANNER.height,
      fov: 18,
      camPos: [0, 2.2, 36],
      lookAt: [0, 1.85, 0],
      roryX: 3.6,
    }),
  ]);
  return { profile, banner };
}

function drawTitle(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, size: number) {
  ctx.save();
  ctx.font = `${size}px Bungee`;
  const w = ctx.measureText(text).width;
  if (w > maxWidth) {
    size *= maxWidth / w;
    ctx.font = `${size}px Bungee`;
  }
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
  gr.addColorStop(0, '#fff3a8');
  gr.addColorStop(0.5, '#ffd36b');
  gr.addColorStop(1, '#ff8a3d');
  ctx.fillStyle = gr;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawTagline(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
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

export interface BannerText {
  name: string;
  tagline: string;
  /** Draw guides for the visible-everywhere strip (never on exports). */
  showSafeArea: boolean;
}

export function drawBanner(
  canvas: HTMLCanvasElement,
  background: HTMLCanvasElement,
  { name, tagline, showSafeArea }: BannerText,
) {
  const { width: BW, height: BH, safeWidth: SW, safeHeight: SH } = BANNER;
  canvas.width = BW;
  canvas.height = BH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(background, 0, 0);
  const sx = (BW - SW) / 2;
  const sy = (BH - SH) / 2;
  const textCx = sx + SW * 0.36;
  drawTitle(ctx, name.toUpperCase(), textCx, BH / 2 - 40, SW * 0.62, 150);
  drawTagline(ctx, tagline, textCx, BH / 2 + 95, 58);
  if (showSafeArea) {
    ctx.strokeStyle = '#3fd4ff';
    ctx.lineWidth = 4;
    ctx.setLineDash([18, 12]);
    ctx.strokeRect(sx, sy, SW, SH);
    ctx.strokeStyle = '#ffffff55';
    ctx.strokeRect(0, sy, BW, SH); // desktop visible area
  }
}

export function drawProfile(canvas: HTMLCanvasElement, background: HTMLCanvasElement) {
  canvas.width = canvas.height = PROFILE_SIZE;
  canvas.getContext('2d')?.drawImage(background, 0, 0);
}

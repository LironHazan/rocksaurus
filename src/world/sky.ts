import type * as THREE from 'three';
import { textTexture } from './text-texture';

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

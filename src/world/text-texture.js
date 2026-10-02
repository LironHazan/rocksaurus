import * as THREE from 'three';

/**
 * Canvas texture painted by `draw(ctx, w, h)`. Repaints once the given fonts have loaded,
 * so signs never stay stuck in a fallback font.
 */
export function textTexture(width, height, draw, fonts = []) {
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const paint = () => { ctx.clearRect(0, 0, width, height); draw(ctx, width, height); tex.needsUpdate = true; };
  paint();
  Promise.all(fonts.map(f => document.fonts.load(f))).then(paint);
  return tex;
}

/** Bold text with a dark outline, centered at (x, y), shrunk to fit maxWidth. */
export function outlinedText(ctx, text, x, y, { font, size, maxWidth = Infinity, fill = '#fff', stroke = '#140a1f', line = 0.14, glow }) {
  ctx.font = `${size}px ${font}`;
  const w = ctx.measureText(text).width;
  if (w > maxWidth) { size *= maxWidth / w; ctx.font = `${size}px ${font}`; }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = size * 0.3; }
  ctx.lineWidth = size * line;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = typeof fill === 'function' ? fill(ctx, y, size) : fill;
  ctx.fillText(text, x, y);
}

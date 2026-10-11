import { createStegosaurus, STEGGY_COLORS } from './stegosaurus';
import { addBandTee } from '../props/band-tee';
import { addGlasses } from '../props/glasses';

/** The print on Amazaurus's tee: a crescent moon, a ringed planet and stars, on black. */
function space(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(w * 0.42, h * 0.48, h * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.4, h * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#b48cff';
  ctx.beginPath();
  ctx.arc(w * 0.72, h * 0.62, h * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e6d6ff';
  ctx.lineWidth = h * 0.02;
  ctx.beginPath();
  ctx.ellipse(w * 0.72, h * 0.62, h * 0.18, h * 0.05, -0.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  for (const [x, y, r] of [
    [0.15, 0.2, 0.015],
    [0.25, 0.75, 0.012],
    [0.62, 0.18, 0.018],
    [0.85, 0.3, 0.012],
    [0.88, 0.85, 0.015],
    [0.12, 0.55, 0.01],
    [0.55, 0.88, 0.01],
  ] as const) {
    ctx.beginPath();
    ctx.arc(w * x, h * y, h * r * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Amazaurus: a deep-teal Stegosaurus with round glasses and a black tee with the moon and stars. Very calm. */
export function createAmazaurus() {
  const rig = createStegosaurus({
    ...STEGGY_COLORS,
    body: 0x4fb6a8,
    belly: 0xdff5ef,
    plates: 0x2f7f86,
    plateTips: 0x5fb3b9,
    bowTie: 0x15151a,
    eyes: 0x6b4a2a,
    mustache: null,
  });
  addBandTee(rig, { text: '', color: 0x15151a, print: space, aspect: 0.62 });
  addGlasses(rig.head, { eyeX: 0.22, eyeY: 0.1, eyeZ: 0.52, rim: 0.15, color: 0x1b1b22 });
  return rig;
}

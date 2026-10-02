import { clamp01 } from './math';
import type { Caption, Format } from './types';

export const CAPTION_FONT = 'Fredoka';

const backOut = (x: number): number => {
  const k = 1.7;
  return 1 + (k + 1) * (x - 1) ** 3 + k * (x - 1) ** 2;
};

/** Splits text into lines no wider than maxWidth ('\n' forces a break). */
export function wrapText(measure: (s: string) => number, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? `${line} ${word}` : word;
      if (line && measure(test) > maxWidth) {
        out.push(line);
        line = word;
      } else line = test;
    }
    out.push(line);
  }
  return out;
}

/** Draws meme-style captions (bold white, dark outline, pop-in) for time t. */
export function drawCaptions(
  ctx: CanvasRenderingContext2D,
  captions: readonly Caption[],
  t: number,
  format: Format,
): void {
  const { width, height, safe } = format;
  const unit = Math.min(width, height);
  for (const c of captions) {
    if (t < c.from || t > c.to) continue;
    const pop = backOut(clamp01((t - c.from) / 0.2));
    const fade = clamp01((c.to - t) / 0.15);
    const size = unit * (c.size ?? 0.085);
    ctx.font = `700 ${size}px ${CAPTION_FONT}, "Arial Rounded MT Bold", system-ui, sans-serif`;
    const left = c.align === 'left';
    // left-aligned text stays clear of the Shorts buttons on the right edge
    const lines = wrapText(s => ctx.measureText(s).width, c.text, width * (left ? 0.78 : 0.86));

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(left ? width * 0.07 : width / 2, (c.y ?? safe[c.at ?? 'top']) * height);
    ctx.scale(pop, pop);
    ctx.textAlign = left ? 'left' : 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    lines.forEach((line, i) => {
      const y = (i - (lines.length - 1) / 2) * size * 1.15;
      ctx.lineWidth = size * 0.2;
      ctx.strokeStyle = '#1b1b2e';
      ctx.strokeText(line, 0, y);
      ctx.fillStyle = c.color ?? '#ffffff';
      ctx.fillText(line, 0, y);
    });
    ctx.restore();
  }
}

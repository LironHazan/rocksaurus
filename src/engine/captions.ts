import { clamp01 } from './math';
import type { Caption, Format } from './types';

export const CAPTION_FONT = 'Fredoka';
/** The caption font as `document.fonts.load()` wants it: await it before recording or snapshotting. */
export const CAPTION_FONT_SPEC = `700 80px ${CAPTION_FONT}`;

/** Seconds to pop in and to fade out. */
const POP_IN = 0.2;
const FADE_OUT = 0.15;
/** Sizes as fractions of the frame's short side; widths and margins of its width. */
const DEFAULT_SIZE = 0.085;
const LINE_HEIGHT = 1.15; // × size
const OUTLINE = 0.2; // × size
const MAX_WIDTH = { left: 0.78, center: 0.86 }; // left-aligned stops short of the Shorts buttons on the right
const LEFT_MARGIN = 0.07;
const OUTLINE_COLOUR = '#1b1b2e';

const backOut = (x: number): number => {
  const k = 1.7; // overshoot
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
    const pop = backOut(clamp01((t - c.from) / POP_IN));
    const fade = clamp01((c.to - t) / FADE_OUT);
    const size = unit * (c.size ?? DEFAULT_SIZE);
    ctx.font = `700 ${size}px ${CAPTION_FONT}, "Arial Rounded MT Bold", system-ui, sans-serif`;
    const left = c.align === 'left';
    const lines = wrapText(s => ctx.measureText(s).width, c.text, width * MAX_WIDTH[left ? 'left' : 'center']);

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(left ? width * LEFT_MARGIN : width / 2, (c.y ?? safe[c.at ?? 'top']) * height);
    ctx.scale(pop, pop);
    ctx.textAlign = left ? 'left' : 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    lines.forEach((line, i) => {
      const y = (i - (lines.length - 1) / 2) * size * LINE_HEIGHT;
      ctx.lineWidth = size * OUTLINE;
      ctx.strokeStyle = OUTLINE_COLOUR;
      ctx.strokeText(line, 0, y);
      ctx.fillStyle = c.color ?? '#ffffff';
      ctx.fillText(line, 0, y);
    });
    ctx.restore();
  }
}

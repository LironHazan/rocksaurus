import { clamp01 } from './math.js';

export const CAPTION_FONT = 'Fredoka';

const backOut = x => { const k = 1.7; return 1 + (k + 1) * (x - 1) ** 3 + k * (x - 1) ** 2; };

/**
 * Draws meme-style captions (bold white, dark outline, pop-in) for time t.
 * Caption: { from, to, text, at = 'top' | 'bottom', y?, size = 0.085, color = '#fff' }
 *   at/y  — named safe position from the format, or an explicit 0..1 height
 *   size  — font size as a fraction of the frame's short side
 * Use '\n' in text to force a line break; long lines wrap automatically.
 */
export function drawCaptions(ctx, captions, t, format) {
  const { width, height, safe } = format;
  const unit = Math.min(width, height);
  for (const c of captions) {
    if (t < c.from || t > c.to) continue;
    const pop = backOut(clamp01((t - c.from) / 0.2));
    const fade = clamp01((c.to - t) / 0.15);
    const size = unit * (c.size ?? 0.085);
    ctx.font = `700 ${size}px ${CAPTION_FONT}, "Arial Rounded MT Bold", system-ui, sans-serif`;
    const lines = wrap(ctx, c.text, width * 0.86);

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(width / 2, (c.y ?? safe[c.at ?? 'top']) * height);
    ctx.scale(pop, pop);
    ctx.textAlign = 'center';
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

function wrap(ctx, text, maxWidth) {
  const out = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(test).width > maxWidth) { out.push(line); line = word; }
      else line = test;
    }
    out.push(line);
  }
  return out;
}

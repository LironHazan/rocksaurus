import type * as THREE from 'three';
import { livePanel, picture, ROUND } from '../../world/interior';

// The sign Lulu tapes to her monitor, and Hack, the team chat, open on a monitor. Yashinozarus's corner is a shared
// set: world/architect-corner.ts.

const font = (size: number, weight = 700) => `${weight} ${size}px ${ROUND}`;

/** The sign Lulu tapes to her monitor after the second time: a yellow sticky note, in marker. */
export function createSign(): THREE.Group {
  return picture(
    1.25,
    0.82,
    (ctx, w, h) => {
      ctx.fillStyle = '#ffe36b';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1b1b22';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = font(h * 0.2, 800);
      ctx.fillText('AI AGENT =', w / 2, h * 0.32);
      ctx.fillText('LOOP + TOOLS', w / 2, h * 0.62);
      ctx.font = font(h * 0.14, 600);
      ctx.fillText('(please)', w / 2, h * 0.86);
    },
    { px: 384, frame: null },
  );
}

/** Hack, the team chat (our own app, purple like the rest of it): how wide its sidebar is, and its colours. */
const HACK = { sidebar: 0.24, purple: '#4b2a6e', ink: '#1d1c22', faint: '#7a7884' } as const;
/** Each one's avatar colour in the chat. */
const AVATAR = { Yashinozarus: '#7fa38f', Lulu: '#c79bd8' } as const;

/** The chat's words, wrapped to `width` (canvas units); returns the lines. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  return line ? [...lines, line] : lines;
}

/**
 * Hack open on a monitor, on the DM between the two of them: the sidebar of channels and DMs, the other one's name
 * up top, and the messages, each with its avatar. `show` repaints only when what's shown changed.
 */
export function createHackWindow(w: number, h: number, other: keyof typeof AVATAR) {
  let messages: readonly { who: keyof typeof AVATAR; text: string }[] = [];
  const panel = livePanel(w, h, 1024, (ctx, cw, ch) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cw, ch);
    const side = cw * HACK.sidebar;
    ctx.fillStyle = HACK.purple;
    ctx.fillRect(0, 0, side, ch);
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.font = font(ch * 0.07);
    ctx.fillText('Hack', cw * 0.03, ch * 0.08);
    ctx.font = font(ch * 0.045, 500);
    ['# platform', '# incidents', '# random', `● ${other}`].forEach((item, i) => {
      ctx.globalAlpha = item.startsWith('●') ? 1 : 0.7;
      ctx.fillText(item, cw * 0.03, ch * (0.2 + i * 0.08));
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = HACK.ink;
    ctx.font = font(ch * 0.06);
    ctx.fillText(other, side + cw * 0.03, ch * 0.08);
    ctx.fillStyle = '#e4e2ea';
    ctx.fillRect(side, ch * 0.15, cw - side, ch * 0.006);
    let y = ch * 0.24;
    for (const { who, text } of messages) {
      ctx.fillStyle = AVATAR[who];
      ctx.beginPath();
      ctx.arc(side + cw * 0.05, y + ch * 0.02, ch * 0.045, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = HACK.ink;
      ctx.font = font(ch * 0.048);
      ctx.fillText(who, side + cw * 0.1, y);
      ctx.font = font(ch * 0.046, 500);
      for (const l of wrap(ctx, text, cw - side - cw * 0.14)) {
        y += ch * 0.065;
        ctx.fillText(l, side + cw * 0.1, y);
      }
      y += ch * 0.1;
    }
  });
  let key = '';
  return {
    mesh: panel.mesh,
    show(next: typeof messages) {
      const k = next.map(m => m.who + m.text).join('|');
      if (k === key) return;
      key = k;
      messages = next;
      panel.repaint();
    },
  };
}

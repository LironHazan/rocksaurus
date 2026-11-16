import * as THREE from 'three';
import { livePanel, ROUND } from './interior';

// Hack, the team chat (our own app, purple like the rest of it), open on a monitor over its screen: a DM between two
// of them. And its messages, typed out as t goes by.

const font = (size: number, weight = 700) => `${weight} ${size}px ${ROUND}`;
/** A message as it shows: who wrote it, and as much of it as is typed. */
interface ChatText {
  who: string;
  text: string;
}
/** A message in a chat: who, what, and when they start typing it. */
export interface HackMessage extends ChatText {
  at: number;
}
/** How fast they type in chat (characters a second). */
const CHAT_CPS = 30;
/** Hack sits this far in front of the screen it covers. */
const IN_FRONT = new THREE.Vector3(0, 0, 0.005);

/** Hack, the team chat (our own app, purple like the rest of it): how wide its sidebar is, and its colours. */
const HACK = { sidebar: 0.24, purple: '#4b2a6e', ink: '#1d1c22', faint: '#7a7884' } as const;

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
function createHackWindow(w: number, h: number, other: string, avatars: Readonly<Record<string, string>>) {
  let messages: readonly ChatText[] = [];
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
      ctx.fillStyle = avatars[who] ?? HACK.faint;
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

/**
 * Hack, open over `screen` (a plane), the same size and a hair in front of it, on the DM with `other`; `avatars` are
 * each one's colour. `show` repaints only when what's shown changed.
 */
export function hackOver(screen: THREE.Mesh, other: string, avatars: Readonly<Record<string, string>>) {
  const size = screen.geometry instanceof THREE.PlaneGeometry ? screen.geometry.parameters : { width: 1, height: 1 };
  const hack = createHackWindow(size.width, size.height, other, avatars);
  hack.mesh.position.copy(screen.position).add(IN_FRONT);
  screen.parent!.add(hack.mesh);
  return hack;
}

/** The messages as they stand at t: each typed out so far. */
export const typedOut = (chat: readonly HackMessage[], t: number): ChatText[] =>
  chat.flatMap(m =>
    t >= m.at ? [{ who: m.who, text: [...m.text].slice(0, Math.floor((t - m.at) * CHAT_CPS)).join('') }] : [],
  );

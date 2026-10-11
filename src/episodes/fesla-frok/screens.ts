import { ROUND } from '../../world/interior';
import { CUE, FROK, PERMISSIONS, PERM_EVERY, ticketsAt } from './timeline';

// What the screens show, as pure functions of t: the Fesla's dash (the map, Frok's install, the calls, Frok's ideas,
// the ticket counter) and Amazarus's monitor (his ticket queue). Each screen repaints only when its view changes.

/** The Fesla's dash, at t. */
export type DashView =
  | { kind: 'map' }
  | { kind: 'install'; ticked: number }
  | { kind: 'call'; who: string; secs: number }
  | { kind: 'ringing'; who: string; label: string }
  | { kind: 'frok'; text: string; wild: boolean }
  | { kind: 'tickets'; count: number };

/** Amazarus picks up when we cut to his cube; his call with Rorit is still going when Frok cuts in. */
const AMAZARUS_ON = CUE.amaz[0];

export function dashAt(t: number): DashView {
  const frok = FROK.find(f => t >= f.from && t < f.to);
  if (t >= CUE.flood[0] && t < CUE.tag[0]) return { kind: 'tickets', count: ticketsAt(t) };
  if (frok) return { kind: 'frok', text: frok.text, wild: t >= CUE.wild[0] };
  if (t < CUE.install) return { kind: 'map' };
  if (t < CUE.dial) return { kind: 'install', ticked: Math.max(0, Math.floor((t - CUE.perms[0]) / PERM_EVERY) + 1) };
  if (t < CUE.answer) return { kind: 'ringing', who: 'Lulu', label: 'Calling… 📞' };
  if (t >= CUE.waiting && t < AMAZARUS_ON) return { kind: 'ringing', who: 'Amazarus', label: 'Call waiting 📞' };
  const amazarus = t >= AMAZARUS_ON;
  return {
    kind: 'call',
    who: amazarus ? 'Amazarus' : 'Lulu',
    secs: Math.floor(t - (amazarus ? AMAZARUS_ON : CUE.answer)),
  };
}

const font = (size: number, weight = 700) => `${weight} ${size}px ${ROUND}`;

/** Frok: a round bot face, cyan eyes and a grin; wild, its eyes go to red stars. Centred on (x, y), `r` wide. */
function drawFrok(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, wild: boolean) {
  ctx.fillStyle = '#e9edf3';
  ctx.beginPath();
  ctx.roundRect(x - r, y - r * 0.8, r * 2, r * 1.6, r * 0.5);
  ctx.fill();
  ctx.fillStyle = '#141820';
  ctx.beginPath();
  ctx.roundRect(x - r * 0.8, y - r * 0.6, r * 1.6, r * 1.2, r * 0.4);
  ctx.fill();
  ctx.fillStyle = wild ? '#ff3b3b' : '#4ee6ff';
  ctx.font = font(r * 0.6);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const s of [-1, 1]) {
    if (wild) ctx.fillText('✶', x + s * r * 0.38, y - r * 0.12);
    else {
      ctx.beginPath();
      ctx.ellipse(x + s * r * 0.38, y - r * 0.12, r * 0.13, r * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = r * 0.09;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y + r * 0.1, r * 0.32, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.strokeStyle = '#e9edf3'; // the antenna
  ctx.beginPath();
  ctx.moveTo(x, y - r * 0.8);
  ctx.lineTo(x, y - r * 1.05);
  ctx.stroke();
  ctx.fillStyle = wild ? '#ff3b3b' : '#4ee6ff';
  ctx.beginPath();
  ctx.arc(x, y - r * 1.1, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

/** The navigation map: a road in red (traffic), our arrow on it, and the ETA. */
function drawMap(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#20252e';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#353c48';
  ctx.lineWidth = h * 0.04;
  for (const k of [0.2, 0.45, 0.75]) {
    ctx.beginPath();
    ctx.moveTo(0, h * k);
    ctx.lineTo(w, h * (k + 0.1));
    ctx.stroke();
  }
  ctx.strokeStyle = '#ff4b4b';
  ctx.lineWidth = h * 0.06;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.9);
  ctx.bezierCurveTo(w * 0.3, h * 0.5, w * 0.6, h * 0.7, w * 0.9, h * 0.15);
  ctx.stroke();
  ctx.fillStyle = '#4ee6ff';
  ctx.beginPath();
  ctx.moveTo(w * 0.24, h * 0.62);
  ctx.lineTo(w * 0.3, h * 0.72);
  ctx.lineTo(w * 0.18, h * 0.72);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(w * 0.06, h * 0.8, w * 0.88, h * 0.14);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font(w * 0.07);
  ctx.fillText('ETA 9:42 · heavy traffic 🔴', w * 0.5, h * 0.87);
}

function drawInstall(ctx: CanvasRenderingContext2D, w: number, h: number, ticked: number) {
  drawFrok(ctx, w * 0.5, h * 0.17, w * 0.16, false);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font(w * 0.085);
  ctx.fillText('Frok installed!', w * 0.5, h * 0.34);
  ctx.textAlign = 'left';
  ctx.font = font(w * 0.055, 600);
  ctx.fillStyle = '#9aa6b8';
  ctx.fillText('Permissions', w * 0.14, h * 0.43);
  PERMISSIONS.forEach((p, i) => {
    const on = i < ticked;
    const all = i === PERMISSIONS.length - 1;
    ctx.fillStyle = on ? (all ? '#ffe08a' : '#ffffff') : '#56607a';
    ctx.font = font(w * (all ? 0.085 : 0.068), all ? 800 : 600);
    ctx.fillText(`${on ? '✅' : '⬜'} ${p}`, w * 0.14, h * (0.51 + i * 0.08));
  });
}

function drawCall(ctx: CanvasRenderingContext2D, w: number, h: number, who: string, label: string, ringing: boolean) {
  ctx.fillStyle = ringing ? '#173b2a' : '#20252e';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = ringing ? '#2fd27a' : '#3a4254';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.36, w * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font(w * 0.22, 400);
  ctx.fillText('🦕', w * 0.5, h * 0.37);
  ctx.font = font(w * 0.12);
  ctx.fillText(who, w * 0.5, h * 0.62);
  ctx.font = font(w * 0.065, 600);
  ctx.fillStyle = ringing ? '#9ff0c4' : '#9aa6b8';
  ctx.fillText(label, w * 0.5, h * 0.72);
}

/** Words into rows no wider than `max`. */
function rows(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const out: string[] = [];
  let row = '';
  for (const word of text.split(' ')) {
    const next = row ? `${row} ${word}` : word;
    if (row && ctx.measureText(next).width > max) {
      out.push(row);
      row = word;
    } else row = next;
  }
  return [...out, row];
}

function drawSay(ctx: CanvasRenderingContext2D, w: number, h: number, text: string, wild: boolean) {
  ctx.fillStyle = wild ? '#3a1218' : '#1b2233';
  ctx.fillRect(0, 0, w, h);
  drawFrok(ctx, w * 0.5, h * 0.22, w * 0.2, wild);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(w * 0.08, h * 0.44, w * 0.84, h * 0.42, w * 0.06);
  ctx.fill();
  ctx.fillStyle = '#141820';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font(w * 0.085);
  const lines = rows(ctx, text, w * 0.74);
  const step = w * 0.11;
  lines.forEach((l, i) => ctx.fillText(l, w * 0.5, h * 0.65 + (i - (lines.length - 1) / 2) * step));
}

function drawTickets(ctx: CanvasRenderingContext2D, w: number, h: number, count: number) {
  ctx.fillStyle = '#3a1218';
  ctx.fillRect(0, 0, w, h);
  drawFrok(ctx, w * 0.5, h * 0.2, w * 0.18, true);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font(w * 0.075, 600);
  ctx.fillText('Opening tickets…', w * 0.5, h * 0.42);
  ctx.fillStyle = '#ffe08a';
  ctx.font = font(w * 0.2, 800);
  ctx.fillText(count.toLocaleString('en-US'), w * 0.5, h * 0.58);
  ctx.font = font(w * 0.12, 400);
  ctx.fillText('🎫🎫🎫', w * 0.5, h * 0.72);
  ctx.fillStyle = '#ff9a9a';
  ctx.font = font(w * 0.065, 600);
  ctx.fillText('Assignee: Amazarus', w * 0.5, h * 0.85);
}

/** Paints the dash's view. */
export function paintDash(ctx: CanvasRenderingContext2D, w: number, h: number, view: DashView) {
  ctx.fillStyle = '#1b2233';
  ctx.fillRect(0, 0, w, h);
  if (view.kind === 'map') drawMap(ctx, w, h);
  else if (view.kind === 'install') drawInstall(ctx, w, h, view.ticked);
  else if (view.kind === 'ringing') drawCall(ctx, w, h, view.who, view.label, true);
  else if (view.kind === 'call') {
    const mm = Math.floor(view.secs / 60);
    const ss = String(view.secs % 60).padStart(2, '0');
    drawCall(ctx, w, h, view.who, `On the call · ${mm}:${ss}`, false);
  } else if (view.kind === 'frok') drawSay(ctx, w, h, view.text, view.wild);
  else drawTickets(ctx, w, h, view.count);
}

/** Amazarus's monitor: his ticket queue, and from CUE.swamped, Frok's flood on top of it. */
export function queueAt(t: number): number {
  return t >= CUE.swamped[0] ? ticketsAt(CUE.flood[1]) : 0;
}

/** The tickets in his queue before Frok: the approved one, and the two IT asked him to open. */
const QUEUE = [
  ['INFRA-101', 'New infra for validations', 'Approved ✅'],
  ['INFRA-102', 'Open a ticket for the actual work', 'To do'],
  ['INFRA-103', 'Open a ticket for the other actual work', 'To do'],
] as const;

export function paintQueue(ctx: CanvasRenderingContext2D, w: number, h: number, flood: number) {
  ctx.fillStyle = '#f4f6fa';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#2f3a4f';
  ctx.fillRect(0, 0, w, h * 0.14);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = font(h * 0.07);
  ctx.fillText('My tickets', w * 0.04, h * 0.07);
  QUEUE.forEach(([id, what, state], i) => {
    const y = h * (0.24 + i * 0.12);
    ctx.fillStyle = '#5a6478';
    ctx.font = font(h * 0.045, 600);
    ctx.fillText(id, w * 0.04, y);
    ctx.fillStyle = '#1b2233';
    ctx.font = font(h * 0.05, 600);
    ctx.fillText(what, w * 0.22, y);
    ctx.fillStyle = state.startsWith('Approved') ? '#1f9d55' : '#c98a00';
    ctx.fillText(state, w * 0.8, y);
  });
  if (flood === 0) return;
  // Frok's flood: a red banner and tickets stacked to the bottom
  ctx.fillStyle = '#e5383b';
  ctx.fillRect(0, h * 0.6, w, h * 0.4);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = font(h * 0.12, 800);
  ctx.fillText(`📥 ${flood.toLocaleString('en-US')} new tickets`, w * 0.5, h * 0.74);
  ctx.font = font(h * 0.055, 600);
  ctx.fillText('Opened by: Frok 🤖 (on behalf of Rorit)', w * 0.5, h * 0.88);
}

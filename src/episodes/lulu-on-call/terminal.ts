// A terminal on Lulu's screens, written as a script of lines that appear (or get typed) over time.

export type LineKind = 'title' | 'prompt' | 'agent' | 'ok' | 'err' | 'dim';

export interface ScriptLine {
  /** Seconds (episode time) when the line starts. */
  at: number;
  text: string;
  kind: LineKind;
  /** Typed out at this many characters per second instead of appearing at once. */
  cps?: number;
}

export interface ShownLine {
  text: string;
  kind: LineKind;
}

/** Characters of a line visible at time t. */
export function visibleChars(line: ScriptLine, t: number): number {
  if (t < line.at) return 0;
  if (!line.cps) return line.text.length;
  return Math.min(line.text.length, Math.floor((t - line.at) * line.cps));
}

/** The lines on screen at time t (a typed line shows only what's been typed so far). */
export function linesAt(script: readonly ScriptLine[], t: number): ShownLine[] {
  return script
    .filter(l => t >= l.at)
    .map(l => ({ text: [...l.text].slice(0, visibleChars(l, t)).join(''), kind: l.kind }));
}

/** Times of each keystroke in typed lines (for typing sounds and paw taps). */
export function keystrokes(script: readonly ScriptLine[]): number[] {
  return script.flatMap(l => (l.cps ? Array.from({ length: [...l.text].length }, (_, i) => l.at + i / l.cps!) : []));
}

export const OFFICE_SCRIPT: readonly ScriptLine[] = [
  { at: 0, text: 'lulu@work ~/checkout $', kind: 'title' },
  { at: 6.8, text: '› add retry logic to the payment', kind: 'prompt', cps: 20 },
  { at: 8.5, text: '  service + tests. ship before 6 🙏', kind: 'prompt', cps: 20 },
  { at: 10.8, text: '✻ Planning…', kind: 'agent' },
  { at: 11.5, text: '✻ Editing payment.ts', kind: 'agent' },
  { at: 12.3, text: '✻ Writing tests… 42 passed', kind: 'agent' },
  { at: 13.2, text: '✓ PR #666 opened, ready for review', kind: 'ok' },
];

export const NIGHT_SCRIPT: readonly ScriptLine[] = [
  { at: 0, text: 'lulu@home ~ 3:08 AM $', kind: 'title' },
  { at: 64.2, text: '› PROD IS DOWN 🔥 checkout = 500s', kind: 'prompt', cps: 22 },
  { at: 65.9, text: '  fix it pls pls pls', kind: 'prompt', cps: 22 },
  { at: 67.2, text: '✻ Reading logs…', kind: 'agent' },
  { at: 68.1, text: '✻ Found it: infinite retry loop', kind: 'agent' },
  { at: 68.8, text: '  ↳ added in PR #666', kind: 'err' },
  { at: 69.7, text: '✓ Hotfix deployed, all green', kind: 'ok' },
];

// Text on an in-scene screen (a terminal, a document…), written as a script of lines that appear
// (or get typed out) over time. Pure functions of time, like everything else.

export type LineKind = 'title' | 'prompt' | 'agent' | 'ok' | 'err' | 'dim' | 'heading' | 'body';

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

import type { ScriptLine } from '../../world/screen-script';
import { CUE } from './timeline';

// What's on their screens: their terminals, and Hack (the team chat) for his DM. Version numbers are made up for the
// story: Node.js 26 is the latest line.

export const LULU_SCRIPT: readonly ScriptLine[] = [
  { at: 0, text: 'lulu@work ~/platform $', kind: 'title' },
  { at: 0.8, text: '› refactor the deploy pipeline', kind: 'prompt', cps: 16 },
  { at: 2.9, text: '✻ Reading 214 files…', kind: 'agent' },
  { at: CUE.focus[0], text: '🔕 Focus mode: ON 🎧', kind: 'ok' },
  { at: CUE.focus[0] + 0.8, text: '› split deploy into stages', kind: 'prompt', cps: 18 },
  { at: CUE.focus[0] + 3.0, text: '✻ Editing pipeline.yml', kind: 'agent' },
];

export const YASHI_SCRIPT: readonly ScriptLine[] = [
  { at: 0, text: 'yashi@arch ~ $', kind: 'title' },
  { at: CUE.yashi[0] + 0.4, text: '› npm audit', kind: 'prompt', cps: 12 },
  { at: CUE.yashi[0] + 1.6, text: '✗ 1 critical: CVE-2026-31337', kind: 'err' },
  { at: CUE.yashi[0] + 2.2, text: '  npm on Node.js < 26.1.1', kind: 'dim' },
  { at: CUE.yashi[0] + 2.8, text: '  No fixes for deprecated versions', kind: 'err' },
  { at: CUE.patch[0], text: '› node -v', kind: 'prompt', cps: 10 },
  { at: CUE.patch[0] + 0.9, text: 'v26.1.0 · latest, since 3 weeks ago 😎', kind: 'ok' },
  { at: CUE.patch[0] + 1.5, text: '› FROM node:26.1.1 · rebuild images', kind: 'prompt', cps: 24 },
  { at: CUE.patch[0] + 3.0, text: '✓ 14 images built & pushed 🐳', kind: 'ok' },
  { at: CUE.patch[0] + 3.6, text: '✓ Rolled out to EKS · tests green 🛡️', kind: 'ok' },
];

/** A chat message: who wrote it, what, and when they start typing it (it's typed out at `cps`). */
interface ChatMessage {
  who: 'Yashinozarus' | 'Lulu';
  text: string;
  at: number;
}
/** How fast they type in chat (characters a second). */
const CHAT_CPS = 30;
/** His DM to her, and her answer. */
const DM: readonly ChatMessage[] = [
  { who: 'Yashinozarus', text: '🚨 Critical npm CVE. Node.js upgrade, no fixes for deprecated versions.', at: CUE.dm },
  { who: 'Yashinozarus', text: 'Come over? 🧐', at: CUE.dm + 1.0 },
  { who: 'Lulu', text: 'On my way 🏃‍♀️', at: CUE.ping + 2.0 },
];
/** The messages as they stand at t: each typed out so far. */
export const dmAt = (t: number): { who: ChatMessage['who']; text: string }[] =>
  DM.flatMap(m =>
    t >= m.at ? [{ who: m.who, text: [...m.text].slice(0, Math.floor((t - m.at) * CHAT_CPS)).join('') }] : [],
  );

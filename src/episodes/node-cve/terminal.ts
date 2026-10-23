import type { ScriptLine } from '../../world/screen-script';
import { CUE } from './timeline';

// What's on their screens. Version numbers are made up for the story: Node.js 26 is the latest line.

export const LULU_SCRIPT: readonly ScriptLine[] = [
  { at: 0, text: 'lulu@work ~/platform $', kind: 'title' },
  { at: 0.8, text: '› refactor the deploy pipeline', kind: 'prompt', cps: 16 },
  { at: 2.9, text: '✻ Reading 214 files…', kind: 'agent' },
  { at: CUE.focus[0], text: '🔕 Focus mode: ON 🎧', kind: 'ok' },
  { at: CUE.focus[0] + 0.8, text: '› split deploy into stages', kind: 'prompt', cps: 18 },
  { at: CUE.focus[0] + 3.0, text: '✻ Editing pipeline.yml', kind: 'agent' },
  { at: CUE.ping, text: '🔔 Hack · Yashinozarus', kind: 'err' },
  { at: CUE.ping + 0.5, text: '🚨 CRITICAL npm CVE: upgrade Node.js', kind: 'err' },
  { at: CUE.ping + 1.2, text: '   No fixes for deprecated versions 💀', kind: 'err' },
  { at: CUE.patch[0], text: '› node -v', kind: 'prompt', cps: 10 },
  { at: CUE.patch[0] + 1.1, text: 'v26.1.0 · latest, since 3 weeks ago 😎', kind: 'ok' },
  { at: CUE.patch[0] + 2.0, text: '› nvm install 26.1.1 && npm test', kind: 'prompt', cps: 20 },
  { at: CUE.patch[0] + 4.0, text: '✓ 1,284 tests passed', kind: 'ok' },
  { at: CUE.patch[0] + 4.8, text: '✓ All environments patched 🛡️', kind: 'ok' },
];

export const YASHI_SCRIPT: readonly ScriptLine[] = [
  { at: 0, text: 'yashi@arch ~ $', kind: 'title' },
  { at: CUE.yashi[0] + 0.4, text: '› npm audit', kind: 'prompt', cps: 12 },
  { at: CUE.yashi[0] + 1.6, text: '✗ 1 critical: CVE-2026-31337', kind: 'err' },
  { at: CUE.yashi[0] + 2.2, text: '  npm on Node.js < 26.1.1', kind: 'dim' },
  { at: CUE.yashi[0] + 2.8, text: '  Fix: upgrade Node.js', kind: 'dim' },
  { at: CUE.yashi[0] + 3.4, text: '  No fixes for deprecated versions', kind: 'err' },
  { at: CUE.reply[0] + 0.3, text: '🔔 Hack · Lulu', kind: 'ok' },
  { at: CUE.reply[0] + 0.8, text: '✅ Done. Already on latest 😎', kind: 'ok' },
];

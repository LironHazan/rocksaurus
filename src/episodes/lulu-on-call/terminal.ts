import type { ScriptLine } from '../../world/screen-script';

// What's on Lulu's screens.

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

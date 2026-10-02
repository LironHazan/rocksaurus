import type { Caption } from '../../engine/types';

// Subtitle style: everything is left-aligned at the bottom, so the middle of the frame stays clear.
// Each scene opens with a title card, then a subtitle explains what's going on, with a metal punchline
// on the line under it. Times are story seconds (the episode scales them by PACE).

const LINE_1 = 0.75; // title cards and subtitles
const LINE_2 = 0.83; // punchlines
const TITLE_Y = 0.8; // two-line scene titles, centered between the two lines (shown before any punchline)
const BASE = { align: 'left' } as const;
const title = (from: number, to: number, text: string): Caption => ({
  from,
  to,
  text,
  ...BASE,
  y: TITLE_Y,
  size: 0.078,
  color: '#ffe08a',
});
const sub = (from: number, to: number, text: string, extra: Partial<Caption> = {}): Caption => ({
  from,
  to,
  text,
  ...BASE,
  y: LINE_1,
  size: 0.068,
  ...extra,
});
const punch = (from: number, to: number, text: string, extra: Partial<Caption> = {}): Caption => ({
  from,
  to,
  text,
  ...BASE,
  y: LINE_2,
  size: 0.058,
  color: '#c9f2ff',
  ...extra,
});

export const CAPTIONS: Caption[] = [
  // ── The office ──────────────────────────────────────────────
  title(0.2, 2.8, '🏢 THE OFFICE\n5:58 PM'),
  sub(3.0, 6.6, 'Meet Lulu: drummer by night, dev by day'),
  sub(6.8, 10.4, 'She tells the coding agent to do her task'),
  punch(7.6, 10.4, '(Typing with drumsticks, obviously 🥁)'),
  sub(10.6, 13.4, 'The agent writes the code…'),
  punch(10.9, 13.4, 'She is the Master of Puppets 🤘'),
  sub(13.6, 15.9, '6:00 PM sharp. Logged off 👋'),
  punch(13.9, 15.9, 'PR #666: the number of the beast'),

  // ── The walk home ───────────────────────────────────────────
  title(16.2, 18.6, '🚶‍♀️ THE COMMUTE\n20 km on foot'),
  sub(18.8, 22.0, 'Lulu walks home. All 20 km.'),
  sub(22.1, 25.3, 'It takes her 30 min'),
  sub(25.4, 28.3, 'Commute playlist: Walk 🎧'),
  punch(25.8, 28.3, 'On repeat, stomping on the beat'),
  sub(28.4, 31.9, 'Home by 6:30 🏠'),
  punch(28.8, 31.9, 'Run to the Hills? She walked over them'),

  // ── Gains ───────────────────────────────────────────────────
  title(32.2, 34.4, '🥤 GAINS\n6:31 PM'),
  sub(34.5, 37.1, 'Post-walk protein shake'),
  punch(34.8, 37.1, 'Flavor: Iron Man 🤘'),
  sub(37.2, 40.5, 'Chugs it like it’s Wacken'),
  punch(37.6, 40.5, 'One long neck, zero spills'),
  sub(40.6, 41.9, '💪 Tiny arms, big gains'),

  // ── Pilates ─────────────────────────────────────────────────
  title(42.2, 44.3, '🧘‍♀️ PILATES\n7:00 PM'),
  sub(44.4, 48.0, 'Neck stretches'),
  punch(44.8, 48.0, '(Headbanging injury prevention)'),
  sub(48.2, 53.8, 'The hundred: core of steel'),
  punch(48.6, 51.2, 'Breathe in… breathe out…'),
  punch(51.3, 53.8, '…98, 99, 100. Painkiller, please 😮‍💨'),

  // ── On call ─────────────────────────────────────────────────
  title(54.2, 56.4, '🌙 ON CALL\n3:07 AM'),
  sub(56.5, 59.9, 'Enter Sandman 😴'),
  punch(56.9, 59.9, 'Dreaming of double-kick solos'),
  sub(60.0, 62.9, '📟 PAGED! Prod is down 🔥', { color: '#ff6b8b' }),
  punch(60.4, 62.9, 'Fear of the Dark? No. Fear of the pager'),
  sub(63.0, 66.4, 'Awake faster than a blast beat'),
  punch(63.4, 66.4, 'Typing at 240 BPM 🥁'),
  sub(66.5, 70.4, 'She asks the agent to hotfix it'),
  punch(66.9, 70.4, 'The bug? The task from PR #666 🙃'),
  sub(70.5, 73.3, 'Hotfix deployed. Crisis over.'),
  punch(70.9, 73.3, 'Who wrote that bug anyway?'),
  sub(73.4, 75.9, 'Git blame: Lulu 🫠', { color: '#ffe08a' }),
  punch(74.2, 75.9, 'Horns up. Back to bed 🤘'),
];

import type { Caption } from '../../engine/types';
import { title, sub, punch } from '../../engine/subtitles';

export const CAPTIONS: Caption[] = [
  title(0.3, 3.8, '⚽ SATURDAY, 9 AM\nDaycare Dads FC'),
  sub(4.0, 7.9, 'His lucky shirt today:'),
  punch(4.4, 7.9, 'Ronaldo, number 7 🐐'),

  // ── The game ────────────────────────────────────────────────
  sub(8.2, 11.9, 'Kickoff! Pass, pass, pass'),
  punch(8.6, 11.9, 'He plays just like his name'),
  sub(12.1, 15.4, 'Then Tiki Taka goes solo'),
  punch(12.5, 15.4, 'Tiny arms, zero handballs'),
  sub(15.6, 19.6, 'One stepover…'),
  punch(16.3, 19.6, 'Dad knees weren’t ready 😵'),

  // ── Goal ────────────────────────────────────────────────────
  title(20.0, 21.9, '⚽ GOOOOAL!\nSeason’s first goal'),
  sub(22.0, 24.4, 'He rehearsed this all week'),
  punch(22.5, 24.4, 'SIUUU! 🙌'),
  sub(24.6, 26.4, 'Tiny arms can’t high-five…'),
  punch(24.95, 26.4, 'Belly bump instead 💥'),
  sub(26.6, 28.2, 'His biggest fan 🍼'),
  punch(27.0, 28.2, 'Already practising the move'),
  sub(28.4, 29.9, 'Final score: 1–0'),
  punch(28.7, 29.9, 'Daycare pickup is at noon'),
];

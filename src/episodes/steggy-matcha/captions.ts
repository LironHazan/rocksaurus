import type { Caption } from '../../engine/types';
import { title, sub, punch } from '../../engine/subtitles';

// Times are story seconds (the episode scales them by PACE).

export const CAPTIONS: Caption[] = [
  sub(0.8, 5.4, "Steggy: physicist, PhD.\nLives in his dad's place"),
  sub(5.8, 10.6, '500 metal CDs, helll yeahh ride the Lightning!'),
  sub(11.2, 18.8, 'Trying to write a scientific paper..'),
  punch(11.9, 18.8, 'Scenes from a Memory: total focus'),

  title(19.1, 21.4, '👶 ENTER: SISTER - She has other plans'),
  sub(21.8, 26.8, 'Nudge. Nudge. NUDGE.'),
  punch(22.5, 26.8, 'And focus? Fade to Black..'),
  sub(27.2, 30.9, 'Time to run to the hills!'),
  punch(27.9, 30.9, 'Well… to the café'),

  title(31.1, 33.1, "☕ THE COFFEE SHOP\nRory's place"),
  sub(33.3, 37.1, 'Rory brings two green matcha 🍵'),
  punch(34.0, 37.1, 'Green is the new black'),
  sub(37.6, 43.3, 'Ahh… 🍵'),
  punch(38.3, 43.3, 'Peace sells. Matcha too'),
];

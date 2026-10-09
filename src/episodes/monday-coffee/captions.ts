import type { Caption } from '../../engine/types';
import { title, sub, punch } from '../../engine/subtitles';

export const CAPTIONS: Caption[] = [
  title(0.2, 2.5, '☕ MONDAY, 8:10 AM\nSchool drop-off'),
  sub(2.7, 7.7, 'Three kids, three schools'),
  punch(5.3, 7.7, 'One group chat 📱'),
  sub(8.0, 10.5, 'Tiki Taka, to the chat:'),
  sub(10.8, 21.2, 'The great café debate'),
  punch(13.6, 18.0, 'Steggy is still on matcha 🍵'),
  punch(19.4, 21.2, 'Tiki only cares about chairs 🦖'),

  title(26.6, 29.0, '🛋️ MEANWHILE\nLulu’s Monday therapy'),
  sub(29.2, 36.6, 'Lulu LOVES coffee…'),
  punch(29.6, 36.6, 'Mid-session. Phone out 🙈'),
  sub(36.8, 41.4, '“And how do you feel?”'),
  punch(38.0, 41.4, 'Lulu: “FOMO. Severe FOMO.” 😩'),

  sub(41.8, 45.6, 'Big chairs, as promised'),
  punch(42.2, 45.6, 'Parliament is in session ☕'),
  sub(45.8, 50.0, 'And a selfie for Lulu 📸'),
  sub(50.4, 54.8, 'Next Monday:'),
  punch(51.2, 54.8, 'Therapy moves to Tuesday 📅'),
];

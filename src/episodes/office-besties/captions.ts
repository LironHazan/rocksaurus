import type { Caption } from '../../engine/types';
import { title, sub, punch } from '../../engine/subtitles';
import { LINES } from './timeline';

export const CAPTIONS: Caption[] = [
  title(0.2, 2.5, '☀️ 8:44 AM\nLulu, almost out the door'),
  sub(2.8, 4.5, 'Bzzz. The office group chat 📱'),
  sub(5.0, 10.8, 'Rorit, fresh out of the gym 🏋️‍♀️'),
  punch(9.2, 10.8, 'A protein emergency 🚨'),
  sub(11.2, 12.8, 'Silvi is trying her best ✨'),
  sub(13.0, 15.4, 'Lulu knows exactly what to do'),

  sub(15.8, 21.4, 'Lulu’s emergency protein stash 🍫'),
  punch(17.0, 21.4, 'Stocked like a tour bus 🚌🤘'),

  title(21.8, 25.5, '🏢 THE OFFICE\nPapo Pako Shapeworks'),
  sub(25.8, 27.3, 'Rorit is NOT okay'),
  sub(27.6, 31.0, 'Gains: saved 💪'),
  punch(29.2, 31.0, 'Rorit: “Ugh. Legend.” 🙏'),

  ...LINES.slice(0, 3).map(l => sub(l.from, l.to, `${l.who}: “${l.text}”`)),
  sub(41.6, 43.4, '*Collective gasp* 😱'),
  ...LINES.slice(3).map(l => sub(l.from, l.to, `${l.who}: “${l.text}”`)),
  punch(50.0, 51.8, 'Lulu: protein dealer. Now on call 📟'),
];

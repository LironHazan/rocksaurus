import type { Caption } from '../../engine/types';
import { title, sub, punch } from '../../engine/subtitles';
import { CUE, LINES } from './timeline';

const said = (i: number) => {
  const l = LINES[i]!;
  return sub(l.from, l.to, `${l.who}: “${l.text}”`);
};

export const CAPTIONS: Caption[] = [
  title(0.2, 2.6, '🏋️ OMLI\nLulu’s teammate. Lifts.'),
  sub(2.8, 3.9, 'Bzzz 📱'),
  sub(4.0, 9.6, 'A DM from Lulu 🥁'),
  punch(6.2, 9.6, 'Tiki Taka broke his arm 🤕'),
  sub(9.8, 13.9, 'Omli is in 🤘'),
  sub(14.1, 14.95, 'Arm day: every day 💪'),

  title(15.2, 17.4, '🎸 THE AUDITION\nThe next day'),
  sub(17.6, 20.4, 'Omli. Bass. Muscles.'),
  punch(18.4, 20.4, 'Wearing the right T-shirt 🤘'),
  sub(20.6, 22.4, 'The band: 😳'),
  sub(22.6, CUE.drumsIn - 0.1, 'Tiki Taka: 😬'),
  punch(23.2, CUE.drumsIn - 0.1, 'Arm in a sling. Jealous.'),
  sub(CUE.drumsIn + 0.1, CUE.drumsIn + 3.6, 'Lulu can’t help herself 🥁'),
  sub(CUE.guitarIn, CUE.guitarIn + 3.2, 'Then Rory jumps in 🎸'),
  sub(CUE.guitarIn + 3.4, CUE.lastHit, 'Groove metal. On a Tuesday. 🤘'),
  sub(CUE.lastHit + 0.3, CUE.verdict[0] - 0.1, 'That’s a wrap 🔥'),

  said(0),
  said(1),
  punch(44.4, 46.8, 'Rocksaurus: now 40% more muscle 💪'),
];

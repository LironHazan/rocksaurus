import type { Caption } from '../../engine/types';
import { boxedAtBottom, punch, sub, title } from '../../engine/subtitles';
import { BAR4, BAR7, LINES, T } from './timeline';

// What to listen for, and a little fun with the counting. Then the three lines.

const line = (i: number) => {
  const l = LINES[i]!;
  return sub(l.from, l.to, `${l.who}: “${l.text}”`);
};

const AT_THE_BOTTOM: Caption[] = [
  title(0.1, T.drumsIn - 0.1, '🌀 Prog night\nTiki Taka starts a riff in 7/8'),
  sub(T.drumsIn, T.groove - 0.1, 'Lulu on the toms. Very Danny Carey 🥁'),
  punch(T.drumsIn + 0.8, T.groove - 0.1, 'Count it: 1-2, 1-2, 1-2-3 🧮'),
  sub(T.groove, T.groove + 2 * BAR7, 'Drop D. Everyone in 🤘'),
  punch(T.groove + BAR7 * 0.5, T.groove + 2 * BAR7, 'Still 7/8. Nobody’s counting anymore'),
  sub(T.verse, T.verse + 2 * BAR4, 'Half time. Paris, soft and ominous 🕯️'),
  sub(T.build, T.chorus - 0.1, 'Rory plays fives over Lulu’s fours 🌀'),
  punch(T.build + BAR4 * 0.5, T.chorus - 0.1, 'On purpose. Probably'),
  sub(T.chorus, T.chorus + 2 * BAR4, 'And it opens up 🦅'),
  sub(T.outro, T.end - 0.1, 'The riff. One last time 🔁'),
  sub(T.end, LINES[0]!.from - 0.05, 'Everyone lands on D. Somehow 😮‍💨'),
  line(0),
  line(1),
  line(2),
];

export const CAPTIONS: Caption[] = boxedAtBottom(AT_THE_BOTTOM);

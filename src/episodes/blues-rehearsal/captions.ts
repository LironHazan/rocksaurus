import type { Caption } from '../../engine/types';
import { boxedAtBottom, punch, sub, title } from '../../engine/subtitles';
import { BAR } from './music';
import { CUE, LINES, barAt, chorusBar, secondBar } from './timeline';

// Few words: the music is the point. A title, what to listen for, and the two lines at the end.

const line = (i: number) => {
  const l = LINES[i]!;
  return sub(l.from, l.to, `${l.who}: “${l.text}”`);
};

const AT_THE_BOTTOM: Caption[] = [
  title(0.2, barAt(1) - 0.1, '🎸 The rehearsal room, 7 PM\nRory’s early'),
  sub(barAt(1), barAt(2) - 0.1, 'Slow blues in A. 12/8. Eyes closed.'),
  punch(barAt(1) + 1.2, barAt(2) - 0.1, 'Bend it. Hold it. Make it cry 🎸'),
  sub(barAt(2), CUE.sneak[0] - 0.1, 'That bend? Pure Albert King 🤘'),
  sub(CUE.sneak[0], CUE.in - 0.1, 'Lulu walks in. He hasn’t noticed 🤫'),
  sub(CUE.in, chorusBar(2), 'She slides in with a slow shuffle 🥁'),
  punch(CUE.in + 1.4, chorusBar(2), 'Not one note too many'),
  sub(chorusBar(9), chorusBar(11) - 0.1, 'Tiki Taka. Bass on. Not a word 🤫'),
  sub(chorusBar(11), chorusBar(11) + BAR - 0.1, 'The turnaround 🔁'),
  sub(secondBar(1), secondBar(2), 'Chorus two: the walking bass 🎸'),
  punch(secondBar(1) + 1.2, secondBar(2), 'Now it’s a band 🤘'),
  sub(secondBar(5), secondBar(6) - 0.1, 'A step and a half. Albert would approve 🤘'),
  sub(secondBar(9), secondBar(10) - 0.1, 'Bar 9: the V. He’s flying 🔥'),
  sub(secondBar(11), secondBar(11) + BAR - 0.1, 'The turnaround, again 🔁'),
  sub(CUE.final, LINES[0]!.from - 0.05, 'B♭9 → A9 🤌'),
  line(0),
  line(1),
  line(2),
];

export const CAPTIONS: Caption[] = boxedAtBottom(AT_THE_BOTTOM);

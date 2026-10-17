import type { Caption } from '../../engine/types';
import { boxedAtBottom, punch, sub, title } from '../../engine/subtitles';
import { FINAL_CHORD, HEAD } from './music';
import { LINES, barAt, headBar, outBar, soloBar } from './timeline';

// Few words: the music is the point. Where we are, what to listen for, and the three lines at the end.

const line = (i: number) => {
  const l = LINES[i]!;
  return sub(l.from, l.to, `${l.who}: “${l.text}”`);
};

const AT_THE_BOTTOM: Caption[] = [
  title(0.1, barAt(HEAD) - 0.1, '🎸 Same rehearsal, after the blues\nNow: gypsy jazz in G'),
  sub(headBar(1), headBar(3) - 0.1, 'La pompe: boom-CHICK, boom-CHICK 🥖'),
  punch(headBar(1) + 0.6, headBar(3) - 0.1, 'In gypsy jazz, the guitar is the drums'),
  sub(headBar(3), headBar(5) - 0.1, 'G6 → E7 → Am6 → D7. Round and round 🔁'),
  sub(headBar(6), headBar(8) - 0.1, 'Over the E7: a diminished run. Very Django 🎩'),
  sub(headBar(11), headBar(13) - 0.1, 'C6… then Cm6. The minor six: the sigh 🥀'),
  sub(headBar(13), headBar(16) - 0.1, 'Lulu on the ride, feathering the kick 🪶'),
  sub(soloBar(1), soloBar(3) - 0.1, 'The solo: arpeggios, swept in triplets 🔥'),
  punch(soloBar(1) + 0.6, soloBar(3) - 0.1, 'Tiki walks four to the bar 🚶'),
  sub(soloBar(5), soloBar(7) - 0.1, 'Octaves 🎯'),
  sub(soloBar(9), soloBar(10) - 0.1, 'Tremolo picking 🌀'),
  sub(soloBar(13), soloBar(15) - 0.1, 'A chromatic run, all the way down 🎢'),
  sub(outBar(1), outBar(3) - 0.1, 'Back to the head 🏠'),
  sub(FINAL_CHORD - 0.2, LINES[0]!.from - 0.05, 'A♭9 → G6/9. Fin 🤌'),
  line(0),
  line(1),
  line(2),
];

export const CAPTIONS: Caption[] = boxedAtBottom(AT_THE_BOTTOM);

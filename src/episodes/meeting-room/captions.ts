import type { Caption } from '../../engine/types';
import { title, sub, punch, boxedAtBottom } from '../../engine/subtitles';
import { CUE, LINES } from './timeline';

const line = (i: number) => {
  const l = LINES[i]!;
  return sub(l.from, l.to, `${l.who}: “${l.text}”`);
};
const [, , , , lastPost] = CUE.posts;

const AT_THE_BOTTOM: Caption[] = [
  title(0.2, CUE.campus[1] - 0.1, '🏢 Another day at the office'),
  sub(CUE.room + 0.2, CUE.posts[0] - 0.1, 'Statitezarus, the agentic AI team 🦸'),
  sub(CUE.posts[0], lastPost + 1.2, 'He has a design. He wants reviews.'),
  punch(CUE.posts[1], lastPost + 1.2, 'Posted in #agentic-ai. And #design-review. And…'),
  sub(CUE.tagged[0], CUE.tagged[1], 'Five channels. The same two dinos tagged. Every time 📣'),
  punch(CUE.tagged[0] + 1.2, CUE.tagged[1], 'Dchozaurus & Igarzarus: 🫠'),
  line(0),
  line(1),
  sub(LINES[1]!.to + 0.2, LINES[2]!.from - 0.1, 'He asks this at every opportunity 🔁'),
  punch(LINES[1]!.to + 0.8, LINES[2]!.from - 0.1, 'Ruby → Elm. Someday. 🤘'),
  line(2),
  line(3),
  line(4),
  line(5),
  sub(CUE.door, LINES[6]!.from - 0.1, 'Ogozaurus walks in ⚽'),
  line(6),
  sub(CUE.confused[0], CUE.confused[1], 'Lulu: …was WHAT done? 😶'),
  punch(CUE.confused[0] + 1.6, CUE.confused[1], 'Another day at the office 🤘'),
];

export const CAPTIONS: Caption[] = boxedAtBottom(AT_THE_BOTTOM);

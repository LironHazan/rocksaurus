import type { Caption } from '../../engine/types';
import { title, sub, punch } from '../../engine/subtitles';
import { CUE, FROK, LINES, type Speaker } from './timeline';

const said = (who: Speaker, text: string) => LINES.find(l => l.who === who && l.text === text)!;
const line = (i: number) => {
  const l = LINES[i]!;
  return sub(l.from, l.to, `${l.who}: “${l.text}”`);
};
const frok = (i: number) => {
  const f = FROK[i]!;
  return sub(f.from, f.to, `Frok 🤖: “${f.text}”`);
};
/** Lulu's last word: bigger, yellow, a little higher, so it reads as the punchline it is. */
const STATEMENT = { y: 0.85, size: 0.07, color: '#ffe08a' } as const;
const escalate = said('Lulu', 'Let me escalate. I’m still a manager by title 😂');

const AT_THE_BOTTOM: Caption[] = [
  title(0.2, 2.6, '🚗 8:30 AM, the highway\nRorit drives to work'),
  sub(CUE.install, CUE.perms[0] + 0.6, 'Her Fesla just got Frok bot 🤖'),
  sub(CUE.perms[0] + 0.8, CUE.dial, 'She gave it permissions to her whole workflow'),
  punch(CUE.perms[1] - 1.2, CUE.dial, 'Permissions: EVERYTHING ✅'),
  sub(CUE.dial + 0.1, CUE.answer + 0.3, 'Stuck in traffic? Call Lulu 📞'),

  line(0),
  line(1),
  line(2),
  frok(0),
  line(3),
  line(4),
  line(5),
  line(6),
  line(7),
  line(8),
  punch(LINES[8]!.from, CUE.amaz[1], 'Amazaurus: not so calm anymore 🍅'),

  frok(1),
  punch(CUE.flood[0], CUE.flood[1], 'Frok has permissions to everything 🎫🎫🎫'),
  line(9),
  sub(CUE.swamped[0], CUE.swamped[1], 'His queue: 4,096 new tickets 💀'),

  sub(CUE.cube[0] + 0.2, CUE.arrive + 0.1, 'Lulu, with tea 🍵'),
  line(10),
  punch(escalate.from, escalate.to + 1.2, `Lulu: “${escalate.text}”`, STATEMENT),
  sub(CUE.give, CUE.tag[0], 'Tea: the original incident response 🤘'),
  frok(2),
];

/** This Short's captions go top left, clear of the action at the bottom of each shot: titles, subtitles and lines
 * high up (the owner's call: above the Shorts safe area, which starts at 0.17), punchlines (written under the
 * subtitle line, past `PUNCH_LINE`) under them. Heights are fractions of the frame; a caption is centred on its
 * height. */
const TOP = 0.12;
const UNDER = 0.225;
const PUNCH_LINE = 0.9;
/** A dark, see-through box behind each caption, so it reads over the street and the office. */
const BACKDROP = 'rgba(16, 18, 30, 0.62)';
export const CAPTIONS: Caption[] = AT_THE_BOTTOM.map(c => ({
  ...c,
  y: (c.y ?? 0) > PUNCH_LINE ? UNDER : TOP,
  backdrop: BACKDROP,
}));

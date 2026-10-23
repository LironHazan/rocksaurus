import type { Caption } from '../../engine/types';
import { boxedAtBottom, punch, sub, title } from '../../engine/subtitles';
import { ASKERS, CUE, DURATION, LINES } from './timeline';

const line = (i: number) => {
  const l = LINES[i]!;
  return sub(l.from, l.to, `${l.who}: “${l.text}”`);
};

const AT_THE_BOTTOM: Caption[] = [
  title(0.2, ASKERS[0].walk[0] + 1.4, '🏢 Another day at the office\nLulu tries to get some work done'),
  line(0),
  line(1),
  sub(LINES[1]!.to + 0.1, LINES[2]!.from - 0.1, 'Interruption #1 ✅'),
  line(2),
  line(3),
  sub(CUE.sign - 0.3, LINES[4]!.from - 0.1, 'She made a sign 🪧'),
  punch(CUE.sign + 0.4, LINES[4]!.from - 0.1, 'Interruption #3 incoming…'),
  line(4),
  line(5),
  sub(CUE.focus[0], CUE.focus[1], 'Finally. Focus mode 🎧'),
  punch(CUE.focus[0] + 1.2, CUE.focus[1], 'Deep work. Flow state. Nothing can stop her now…'),
  title(CUE.yashi[0] + 0.1, LINES[6]!.from - 0.1, '🧠 Yashinozarus\nDistinguished architect. Master of all trades'),
  line(6),
  sub(CUE.dm, CUE.yashi[1], 'He DMs Lulu on Hack 💬'),
  sub(CUE.ping + 0.2, CUE.walkOver[0] - 0.1, '🚨 Critical npm vulnerability. Upgrade Node.js'),
  punch(CUE.ping + 1.0, CUE.walkOver[0] - 0.1, 'No fixes for deprecated versions 💀'),
  sub(CUE.walkOver[0], LINES[7]!.from - 0.1, 'Lulu heads over. They’ll fix it together 🤝'),
  line(7),
  sub(CUE.patch[0], CUE.patch[1], 'Plot twist: she upgraded every environment to latest 3 weeks ago 😎'),
  punch(CUE.patch[0] + 1.6, CUE.patch[1], 'Painful? Not today 🛡️'),
  line(8),
  line(9),
  sub(CUE.facePlant, DURATION, 'Another day. Another CVE. Another “what’s an agent” 🔁'),
];

export const CAPTIONS: Caption[] = boxedAtBottom(AT_THE_BOTTOM);

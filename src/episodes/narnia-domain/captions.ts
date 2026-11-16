import type { Caption } from '../../engine/types';
import { boxedAtBottom, punch, sub, title } from '../../engine/subtitles';
import { CHAT, CUE, DURATION, LINES } from './timeline';

const line = (i: number) => {
  const l = LINES[i]!;
  return sub(l.from, l.to, `${l.who}: “${l.text}”`);
};
/** When a chat message lands. */
const landed = (i: number) => CHAT[i]!.at;
/** Rorit's line in the grind, and the beats either side of it. */
const RANT = LINES[3]!;

const AT_THE_BOTTOM: Caption[] = [
  title(0.2, CUE.mail - 0.2, '🏢 Papo Pako Shapeworks\nThe DevOps floor, 9 AM'),
  sub(CUE.mail, CUE.open + 1.6, '📧 New email. From: Chuks'),
  punch(CUE.mail + 0.6, CUE.open + 1.6, 'Subject: Narnia compliance ⚠️'),
  sub(CUE.open + 1.7, CUE.gasp, 'A new domain name. For everything 🌐'),
  punch(CUE.open + 2.3, CUE.gasp, 'Due: yesterday 💀'),
  line(0),
  sub(CUE.chat[0], landed(1), 'Rorit alerts the DevOps group 📱'),
  punch(CUE.chat[0] + 0.6, landed(1), 'Panic. In the group chat 🚨'),
  sub(landed(1), landed(2), 'Amazaurus does the maths 🧮'),
  punch(landed(1) + 0.4, landed(2), '200 microservices = 200 certs 🔐'),
  sub(landed(2), landed(3) - 0.6, 'Eilon: smiling. Nervously 😅'),
  sub(landed(3) + 0.6, CUE.chat[1], 'Eter leads the Narnia effort 🦁'),
  punch(landed(4) - 0.4, CUE.chat[1], 'Step one: a name'),
  title(CUE.yashi[0] + 0.2, LINES[1]!.from - 0.1, '🧠 Yashinozarus\nAsks upper management'),
  line(1),
  sub(LINES[1]!.to + 0.1, CUE.yashi[1], 'That was the easy part ✅'),
  punch(LINES[1]!.to + 0.5, CUE.yashi[1], 'Now find every hardcoded domain 🔍'),
  line(2),
  sub(LINES[2]!.to + 0.1, CUE.board[1], 'The real DevOps pain begins 😰'),
  sub(CUE.grind[0] + 0.1, RANT.from - 0.1, 'Reissue 200 TLS certs 🔐'),
  punch(CUE.grind[0] + 0.6, RANT.from - 0.1, 'One. By. One.'),
  line(3),
  sub(RANT.to + 0.1, RANT.to + 2.9, 'Configs, code, Helm charts… 😱'),
  punch(RANT.to + 0.5, RANT.to + 2.9, 'And one README from 2016 📜'),
  sub(RANT.to + 3.0, CUE.grind[1], 'Months later. Cert 61 of 200 💀'),
  sub(CUE.lulu[0] + 0.1, LINES[4]!.from - 0.1, 'Then Lulu walks by 🥁'),
  line(4),
  line(5),
  sub(CUE.year + 0.1, DURATION, '20666: the most metal year in history 🤘'),
];

export const CAPTIONS: Caption[] = boxedAtBottom(AT_THE_BOTTOM);

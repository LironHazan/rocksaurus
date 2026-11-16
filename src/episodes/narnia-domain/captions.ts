import type { Caption } from '../../engine/types';
import { boxedAtBottom, punch, sub, title } from '../../engine/subtitles';
import { CHAT, CUE, DURATION, LINES } from './timeline';

const line = (i: number) => {
  const l = LINES[i]!;
  return sub(l.from, l.to, `${l.who}: “${l.text}”`);
};
/** When a chat message lands. */
const landed = (i: number) => CHAT[i]!.at;

const AT_THE_BOTTOM: Caption[] = [
  title(0.2, CUE.mail - 0.2, '🏢 Papo Pako Shapeworks\nThe DevOps floor, 9 AM'),
  sub(CUE.mail, CUE.open + 1.6, '📧 New email. From: Chuks'),
  punch(CUE.mail + 0.6, CUE.open + 1.6, 'Subject: Narnia compliance ⚠️'),
  sub(CUE.open + 1.7, CUE.gasp, 'Every service needs a new domain name 🌐'),
  punch(CUE.open + 2.3, CUE.gasp, 'Narnia-approved. Due: yesterday 💀'),
  line(0),
  sub(CUE.chat[0], landed(1), 'Rorit alerts the DevOps group 📱'),
  punch(CUE.chat[0] + 0.6, landed(1), 'Faster than a blast beat 🥁'),
  sub(landed(1), landed(2), 'Amazaurus: calm as the moon 🌙'),
  punch(landed(1) + 0.4, landed(2), '200 microservices. 200 certs to replace 🔐'),
  sub(landed(2), landed(3) - 0.6, 'Eilon: always smiling. Always ☀️'),
  sub(landed(3) + 0.6, CUE.chat[1], 'Meet Eter: she leads the Narnia effort 🦁'),
  punch(landed(4) - 0.4, CUE.chat[1], 'Her plan has a plan'),
  line(1),
  sub(LINES[1]!.to + 0.1, CUE.board[1], 'Domain name: ________ ⏳'),
  punch(LINES[1]!.to + 0.5, CUE.board[1], 'Waiting on Yashinozarus'),
  title(CUE.yashi[0] + 0.2, LINES[2]!.from - 0.1, '🧠 Meanwhile, Yashinozarus\nThe Distinguished of them all'),
  line(2),
  sub(LINES[2]!.to + 0.1, CUE.yashi[1], 'Upper management: last seen in 2019 👻'),
  sub(CUE.wait[0] + 0.1, CUE.wait[0] + 2.6, 'Eter waits ⏳'),
  sub(CUE.wait[0] + 2.7, CUE.wait[0] + 5.2, 'And waits…'),
  sub(CUE.wait[0] + 5.3, CUE.wait[1], 'And waits 🕸️'),
  punch(CUE.wait[0] + 5.7, CUE.wait[1], 'Still no domain name'),
  sub(CUE.lulu[0] + 0.1, LINES[3]!.from - 0.1, 'Then Lulu walks by 🥁'),
  line(3),
  line(4),
  sub(CUE.year + 0.1, DURATION, '20666: the most metal year in history 🤘'),
];

export const CAPTIONS: Caption[] = boxedAtBottom(AT_THE_BOTTOM);

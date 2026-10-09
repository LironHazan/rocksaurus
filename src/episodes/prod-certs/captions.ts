import type { Caption } from '../../engine/types';
import { title, sub, punch } from '../../engine/subtitles';
import { LINES, type Who } from './timeline';

/** A spoken line as a caption: `Name: “…”`. */
const said = (who: Who, from: number) => {
  const l = LINES.find(x => x.who === who && x.from === from)!;
  return sub(l.from, l.to, `${l.who}: “${l.text}”`);
};

export const CAPTIONS: Caption[] = [
  title(0.2, 3.3, '🌙 03:00 AM\nPapo Pako Shapeworks'),
  sub(3.7, 9.3, 'Sagish is on call 📟'),
  punch(4.8, 9.3, 'Louder than a blast beat 🥁🤘'),

  sub(9.7, 15.3, 'Production certificates: EXPIRED 💀'),
  punch(13.4, 15.3, 'Expiry date: “Invalid Date” 🤡'),

  said('Sagish', 15.8),
  said('Rorit', 18.9),
  punch(18.2, 21.8, 'Rorit, the mighty DinOps manager 💪'),
  said('Sagish', 20.5),

  said('Taluzarus', 22.2),
  punch(22.2, 23.9, 'Taluzarus: already awake, obviously ⚡'),
  said('Amazaurus', 24.3),
  punch(24.1, 25.9, 'Amazaurus: calm as the moon 🌙'),

  title(26.2, 28.3, '🚨 THE WAR ROOM\n3:21 AM'),
  sub(28.5, 33.8, 'Taluzarus tries 12 fixes at once ⚡'),
  said('Amazaurus', 34.0),
  sub(38.4, 40.8, 'Prod: back from the dead ✅'),
  punch(38.8, 40.8, 'Like any good zombie metal band 🧟🤘'),
  sub(41.2, 43.8, '7:00 AM. Nobody slept 😴'),

  sub(44.4, 47.9, 'Enter Eilon, the tech lead ☀️'),
  punch(45.2, 47.9, 'Always smiling. Always.'),
  said('Eilon', 48.2),
  sub(51.2, 52.0, 'Everyone: 🫠'),
  said('Amazaurus', 52.2),
];

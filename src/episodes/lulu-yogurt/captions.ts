import type { Caption } from '../../engine/types';
import { title, sub, punch } from '../../engine/subtitles';
import { CUE, DURATION, LINES, SPECS_TURN } from './timeline';

const said = (i: number) => {
  const l = LINES[i]!;
  return sub(l.from, l.to, `${l.who}: “${l.text}”`);
};
const [vegan, peach, caramel] = CUE.cups;
/** The agent joke's three lines: bigger than a punchline, centred a little higher so all three fit. */
const STATEMENT_Y = 0.85;
const STATEMENT_SIZE = 0.07;

export const CAPTIONS: Caption[] = [
  title(0.2, 2.8, '🕕 6:00 PM, almost the weekend\nPapo Pako Shapeworks'),
  sub(3.0, CUE.enter[1], 'Lulu. A week of specs and plans 📝'),
  punch(3.6, CUE.enter[1], 'Sleep: not in the spec 😵'),
  sub(CUE.specs[0] + 0.2, SPECS_TURN, 'Specs. Plans. More specs. For the coding agent 🤖'),
  punch(CUE.specs[0] + 1.6, SPECS_TURN, 'Spec v9. Plan v12. 📄📄📄'),
  // the statement: big, yellow, on its own, and on screen long enough to read twice
  punch(SPECS_TURN + 0.2, CUE.specs[1], 'Can’t believe I stopped\nmanaging humans…\nto manage bots 🤖😈', {
    y: STATEMENT_Y,
    size: STATEMENT_SIZE,
    color: '#ffe08a',
  }),
  sub(CUE.battery[0] + 0.2, CUE.battery[1], 'Protein: 5% 🔋'),
  punch(CUE.battery[0] + 1.4, CUE.battery[1], 'Gains in danger 🚨'),

  sub(CUE.open + 0.2, vegan - 0.1, 'The office fridge. Please. 🙏'),
  sub(vegan, peach - 0.1, 'Vegan protein yogurt 🌱 Nope.'),
  sub(peach, caramel - 0.1, 'Peach 🍑 Nope.'),
  sub(caramel, CUE.sigh - 0.1, 'Caramel 🍮 NOPE.'),
  punch(CUE.sigh, CUE.mirta[0], 'Almost weekend: only the bad ones left 💀'),

  sub(CUE.mirta[0] + 0.2, LINES[0]!.from - 0.2, 'Mirta. Facilities. Knows every fridge 🧽'),
  said(0),
  said(1),
  punch(LINES[1]!.from + 0.2, LINES[1]!.to, 'Lost in translation 🤷‍♀️'),
  said(2),
  said(3),

  sub(CUE.lid, CUE.bites[1], 'Peach it is 🍑'),
  sub(CUE.bites[1] + 0.2, CUE.yuck[0] - 0.1, 'Bite two…'),
  punch(CUE.yuck[0] + 0.1, CUE.yuck[1], 'Unbearable. Like a ballad with no drums 🥁💀'),
  said(4),
  punch(CUE.toss + 0.4, CUE.bye[1], 'Weekend mode: ON 🤘'),

  title(CUE.ride[0] + 0.2, CUE.ride[0] + 2.8, '🚗 A ride home with Omli'),
  sub(CUE.ride[0] + 3.0, CUE.ride[1] - 0.2, 'Long week. Long neck. 🦕'),
  punch(CUE.ride[0] + 3.8, CUE.ride[1] - 0.2, 'Sunroof: not optional'),

  title(CUE.bed[0] + 0.2, CUE.sips[1] - 0.2, '🌙 7:30 PM\nHome. Shake. Bed.'),
  sub(CUE.sips[1], CUE.asleep, 'Sip… sip… 🥤'),
  punch(CUE.asleep + 0.2, DURATION - 0.2, 'Asleep by 7:30. Rest in protein 🤘💤'),
];

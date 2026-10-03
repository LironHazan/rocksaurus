import type { ScriptLine } from '../../world/screen-script';
import { CUE } from './timeline';

// Steggy's very important article, as it appears on his laptop.

const HEAD: ScriptLine[] = [
  { at: CUE.typeFrom, text: 'On the Entropy of Odd Time Signatures', kind: 'heading', cps: 15 },
  { at: CUE.typeFrom + 2.7, text: 'S. Stegosaurus, PhD', kind: 'dim', cps: 20 },
  { at: CUE.typeFrom + 3.8, text: 'Abstract. A riff in 7/8 carries more', kind: 'body', cps: 20 },
  { at: CUE.typeFrom + 5.8, text: 'information than one in 4/4. We show', kind: 'body', cps: 20 },
];

const TYPOS = ['kjhgfds;;;', 'ASDFGHJKL', 'nnnnnnnnnnn', 'qwqwqwqw', '!!!!!!!!', 'bbbbbbb'];

/** At home: the abstract, then his sister's "contributions" on every nudge. */
export const ROOM_DOC: readonly ScriptLine[] = [
  ...HEAD,
  ...CUE.nudges.map((at, i): ScriptLine => ({ at, text: TYPOS[i % TYPOS.length]!, kind: 'err' })),
];

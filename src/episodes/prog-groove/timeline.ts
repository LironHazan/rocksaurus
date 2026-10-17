import { speech, type SpokenLine } from '../../audio/babble';
import { TRIO_VOICES, type Trio } from '../../band/voices';
import { AT, EIGHTH, END_OF_SONG } from './music';

// The whole band on the stage, lights down, playing prog: Tiki Taka starts a riff in 7/8 on his own, and one by one
// they come in. Times are video seconds; the song is music.ts.

/** Section starts, in seconds. */
export const T = {
  bassAlone: AT.bassAlone * EIGHTH,
  drumsIn: AT.drumsIn * EIGHTH,
  groove: AT.groove * EIGHTH,
  verse: AT.verse * EIGHTH,
  build: AT.build * EIGHTH,
  chorus: AT.chorus * EIGHTH,
  outro: AT.outro * EIGHTH,
  end: AT.end * EIGHTH,
} as const;
/** A 7/8 bar and a 4/4 bar, seconds. */
export const BAR7 = 7 * EIGHTH;
export const BAR4 = 8 * EIGHTH;

export const LINES: readonly SpokenLine<Trio>[] = [
  { from: END_OF_SONG + 0.4, to: END_OF_SONG + 2.0, who: 'Tiki', text: 'Was that in 7/8 or 7/4? 🤔' },
  { from: END_OF_SONG + 2.2, to: END_OF_SONG + 3.4, who: 'Lulu', text: 'Yes 😏' },
  { from: END_OF_SONG + 3.6, to: END_OF_SONG + 5.6, who: 'Rory', text: 'I just count to seven and pray 🙏' },
];
export const DURATION = LINES.at(-1)!.to + 0.3;

export const { syllables: SYLLABLES, mouthAt } = speech(LINES, TRIO_VOICES, 92);

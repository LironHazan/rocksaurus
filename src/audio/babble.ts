import { rng } from '../engine/math';
import { atTime } from './schedule';
import { sing } from './voice';
import type { Vowel } from './vowels';

// Dino talk: no words, just short sung vowels at a talking pitch (each character has their own voice). The same
// syllables drive the sound and the mouths, so lips land on the voice. Pure data, like every other part.

/** Someone talking: from/to in episode seconds; `text` is what they say (shown as a caption). */
export interface SpokenLine<W extends string = string> {
  from: number;
  to: number;
  who: W;
  text: string;
}

/** A voice: the pitches it moves between (low to high) and how long a syllable lasts. */
export interface Voice {
  notes: readonly string[];
  rate: number;
}

export interface Syllable<W extends string = string> {
  at: number;
  dur: number;
  note: string;
  vowel: Vowel;
  who: W;
}

const VOWELS: readonly Vowel[] = ['a', 'e', 'i', 'o', 'u'];

/** Talking comes in phrases: a breath (seconds) after every few syllables. */
const PHRASE_SYLLABLES = 5;
const BREATH = 0.18;

/** Every syllable of everyone's lines, in order. Questions rise at the end. */
export function syllables<W extends string>(
  lines: readonly SpokenLine<W>[],
  voices: Record<W, Voice>,
  seed = 23,
): Syllable<W>[] {
  const r = rng(seed);
  const out: Syllable<W>[] = [];
  for (const line of lines) {
    const { notes, rate } = voices[line.who];
    let t = line.from + 0.1;
    let i = 0;
    while (t < line.to - 0.25) {
      // phrases: a few syllables, a little breath; the pitch drifts up toward the end of a question
      const rising = line.text.includes('?') && t > line.to - 0.9;
      const step = Math.min(notes.length - 1, Math.floor(r() * 3) + (rising ? 1 : 0));
      const dur = rate * (0.7 + r() * 0.6);
      out.push({ at: t, dur, note: notes[step]!, vowel: VOWELS[Math.floor(r() * VOWELS.length)]!, who: line.who });
      t += dur + 0.02 + (++i % PHRASE_SYLLABLES === 0 ? BREATH : 0);
    }
  }
  return out.sort((a, b) => a.at - b.at);
}

/** How open `who`'s mouth is at t (0..1), from their syllables. */
export function mouthOf<W extends string>(all: readonly Syllable<W>[], who: W, t: number): number {
  for (const s of all)
    if (s.who === who && t >= s.at && t < s.at + s.dur) return 0.35 + 0.5 * Math.sin(Math.PI * ((t - s.at) / s.dur));
  return 0;
}

/** talk(rig, who, t, rest?) for a cast: opens the rig's mouth with `who`'s babble, never less than `rest`. */
export const talker =
  <W extends string>(mouthAt: (who: W, t: number) => number) =>
  (rig: { setMouth(k: number): void }, who: W, t: number, rest = 0): void =>
    rig.setMouth(Math.max(rest, mouthAt(who, t)));

export const speakerOf = <W extends string>(lines: readonly SpokenLine<W>[], t: number): W | null =>
  lines.find(l => t >= l.from && t < l.to)?.who ?? null;

/** Sings every syllable, quietly, from episode start `t0`. Each note is built just before it plays (`atTime`). */
export function playSyllables(bus: AudioNode, t0: number, all: readonly Syllable[], gain = 0.32): void {
  const voices = new GainNode(bus.context, { gain });
  voices.connect(bus);
  for (const s of all) atTime(t0 + s.at, () => sing(voices, t0 + s.at, s.note, s.vowel, 0.6, s.dur));
}

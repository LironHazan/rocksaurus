import { entriesOf } from '../lib/object';

export type DrumName = 'kick' | 'snare' | 'hat' | 'crash' | 'china' | 'splash' | 'ride' | 'tom' | 'floorTom' | 'click';

/**
 * A drum part written as one string per instrument, 16 steps per bar (16th notes):
 *   'x' hit · 'X' accent · 'g' ghost note (soft) · 'o' open hi-hat · '.' rest   (spaces are ignored, use them to separate bars)
 */
export interface DrumPart {
  bpm: number;
  tracks: Partial<Record<DrumName, string>>;
}

export interface DrumHit {
  name: DrumName;
  /** Seconds from the start of the part. */
  time: number;
  accent: boolean;
  ch: string;
}

/** How hard a hit is played, from its pattern character. */
export const hitVelocity = (ch: string): number => (ch === 'X' ? 1 : ch === 'g' ? 0.32 : 0.75);

/** Every hit in a drum part, sorted by time — used both to schedule sound and to sync animation. */
export function drumHits({ bpm, tracks }: DrumPart): DrumHit[] {
  const step = 60 / bpm / 4;
  const hits: DrumHit[] = [];
  for (const [name, pattern] of entriesOf(tracks)) {
    [...pattern.replace(/\s/g, '')].forEach((ch, i) => {
      if (ch !== '.') hits.push({ name, time: i * step, accent: ch === 'X', ch });
    });
  }
  return hits.sort((a, b) => a.time - b.time);
}

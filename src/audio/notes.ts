const NOTE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export type Note = string | number;

/** 'C5' → 72, 'F#3' → 54, 'Bb4' → 70. Numbers pass through unchanged. */
export function midi(note: Note): number {
  if (typeof note === 'number') return note;
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(note);
  if (!m) throw new Error(`Bad note name: ${note}`);
  const [, letter, accidental, octave] = m as unknown as [string, string, string, string];
  return (Number(octave) + 1) * 12 + (NOTE[letter] ?? 0) + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0);
}

/** Frequency in Hz of a note (A4 = 440). */
export const frequency = (note: Note): number => 440 * 2 ** ((midi(note) - 69) / 12);

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as const;

const NOTE_NAME = /^(?<letter>[A-G])(?<accidental>[#b]?)(?<octave>-?\d)$/;

const isLetter = (s: string): s is keyof typeof NOTE => s in NOTE;

export type Note = string | number;

/** 'C5' → 72, 'F#3' → 54, 'Bb4' → 70. Numbers pass through unchanged. */
export function midi(note: Note): number {
  if (Number.isFinite(note)) return Number(note);
  const { letter = '', accidental, octave } = NOTE_NAME.exec(String(note))?.groups ?? {};
  if (!isLetter(letter)) throw new Error(`Bad note name: ${note}`);
  return (Number(octave) + 1) * 12 + NOTE[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0);
}

/** Frequency in Hz of a note (A4 = 440). */
export const frequency = (note: Note): number => 440 * 2 ** ((midi(note) - 69) / 12);

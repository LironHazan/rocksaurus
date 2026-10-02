// Waltz lullaby in C major, 3/4 @ 90 BPM → one bar = 2 s, 6 bars = 12 s.
export const score = {
  bpm: 90,
  melody: [ // [beat, note, beats]
    [0, 'C5', 1], [1, 'E5', 1], [2, 'G5', 1],                    // C   — Rory hops in
    [3, 'A5', 2], [5, 'G5', 1],                                  // Am  — waves hello
    [6, 'F5', 1], [7, 'E5', 1], [8, 'D5', 1],                    // F   — big jump
    [9, 'D5', 2], [11, 'G4', 1],                                 // G   — lands
    [12, 'A5', 1], [13, 'G5', 1], [14, 'F5', 0.5], [14.5, 'D5', 0.5], // F→G — hug
    [15, 'E5', 0.5], [15.5, 'D5', 0.5], [16, 'C5', 3],           // C   — settle
  ],
  harmony: [
    { at: 0, bass: 'C3', chord: ['G3', 'C4', 'E4'] },
    { at: 3, bass: 'A2', chord: ['A3', 'C4', 'E4'] },
    { at: 6, bass: 'F2', chord: ['A3', 'C4', 'F4'] },
    { at: 9, bass: 'G2', chord: ['G3', 'B3', 'D4'] },
    { at: 12, bass: 'F2', chord: ['A3', 'C4', 'F4'] },
    { at: 15, bass: 'C3', chord: ['G3', 'C4', 'E4'], hits: [1], hold: 2 },
  ],
  extras: [ // [beat, note, beats, velocity]
    [7.5, 'F5', 0.75, 0.2], [7.6, 'A5', 0.75, 0.2], [7.7, 'C6', 0.75, 0.2], [7.8, 'F6', 0.75, 0.2], // jump arpeggio
    [16.5, 'C6', 3.5, 0.22],                                                                         // final sparkle
  ],
};

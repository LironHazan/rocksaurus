// Synth riff in E, 4/4 @ 120 BPM: 6 bars = 12 s. Used when there's no recorded riff yet.
// [eighth, root, lengthInEighths, 'mute' | 'open', velocity = 1]  — chords are power chords (root + 5th + octave).
export const chug = (at, vel = 1) => [[at, 'E2', 1, 'mute', vel], [at + 1, 'E2', 1, 'mute', vel]];

export const mainBar = bar => [
  ...chug(bar * 8), [bar * 8 + 2, 'G2', 2, 'open'],
  ...chug(bar * 8 + 4), [bar * 8 + 6, 'A2', 2, 'open'],
];

export const riff = {
  bpm: 120,
  notes: [
    ...mainBar(0),
    ...chug(8), [10, 'G2', 2, 'open'], ...chug(12), [14, 'A2', 1, 'open'], [15, 'G2', 1, 'open'],
    ...mainBar(2),
    ...chug(24), [26, 'G2', 1, 'open'], [27, 'A2', 1, 'open'], [28, 'B2', 2, 'open'], [30, 'A2', 1, 'open'], [31, 'G2', 1, 'open'],
    ...mainBar(4),
    [40, 'E2', 8, 'open'],                       // big final chord rings out
  ],
};

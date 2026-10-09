import { chug, mainBar } from '../../audio/rory-riff';
import * as sfx from '../../audio/sfx';
import type { Riff, RiffNote } from '../../audio/guitar';

// 4/4 @ 120 BPM → 1 beat = 0.5 s, 1 eighth = 0.25 s, 1 bar = 2 s. Eighth index = seconds × 4.
const BPM = 120;
export const BEAT = 60 / BPM;

const walkBar = (bar: number, vel: number): RiffNote[] => {
  const a = bar * 8;
  return [
    ...chug(a, vel),
    ...chug(a + 3, vel).slice(0, 1),
    ...chug(a + 4, vel),
    [a + 6, 'G2', 1, 'open', vel],
    [a + 7, 'A2', 1, 'open', vel],
  ];
};

// Moments the animation also reacts to (seconds)
export const CUES = {
  walk: [0.3, 9.5],
  sniffs: [10.3, 10.7, 11.1],
  pizzaDrop: 12.0,
  tries: [
    [20.5, 22.5],
    [23.5, 25.5],
    [26.5, 28.5],
  ],
  idea: 32.0,
  chords: [33.0, 35.0, 37.0], // each chord makes the slice hop
  launch: 38.5, // last chord: slice flies into Rory's mouth
  bites: [39.0, 39.6, 40.2, 40.8],
  victory: 42.0,
  finalChord: 50.0,
  burp: 51.3,
} as const;

export const riff: Riff = {
  bpm: BPM,
  notes: [
    // 0–9.5 s  walking groove
    ...[0, 1, 2, 3, 4].flatMap(b => walkBar(b, 0.7)),
    // 12 s  ta-da! then light chugs while he gets excited
    [48, 'A2', 2, 'open', 0.8],
    [50, 'D3', 6, 'open', 0.8],
    ...[7, 8, 9].flatMap(b => walkBar(b, 0.35)),
    // 29.5 s  sad descending chords after three failed tries
    [118, 'B2', 3, 'open', 0.7],
    [121, 'A#2', 3, 'open', 0.7],
    [124, 'A2', 6, 'open', 0.7],
    // 33–38.5 s  the power chords that move the pizza
    [132, 'E2', 6, 'open'],
    [140, 'G2', 6, 'open'],
    [148, 'A2', 5, 'open'],
    [154, 'B2', 3, 'open'],
    // 42–52 s  victory jam + final chord
    ...mainBar(21),
    ...mainBar(22),
    ...mainBar(23),
    ...mainBar(24),
    [200, 'E2', 8, 'open'],
  ],
};

export function soundEffects(bus: AudioNode, t0: number): void {
  const at = (s: number) => t0 + s;
  CUES.sniffs.forEach(s => sfx.sniff(bus, at(s)));
  sfx.ding(bus, at(CUES.pizzaDrop));
  sfx.thump(bus, at(CUES.pizzaDrop + 0.35)); // pizza lands
  sfx.hop(bus, at(12.9)); // Rory lands his happy jump
  CUES.tries.forEach(([a, b]) => sfx.stretch(bus, at(a + 0.2), b - a - 0.5));
  sfx.thump(bus, at(27.9)); // failed jump lands
  sfx.ding(bus, at(CUES.idea), 1760);
  CUES.chords.forEach(s => sfx.hop(bus, at(s + 0.45))); // slice lands after each hop
  CUES.bites.forEach(s => sfx.chomp(bus, at(s)));
  sfx.burp(bus, at(CUES.burp));
}

import { playDrums } from '../../audio/drums';
import type { DrumPart } from '../../audio/drum-patterns';
import { playKeyboardPart, type KeyboardPart, type KeyNote } from '../../audio/keyboard-part';
import type { Note } from '../../audio/notes';
import { playVocal } from '../../audio/voice';
import type { SungNote, VocalPart, Vowel } from '../../audio/vowels';
import { boop } from '../../audio/sfx';
import * as fx from '../../audio/foley';
import { cueSheet, type Cue, type Player } from '../../audio/cue-sheet';
import { BAR, BPM, CUE, DURATION, touches } from './timeline';
import { entriesOf } from '../../lib/object';

// A party dance groove at 120 BPM: four on the floor, claps on 2 and 4, off-beat open hats and piano-house
// chord stabs, and a terrace anthem: a lone dad hums it over the intro, and from the goal (the drop, bar 10)
// the whole touchline sings it. Ends on two big hits.

export const BARS = Math.round(DURATION / BAR); // 15
const at = (seconds: number) => (seconds / BAR) * 16; // in 16ths
const GOAL_BAR = CUE.goal / BAR; // the drop
const BUILD_BAR = GOAL_BAR - 1; // the shot: a drum roll
const END_BAR = BARS - 1;

/** A four-bar loop: Em · C · D · B */
const LOOP = ['Em', 'C', 'D', 'B'] as const;
type Chord = (typeof LOOP)[number];
/** The chord of each bar, lined up so the loop starts again on the goal (where the anthem starts). */
export const PLAN: readonly Chord[] = Array.from({ length: BARS }, (_, b) => LOOP[(((b - GOAL_BAR) % 4) + 4) % 4]!);

/** The piano's left hand plays the root on each bar's downbeat, so the chords still have a bottom. */
const ROOT: Record<Chord, Note> = { Em: 'E2', C: 'C3', D: 'D3', B: 'B2' };

const VOICING: Record<Chord, readonly Note[]> = {
  Em: ['G3', 'B3', 'E4'],
  C: ['G3', 'C4', 'E4'],
  D: ['A3', 'D4', 'F#4'],
  B: ['A3', 'D#4', 'F#4'],
};

/** Piano-house stabs on the off-beats (in eighths for the keyboard part). */
function pianoPart(): KeyboardPart {
  const notes: KeyNote[] = [];
  PLAN.forEach((chord, bar) => {
    const a = bar * 8;
    const offs = bar === END_BAR ? [0, 6] : bar === BUILD_BAR ? [1, 3] : bar === 0 ? [3, 7] : [1, 3, 5, 7];
    for (const o of offs)
      for (const n of VOICING[chord]) notes.push([a + o, n, bar === END_BAR ? 2 : 0.45, bar === 0 ? 0.25 : 0.4]);
    if (bar > 0 && bar !== BUILD_BAR) notes.push([a, ROOT[chord], bar === END_BAR ? 2 : 1.5, 0.45, 'L']);
  });
  return { bpm: BPM, sound: 'piano', notes, gain: 0.8 };
}

function drumPart(): DrumPart {
  const rows: Record<'kick' | 'snare' | 'hat' | 'crash', string[]> = { kick: [], snare: [], hat: [], crash: [] };
  const bar = (kick = '', snare = '', hat = '', crash = '') => {
    for (const [k, v] of entriesOf({ kick, snare, hat, crash })) rows[k].push(v.padEnd(16, '.'));
  };
  const FLOOR = 'x...x...x...x...';
  const CLAP = '....x.......x...';
  const HATS = 'x.o.x.o.x.o.x.o.';
  for (let b = 0; b < BARS; b++) {
    if (b === 0) bar('', '', '..o...o...o...o.');
    else if (b === BUILD_BAR)
      bar('x...x...', '....x...gxgxXxXX', 'x.o.x.o.'); // the roll
    else if (b === END_BAR) bar('x...........x...', '............X...', '', 'X...........X...');
    else bar(FLOOR, CLAP, b >= GOAL_BAR ? 'xxoxxxoxxxoxxxox' : HATS, b === 1 || b === GOAL_BAR ? 'X' : '');
  }
  return { bpm: BPM, tracks: Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, v.join(' ')])) };
}

const eighths = (seconds: number) => at(seconds) / 2;
/** Tiki's celebration shout. */
export const SIUU: VocalPart = {
  bpm: BPM,
  notes: [
    [eighths(CUE.siuu[0]), 'D4', 0.5, 'i', 0.9],
    [eighths(CUE.siuu[0]) + 0.5, 'G4', 3, 'u', 1],
  ],
};
/**
 * The terrace anthem: an original "whoa-oh-oh" in E minor, one phrase per chord of the loop, climbing and falling
 * back like a stadium singalong. [eighth in the bar, note, length in eighths]
 */
const ANTHEM: Record<Chord, readonly (readonly [number, Note, number])[]> = {
  Em: [
    [0, 'E4', 1],
    [1, 'G4', 1],
    [2, 'B4', 2],
    [4, 'A4', 1],
    [5, 'G4', 1],
    [6, 'A4', 2],
  ],
  C: [
    [0, 'G4', 1],
    [1, 'E4', 1],
    [2, 'G4', 2],
    [4, 'C5', 2],
    [6, 'B4', 2],
  ],
  D: [
    [0, 'A4', 1],
    [1, 'F#4', 1],
    [2, 'A4', 2],
    [4, 'D5', 2],
    [6, 'C5', 1],
    [7, 'B4', 1],
  ],
  B: [
    [0, 'B4', 3],
    [3, 'A4', 1],
    [4, 'G4', 1],
    [5, 'F#4', 1],
    [6, 'D#4', 2],
  ],
};
const shift = (note: Note, octaves: number) => {
  const m = /^([A-G][#b]?)(\d)$/.exec(String(note))!;
  return `${m[1]}${Number(m[2]) + octaves}`;
};
/** The anthem over some bars: one voice per [octave shift, vowel, velocity], a little spread like a real crowd. */
function chant(bars: readonly number[], voices: readonly (readonly [number, Vowel, number])[]): SungNote[] {
  return bars.flatMap(bar =>
    ANTHEM[PLAN[bar]!].flatMap(([o, note, len]) =>
      voices.map(([oct, vowel, vel], v) => [bar * 8 + o + v * 0.03, shift(note, oct), len * 0.95, vowel, vel] as const),
    ),
  );
}
const CHANT_BARS = [GOAL_BAR, GOAL_BAR + 1, GOAL_BAR + 2, GOAL_BAR + 3];
/** A lone dad hums it as Tiki jogs on; the whole touchline sings it from the goal on. */
const CROWD: VocalPart = {
  bpm: BPM,
  notes: [
    ...chant([0, 1], [[-1, 'o', 0.45]]),
    ...chant(CHANT_BARS, [
      [-1, 'o', 0.6],
      [-1, 'a', 0.45],
      [0, 'o', 0.35], // the kids, an octave up
    ]),
    [eighths(DURATION) - 2, 'E3', 1.9, 'o', 0.6], // and one last "whoa" on the final hit
  ],
};

const PIANO = pianoPart();
export const DRUMS = drumPart();

type Kind = 'whistle' | 'longWhistle' | 'kick' | 'shot' | 'net' | 'cheer' | 'thud' | 'boing';

function cues(): Cue<Kind>[] {
  const out: Cue<Kind>[] = [
    { at: CUE.whistle, kind: 'whistle' },
    ...touches()
      .filter(t => t !== CUE.shot)
      .map(t => ({ at: t, kind: 'kick' as const })),
    { at: CUE.shot, kind: 'shot' },
    { at: CUE.tackle[1], kind: 'thud' },
    { at: CUE.goal, kind: 'net' },
    { at: CUE.goal, kind: 'cheer' },
    { at: CUE.dive[1], kind: 'thud' },
    { at: CUE.jump[1], kind: 'thud' },
    { at: CUE.bump, kind: 'boing' },
    { at: CUE.kidJump[1], kind: 'cheer' },
    { at: CUE.final, kind: 'whistle' },
    { at: CUE.final + 0.3, kind: 'whistle' },
    { at: CUE.final + 0.6, kind: 'longWhistle' },
  ];
  return out;
}

const PLAYERS: Record<Kind, Player> = {
  whistle: (b, w) => fx.whistle(b, w, 0.18),
  longWhistle: (b, w) => fx.whistle(b, w, 0.7),
  kick: (b, w) => fx.kickBall(b, w, 0.6),
  shot: (b, w) => fx.kickBall(b, w, 1.3),
  net: (b, w) => fx.swish(b, w, 0.6),
  cheer: (b, w) => fx.cheer(b, w, 2.6),
  thud: fx.stomp,
  boing: (b, w) => boop(b, w, 180, 520, 0.35, 0.16),
};

const SOUND = cueSheet({ duration: DURATION, players: PLAYERS, cues: cues() });

export function soundtrack(bus: AudioNode, t0: number): void {
  SOUND.play(bus, t0);
  const drums = new GainNode(bus.context, { gain: 0.6 });
  drums.connect(bus);
  playKeyboardPart(bus, t0, PIANO);
  playDrums(drums, t0, DRUMS, { smooth: true });
  playVocal(bus, t0, SIUU);
  playVocal(bus, t0, CROWD);
}

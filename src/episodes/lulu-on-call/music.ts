import type { DrumName, DrumPart } from '../../audio/drum-patterns';
import { playDrums, snare, tom, crash, kick } from '../../audio/drums';
import { atTime } from '../../audio/schedule';
import { CUE, PACE, SCENES, type SceneId } from './timeline';
import { keystrokes, OFFICE_SCRIPT, NIGHT_SCRIPT } from './terminal';
import * as fx from './sounds';

// The soundtrack is Lulu's own drum kit, played softly, at each scene's tempo (16 steps per bar).
// Times here are story seconds (see PACE in timeline.ts).

type Bar = Partial<Record<DrumName, string>>;

const scene = (id: SceneId) => SCENES.find(s => s.id === id)!;
const stepOf = (bpm: number) => 60 / bpm / 4;

/** Repeats a one-bar groove for `seconds`, optionally ending with a crash. */
function groove(bpm: number, seconds: number, bar: Bar, { endCrash = false } = {}): DrumPart {
  const steps = Math.floor(seconds / stepOf(bpm));
  const tracks: Bar = {};
  for (const [name, pattern] of Object.entries(bar) as [DrumName, string][])
    tracks[name] = pattern.repeat(Math.ceil(steps / pattern.length)).slice(0, steps);
  if (endCrash) {
    tracks.crash = (tracks.crash ?? '').padEnd(steps, '.') + 'X';
    tracks.kick = (tracks.kick ?? '').padEnd(steps, '.') + 'X';
  }
  return { bpm, tracks };
}

interface Section {
  at: number;
  part: DrumPart;
}

const office = scene('office'),
  walk = scene('walk'),
  gains = scene('gains'),
  pilates = scene('pilates'),
  night = scene('night');

export const SECTIONS: readonly Section[] = [
  {
    at: office.from, // lo-fi: lazy kick, ghosted snare, soft hats
    part: groove(office.bpm, office.to - office.from, {
      kick: 'x.......x.x.....',
      snare: '....g.......x...',
      hat: 'g.g.g.g.g.g.g.g.',
    }),
  },
  {
    at: walk.from, // four on the floor: every kick is a giant step
    part: groove(
      walk.bpm,
      CUE.walkStop - walk.from,
      { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
      { endCrash: true },
    ),
  },
  {
    at: gains.from, // funky, with open hats
    part: groove(gains.bpm, gains.to - gains.from, {
      kick: 'x.....x...x.....',
      snare: '....x.......x..g',
      hat: 'x.x.x.o.x.x.x.o.',
    }),
  },
  {
    at: pilates.from, // slow ride and a soft kick: breathe in, breathe out
    part: groove(pilates.bpm, pilates.to - pilates.from, {
      kick: 'x.......x.......',
      snare: '........g.......',
      ride: 'g.g.g.g.g.g.g.g.',
    }),
  },
  {
    at: night.from, // a sleepy heartbeat
    part: groove(night.bpm, CUE.page - night.from, { kick: 'g..g............' }),
  },
  {
    at: CUE.blast, // panic: a (soft) blast beat
    part: groove(
      200,
      70.6 - CUE.blast,
      { kick: 'x.x.x.x.x.x.x.x.', snare: '.x.x.x.x.x.x.x.x', china: 'x...x...x...x...' },
      { endCrash: true },
    ),
  },
];

/** Drum hits the animation can follow (e.g. her steps), in episode seconds. */
export function sectionHits(index: number, name: DrumName): number[] {
  const s = SECTIONS[index]!;
  const step = stepOf(s.part.bpm);
  return [...(s.part.tracks[name] ?? '')].flatMap((ch, i) => (ch === '.' ? [] : [s.at + i * step]));
}

export const STEPS = sectionHits(1, 'kick').filter(t => t >= CUE.walkStart && t < CUE.walkStop);

const SHAKES = Array.from({ length: 10 }, (_, i) => CUE.shake + i * 0.3);
const GULPS = [0, 1, 2, 3].map(i => CUE.drink + 0.5 + i * 0.6);

export { SHAKES, GULPS };

export function soundtrack(bus: AudioNode, t0: number): void {
  const drums = new GainNode(bus.context, { gain: 0.42 }); // soft: it's background
  drums.connect(bus);
  // the story plays PACE times slower than written, so the tempo drops by the same factor
  for (const s of SECTIONS) playDrums(drums, t0 + s.at * PACE, { ...s.part, bpm: s.part.bpm / PACE });

  const at = (s: number, play: (when: number) => void) => {
    const when = t0 + s * PACE;
    atTime(when, () => play(when));
  };
  for (const k of [...keystrokes(OFFICE_SCRIPT), ...keystrokes(NIGHT_SCRIPT)]) at(k, w => fx.keyTap(bus, w));
  for (const s of STEPS) at(s, w => fx.stomp(bus, w));
  for (const s of SHAKES) at(s, w => fx.rattle(bus, w));
  for (const s of GULPS) at(s, w => fx.gulp(bus, w));
  for (let s = night.from + 0.5; s < CUE.page; s += 1) at(s, w => fx.tick(bus, w));
  for (let i = 0; i < 4; i++) at(CUE.page + i * 0.8, w => fx.page(bus, w));

  // ba-dum-tss
  at(CUE.blame, w => snare(bus, w, 0.8));
  at(CUE.blame + 0.18, w => tom(bus, w, 0.8, 110));
  at(CUE.blame + 0.42, w => {
    kick(bus, w, 0.8);
    crash(bus, w, 0.8);
  });
}

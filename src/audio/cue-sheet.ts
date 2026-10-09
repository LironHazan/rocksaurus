import { atTime } from './schedule';
import { bed, type BedKind } from './foley';

// A Short's sound design: background beds under spans of the video, and one-shot cues on top. An episode declares
// what plays when; this module owns the scheduling, the ordering and the range checks.

/** One sound at `at` seconds from the start of the episode. */
export interface Cue<K extends string> {
  at: number;
  kind: K;
}

/** Background sound from `from` to `to` (episode seconds). */
export interface Bed {
  from: number;
  to: number;
  kind: BedKind;
}

/** Plays one kind of cue at `when` (audio-context seconds). */
export type Player = (bus: AudioNode, when: number) => void;

export interface CueSheetPlan<K extends string> {
  /** The episode's length in seconds: every cue and bed must fit inside it. */
  duration: number;
  /** How each kind of cue sounds. */
  players: Readonly<Record<K, Player>>;
  /** In any order. */
  cues: readonly Cue<K>[];
  beds?: readonly Bed[];
}

export interface CueSheet<K extends string> {
  /** Sorted by time. */
  readonly cues: readonly Cue<K>[];
  readonly beds: readonly Bed[];
  /** Schedules every bed and cue, with the episode starting at `t0` (audio-context seconds). */
  play(bus: AudioNode, t0: number): void;
}

/** Throws a RangeError on a cue or bed outside 0…duration, so a mistimed cue fails as soon as its Short loads. */
export function cueSheet<K extends string>(plan: CueSheetPlan<K>): CueSheet<K> {
  const { duration, players } = plan;
  const beds = plan.beds ?? [];
  const cues = [...plan.cues].sort((a, b) => a.at - b.at);
  for (const c of cues)
    if (c.at < 0 || c.at > duration) throw new RangeError(`cue "${c.kind}" at ${c.at}s is outside 0…${duration}s`);
  for (const b of beds)
    if (b.from < 0 || b.to > duration || b.from >= b.to)
      throw new RangeError(`bed "${b.kind}" ${b.from}…${b.to}s is outside 0…${duration}s`);
  return {
    cues,
    beds,
    play(bus, t0) {
      for (const b of beds) atTime(t0 + b.from, () => bed(bus, t0 + b.from, b.to - b.from, b.kind));
      for (const c of cues) atTime(t0 + c.at, () => players[c.kind](bus, t0 + c.at));
    },
  };
}

/** Times from `from` (inclusive) to `to` (exclusive), `step` seconds apart: footsteps, crickets, a ticking clock. */
export function every(from: number, to: number, step: number): number[] {
  const out: number[] = [];
  for (let t = from; t < to; t += step) out.push(t);
  return out;
}

/** A bus at `gain` of `bus`: for sounds that are far away, through a window, or softer than the rest. */
export function quieter(bus: AudioNode, gain: number): AudioNode {
  const g = new GainNode(bus.context, { gain });
  g.connect(bus);
  return g;
}

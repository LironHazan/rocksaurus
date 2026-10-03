import { audio } from './context';
import { midi, type Note } from './notes';
import { pianoSamples } from './piano-model';

const { ctx } = audio;
const cache = new Map<number, AudioBuffer>();

/** How long each rendered note lasts (it's damped earlier when the key is released). */
const secondsFor = (m: number) => Math.min(4, Math.max(1.5, 2.5 + (60 - m) * 0.05));

function bufferFor(m: number): AudioBuffer {
  let b = cache.get(m);
  if (!b) {
    const samples = pianoSamples(m, ctx.sampleRate, secondsFor(m));
    b = ctx.createBuffer(1, samples.length, ctx.sampleRate);
    b.copyToChannel(samples, 0);
    cache.set(m, b);
  }
  return b;
}

/** Renders the given notes ahead of time (e.g. in an episode's preload) so playback never stutters. */
export function warmGrand(notes: Iterable<Note>): void {
  for (const n of notes) bufferFor(midi(n));
}

/**
 * Grand piano voice: plays a pre-rendered, physically-modeled note (see piano-model.ts). Harder hits are
 * louder and brighter; releasing the key brings the damper down.
 */
export function grand(bus: AudioNode, when: number, note: Note, vel = 0.5, dur = 1): void {
  const m = midi(note);
  const src = new AudioBufferSourceNode(ctx, { buffer: bufferFor(m) });
  const f0 = 440 * 2 ** ((m - 69) / 12);
  const tone = new BiquadFilterNode(ctx, {
    type: 'lowpass',
    frequency: Math.min(14000, f0 * 4 + 1500 + vel * 7000),
    Q: 0.5,
  });
  const g = new GainNode(ctx, { gain: 0 });
  g.gain.setValueAtTime(0.32 * vel ** 1.2, when);
  g.gain.setTargetAtTime(0, when + dur, 0.06); // damper
  src.connect(tone).connect(g).connect(bus);
  src.start(when);
  src.stop(Math.min(when + dur + 0.6, when + src.buffer!.duration));
}

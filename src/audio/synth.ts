import { audio } from './context';
import { frequency, type Note } from './notes';

const { ctx } = audio;

/** Bright, singing synth lead: two detuned saws through a resonant filter that opens on each note, delayed vibrato. */
export function lead(bus: AudioNode, when: number, note: Note, vel = 0.5, dur = 0.5): void {
  const f = frequency(note);
  const out = ctx.createGain();
  const filter = new BiquadFilterNode(ctx, { type: 'lowpass', Q: 4 });
  filter.frequency.setValueAtTime(900, when);
  filter.frequency.linearRampToValueAtTime(Math.min(9000, f * 9), when + 0.03);
  filter.frequency.setTargetAtTime(Math.min(4500, f * 5), when + 0.03, 0.15);
  out.gain.setValueAtTime(0, when);
  out.gain.linearRampToValueAtTime(0.11 * vel, when + 0.012);
  out.gain.setTargetAtTime(0.08 * vel, when + 0.012, 0.2);
  out.gain.setTargetAtTime(0, when + dur, 0.06);
  filter.connect(out);
  out.connect(bus);

  const vibrato = new OscillatorNode(ctx, { frequency: 5.6 });
  const depth = ctx.createGain();
  depth.gain.setValueAtTime(0, when);
  depth.gain.linearRampToValueAtTime(dur > 0.4 ? 12 : 0, when + Math.min(dur, 0.45)); // cents, only on longer notes
  vibrato.connect(depth);
  for (const detune of [-7, 7]) {
    const o = new OscillatorNode(ctx, { type: 'sawtooth', frequency: f, detune });
    depth.connect(o.detune);
    o.connect(filter);
    o.start(when);
    o.stop(when + dur + 0.4);
  }
  vibrato.start(when);
  vibrato.stop(when + dur + 0.4);
}

/** Soft, wide pad: three detuned saws, slow attack and release, warm filter. */
export function pad(bus: AudioNode, when: number, note: Note, vel = 0.5, dur = 2): void {
  const f = frequency(note);
  const out = ctx.createGain();
  const filter = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 1100, Q: 0.6 });
  out.gain.setValueAtTime(0, when);
  out.gain.linearRampToValueAtTime(0.05 * vel, when + 0.45);
  out.gain.setTargetAtTime(0, when + dur, 0.35);
  filter.connect(out);
  out.connect(bus);
  for (const detune of [-12, 0, 12]) {
    const o = new OscillatorNode(ctx, { type: 'sawtooth', frequency: f, detune });
    const pan = new StereoPannerNode(ctx, { pan: detune / 16 });
    o.connect(pan);
    pan.connect(filter);
    o.start(when);
    o.stop(when + dur + 1.5);
  }
}

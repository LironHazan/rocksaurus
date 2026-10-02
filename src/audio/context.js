import { rng } from '../engine/math.js';

// One shared audio graph:  episode bus → master → (dry + reverb) → compressor → speakers + recorder
const ctx = new AudioContext();
const master = ctx.createGain();
master.gain.value = 0.9;

const comp = ctx.createDynamicsCompressor();
comp.threshold.value = -14;
comp.ratio.value = 3;

const reverb = ctx.createConvolver();
reverb.buffer = makeImpulse(2.8);
const wet = ctx.createGain();
wet.gain.value = 0.3;

master.connect(comp);
master.connect(reverb);
reverb.connect(wet);
wet.connect(comp);

const recordDest = ctx.createMediaStreamDestination();
comp.connect(ctx.destination);
comp.connect(recordDest);

/** Synthetic concert-hall reverb tail: decaying stereo noise. */
function makeImpulse(seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  const r = rng(11);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, 3.2);
  }
  return buf;
}

export const audio = { ctx, master, recordStream: recordDest.stream };

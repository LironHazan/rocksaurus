import { rng } from '../engine/math';

// One shared audio graph:  episode bus → master → (dry + reverb) → compressor → speakers + recorder
const ctx = new AudioContext();

/** The mix: a little headroom, a gentle glue compressor, and a concert-hall reverb send. */
const MASTER_GAIN = 0.9;
const COMPRESSOR = { threshold: -14, ratio: 3 }; // dB, x:1
const REVERB_SECONDS = 2.8;
const REVERB_DECAY = 3.2; // the tail's curve: higher dies away faster
const REVERB_WET = 0.3;
const REVERB_SEED = 11;

const master = ctx.createGain();
master.gain.value = MASTER_GAIN;

const comp = ctx.createDynamicsCompressor();
comp.threshold.value = COMPRESSOR.threshold;
comp.ratio.value = COMPRESSOR.ratio;

const reverb = ctx.createConvolver();
reverb.buffer = makeImpulse(REVERB_SECONDS);
const wet = ctx.createGain();
wet.gain.value = REVERB_WET;

master.connect(comp);
master.connect(reverb);
reverb.connect(wet);
wet.connect(comp);

const recordDest = ctx.createMediaStreamDestination();
comp.connect(ctx.destination);
comp.connect(recordDest);

/** Synthetic concert-hall reverb tail: decaying stereo noise. */
function makeImpulse(seconds: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  const r = rng(REVERB_SEED);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, REVERB_DECAY);
  }
  return buf;
}

export const audio = { ctx, master, recordStream: recordDest.stream } as const;

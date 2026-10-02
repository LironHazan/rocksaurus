import { audio } from './context';

const cache = new Map();

/** Loads and decodes an audio file (wav, mp3, m4a…) once. Resolves to an AudioBuffer, or null if missing. */
export function loadTrack(url) {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url)
        .then(r => {
          if (!r.ok) throw new Error(r.statusText);
          return r.arrayBuffer();
        })
        .then(data => audio.ctx.decodeAudioData(data))
        .catch(err => {
          console.warn(`Could not load ${url}: ${err.message}`);
          return null;
        }),
    );
  }
  return cache.get(url);
}

/**
 * Plays a recorded track on the bus at time `when`.
 *   offset — skip this many seconds into the file (trim silence before your first note)
 *   gain   — volume (1 = as recorded)
 */
export function playTrack(bus, when, buffer, { offset = 0, gain = 1 } = {}) {
  if (!buffer) return;
  const src = audio.ctx.createBufferSource();
  const g = audio.ctx.createGain();
  src.buffer = buffer;
  g.gain.value = gain;
  src.connect(g);
  g.connect(bus);
  src.start(when, offset);
}

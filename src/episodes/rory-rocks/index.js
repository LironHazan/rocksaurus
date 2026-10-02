import { ease, seg, lerp } from '../../engine/math.js';
import { createRockStage } from '../../world/rock-stage.js';
import { createRockerRory } from '../../brand/rocker.js';
import { loadTrack, playTrack } from '../../audio/track.js';
import { boop } from '../../audio/sfx.js';
import { playRiff } from '../../audio/guitar.js';
import { riff as synthRiff } from './riff.js';

// ── Your riff ────────────────────────────────────────────────────────────────
// Drop your recording at public/audio/riff.wav (or .mp3 / .m4a and change the url),
// then set BPM to the tempo you played at. Rory headbangs and the lights flash on every beat.
// No file yet? You'll hear FALLBACK instead: 'synth' (synthesized guitar riff, riff.js) or
// 'click' (a metronome at BPM, to record along to with headphones).
const RIFF = { url: '/audio/riff.wav', offset: 0, gain: 1 };
const FALLBACK = 'synth';
const BPM = 120;
const BEATS_PER_BAR = 4;
// ─────────────────────────────────────────────────────────────────────────────

let riff = null;

export default {
  id: 'rory-rocks',
  title: 'Rory Rocks 🎸',
  duration: 12,

  async preload() { riff = await loadTrack(RIFF.url); },

  setup({ scene, camera }) {
    const stage = createRockStage(scene);
    const rory = createRockerRory();
    scene.add(rory.root);
    const beat = 60 / BPM;
    const strum = rory.arms.find(a => a.userData.side === -1);
    const pump = rory.arms.find(a => a.userData.side === 1);

    function update(t) {
      const intro = ease(seg(t, 0, 0.6));                // ease in from a still pose
      const phase = (t / beat) % 1;
      const hit = Math.pow(1 - phase, 3) * intro;        // sharp on the beat, decays until the next
      const barHit = Math.floor(t / beat) % BEATS_PER_BAR === 0 ? hit : hit * 0.6;

      rory.head.rotation.x = -0.18 + hit * 0.5;          // headbang
      rory.head.rotation.z = 0.22 * Math.cos(t * Math.PI / beat / 2);
      rory.torso.rotation.x = hit * 0.12;
      rory.root.position.y = Math.abs(Math.sin((t / beat) * Math.PI)) * 0.12 * intro;
      rory.squash.scale.set(1 + barHit * 0.05, 1 - barHit * 0.08, 1 + barHit * 0.05);
      pump.rotation.z = 2.2 + hit * 0.35;                // 🤘 pump
      strum.rotation.x = -0.9 + Math.sin(t * Math.PI * 2 / beat * 2) * 0.25; // strumming 8ths
      rory.tail.rotation.y = Math.sin(t * Math.PI / beat) * 0.35;

      stage.pulse(barHit);
      const zoom = lerp(10.5, 8.6, ease(seg(t, 0, 12)));
      camera.position.set(Math.sin(t * 0.4) * 0.5, 2.5 + barHit * 0.04, zoom);
      camera.lookAt(0, 2.0, 0);
    }
    return { update };
  },

  audio(bus, t0) {
    if (riff) return playTrack(bus, t0, riff, RIFF);
    if (FALLBACK === 'synth') return playRiff(bus, t0, synthRiff);
    const beat = 60 / BPM; // click track
    for (let i = 0; i * beat < this.duration; i++) {
      const accent = i % BEATS_PER_BAR === 0;
      boop(bus, t0 + i * beat, accent ? 1600 : 1100, accent ? 1500 : 1000, 0.05, accent ? 0.25 : 0.15);
    }
  },
};

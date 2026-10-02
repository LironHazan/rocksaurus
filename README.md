# Rocksaurus 🦖🎸 — Dino Studio

The studio behind [@Rocksaurus on YouTube](https://www.youtube.com/@Rocksaurus): a band of tiny dinosaurs
(Rory on guitar, Lulu on drums, Tiki Taka on bass) — tiny arms, BIG riffs.

Cute 3D dinosaur shorts made entirely with web tech: **Three.js** for the picture, **Web Audio** for a
synthesized piano. Every episode is a pure function of time, so it renders the same way every time and
records straight to a video file you can upload to YouTube.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). Pick an episode and a format, drag the timeline slider to jump to any moment
(**Shorts 9:16** = 1080×1920, **YouTube 16:9** = 1920×1080), turn **Sound on**, and click **Record video** to download an `.mp4` (Chrome/Safari) or `.webm` (Firefox) with picture and music.
Keep the tab visible while recording, because browsers slow down hidden tabs.

Debug tip: add `&cam=x,y,z,lookX,lookY,lookZ` to the URL to view any episode from a fixed camera (great for close-ups).

## Layout

```
src/
  main.js                  UI wiring (episode picker, sound, record)
  engine/
    stage.js               renderer, camera, lights; composites 3D + overlay onto the output canvas
    formats.js             Shorts 9:16 / YouTube 16:9 sizes and caption safe zones
    captions.js            meme-style captions (outline, pop-in, auto-wrap)
    player.js              playback loop; visuals follow the audio clock
    recorder.js            canvas + audio → MediaRecorder → download
    math.js                seg / ease / lerp / seeded rng
  audio/
    context.js             shared audio graph (master, reverb, compressor, record tap)
    piano.js               additive piano synth + note names ('C5', 'F#3')
    score.js               playScore(): melody / harmony / extras
    sfx.js                 hop, thump, boop, growl, chomp, ding, burp…
    guitar.js              plucked-string electric guitar + amp, playRiff()
    drums.js               synthesized kit + playDrums() with step patterns ('x...x...')
    bass.js                finger-style bass (plucked string + warm amp), playBass()
  characters/
    materials.js           plush fabric, eyes, ball() building block
    rory.js                Rory rig + idle() (breathing, blinking)
    lulu.js                Lulu, the long-neck drummer + idleLulu() (neck sway, nod)
    tyrannosaurus.js       Tiki Taka: big Tyrannosaurus build (long snout, jaw, stripes, long tail)
    reach.js               reachArm(): point a tiny arm at a target and put the paw on it (instruments)
  world/
    meadow.js              sky, hill, flowers, clouds, groundY()
  episodes/
    index.js               episode registry
    rory-hello/
      index.js             choreography (update(t)) + SFX timing
      score.js             the music
    rory-friday/
      index.js             reuses rory-hello, adds joke captions
    rory-rocks/
      index.js             headbanging to your recorded riff (BPM-synced)
      riff.js              synth riff + reusable chug()/mainBar() helpers
    meet-tiki/
      index.js             Tiki Taka (big blue Tyrannosaurus, cap + shades): bass groove + sunglasses-down wink
      music.js             bass line + light backing beat
    meet-lulu/
      index.js             count-in, drum fill, band jam with Rory
      music.js             drum patterns + guitar part
    rory-pizza/
      index.js             60 s story: stage → walk → pizza → tiny arms → guitar trick → victory
      music.js             riff for the whole story + CUES (times the animation reacts to) + SFX
  world/rock-stage.js      dark stage, spotlights that pulse on the beat
  props/                   guitar/bass, drum kit, sunglasses, backwards cap, flannel, mohawk, ponytail, tattoo, pizza, thought bubble, light bulb
  world/pizzeria.js        pizza shop + checkered table
  brand/                   channel art page + rock-star Rory pose
public/audio/              your recordings (riff.wav)
```

## Record your own guitar riff

`Rory Rocks 🎸` plays a real recording in sync with the video.

1. Open the episode with **Sound on**. With no riff file yet, you'll hear a **click track** at the episode's BPM
   (accent on beat 1). Record your riff to that click with headphones, so the click doesn't end up in the recording.
2. Export it as WAV (or MP3/M4A) and save it as `public/audio/riff.wav`.
3. In `src/episodes/rory-rocks/index.js` set `BPM` to your tempo. If there's silence before your first note,
   set `RIFF.offset` to skip it (seconds). Rory headbangs and the lights flash on every beat.

Any episode can use `loadTrack()` / `playTrack()` from `src/audio/track.js` the same way (see `preload()` there).

## Write a drum beat

Drum parts are one string per instrument, 16 steps per bar (`x` hit, `X` accent, `o` open hi-hat, `.` rest):

```js
playDrums(bus, t0, {
  bpm: 120,
  tracks: {
    kick:  'x.......x.x.....',
    snare: '....X.......X...',
    hat:   'x.x.x.x.x.x.x.x.',
  },
});
```

Instruments: `kick`, `snare`, `hat`, `crash`, `tom`, `floorTom`, `click`. `drumHits()` returns the same hits as
times, so Lulu's sticks and the cymbals move exactly with the sound (see `meet-lulu/index.js`).

## Channel art

Open `/brand.html` on the dev server for the 800×800 profile picture and the 2560×1440 banner,
rendered from the same 3D Rory. Edit the name and tagline there, then download PNGs.

## Add an episode

1. Copy `src/episodes/rory-hello/` to `src/episodes/my-episode/`.
2. Change `id`, `title`, `duration`, the beat sheet in `update(t)`, and the notes in `score.js`.
3. Register it in `src/episodes/index.js`.

An episode is just:

```js
export default {
  id, title, duration,              // seconds
  setup({ scene, camera }) {        // build the world once
    return { update(t) { /* pose everything for time t */ } };
  },
  audio(bus, t0) { /* schedule music + SFX at t0 + seconds */ },
  captions: [                       // optional
    { from: 0.2, to: 4.8, at: 'top', text: 'me leaving work at\n5:00 PM on a Friday' },
    { from: 5.0, to: 6.6, at: 'bottom', text: 'WEEKEND!!!', size: 0.13, color: '#ffe08a' },
  ],
};
```

## Same animation, new joke

The cheapest way to test ideas: reuse an episode's animation and music, and change only the captions.

```js
import roryHello from '../rory-hello/index.js';
export default { ...roryHello, id: 'rory-monday', title: 'Rory: Monday 9 AM', captions: [ /* … */ ] };
```

Tip: at 90 BPM in 3/4, one bar = 2 s. Plan actions on bar boundaries and the music will match automatically.

## Add a character

Copy `src/characters/rory.js`, change the colors and shapes, and return the same kind of rig
(`root`, `squash`, `head`, `eyes`, `arms`, …) so `idle()` and existing choreography keep working.

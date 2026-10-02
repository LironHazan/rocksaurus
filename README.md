# Rocksaurus 🦖🎸 — Dino Studio

The studio behind [@Rocksaurus on YouTube](https://www.youtube.com/@Rocksaurus): a band of tiny dinosaurs
(Paris on vocals, Rory on guitar, Tiki Taka on bass, Steggy on keys, Lulu on drums) — tiny arms, BIG riffs.

Cute 3D dinosaur shorts made entirely with web tech: **Three.js** for the picture, **Web Audio** for a
synthesized piano. Every episode is a pure function of time, so it renders the same way every time and
records straight to a video file you can upload to YouTube.

**Live studio:** https://lironhazan.github.io/rocksaurus/ (deployed by GitHub Actions on every push to `main`).

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173):

- **Studio**: pick an episode in the sidebar, switch **Shorts 9:16 / YouTube 16:9**, scrub the timeline, turn on sound,
  and click **Record video** to download an `.mp4` (Chrome/Safari) or `.webm` (Firefox). Keep the tab visible while
  recording; browsers slow down hidden tabs.
- **Channel art** (`/brand`): profile picture and banner PNGs rendered from the same 3D Rory.

Debug tip: add `&cam=x,y,z,lookX,lookY,lookZ` to the URL to view any episode from a fixed camera (great for close-ups).

## Scripts

| Script                            | What it does                                  |
| --------------------------------- | --------------------------------------------- |
| `npm run dev`                     | Dev server with hot reload                    |
| `npm run build`                   | Type-check, then production build to `dist/`  |
| `npm run typecheck`               | TypeScript (strict)                           |
| `npm run lint`                    | ESLint (typescript-eslint, React hooks rules) |
| `npm run format` / `format:check` | Prettier                                      |
| `npm test` / `test:watch`         | Vitest + Testing Library                      |
| `npm run check`                   | Everything CI runs, in one go                 |

CI (GitHub Actions) runs type-check, lint, format check, tests and build on every push and pull request.

## Architecture

- **React + TypeScript app** (`src/app`, `src/features`, `src/ui`): routing (React Router), the Studio dashboard
  and the Channel Art page. UI primitives come from Radix UI (accessible), icons from Lucide, styles are CSS modules
  on shared design tokens (`src/styles/global.css`).
- **Engine** (`src/engine`, TypeScript): stage (renderer + compositing), player (loop, audio-clock sync, cleanup),
  recorder, captions, formats and the typed `Episode` contract (`engine/types.ts`).
- **Content** (`src/characters`, `src/props`, `src/world`, `src/episodes`, most of `src/audio`): the 3D models, sets,
  music and choreography. Still JavaScript; being migrated to TypeScript file by file (`allowJs` keeps both working).

React owns the page; the engine owns the canvas. `useStudioSession` creates a stage + player when the preview
mounts and disposes both (WebGL context, animation loop, audio) when the episode/format changes or the page unmounts.
`usePlayback` subscribes to the player with `useSyncExternalStore`, updating the UI ~10×/s instead of every frame.

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
    kick: 'x.......x.x.....',
    snare: '....X.......X...',
    hat: 'x.x.x.x.x.x.x.x.',
  },
});
```

Instruments: `kick`, `snare`, `hat`, `crash`, `tom`, `floorTom`, `click`. `drumHits()` returns the same hits as
times, so Lulu's sticks and the cymbals move exactly with the sound (see `meet-lulu/index.js`).

## Channel art

Open **Channel art** (`/brand`) for the 800×800 profile picture and the 2560×1440 banner, rendered from the same
3D Rory. Edit the name and tagline there, then download PNGs.

## Add an episode

1. Copy `src/episodes/rory-hello/` to `src/episodes/my-episode/`.
2. Change `id`, `title`, `duration`, the beat sheet in `update(t)`, and the notes in `score.js`.
3. Register it in `src/episodes/index.ts` (it is type-checked against the `Episode` contract).

An episode is just:

```js
export default {
  id,
  title,
  duration, // seconds
  setup({ scene, camera }) {
    // build the world once
    return {
      update(t) {
        /* pose everything for time t */
      },
    };
  },
  audio(bus, t0) {
    /* schedule music + SFX at t0 + seconds */
  },
  captions: [
    // optional
    { from: 0.2, to: 4.8, at: 'top', text: 'me leaving work at\n5:00 PM on a Friday' },
    { from: 5.0, to: 6.6, at: 'bottom', text: 'WEEKEND!!!', size: 0.13, color: '#ffe08a' },
  ],
};
```

## Same animation, new joke

The cheapest way to test ideas: reuse an episode's animation and music, and change only the captions.

```js
import roryHello from '../rory-hello/index.js';
export default { ...roryHello, id: 'rory-monday', title: 'Rory: Monday 9 AM', captions: [/* … */] };
```

Tip: at 90 BPM in 3/4, one bar = 2 s. Plan actions on bar boundaries and the music will match automatically.

## Add a character

Copy `src/characters/rory.js`, change the colors and shapes, and return the same kind of rig
(`root`, `squash`, `head`, `eyes`, `arms`, …) so `idle()` and existing choreography keep working.

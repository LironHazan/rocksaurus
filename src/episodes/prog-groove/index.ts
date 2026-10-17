import * as THREE from 'three';
import type { Episode } from '../../engine/types';
import { cuts, direct, inFrontOf, type Shot } from '../../engine/director';
import { ease, lerp, seg } from '../../engine/math';
import { createRockStage } from '../../world/rock-stage';
import { createGuitarist } from '../../band/guitarist';
import { createBassist } from '../../band/bassist';
import { createDrummer } from '../../band/drummer';
import { createKeyboardist } from '../../band/keyboardist';
import { createSinger } from '../../band/singer';
import { recentHit } from '../../band/timing';
import type { Activity, SongClock } from '../../band/types';
import { drumHits } from '../../audio/drum-patterns';
import { playDrums } from '../../audio/drums';
import { playRiff } from '../../audio/guitar';
import { playBass } from '../../audio/bass';
import { playKeyboardPart } from '../../audio/keyboard-part';
import { playVocal } from '../../audio/voice';
import { playSyllables } from '../../audio/babble';
import { withOutro } from '../outro';
import { CAPTIONS } from './captions';
import { BEAT, END_OF_SONG, bass, drums, guitar, lead, pad, vocal } from './music';
import { createSculpture } from './sets';
import { BAR4, BAR7, DURATION, LINES, SYLLABLES, T, mouthAt } from './timeline';

// Beat sheet (video seconds; music.ts has the song)
//   0–4.6      lights down, Tiki Taka alone: the riff in 7/8
//   4.6–9.1    Lulu comes in on the toms
//   9.1–18.3   everyone: drop-D guitar, Steggy's pad, the riff four times
//   18.3–28.7  the verse, half time: Paris, soft
//   28.7–33.9  the build: the guitar's fives over the drums' fours, Steggy's cold synth line
//   33.9–44.3  the chorus: B♭ F C Dm, Paris up high
//   44.3–48.9  the riff, one last time; 48.9 everyone on one D
//   then three lines, and the channel's end card (outro.ts)

/** Where each of them stands on the round stage (x, z), facing (radians), and on how high a riser. */
const PLOT = {
  paris: { x: 0, z: 1.7, ry: 0, y: 0 },
  rory: { x: -3.5, z: 0.9, ry: 0.4, y: 0 },
  tiki: { x: 3.5, z: 0.8, ry: -0.4, y: 0 },
  steggy: { x: -2.1, z: -2.3, ry: 0.3, y: 0.45 },
  lulu: { x: 1.9, z: -2.7, ry: -0.2, y: 0.5 },
} as const;
/** The light sculpture, high behind them. */
const SCULPTURE_AT = [0, 6.4, -6.6] as const;
/** Paris's and Steggy's faces, above their roots (their rigs aren't handed out: the camera frames these). */
const FACE = { paris: 2.6, steggy: 2.5 } as const;
/** How far the close-ups stand off. */
const CLOSE = { face: 5.2, kit: 6.6, neck: 4.4, bass: 6.4 } as const;

/** Each player's clock: out until they come in, playing to the last D, the pose while it rings, then just them. */
const clockFrom = (from: number): SongClock => ({
  beat: BEAT,
  activity: (t): Activity =>
    t < from ? 'idle' : t < END_OF_SONG - BEAT ? 'play' : t < LINES[0]!.from ? 'pose' : 'idle',
});

const episode: Episode = {
  id: 'prog-groove',
  title: 'Prog Night in 7/8 🌀',
  duration: DURATION,
  captions: CAPTIONS,

  setup(stage) {
    const scene = new THREE.Scene();
    const lights = createRockStage(scene);
    const sculpture = createSculpture();
    sculpture.group.position.set(...SCULPTURE_AT);
    scene.add(sculpture.group);

    const paris = createSinger(vocal, clockFrom(T.verse - BEAT));
    const rory = createGuitarist(guitar, clockFrom(T.groove - BEAT));
    const tiki = createBassist(bass, clockFrom(0));
    const steggy = createKeyboardist([pad, lead], clockFrom(T.groove - BEAT));
    const lulu = createDrummer(drums, clockFrom(T.drumsIn - BEAT));
    const players = [
      [paris, PLOT.paris],
      [rory, PLOT.rory],
      [tiki, PLOT.tiki],
      [steggy, PLOT.steggy],
      [lulu, PLOT.lulu],
    ] as const;
    const riserMat = new THREE.MeshStandardMaterial({ color: 0x1c1028, roughness: 0.5, metalness: 0.2 });
    for (const [player, spot] of players) {
      player.root.position.set(spot.x, spot.y, spot.z);
      player.root.rotation.y = spot.ry;
      scene.add(player.root);
      if (spot.y > 0) {
        const riser = new THREE.Mesh(new THREE.BoxGeometry(3.2, spot.y, 3.0), riserMat);
        riser.position.set(spot.x, spot.y / 2, spot.z + 0.3);
        riser.rotation.y = spot.ry;
        scene.add(riser);
      }
    }
    const faceOf = (root: THREE.Object3D, y: number) => {
      const face = new THREE.Object3D();
      face.position.y = y;
      root.add(face);
      return face;
    };
    const parisFace = faceOf(paris.root, FACE.paris);
    const steggyFace = faceOf(steggy.root, FACE.steggy);
    const kicks = drumHits(drums)
      .filter(h => h.name === 'kick')
      .map(h => h.time);
    const speakers = [
      ['Rory', rory.rig],
      ['Lulu', lulu.rig],
      ['Tiki', tiki.rig],
    ] as const;

    type Framing = 'tiki' | 'lulu' | 'wide' | 'rory' | 'neck' | 'steggy' | 'paris' | 'low' | 'sweep' | 'kit';
    const framingAt = cuts<Framing>([
      [0, 'tiki'], // the riff, his paws
      [T.drumsIn, 'kit'], // the toms
      [T.groove, 'wide'], // everyone
      [T.groove + 2 * BAR7, 'rory'],
      [T.groove + 3 * BAR7, 'steggy'],
      [T.verse, 'paris'],
      [T.verse + 2 * BAR4, 'low'],
      [T.verse + 3 * BAR4, 'paris'],
      [T.build, 'neck'], // the fives
      [T.build + BAR4, 'lulu'], // her fours
      [T.chorus, 'sweep'],
      [T.chorus + 2 * BAR4, 'paris'],
      [T.outro, 'tiki'],
      [T.outro + BAR7, 'kit'],
      [T.end, 'wide'],
      [LINES[0]!.from, 'tiki'],
      [LINES[1]!.from, 'lulu'],
      [LINES[2]!.from, 'rory'],
    ]);
    const FRAMINGS: Record<Framing, (t: number) => Shot> = {
      tiki: () => inFrontOf(tiki.rig.head, tiki.root, CLOSE.bass, 0.25, -0.6),
      kit: () => inFrontOf(lulu.rig.head, lulu.root, CLOSE.kit, 0.2, -0.6),
      lulu: () => inFrontOf(lulu.rig.neck[1]!, lulu.root, CLOSE.face, -0.2, 0.3),
      rory: () => inFrontOf(rory.rig.head, rory.root, CLOSE.face, 0.3, 0.2),
      neck: () => inFrontOf(rory.rig.guitar, rory.root, CLOSE.neck, -0.45, 0.6),
      steggy: () => inFrontOf(steggyFace, steggy.root, CLOSE.face, 0.2, 0.3),
      paris: () => inFrontOf(parisFace, paris.root, CLOSE.face, 0.5, 0.2), // round the mic
      wide: t => {
        const from = t < T.end ? T.groove : T.end;
        const c = ease(seg(t, from, from + 2 * BAR7));
        return { cam: [0, lerp(5.6, 4.8, c), lerp(20, 17, c)], look: [0, 3.4, -1.5] };
      },
      low: t => {
        // low at the lip of the stage, looking up past Paris to the sculpture
        const c = seg(t, T.verse + 2 * BAR4, T.verse + 3 * BAR4);
        return { cam: [lerp(-1.6, 1.6, c), 1.4, 8.5], look: [0, 4.4, -3] };
      },
      sweep: t => {
        const c = ease(seg(t, T.chorus, T.chorus + 2 * BAR4));
        return { cam: [lerp(-9, 9, c), 5.2, lerp(12, 14, c)], look: [0, 3.2, -1] };
      },
    };

    return direct(
      stage,
      {
        stage: {
          scene,
          frame(t) {
            for (const [player] of players) player.update(t);
            if (t >= LINES[0]!.from) for (const [who, rig] of speakers) rig.setMouth(Math.max(0, mouthAt(who, t)));
            const kick = recentHit(t, kicks, 10);
            lights.pulse(t < T.drumsIn ? 0.1 : kick * 0.85);
            sculpture.update(t, kick);
            scene.updateMatrixWorld(true);
            return FRAMINGS[framingAt(t)](t);
          },
        },
      },
      cuts([[0, 'stage']]),
    );
  },

  audio(bus, t0) {
    playDrums(bus, t0, drums);
    playRiff(bus, t0, guitar);
    playBass(bus, t0, bass);
    for (const part of [pad, lead]) playKeyboardPart(bus, t0, part);
    playVocal(bus, t0, vocal);
    playSyllables(bus, t0, SYLLABLES);
  },
};

export default withOutro(episode);

import * as THREE from 'three';
import { ease, lerp, seg } from '../../engine/math';
import type { Episode } from '../../engine/types';
import { createRockStage } from '../../world/rock-stage';
import { createGuitarist } from '../../band/guitarist';
import { createBassist } from '../../band/bassist';
import { createDrummer } from '../../band/drummer';
import { createKeyboardist } from '../../band/keyboardist';
import { createSinger } from '../../band/singer';
import { beatPulse } from '../../band/timing';
import type { Performer } from '../../band/types';
import { playDrums } from '../../audio/drums';
import { playRiff } from '../../audio/guitar';
import { playBass } from '../../audio/bass';
import { playKeyboardPart } from '../../audio/keyboard-part';
import { playVocal } from '../../audio/voice';
import {
  BEAT,
  T,
  DURATION,
  ENDING_AT,
  bandActivity,
  drummerActivity,
  drums,
  guitar,
  bass,
  piano,
  organ,
  vocal,
} from './music';

// Stage plot (x, z, facing, riser height): front row guitar · singer · bass; back row on risers,
// in the gaps between them so everyone is visible from the audience: keys left of center, drums right.
const PLOT = {
  singer: { x: 0, z: 1.4, ry: 0, y: 0 },
  guitar: { x: -3.3, z: 1.1, ry: 0.35, y: 0 },
  bass: { x: 3.3, z: 0.9, ry: -0.35, y: 0 },
  keys: { x: -1.7, z: -1.9, ry: 0.25, y: 0.45 },
  drums: { x: 1.6, z: -2.7, ry: -0.15, y: 0.5 },
} as const;
const RISER = PLOT.drums.y;

type Vec3 = [number, number, number];
type Shot = { cam: Vec3; look: Vec3 };

/**
 * One camera framing per moment of the song (hard cuts between them, a few slow moves).
 * `wide` scales full-band distances so narrow (vertical) frames still fit the whole stage.
 */
function shotAt(t: number, wide: number): Shot {
  const d = PLOT.drums,
    g = PLOT.guitar,
    b = PLOT.bass,
    k = PLOT.keys,
    s = PLOT.singer;
  if (t < T.intro) return { cam: [d.x - 0.6, 4.6, d.z + 6.2], look: [d.x, 3.6 + RISER * 0.5, d.z] }; // count-in: Lulu
  if (t < T.verse) {
    const p = ease(seg(t, T.intro, T.verse)); // reveal: the whole band, over the 7/8 riff
    return { cam: [0, lerp(5, 4, p) * Math.sqrt(wide), lerp(15, 13, p) * wide], look: [0, 2, -0.5] };
  }
  if (t < T.verse + 4) return { cam: [2.4, 3.2, s.z + 6.2], look: [s.x, 2.6, s.z] }; // Paris sings
  if (t < T.verse + 6) return { cam: [g.x + 1.4, 2.7, g.z + 4.4], look: [g.x, 2.0, g.z] }; // Rory
  if (t < T.brk) return { cam: [b.x - 1.4, 3.1, b.z + 4.8], look: [b.x, 2.6, b.z] }; // Tiki Taka
  if (t < T.brk + 1.75) return { cam: [k.x + 1.6, 3.4, k.z + 4.0], look: [k.x, 2.3, k.z] }; // Steggy's organ run
  if (t < T.chorus) {
    const p = ease(seg(t, T.brk + 1.75, T.chorus)); // sweep across the stage
    return { cam: [lerp(-9, -5, p) * wide, 4.2, lerp(7, 9, p) * wide], look: [0, 2, -0.8] };
  }
  if (t < T.chorus + 4) return { cam: [0.9, 3.0, s.z + 5.2], look: [s.x, 2.8, s.z] }; // chorus: Paris close
  if (t < ENDING_AT) return { cam: [d.x + 1.6, 4.4, d.z + 4.6], look: [d.x, 3.2 + RISER * 0.5, d.z] }; // Lulu
  const p = ease(seg(t, ENDING_AT, DURATION)); // ending: everyone
  return { cam: [0, 4.2 * Math.sqrt(wide), lerp(14, 12.5, p) * wide], look: [0, 2, -0.5] };
}

const episode: Episode = {
  id: 'band-live',
  title: 'Rocksaurus Live 🤘',
  duration: DURATION,

  setup({ scene, camera, format }) {
    const lights = createRockStage(scene);
    // how much further back full-band shots must be for this frame (1 for 16:9, more for vertical)
    const wide = Math.max(1, Math.pow(16 / 9 / (format.width / format.height), 0.3));

    const riserMat = new THREE.MeshStandardMaterial({ color: 0x241433, roughness: 0.5, metalness: 0.2 });
    for (const [spot, w, d] of [
      [PLOT.drums, 3.6, 3.2],
      [PLOT.keys, 3.0, 2.8],
    ] as const) {
      const riser = new THREE.Mesh(new THREE.BoxGeometry(w, spot.y, d), riserMat);
      riser.position.set(spot.x, spot.y / 2, spot.z + 0.4);
      riser.rotation.y = spot.ry;
      riser.receiveShadow = true;
      scene.add(riser);
    }

    const band = { beat: BEAT, activity: bandActivity };
    const members: [Performer, (typeof PLOT)[keyof typeof PLOT]][] = [
      [createSinger(vocal, band), PLOT.singer],
      [createGuitarist(guitar, band), PLOT.guitar],
      [createBassist(bass, band), PLOT.bass],
      [createKeyboardist([piano, organ], band), PLOT.keys],
      [createDrummer(drums, { beat: BEAT, activity: drummerActivity }), PLOT.drums],
    ];
    for (const [performer, spot] of members) {
      performer.root.position.set(spot.x, spot.y, spot.z);
      performer.root.rotation.y = spot.ry;
      scene.add(performer.root);
    }

    function update(t: number) {
      for (const [performer] of members) performer.update(t);
      const hit = beatPulse(t, BEAT);
      const ending = t >= ENDING_AT;
      lights.pulse(
        ending ? Math.max(0.2, 1 - (t - ENDING_AT) * 0.4) + 0.3 * Math.sin(t * 22) : t >= 2 ? hit * 0.85 : 0.1,
      );
      const { cam, look } = shotAt(t, wide);
      camera.position.set(...cam);
      camera.lookAt(...look);
    }

    return { update };
  },

  audio(bus, t0) {
    playDrums(bus, t0, drums);
    playRiff(bus, t0, guitar);
    playBass(bus, t0, bass);
    for (const part of [piano, organ]) playKeyboardPart(bus, t0, part);
    playVocal(bus, t0, vocal);
  },
};

export default episode;

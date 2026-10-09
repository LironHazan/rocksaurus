import * as THREE from 'three';
import { seg, ease, lerp } from '../../engine/math';
import type { Episode } from '../../engine/types';
import { createRockStage } from '../../world/rock-stage';
import { createStegosaurus } from '../../characters/stegosaurus';
import { idle, resetPose } from '../../characters/rory';
import { reachArm, armOf } from '../../characters/reach';
import { createStageKeyboard } from '../../props/stage-keyboard';
import { addBandTee } from '../../props/band-tee';
import { addShortHair } from '../../props/short-hair';
import { timedNotes, playKeyboardPart, type TimedNote } from '../../audio/keyboard-part';
import { playDrums } from '../../audio/drums';
import { piano, leadSynth, padSynth, drums, BEAT, ROCK_IN, GLISS, FINAL } from './music';

// Beat sheet
//   0–2    dreamy Em9 arpeggio + synth pad, eyes closed, gentle sway
//   2–6    prog groove: 3-3-2 bass, arpeggios in threes; headbang, back plates bounce on the beat
//   6–10   synth lead: singing melody, fast run up the harmonic-minor scale
//   10–11  lightning run down the keys
//   11–12  final chord, paws fly up off the keys

// keys + paws follow the piano and the lead (the pad is a held background wash)
const notes = [...timedNotes(piano), ...timedNotes(leadSynth)].sort((a, b) => a.start - b.start);
const byHand = (hand: 'L' | 'R') => notes.filter(n => n.hand === hand);
const LEFT = byHand('L');
const RIGHT = byHand('R');

/** The note a hand is on at time t (the latest one started), and how recently it was struck. */
function current(list: readonly TimedNote[], t: number): { note: TimedNote | null; hit: number } {
  let note: TimedNote | null = null;
  for (const n of list) {
    if (n.start <= t) note = n;
    else break;
  }
  return { note, hit: note ? Math.exp(-(t - note.start) * 14) : 0 };
}

const episode: Episode = {
  id: 'meet-steggy',
  title: 'Meet Steggy 🎹',
  duration: 12,

  setup({ scene, camera }) {
    const lights = createRockStage(scene);

    // Steggy stands behind a stage keyboard, facing the audience; the logo panel faces the camera
    const keyboard = createStageKeyboard();
    keyboard.group.position.set(0, 0, 0.9);
    scene.add(keyboard.group);
    const steggy = createStegosaurus();
    steggy.root.position.set(0, 0, -0.25);
    scene.add(steggy.root);
    addBandTee(steggy, { text: 'DREAM THEATER' });
    addShortHair(steggy); // short dark crop

    const leftArm = armOf(steggy, -1);
    const rightArm = armOf(steggy, 1);
    const pressed = new Map<number, number>();
    const world = new THREE.Vector3();
    /** A point on the keyboard (keyboard space) → Steggy's torso space, for reachArm. */
    const toTorso = (p: THREE.Vector3) => steggy.torso.worldToLocal(keyboard.group.localToWorld(world.copy(p)));

    function update(t: number) {
      const rocking = t >= ROCK_IN && t < GLISS;
      const beatHit = Math.pow(1 - ((t / BEAT) % 1), 3);

      resetPose(steggy);
      idle(steggy, t, { eyesOpen: t < ROCK_IN ? 0.12 : t >= FINAL ? 0.15 : 1 });

      // dreamy sway → headbang → final pose
      if (t < ROCK_IN) {
        steggy.torso.rotation.z = Math.sin(t * 2) * 0.06;
        steggy.head.rotation.z = Math.sin(t * 2 + 0.6) * 0.1;
      } else if (rocking) {
        steggy.head.rotation.x += beatHit * 0.35 - 0.05;
        steggy.squash.scale.y = 1 - beatHit * 0.03;
        steggy.setMouth(beatHit * 0.5);
      } else if (t >= FINAL) {
        steggy.head.rotation.x -= 0.3 * ease(seg(t, FINAL, FINAL + 0.4));
        steggy.setMouth(0.8);
      }

      // back plates bounce on the beat, a ripple from front to back
      steggy.plates.forEach((plate, i) => {
        const k = rocking
          ? Math.pow(1 - (((t - i * 0.04) / BEAT) % 1), 3)
          : t >= FINAL
            ? Math.exp(-(t - FINAL) * 3)
            : 0;
        plate.scale.set(1, 1 + k * 0.22, 1);
      });

      // keys down while notes sound
      pressed.clear();
      for (const n of notes) if (t >= n.start && t < n.end) pressed.set(n.midi, Math.min(1, (n.end - t) * 20));
      keyboard.setPressed(pressed);

      // paws on the keys they're playing
      steggy.root.updateMatrixWorld(true);
      keyboard.group.updateMatrixWorld(true);
      const lift = ease(seg(t, FINAL + 0.1, FINAL + 0.5)); // paws fly up after the final chord
      for (const [arm, list] of [
        [leftArm, LEFT],
        [rightArm, RIGHT],
      ] as const) {
        const { note, hit } = current(list, t);
        const target = keyboard.keyTop(note?.midi ?? (arm === leftArm ? 'E3' : 'E4'));
        target.y += 0.04 * (1 - hit) + lift * 0.9;
        target.z -= lift * 0.4;
        reachArm(arm, toTorso(target));
      }

      const flash = rocking ? beatHit * 0.8 : t >= FINAL ? Math.exp(-(t - FINAL) * 2) : 0.1;
      lights.pulse(flash);
      keyboard.glow(flash);

      let cam: [number, number, number];
      let look: [number, number, number];
      if (t < ROCK_IN) {
        cam = [0.9, 2.7, 4.6];
        look = [0, 2.0, 0]; // close: Steggy dreaming over the keys
      } else if (t < 6) {
        const k = ease(seg(t, ROCK_IN, 6));
        cam = [lerp(0.6, -0.5, k), 3.0, lerp(8.5, 7.5, k)];
        look = [0, 1.7, 0];
      } else if (t < GLISS) {
        cam = [-1.6, 2.9, 2.8];
        look = [0, 1.45, 0.6]; // high and close: paws on the keys
      } else {
        cam = [0, 2.8, 7.5];
        look = [0, 1.75, 0];
      }
      camera.position.set(...cam);
      camera.lookAt(...look);
    }

    return { update };
  },

  audio(bus, t0) {
    for (const part of [piano, leadSynth, padSynth]) playKeyboardPart(bus, t0, part);
    playDrums(bus, t0, drums);
  },
};

export default episode;

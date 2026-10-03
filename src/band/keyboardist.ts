import * as THREE from 'three';
import { createStegosaurus } from '../characters/stegosaurus';
import { idle, resetPose } from '../characters/rory';
import { reachArm } from '../characters/reach';
import { createStageKeyboard } from '../props/stage-keyboard';
import { addBandTee } from '../props/band-tee';
import { addShortHair } from '../props/short-hair';
import { timedNotes, type KeyboardPart, type TimedNote } from '../audio/keyboard-part';
import { beatPulse, latestStarted } from './timing';
import type { Performer, SongClock } from './types';

/** Steggy on keys: keys press with the notes, paws follow the hands, plates bounce, the keyboard glows. */
export function createKeyboardist(parts: readonly KeyboardPart[], clock: SongClock): Performer {
  const root = new THREE.Group();
  const keyboard = createStageKeyboard();
  keyboard.group.position.z = 1.15;
  root.add(keyboard.group);
  const steggy = createStegosaurus();
  root.add(steggy.root);
  addBandTee(steggy, { text: 'DREAM THEATER' });
  addShortHair(steggy);

  // keys + paws follow everything except the pad (a held background wash)
  const notes = parts
    .filter(p => p.sound !== 'pad')
    .flatMap(p => timedNotes(p))
    .sort((a, b) => a.start - b.start);
  const allNotes = parts.flatMap(p => timedNotes(p));
  const byHand = (h: 'L' | 'R') => notes.filter(n => n.hand === h);
  const hands = [
    [steggy.arms.find(a => a.userData.side === -1)!, byHand('L'), 'E3'],
    [steggy.arms.find(a => a.userData.side === 1)!, byHand('R'), 'E4'],
  ] as const;
  const pressed = new Map<number, number>();
  const world = new THREE.Vector3();
  const toTorso = (p: THREE.Vector3) => steggy.torso.worldToLocal(keyboard.group.localToWorld(world.copy(p)));

  return {
    root,
    update(t) {
      const act = clock.activity(t);
      const hit = beatPulse(t, clock.beat);
      resetPose(steggy);
      idle(steggy, t, { eyesOpen: act === 'pose' ? 0.15 : 1 });
      if (act === 'play') {
        steggy.head.rotation.x += hit * 0.3 - 0.05;
        steggy.squash.scale.y = 1 - hit * 0.03;
      } else if (act === 'pose') {
        steggy.head.rotation.x -= 0.25;
        steggy.setMouth(0.7);
      }
      steggy.plates.forEach((plate, i) => {
        const k = act === 'play' ? Math.pow(1 - (((t - i * 0.04) / clock.beat) % 1), 3) : 0;
        plate.scale.set(1, 1 + k * 0.22, 1);
      });

      pressed.clear();
      for (const n of allNotes) if (t >= n.start && t < n.end) pressed.set(n.midi, Math.min(1, (n.end - t) * 20));
      keyboard.setPressed(pressed);
      keyboard.glow(act === 'play' ? hit : 0.1);

      root.updateMatrixWorld(true);
      const poseLift = act === 'pose' ? 1 : 0; // paws fly up off the keys for the final pose
      for (const [arm, list, rest] of hands) {
        const note: TimedNote | null = latestStarted(list, t);
        const fresh = note ? Math.exp(-(t - note.start) * 14) : 0;
        const target = keyboard.keyTop(note?.midi ?? rest);
        target.y += 0.04 * (1 - fresh) + poseLift * 0.9;
        reachArm(arm, toTorso(target));
      }
    },
  };
}

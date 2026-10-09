import * as THREE from 'three';
import { createRockerRory, playGuitar } from '../characters/rocker';
import { idle, resetPose } from '../characters/rory';
import { reachArm, armOf } from '../characters/reach';
import { midi } from '../audio/notes';
import { beatPulse, recentHit, latestStarted } from './timing';
import type { Performer, SongClock } from './types';

export interface GuitarPart {
  bpm: number;
  /** [eighth, root, len, 'mute' | 'open', vel] — the same notes the guitar sound plays. */
  notes: readonly (readonly [number, string, number, string?, number?])[];
}

/** Rory on guitar: headbangs on the beat, paws on the strings and neck, strums every note, big pose at the end. */
export function createGuitarist(
  part: GuitarPart,
  clock: SongClock,
): Performer & { rig: ReturnType<typeof createRockerRory> } {
  const rory = createRockerRory();
  const root = new THREE.Group();
  root.add(rory.root);
  const eighth = 60 / part.bpm / 2;
  const notes = part.notes
    .map(([at, note]) => ({ start: at * eighth, midi: midi(note) }))
    .sort((a, b) => a.start - b.start);
  const strums = notes.map(n => n.start);
  const lowest = Math.min(...notes.map(n => n.midi));
  const highest = Math.max(...notes.map(n => n.midi));

  return {
    root,
    rig: rory,
    update(t) {
      const act = clock.activity(t);
      const hit = beatPulse(t, clock.beat);
      resetPose(rory);
      idle(rory, t, { eyesOpen: act === 'idle' ? 1 : 0.14 });
      rory.head.rotation.z = 0.15;

      // the fretting paw slides with the chord (higher chord → further from the head of the guitar)
      const chord = latestStarted(notes, t)?.midi ?? lowest;
      const fret = 1 - (chord - lowest) / Math.max(1, highest - lowest);
      playGuitar(rory, { strum: act === 'play' ? recentHit(t, strums, 16) : 0, fret });

      if (act === 'play') {
        rory.head.rotation.x += -0.18 + hit * 0.5;
        rory.root.position.y = Math.abs(Math.sin((t / clock.beat) * Math.PI)) * 0.1;
        rory.setMouth(0.8);
      } else if (act === 'pose') {
        rory.head.rotation.x += -0.3;
        reachArm(armOf(rory, 1), new THREE.Vector3(1.0, 2.9, 0.6)); // 🤘 paw up for the final pose
        rory.root.position.y = 0;
        rory.setMouth(1);
      } else {
        rory.head.rotation.x += 0.05 + hit * 0.08;
        rory.root.position.y = 0;
      }
      rory.tail.rotation.y = Math.sin((t * Math.PI) / clock.beat) * 0.3;
    },
  };
}

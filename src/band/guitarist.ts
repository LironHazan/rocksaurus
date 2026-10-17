import * as THREE from 'three';
import { createRockerRory, playGuitar } from '../characters/rocker';
import { idle, resetPose } from '../characters/rory';
import { reachArm, armOf } from '../characters/reach';
import { midi } from '../audio/notes';
import { beatPulse, recentHit, latestStarted } from './timing';
import type { Performer, SongClock } from './types';
import type { Riff } from '../audio/guitar';

/** The same notes the guitar sound plays (see audio/guitar). */
export type GuitarPart = Riff;

/** A note for the paws: when it's picked and how high it is. */
export interface FrettedNote {
  start: number;
  midi: number;
}

/**
 * Rory's paws on a part's notes: the picking paw dips on every pick (`pick`: how quickly the dip fades, per second),
 * the fretting paw slides along the neck with the pitch (higher → further from the head). Returns `play(t, picking)`,
 * which poses the paws (call after resetPose) and gives back the note sounding at t.
 */
export function guitarHands<N extends FrettedNote>(
  rig: ReturnType<typeof createRockerRory>,
  notes: readonly N[],
  pick = 16,
) {
  const sorted = [...notes].sort((a, b) => a.start - b.start);
  const picks = sorted.map(n => n.start);
  const lowest = Math.min(...sorted.map(n => n.midi));
  const highest = Math.max(...sorted.map(n => n.midi));
  return (t: number, picking = true): N | null => {
    const note = latestStarted(sorted, t);
    const fret = 1 - ((note?.midi ?? lowest) - lowest) / Math.max(1, highest - lowest);
    playGuitar(rig, { strum: picking ? recentHit(t, picks, pick) : 0, fret });
    return note;
  };
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
  const hands = guitarHands(
    rory,
    part.notes.map(([at, note]) => ({ start: at * eighth, midi: midi(note) })),
  );

  return {
    root,
    rig: rory,
    update(t) {
      const act = clock.activity(t);
      const hit = beatPulse(t, clock.beat);
      resetPose(rory);
      idle(rory, t, { eyesOpen: act === 'idle' ? 1 : 0.14 });
      rory.head.rotation.z = 0.15;

      hands(t, act === 'play');

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

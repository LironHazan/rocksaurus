import * as THREE from 'three';
import { createTyrannosaurus } from '../characters/tyrannosaurus';
import { idle, resetPose } from '../characters/rory';
import { reachArm } from '../characters/reach';
import { createGuitar } from '../props/guitar';
import { addCap } from '../props/cap';
import { addSunglasses } from '../props/sunglasses';
import { enableShadows } from '../characters/materials';
import { midi } from '../audio/notes';
import { beatPulse, recentHit, latestStarted } from './timing';
import type { Performer, SongClock } from './types';

export interface BassPart {
  bpm: number;
  /** [eighth, note, len, vel] — the same notes the bass sound plays. */
  notes: readonly (readonly [number, string, number, number?])[];
}

/** Tiki Taka on bass: cool nods, forearm over the body, paws on strings and neck following the notes. */
export function createBassist(part: BassPart, clock: SongClock): Performer {
  const tiki = createTyrannosaurus();
  addCap(tiki, { scale: 0.72, position: [0, 0.5, 0.15], tilt: -0.05 });
  addSunglasses(tiki.head, {
    eyes: [
      [-0.43, 0.2, 1.02],
      [0.43, 0.2, 1.02],
    ],
    size: 0.24,
  });
  const bass = createGuitar({ color: 0xff8c42, neck: 2.1, strings: 4 });
  bass.position.set(0.25, 1.45, 1.22);
  bass.rotation.set(0.05, 0, 1.0);
  enableShadows(bass);
  tiki.posture.add(bass);
  bass.updateMatrix();
  const onBass = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).applyMatrix4(bass.matrix);

  const root = new THREE.Group();
  root.add(tiki.root);
  const pluckArm = tiki.arms.find(a => a.userData.side === 1)!;
  const fretArm = tiki.arms.find(a => a.userData.side === -1)!;
  const eighth = 60 / part.bpm / 2;
  const notes = part.notes
    .map(([at, note]) => ({ start: at * eighth, midi: midi(note) }))
    .sort((a, b) => a.start - b.start);
  const starts = notes.map(n => n.start);

  return {
    root,
    update(t) {
      const act = clock.activity(t);
      const hit = beatPulse(t, clock.beat);
      resetPose(tiki);
      idle(tiki, t, { eyesOpen: 1 });
      const groove = act === 'play' ? 1 : 0.35;
      tiki.head.rotation.x += 0.12 * hit * groove + (act === 'pose' ? -0.25 : 0);
      tiki.head.rotation.z = Math.sin((t * Math.PI) / (clock.beat * 2)) * 0.08 * groove;
      tiki.torso.rotation.z += Math.sin((t * Math.PI) / (clock.beat * 2)) * 0.04 * groove;
      tiki.tail.rotation.y = Math.sin((t * Math.PI) / (clock.beat * 2)) * 0.3;
      tiki.setMouth(act === 'pose' ? 0.5 : 0);

      const pluck = act === 'play' ? recentHit(t, starts, 18) : 0;
      reachArm(pluckArm, onBass(0.02 - pluck * 0.05, 0.02, 0.3 - pluck * 0.025), onBass(0.62, 0.05, 0.32));
      const current = latestStarted(notes, t);
      const fret = THREE.MathUtils.clamp(1.35 - ((current?.midi ?? midi('E1')) - midi('E1')) * 0.05, 0.85, 1.4);
      reachArm(fretArm, onBass(0, fret, 0.22));
    },
  };
}

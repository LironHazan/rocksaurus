import * as THREE from 'three';
import { createLulu, idleLulu } from '../characters/lulu';
import { createDrumKit } from '../props/drums';
import { addPonytail } from '../props/ponytail';
import { addFlannel } from '../props/flannel';
import { lerp } from '../engine/math';
import { drumHits, type DrumName, type DrumPart } from '../audio/drum-patterns';
import { beatPulse, recentHit } from './timing';
import type { Activity, Performer, SongClock } from './types';
import { sideOf } from '../characters/reach';

/**
 * Her arm's swing (rotation about x, radians): raised between hits, the stick up; on the hit, forward and down, so
 * the stick comes down on the drum in front of her. (A positive swing would take the paw down and back, into her lap.)
 */
const STICK = { up: -0.95, down: -0.15 } as const;

const LEFT_HAND: DrumName[] = ['snare', 'tom', 'floorTom', 'click'];
const RIGHT_HAND: DrumName[] = ['hat', 'ride', 'crash', 'china', 'splash', 'click'];

/** Lulu on drums: sticks on the hits, kick foot, cymbals wobble, ponytail swings, neck headbang. */
export function createDrummer(part: DrumPart, clock: SongClock): Performer & { rig: ReturnType<typeof createLulu> } {
  const root = new THREE.Group();
  const kit = createDrumKit();
  kit.group.scale.setScalar(1.2);
  root.add(kit.group);
  const lulu = createLulu();
  const hair = addPonytail(lulu);
  addFlannel(lulu);
  lulu.root.position.set(0, 0.54, 0);
  root.add(lulu.root);

  const hits = drumHits(part);
  const timesOf = (names: DrumName[]) => hits.filter(h => names.includes(h.name)).map(h => h.time);
  const left = timesOf(LEFT_HAND);
  const right = timesOf(RIGHT_HAND);
  const kicks = timesOf(['kick']);
  const snares = timesOf(['snare']);
  const clicks = timesOf(['click']);
  const countInEnd = (clicks.at(-1) ?? -1) + clock.beat;
  // kit pieces to animate, and which hits make them move (the kit has one crash and one hi-hat stand)
  const parts = [
    ['kick', timesOf(['kick'])],
    ['snare', timesOf(['snare'])],
    ['tom', timesOf(['tom'])],
    ['floorTom', timesOf(['floorTom'])],
    ['hat', timesOf(['hat', 'ride'])],
    ['crash', timesOf(['crash', 'china', 'splash'])],
  ] as const;

  /** Her sticks: up and clicking through a count-in, raised high for the end pose, else on the drums. */
  function sticks(t: number, act: Activity, counting: boolean) {
    for (const arm of lulu.arms) {
      const s = sideOf(arm);
      const strike = recentHit(t, s < 0 ? left : right);
      if (counting) arm.rotation.set(lerp(-2.1, -1.6, strike), 0, -s * 0.5);
      else if (act === 'pose') arm.rotation.set(-2.3, 0, -s * 0.3 + Math.sin(t * 8) * 0.1);
      else arm.rotation.set(lerp(STICK.up, STICK.down, strike), 0, s * 0.15);
    }
  }

  /** Her ponytail: swinging on the beat while she plays, barely moving when she doesn't. */
  function ponytail(t: number, playing: boolean) {
    const sinceBeat = ((t - 0.12) / clock.beat) % 1;
    hair.ponytail.rotation.x = 0.1 + (playing ? Math.pow(1 - sinceBeat, 2) * 0.45 : Math.sin(t * 2) * 0.05);
    hair.ponytail.rotation.z = Math.sin((t * Math.PI) / clock.beat / 2) * (playing ? 0.25 : 0.06);
  }

  /** How open her eyes are, by what she's doing: half shut playing, squeezed shut posing. */
  const EYES: Record<Activity, number> = { play: 0.35, pose: 0.15, idle: 0.75 };

  return {
    root,
    rig: lulu,
    update(t) {
      const act = clock.activity(t);
      const playing = act === 'play';
      idleLulu(lulu, t, { eyesOpen: EYES[act], nod: playing ? beatPulse(t, clock.beat) * 0.22 : 0 });
      sticks(t, act, t < countInEnd && clicks.length > 0);
      lulu.feet.find(f => f.userData.side > 0)!.position.y = (1 - recentHit(t, kicks, 12)) * 0.12;
      lulu.setMouth(act === 'pose' ? 1 : playing ? recentHit(t, snares, 8) * 0.6 : 0);
      ponytail(t, playing);
      for (const [name, times] of parts) kit.strike(name, recentHit(t, times, name === 'crash' ? 2.5 : 10));
    },
  };
}

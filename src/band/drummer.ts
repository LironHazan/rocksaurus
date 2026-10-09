import * as THREE from 'three';
import { createLulu, idleLulu } from '../characters/lulu';
import { createDrumKit } from '../props/drums';
import { addPonytail } from '../props/ponytail';
import { addFlannel } from '../props/flannel';
import { lerp } from '../engine/math';
import { drumHits, type DrumName, type DrumPart } from '../audio/drum-patterns';
import { beatPulse, recentHit } from './timing';
import type { Performer, SongClock } from './types';
import { sideOf } from '../characters/reach';

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

  return {
    root,
    rig: lulu,
    update(t) {
      const act = clock.activity(t);
      const counting = t < countInEnd && clicks.length > 0;
      const hit = beatPulse(t, clock.beat);
      idleLulu(lulu, t, {
        eyesOpen: act === 'play' ? 0.35 : act === 'pose' ? 0.15 : 0.75,
        nod: act === 'play' ? hit * 0.22 : 0,
      });
      for (const arm of lulu.arms) {
        const s = sideOf(arm);
        const strike = recentHit(t, s < 0 ? left : right);
        if (counting)
          arm.rotation.set(lerp(-2.1, -1.6, strike), 0, -s * 0.5); // sticks up, clicking
        else if (act === 'pose') arm.rotation.set(-2.3, 0, -s * 0.3 + Math.sin(t * 8) * 0.1);
        else arm.rotation.set(lerp(-0.6, 0.35, strike), 0, s * 0.15);
      }
      lulu.feet.find(f => f.userData.side > 0)!.position.y = (1 - recentHit(t, kicks, 12)) * 0.12;
      lulu.setMouth(act === 'pose' ? 1 : act === 'play' ? recentHit(t, snares, 8) * 0.6 : 0);
      hair.ponytail.rotation.x =
        0.1 + (act === 'play' ? Math.pow(1 - (((t - 0.12) / clock.beat) % 1), 2) * 0.45 : Math.sin(t * 2) * 0.05);
      hair.ponytail.rotation.z = Math.sin((t * Math.PI) / clock.beat / 2) * (act === 'play' ? 0.25 : 0.06);
      for (const [name, times] of parts) kit.strike(name, recentHit(t, times, name === 'crash' ? 2.5 : 10));
    },
  };
}

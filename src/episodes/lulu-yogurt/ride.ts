import * as THREE from 'three';
import { ease, lerp, seg } from '../../engine/math';
import type { Location, Shot } from '../../engine/director';
import { idleLulu } from '../../characters/lulu';
import { armOf } from '../../characters/reach';
import { createOmli } from '../../characters/omli';
import { reachTo, restRig, type TiredLulu } from './pose';
import { LULU_SEAT, OMLI_SEAT, createRide } from './road';
import { BPM, CUE } from './timeline';

// The ride home: Omli drives, nodding along to the groove; Lulu takes the back seat, and since she doesn't fit,
// her neck goes up through the sunroof, ponytail in the wind, eyes half shut.

/** Both face the way the car goes (+x). */
const FORWARD = Math.PI / 2;
/** One beat of the groove (seconds): Omli's head bobs on it. */
const BEAT = 60 / BPM;
/** The close-up on Lulu above the roof, then Omli at the wheel (seconds into the ride). */
const LULU_CLOSE = [2.0, 4.2] as const;
const OMLI_CLOSE = [4.2, 5.4] as const;

export function createRideLocation(me: TiredLulu): Location {
  const { lulu, hair } = me;
  const ride = createRide();
  const omli = createOmli();
  ride.car.group.add(omli.root);
  const omliFeet = omli.feet.map(f => f.position.clone());
  const v = new THREE.Vector3();

  function poseOmli(t: number) {
    restRig(omli, omliFeet, t);
    omli.root.position.copy(OMLI_SEAT);
    omli.root.rotation.y = FORWARD;
    omli.head.rotation.x += -Math.abs(Math.sin((Math.PI * t) / BEAT)) * 0.12; // on the beat
    omli.head.rotation.y = -0.35; // three-quarters to us
    omli.setMouth(0.15); // a little grin
    omli.root.updateMatrixWorld(true);
    // paws on the wheel, at ten to two
    for (const side of [-1, 1] as const)
      reachTo(armOf(omli, side), ride.car.steering.localToWorld(v.set(0.3 * side, 0.25, 0)));
  }

  function poseLulu(t: number, s: number) {
    me.reset();
    lulu.root.position.copy(LULU_SEAT);
    lulu.root.position.y += ride.car.group.position.y;
    lulu.root.rotation.y = FORWARD;
    idleLulu(lulu, t * 0.7, { eyesOpen: 0.3, nod: -0.15 });
    lulu.head.rotation.y = -0.6 + Math.sin(s * 0.8) * 0.1; // toward us, swaying with the road
    hair.ponytail.rotation.x = 0.7 + Math.sin(t * 13) * 0.15; // in the wind
    hair.ponytail.rotation.z = Math.sin(t * 9) * 0.12;
    lulu.setMouth(lerp(0, 0.2, ease(seg(s, 2.8, 3.6)))); // a slow yawn
    lulu.root.updateMatrixWorld(true);
  }

  function shot(s: number): Shot {
    if (s >= LULU_CLOSE[0] && s < LULU_CLOSE[1]) {
      const h = lulu.head.getWorldPosition(v);
      return { cam: [h.x + 3.6, h.y + 0.2, h.z + 3.8], look: [h.x, h.y - 0.2, h.z] };
    }
    if (s >= OMLI_CLOSE[0] && s < OMLI_CLOSE[1]) {
      const h = omli.head.getWorldPosition(v);
      return { cam: [h.x + 4.4, h.y + 0.1, h.z + 2.6], look: [h.x, h.y - 0.3, h.z] };
    }
    const c = ease(seg(s, 0, CUE.ride[1] - CUE.ride[0]));
    return { cam: [lerp(13, 11, c), 4.6, lerp(10.5, 9.5, c)], look: [-0.5, 3.2, 0] };
  }

  return {
    scene: ride.scene,
    cast: [lulu.root],
    frame(t) {
      const s = t - CUE.ride[0];
      ride.drive(s);
      poseOmli(t);
      poseLulu(t, s);
      return shot(s);
    },
  };
}

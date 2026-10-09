import * as THREE from 'three';
import { ease, lerp, seg } from '../../engine/math';
import type { Location, Shot } from '../../engine/director';
import { idleLulu } from '../../characters/lulu';
import { createBedroom, BED_TOP } from '../../world/bedroom';
import { createShaker, SHAKER_LENGTH } from '../../props/shaker';
import type { TiredLulu } from './pose';
import { CUE } from './timeline';

// Home, 7:30 PM: sitting up in bed in her office flannel, sipping a protein shake. Each sip, her eyes close a
// little more; then she tips over onto the pillow, the shaker rolls onto the blanket, and the Zzz start.

/** Sitting up against the headboard, and lying on her side with her neck along the pillow (as in "Lulu On Call"). */
const SIT = new THREE.Vector3(0.6, BED_TOP - 0.05, -0.3);
const LIE = new THREE.Vector3(1.75, BED_TOP + 0.85, -0.5);
const LIE_ROLL = 1.45;
/** How far she tips the shaker back to drink (radians: base up). */
const DRINK_TILT = -1.7;
/** Where the shaker ends up: on its side on the blanket. */
const DROPPED = new THREE.Vector3(1.6, BED_TOP + 0.75, 1.2);
/** Grip points on the bottle, in its own (unscaled) space: either side of its middle. */
const GRIP = { x: 0.28, y: 0.42 } as const;

/** 0 → 1 → 0 around each sip: up to her mouth, a gulp, down again. */
const sipping = (t: number) =>
  Math.max(...CUE.sips.map(s => ease(seg(t, s - 0.45, s)) * (1 - ease(seg(t, s + 0.45, s + 0.85)))));

export function createBedLocation(me: TiredLulu): Location {
  const { lulu } = me;
  const room = createBedroom();
  room.laptop.visible = false;
  room.clock.set('7:30');
  room.pagerScreen.set('');
  const shaker = createShaker();
  room.scene.add(shaker);
  const v = new THREE.Vector3();
  const tilt = new THREE.Vector3();

  function poseLulu(t: number, lying: number) {
    me.reset();
    const drowsy = seg(t, CUE.bed[0], CUE.asleep);
    idleLulu(lulu, t * 0.6, { eyesOpen: lying > 0.5 ? 0.08 : lerp(0.5, 0.12, drowsy), nod: drowsy * 0.35 });
    lulu.root.position.lerpVectors(SIT, LIE, lying);
    lulu.root.rotation.z = lying * LIE_ROLL;
    for (const s of lulu.neck) s.rotation.z += lying * 0.12;
    lulu.head.rotation.z = -lying * 0.7;
    lulu.root.updateMatrixWorld(true);
  }

  function holdShaker(t: number, lying: number) {
    const k = sipping(t);
    const rest = lulu.body.localToWorld(new THREE.Vector3(0, 0.75, 1.2));
    tilt.set(0, Math.cos(DRINK_TILT), Math.sin(DRINK_TILT));
    const drink = me.mouth(v).addScaledVector(tilt, -SHAKER_LENGTH);
    shaker.position.lerpVectors(rest, drink, k);
    shaker.rotation.set(DRINK_TILT * k, 0, 0);
    // asleep: it slips out of her paws and rolls onto the blanket
    const drop = ease(seg(t, CUE.asleep + 0.2, CUE.asleep + 0.7));
    if (drop > 0) {
      shaker.position.lerp(DROPPED, drop);
      shaker.rotation.set(0, 0.4 * drop, (Math.PI / 2) * drop);
    }
    shaker.updateMatrixWorld(true);
    if (lying > 0) return;
    lulu.setMouth(k * 0.25);
    for (const side of [-1, 1] as const) me.grip(side, shaker.localToWorld(v.set(side * GRIP.x, GRIP.y, 0)));
  }

  function tuckIn(lying: number) {
    // over her legs while she sits up, over all of her once she's lying down
    lulu.body.localToWorld(v.set(0, lerp(0.35, 1.0, lying), lerp(0.75, 0, lying)));
    room.blanket.position.set(v.x, v.y, v.z + 0.15);
    room.blanket.scale.set(lerp(1.3, 1.45, lying), lerp(0.4, 0.8, lying), lerp(1.0, 1.25, lying));
    room.blanket.rotation.set(0, 0, 0);
  }

  function zzz(t: number) {
    const tip = lulu.face.localToWorld(v.set(0, 0.4, 0));
    const on = t >= CUE.asleep + 0.8;
    room.zzz.forEach((z, i) => {
      const p = (((t * 0.6 + i / 3) % 1) + 1) % 1;
      z.position.set(tip.x + 0.3 + p * 0.8, tip.y + 0.3 + p * 1.5, tip.z + 0.3);
      z.scale.setScalar(0.25 + p * 0.35);
      z.material.opacity = on ? Math.sin(p * Math.PI) : 0;
    });
  }

  /** From her side, three-quarters: the shaker goes up to her mouth without hiding her face. Asleep: her head. */
  function shot(t: number): Shot {
    const push = ease(seg(t, CUE.bed[0], CUE.asleep));
    const sitting: Shot = {
      cam: [SIT.x + lerp(6.8, 5.8, push), lerp(4.6, 4.3, push), SIT.z + lerp(5.4, 4.4, push)],
      look: [SIT.x - 0.3, 3.4, SIT.z],
    };
    const asleep = ease(seg(t, CUE.asleep, CUE.asleep + 0.8));
    if (asleep === 0) return sitting;
    const head = lulu.head.getWorldPosition(v);
    return {
      cam: [
        lerp(sitting.cam[0], head.x + 2.4, asleep),
        lerp(sitting.cam[1], 4.0, asleep),
        lerp(sitting.cam[2], 7.4, asleep),
      ],
      look: [lerp(sitting.look[0], head.x + 0.6, asleep), lerp(3.4, head.y + 0.3, asleep), lerp(SIT.z, head.z, asleep)],
    };
  }

  return {
    scene: room.scene,
    cast: [lulu.root],
    frame(t) {
      const lying = ease(seg(t, CUE.asleep, CUE.asleep + 0.8));
      poseLulu(t, lying);
      holdShaker(t, lying);
      tuckIn(lying);
      zzz(t);
      return shot(t);
    },
  };
}

import * as THREE from 'three';
import { ease, lerp, seg } from '../../engine/math';
import { createRockerRory } from '../../characters/rocker';
import { idle, resetPose } from '../../characters/rory';
import { idleLulu, reachLulu, walkLulu } from '../../characters/lulu';
import { armOf, releaseArm } from '../../characters/reach';
import { createDrummer } from '../../band/drummer';
import { guitarHands } from '../../band/guitarist';
import { bendAt, playedNotes, vibratoAt, type PlayedNote } from '../../audio/blues-guitar';
import { BEAT, FINAL_CHORD, drums, guitar } from './music';
import { CUE, mouthAt } from './timeline';
import { KIT_SPOT, LULU_FROM, RORY_SPOT } from './sets';

// The two of them, playing along to the notes they play (music.ts), so every pick, bend and shake lands on the sound.

/** A note keeps the fretting paw where it is this long after it ends (seconds): players don't move off a note. */
const HOLD_S = 0.4;
/** How much a bend moves him (per semitone): the paw pushes the string, the head tilts back, the mouth opens. */
const BEND_PUSH = 0.07;
const BEND_HEAD = 0.09;
const BEND_MOUTH = 0.18;
const MAX_BEND_MOUTH = 0.6;
/** How quickly the picking paw's dip fades (per second): a light, quick pick. */
const PICK = 14;
/** How much the vibrato shakes the fretting paw and his head (per unit of vibratoAt). */
const VIB_PAW = 0.5;
const VIB_HEAD = 0.25;
/** He sways a little, slowly, a bar a sway. */
const SWAY = 0.05;
/** Her walk: a slow tiptoe (seconds a step), small steps; the kit's throne height, in the kit's space. */
const TIPTOE_STEP = 0.55;
const TIPTOE = 0.45;
const THRONE = 0.54;

export function createRoryOnBlues() {
  const rory = createRockerRory();
  rory.root.position.copy(RORY_SPOT.at);
  rory.root.rotation.y = RORY_SPOT.yaw;
  const hands = guitarHands(rory, playedNotes(guitar), PICK);
  const neckPaw = armOf(rory, -1);

  /** The left hand and the face on a held note: the paw pushes the bend and shakes the vibrato; his head goes back
   * into the bend, mouth open with it, and shakes a little with the vibrato (the B.B. face). */
  function feel(note: PlayedNote | null, t: number) {
    const sounding = note && t <= note.end + HOLD_S ? note : null;
    const bend = sounding ? bendAt(sounding, t) : 0;
    const shake = sounding ? vibratoAt(sounding, t) : 0;
    neckPaw.rotation.x -= bend * BEND_PUSH;
    neckPaw.rotation.z += shake * VIB_PAW;
    rory.head.rotation.x = -0.12 - bend * BEND_HEAD;
    rory.head.rotation.z = 0.18 + shake * VIB_HEAD;
    return Math.min(MAX_BEND_MOUTH, bend * BEND_MOUTH);
  }

  /** The last chord still ringing, he opens his eyes: oh. Lulu. */
  function notice(t: number) {
    rory.head.rotation.y = 0.55;
    for (const e of rory.eyes) e.scale.set(1.25, 1.25, 1);
    rory.setMouth(mouthAt('Rory', t));
  }

  return {
    rig: rory,
    update(t: number) {
      resetPose(rory);
      const noticed = t >= CUE.noticed;
      idle(rory, t, { eyesOpen: noticed ? 1 : 0.1 }); // eyes closed: he's somewhere else
      rory.setMouth(feel(hands(t), t));
      rory.root.rotation.z = Math.sin((t * Math.PI) / (BEAT * 2)) * SWAY;
      rory.tail.rotation.y = Math.sin((t * Math.PI) / BEAT) * 0.25;
      if (noticed) notice(t);
    },
  };
}

export function createLuluOnDrums() {
  const playing = (t: number) => t >= CUE.in - BEAT && t < FINAL_CHORD + BEAT;
  const drummer = createDrummer(drums, { beat: BEAT, activity: t => (playing(t) ? 'play' : 'idle') });
  drummer.root.position.copy(KIT_SPOT.at);
  drummer.root.rotation.y = KIT_SPOT.yaw;
  const lulu = drummer.rig;
  const seat = new THREE.Vector3(0, THRONE, 0);
  const from = new THREE.Vector3();
  const v = new THREE.Vector3();

  return {
    root: drummer.root,
    rig: lulu,
    update(t: number) {
      // let go of whatever her paws reached for last frame (the "shh"): the drumming poses start from a clean arm
      for (const arm of lulu.arms) releaseArm(arm);
      drummer.update(t);
      lulu.root.rotation.set(0, 0, 0);
      lulu.root.position.copy(seat);
      // the drummer moves her kick foot; the other is ours (and her walk lifts both)
      lulu.feet.find(f => f.userData.side < 0)!.position.y = 0;
      if (t >= CUE.sit) {
        lulu.setMouth(Math.max(0, mouthAt('Lulu', t)));
        return;
      }
      for (const f of lulu.feet) f.position.y = 0;
      // before she sits: tiptoeing in from the front right, a paw up to her snout (shh), sticks in the other
      drummer.root.updateMatrixWorld(true);
      from.copy(LULU_FROM);
      drummer.root.worldToLocal(from);
      const k = ease(seg(t, CUE.sneak[0], CUE.sneak[1]));
      lulu.root.position.lerpVectors(from, seat, k).setY(lerp(0, THRONE, seg(t, CUE.sit - 0.4, CUE.sit)));
      lulu.root.rotation.y = Math.atan2(seat.x - from.x, seat.z - from.z) * (1 - seg(t, CUE.sit - 0.6, CUE.sit));
      walkLulu(lulu, (t - CUE.sneak[0]) / TIPTOE_STEP, TIPTOE * (k > 0 && k < 1 ? 1 : 0));
      idleLulu(lulu, t, { eyesOpen: 0.95 });
      lulu.root.updateMatrixWorld(true);
      reachLulu(lulu, 1, lulu.face.localToWorld(v.set(0, -0.25, 0.85)));
      lulu.setMouth(0);
    },
  };
}

import * as THREE from 'three';
import { ease, lerp, seg } from '../../engine/math';
import type { Location, Shot } from '../../engine/director';
import { idleLulu } from '../../characters/lulu';
import { armOf, releaseArm } from '../../characters/reach';
import type { CharacterRig } from '../../characters/types';
import { reachTo, restRig, type TiredLulu } from './pose';
import {
  BIN,
  CUP_AT,
  CUP_HEIGHT,
  DOOR_OPEN,
  FRIDGE,
  createBattery,
  createSpecsBubble,
  createKitchen,
  createMop,
  createSpoon,
  createYogurt,
  type Yogurt,
} from './sets';
import { CUE, FLAVOURS, LINES, PAGE_AT, SPECS_TURN, mouthAt, speakerAt, type Flavour } from './timeline';

// The office kitchen, 0 → the ride: Lulu shuffles in, drained by a week of specs for a devilish agent; her protein
// battery pulses; the fridge (seen from inside), three yogurts and three nopes; Mirta and her mop; "this… or this?";
// the peach, the yuck, the bin, the bye.

/** Where Lulu stands at the fridge, where she comes in from and leaves to. */
const LULU_SPOT = new THREE.Vector3(FRIDGE.x + 0.4, 0, 0.6);
const LULU_FROM = new THREE.Vector3(5.2, 0, 1.8); // inside the room: its right wall is at x = 8
const LULU_EXIT = new THREE.Vector3(-8.5, 0, 2.6);
/** The opening shot follows her, but never so far right that it sees past the room's right wall (x = 8). */
const OPENING_CAM_MAX_X = 5.5;
/** Lulu's facing (radians about y; 0 faces the camera). */
const YAW = {
  walkIn: -Math.PI / 2 + 0.6,
  slump: 0.35,
  fridge: Math.PI,
  mirta: Math.PI / 2 - 0.45,
  out: -Math.PI / 2 + 0.5,
};
/** Mirta: where she mops in from, where she stops, and her facing there (toward Lulu, three-quarters to us). */
const MIRTA_FROM = new THREE.Vector3(9.5, 0, 1.4);
const MIRTA_SPOT = new THREE.Vector3(2.4, 0, 0.9);
const MIRTA_YAW = -Math.PI / 2 + 0.55;
/** How far above the judged cup's lid the fridge camera sits: enough to see over it to her face. */
const POV_ABOVE_LID = 0.1;
/** One step of a tired shuffle, and of a quicker walk out (seconds). */
const SHUFFLE = 0.6;
const STRIDE = 0.45;
/** How she looks all week: eyes barely open. */
const TIRED_EYES = 0.45;
/** The time she shakes her head at a yogurt, after looking at it. */
const NOPE = { after: 0.9, len: 0.7 } as const;

/** 0 → 1 → 0 around a spoonful: up to the mouth just before `at`, then back down to the cup. */
const spoonful = (t: number, at: number) => ease(seg(t, at - 0.4, at)) * (1 - ease(seg(t, at + 0.3, at + 0.7)));
/** The yogurt she's looking at, from the fridge (or null). */
const lookingAt = (t: number): Flavour | null => {
  if (t < CUE.cups[0] || t >= CUE.sigh) return null;
  let i = 0;
  while (i + 1 < CUE.cups.length && t >= CUE.cups[i + 1]!) i++;
  return FLAVOURS[i]!;
};

export function createKitchenLocation(me: TiredLulu, mirta: CharacterRig): Location {
  const { lulu } = me;
  const kitchen = createKitchen();
  const cups: Record<Flavour, Yogurt> = {
    vegan: createYogurt('vegan'),
    peach: createYogurt('peach'),
    caramel: createYogurt('caramel'),
  };
  for (const f of FLAVOURS) kitchen.scene.add(cups[f].group);
  const spoon = createSpoon();
  const { mop, bucket } = createMop();
  bucket.position.set(MIRTA_SPOT.x + 1.6, 0, MIRTA_SPOT.z - 0.9);
  const battery = createBattery();
  const batterySize = battery.scale.clone();
  const bubble = createSpecsBubble();
  kitchen.scene.add(spoon, mop, bucket, battery, bubble.sprite);
  const mirtaFeet = mirta.feet.map(f => f.position.clone());
  const v = new THREE.Vector3();
  const w = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);

  /** Lulu's paw-held point for a cup: low at her chest, or raised to show it. Body space → world. */
  const held = (side: -1 | 1, raise: number) =>
    lulu.body.localToWorld(new THREE.Vector3(side * 0.85, 1.7 + raise * 0.9, 1.15 + raise * 0.2));
  /** Puts a cup's base just under a paw point, and the paw on it. */
  function holdCup(cup: Yogurt, side: -1 | 1, at: THREE.Vector3) {
    cup.group.position.copy(at).y -= CUP_HEIGHT * 0.4;
    cup.group.rotation.set(0, 0, 0);
    me.grip(side, at);
  }

  function walkIn(t: number) {
    const k = seg(t, 0.3, CUE.enter[1] - 0.4);
    lulu.root.position.lerpVectors(LULU_FROM, LULU_SPOT, k);
    lulu.root.rotation.y = lerp(YAW.walkIn, YAW.slump, ease(seg(t, CUE.enter[1] - 0.6, CUE.enter[1])));
    if (k < 1) me.walk((t - 0.3) / SHUFFLE, 0.7);
    idleLulu(lulu, t, { eyesOpen: TIRED_EYES, nod: 0.45 });
  }
  function slump(t: number) {
    lulu.root.position.copy(LULU_SPOT);
    lulu.root.rotation.y = lerp(YAW.slump, YAW.fridge, ease(seg(t, CUE.battery[1] - 0.2, CUE.open)));
    idleLulu(lulu, t * 0.6, { eyesOpen: TIRED_EYES * 0.8, nod: 0.6 });
    lulu.squash.scale.y = 0.96; // deflated
    if (t < CUE.specs[1]) rubEyes(t);
    if (t >= CUE.battery[1] - 0.2) me.grip(-1, kitchen.door.localToWorld(v.set(FRIDGE.w - 0.3, 2.0, 0.35))); // the handle
  }
  /** All those specs: eyes shut, a paw rubbing them, the head hanging. */
  function rubEyes(t: number) {
    for (const e of lulu.eyes) e.scale.y = 0.08;
    lulu.root.updateMatrixWorld(true);
    const rub = lulu.face.localToWorld(v.set(0.25 + Math.sin(t * 9) * 0.06, 0.1 + Math.cos(t * 9) * 0.04, 0.6));
    me.grip(1, rub);
  }
  function atTheFridge(t: number) {
    lulu.root.position.copy(LULU_SPOT);
    lulu.root.rotation.y = YAW.fridge;
    const sigh = ease(seg(t, CUE.sigh, CUE.sigh + 0.8));
    idleLulu(lulu, t, { eyesOpen: lerp(0.7, 0.12, sigh), nod: 0.4 + sigh * 0.35 });
    lulu.squash.scale.y = 1 - sigh * 0.04;
    for (const c of CUE.cups) {
      const nope = seg(t, c + NOPE.after, c + NOPE.after + NOPE.len);
      if (nope > 0 && nope < 1) lulu.head.rotation.y += Math.sin(nope * Math.PI * 4) * 0.35;
      if (nope > 0 && nope < 1) for (const e of lulu.eyes) e.scale.y = 0.3;
    }
  }
  function talking(t: number) {
    lulu.root.position.copy(LULU_SPOT);
    lulu.root.rotation.y = lerp(YAW.fridge, YAW.mirta, ease(seg(t, CUE.mirta[0] + 0.4, CUE.mirta[0] + 1.2)));
    idleLulu(lulu, t, { eyesOpen: TIRED_EYES + 0.15, nod: 0.3 });
    lulu.setMouth(mouthAt('Lulu', t));
    if (t >= CUE.point && t < CUE.eat[0]) for (const e of lulu.eyes) e.scale.y = 0.15; // …the peach. Of course.
  }
  function eating(t: number) {
    lulu.root.position.copy(LULU_SPOT);
    lulu.root.rotation.y = lerp(YAW.mirta, YAW.slump, ease(seg(t, CUE.eat[0], CUE.eat[0] + 0.6)));
    const yuck = seg(t, CUE.yuck[0], CUE.yuck[0] + 0.3) * (1 - seg(t, CUE.yuck[1] - 0.4, CUE.yuck[1]));
    idleLulu(lulu, t, { eyesOpen: lerp(TIRED_EYES + 0.2, 0.1, yuck), nod: 0.2 + yuck * 0.25 });
    me.queasy(yuck);
    lulu.squash.rotation.z = Math.sin(t * 46) * 0.03 * yuck; // a full-body shiver
    lulu.setMouth(Math.max(...CUE.bites.map(b => spoonful(t, b))) * 0.45);
  }
  function leaving(t: number) {
    const k = seg(t, CUE.toss + 0.9, CUE.bye[1]);
    lulu.root.position.lerpVectors(LULU_SPOT, LULU_EXIT, k);
    lulu.root.rotation.y = lerp(YAW.slump, YAW.out, ease(seg(t, CUE.toss + 0.6, CUE.toss + 1.1)));
    idleLulu(lulu, t, { eyesOpen: TIRED_EYES + 0.25 });
    if (k > 0) me.walk((t - CUE.toss - 0.9) / STRIDE);
    lulu.setMouth(mouthAt('Lulu', t));
    // bye bye: a little wave
    if (t >= LINES[4]!.from) armOf(lulu, 1).rotation.set(-0.3, 0, 2.3 + Math.sin(t * 12) * 0.3);
  }
  function poseLulu(t: number) {
    me.reset();
    if (t < CUE.enter[1]) walkIn(t);
    else if (t < CUE.open) slump(t);
    else if (t < CUE.mirta[0]) atTheFridge(t);
    else if (t < CUE.eat[0]) talking(t);
    else if (t < CUE.bye[0]) eating(t);
    else leaving(t);
    lulu.root.updateMatrixWorld(true);
  }

  /** The cups: on the shelf; two in her paws for "this… or this?"; the peach eaten, then in the bin. */
  function placeCups(t: number) {
    const looked = lookingAt(t);
    for (const f of FLAVOURS) {
      cups[f].group.position.copy(CUP_AT[f]);
      cups[f].group.rotation.set(0, Math.PI, 0); // labels to the back of the fridge, where the camera is
      cups[f].group.visible = true;
      cups[f].lid.rotation.x = 0;
      if (f === looked) cups[f].group.position.y += Math.abs(Math.sin(t * 6)) * 0.05; // the one she's judging
    }
    if (t < CUE.take || t >= CUE.bye[1]) return;
    if (t < CUE.eat[0]) return showTwo(t);
    eatPeach(t);
  }
  function showTwo(t: number) {
    const take = ease(seg(t, CUE.take, CUE.take + 0.6));
    const line = LINES[2]!;
    const [first, second] = [seg(t, line.from + 0.2, line.from + 0.6), seg(t, line.from + 1.0, line.from + 1.4)];
    const raise = { peach: first * (1 - second), caramel: second };
    for (const [f, side] of [
      ['peach', -1],
      ['caramel', 1],
    ] as const) {
      const at = held(side, raise[f]).lerp(w.copy(CUP_AT[f]).setY(CUP_AT[f].y + CUP_HEIGHT * 0.4), 1 - take);
      holdCup(cups[f], side, at);
    }
    if (t >= CUE.point) mirtaPoints(cups.peach.group.position);
  }
  function eatPeach(t: number) {
    const peach = cups.peach;
    const hand = lulu.body.localToWorld(v.set(-0.35, 1.75, 1.3));
    // into the bin, by paw: over it, then let go and it drops in (Mirta has enough to clean)
    const over = ease(seg(t, CUE.toss, CUE.toss + 0.35));
    const drop = ease(seg(t, CUE.toss + 0.35, CUE.toss + 0.6));
    if (over > 0) {
      const above = w.copy(BIN).setY(BIN.y + 0.7);
      holdCup(peach, -1, hand.lerp(above, over));
      if (drop > 0) {
        releaseArm(armOf(lulu, -1));
        armOf(lulu, -1).rotation.set(-0.3, 0, -0.15); // paw back down
        peach.group.position.lerp(w.copy(BIN).setY(0.3), drop);
      }
    } else holdCup(peach, -1, hand);
    peach.lid.rotation.x = -2.4 * ease(seg(t, CUE.lid, CUE.lid + 0.4));
    if (t >= CUE.toss) return;
    // the spoon: from the cup to her mouth and back, once per bite; it stays in through the worst of it
    const yuck = t >= CUE.yuck[0] && t < CUE.yuck[0] + 1.6 ? 1 : 0;
    const bite = Math.max(yuck, ...CUE.bites.map(b => spoonful(t, b)));
    const cupTop = peach.group.localToWorld(w.set(0, CUP_HEIGHT * 0.8, 0));
    const target = cupTop.lerp(me.mouth(v), bite);
    const anchor = lulu.body.localToWorld(new THREE.Vector3(0.7, 1.5, 1.1));
    const dir = target.clone().sub(anchor).normalize();
    spoon.position.copy(target).addScaledVector(dir, -0.6);
    spoon.quaternion.setFromUnitVectors(UP, dir);
    me.grip(1, spoon.position);
  }

  function mopAt(head: THREE.Vector3, sweep: number) {
    mirta.root.updateMatrixWorld(true);
    const chest = mirta.torso.localToWorld(v.set(0, 1.7, 0.7));
    mop.position.copy(head);
    const dir = chest.sub(head).normalize();
    mop.quaternion.setFromUnitVectors(UP, dir);
    reachTo(armOf(mirta, -1), w.copy(head).addScaledVector(dir, 2.0));
    if (sweep >= 0) reachTo(armOf(mirta, 1), w.copy(head).addScaledVector(dir, 2.6));
  }
  /** The mop head in front of her: swept side to side while she works. */
  function mopHead(sweep: number) {
    const fwd = v.set(0, 0, 1).applyQuaternion(mirta.root.quaternion);
    const side = w.set(1, 0, 0).applyQuaternion(mirta.root.quaternion);
    return mirta.root.position
      .clone()
      .addScaledVector(fwd, 1.5)
      .addScaledVector(side, Math.sin(sweep) * 0.6);
  }
  function mirtaPoints(at: THREE.Vector3) {
    mirta.root.updateMatrixWorld(true);
    const shoulder = armOf(mirta, 1).getWorldPosition(v);
    reachTo(armOf(mirta, 1), shoulder.lerp(at, 0.55));
  }
  function poseMirta(t: number) {
    mirta.root.visible = mop.visible = bucket.visible = t >= CUE.mirta[0]; // her bucket comes with her
    restRig(mirta, mirtaFeet, t + 0.7);
    if (!mirta.root.visible) return;
    const walk = seg(t, CUE.mirta[0], LINES[0]!.from - 0.6);
    mirta.root.position.lerpVectors(MIRTA_FROM, MIRTA_SPOT, walk);
    mirta.root.rotation.y = walk < 1 ? -Math.PI / 2 : MIRTA_YAW;
    if (walk < 1) mirta.root.position.y += Math.abs(Math.sin(t * 8)) * 0.08;
    mirta.setMouth(mouthAt('Mirta', t));
    const working = t < LINES[0]!.from - 0.4 || t >= CUE.eat[0];
    const sweep = working ? ((t - CUE.mirta[0]) / 0.55) * Math.PI : 0;
    mopAt(mopHead(sweep), working ? sweep : -1);
    mirtaReacts(t);
  }
  /** Mirta's free paw, posed by rotation (not reaching for anything). */
  function mirtaPaw(x: number, z: number) {
    const arm = armOf(mirta, 1);
    releaseArm(arm);
    arm.rotation.set(x, 0, z);
  }
  function mirtaReacts(t: number) {
    const shrug = LINES[1]!;
    if (t >= shrug.from && t < shrug.to) {
      mirtaPaw(-0.6, 1.3); // ¿?
      mirta.head.rotation.z = 0.2;
    }
    if (t >= LINES[3]!.from && t < CUE.eat[0]) mirta.head.rotation.x = -Math.abs(Math.sin(t * 9)) * 0.2; // mm! mm!
    if (t >= CUE.yuck[0] && t < CUE.bye[0]) mirtaPaw(-0.4, 2.4); // 👍 delicious, right?
    if (t >= LINES[4]!.from + 0.3) mirtaPaw(-0.3, 2.3 + Math.sin(t * 11 + 1) * 0.3); // bye bye
  }

  function setFridge(t: number) {
    const open = ease(seg(t, CUE.open, CUE.open + 0.6)) * (1 - ease(seg(t, CUE.eat[0], CUE.eat[0] + 0.6)));
    kitchen.door.rotation.y = -open * DOOR_OPEN;
    kitchen.light.intensity = open * 6;
    battery.visible = t >= CUE.battery[0] && t < CUE.battery[1];
    battery.scale.copy(batterySize).multiplyScalar(1 + Math.abs(Math.sin(t * 5)) * 0.04); // a low-battery pulse
    lulu.face.localToWorld(battery.position.set(0.3, 1.3, 0));
    // the specs bubble: floats in; the pile grows a version at a time; then the agent laughs (and the bubble shakes)
    const thought = seg(t, CUE.specs[0], CUE.specs[0] + 0.4) * (1 - seg(t, CUE.specs[1] - 0.3, CUE.specs[1]));
    bubble.sprite.visible = thought > 0;
    bubble.sprite.material.opacity = thought;
    const laughing = t >= SPECS_TURN;
    bubble.show(Math.max(1, PAGE_AT.filter(at => t >= at).length), laughing);
    const shake = laughing ? Math.sin(t * 30) * 0.04 : 0;
    lulu.face.localToWorld(bubble.sprite.position.set(0.1 + shake, 1.7 + Math.sin(t * 2) * 0.05, 0));
  }

  function headOf(rig: { head: THREE.Object3D }) {
    return rig.head.getWorldPosition(new THREE.Vector3());
  }
  function fridgePov(t: number): Shot {
    const face = lulu.face.getWorldPosition(new THREE.Vector3());
    const looked = lookingAt(t);
    const cup = looked ? CUP_AT[looked] : CUP_AT.peach;
    // mostly her face; the lids of the yogurts at the bottom of the frame, the one she's judging in the middle
    // straight behind the one she's judging, just above its lid: the cup fills the bottom of the frame, her face the top
    return {
      cam: [cup.x, cup.y + CUP_HEIGHT + POV_ABOVE_LID, FRIDGE.back + 0.2],
      look: [lerp(face.x, cup.x, 0.3), face.y - 0.2, face.z],
    };
  }
  function closeOn(who: 'Lulu' | 'Mirta'): Shot {
    const h = headOf(who === 'Lulu' ? lulu : mirta);
    return who === 'Lulu'
      ? { cam: [h.x + 2.4, h.y - 0.1, h.z + 4.6], look: [h.x, h.y - 0.3, h.z] }
      : { cam: [h.x - 1.4, h.y + 0.2, h.z + 4.4], look: [h.x, h.y - 0.3, h.z] };
  }
  function shot(t: number): Shot {
    if (t < CUE.enter[1]) {
      // follow her across the kitchen to the fridge, the camera kept inside the room's walls
      const x = lulu.root.position.x;
      return { cam: [Math.min(x + 1.0, OPENING_CAM_MAX_X), 4.8, 13.5], look: [x - 0.5, 3.0, -0.5] };
    }
    if (t >= SPECS_TURN && t < CUE.specs[1]) {
      // the joke: push in on her face and the laughing agent above it
      const h = headOf(lulu);
      const push = ease(seg(t, SPECS_TURN, SPECS_TURN + 1.2));
      return {
        cam: [h.x + lerp(1.0, 0.5, push), h.y + lerp(0.6, 1.0, push), h.z + lerp(7.0, 5.4, push)],
        look: [h.x + 0.2, h.y + lerp(0.4, 0.9, push), h.z],
      };
    }
    if (t < CUE.battery[1] - 0.3) {
      const h = headOf(lulu);
      return { cam: [h.x + 1.0, h.y + 0.6, h.z + 7.0], look: [h.x + 0.2, h.y + 0.4, h.z] }; // room for the battery
    }
    if (t < CUE.open + 0.35) return { cam: [2.6, 4.6, 7.8], look: [FRIDGE.x + 0.3, 3.0, -1.5] };
    if (t < CUE.mirta[0]) return fridgePov(t);
    return talkShot(t);
  }
  function talkShot(t: number): Shot {
    const two: Shot = { cam: [0.0, 4.4, 13], look: [-0.2, 3.3, -0.2] };
    if (t < LINES[0]!.from) return { cam: [1.5, 4.8, 15], look: [1.0, 3.0, -1] };
    if (t < CUE.eat[0]) {
      const speaker = speakerAt(t);
      const line = LINES.find(l => t >= l.from + 0.9 && t < l.to);
      if (speaker && line && t < CUE.point) return closeOn(speaker);
      return two;
    }
    if (t < CUE.bye[0]) {
      const push = ease(seg(t, CUE.yuck[0], CUE.yuck[0] + 0.4));
      const h = headOf(lulu);
      const mid: Shot = { cam: [LULU_SPOT.x + 1.6, 3.9, 7.4], look: [LULU_SPOT.x + 0.3, 3.3, 0] };
      if (push === 0) return mid;
      return {
        cam: [lerp(mid.cam[0], h.x + 0.9, push), lerp(3.9, h.y, push), lerp(7.4, h.z + 3.6, push)],
        look: [lerp(mid.look[0], h.x, push), lerp(3.3, h.y - 0.2, push), lerp(0, h.z, push)],
      };
    }
    if (t < CUE.toss + 0.9) return { cam: [1.2, 4.0, 7.6], look: [-1.4, 2.0, -0.2] }; // into the bin
    return { cam: [-0.5, 4.8, 15.5], look: [-1.5, 3.2, -0.5] };
  }

  return {
    scene: kitchen.scene,
    cast: [lulu.root, mirta.root],
    frame(t) {
      poseLulu(t);
      poseMirta(t);
      placeCups(t);
      spoon.visible = t >= CUE.lid + 0.3 && t < CUE.toss;
      setFridge(t);
      return shot(t);
    },
  };
}

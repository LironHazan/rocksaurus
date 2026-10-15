import * as THREE from 'three';
import { ease, lerp, seg } from '../../engine/math';
import { cuts, type Location, type Shot } from '../../engine/director';
import type { Stage } from '../../engine/types';
import { disposeObject } from '../../engine/dispose';
import { createLulu, idleLulu, resetLulu, reachLulu } from '../../characters/lulu';
import { ORNITHO_SEAT, type OrnithomimusRig } from '../../characters/ornithomimus';
import { restRig } from '../../characters/rest';
import { armOf, reachArm } from '../../characters/reach';
import { addPonytail } from '../../props/ponytail';
import { addFlannel } from '../../props/flannel';
import { LAPTOP_SCREEN } from '../../props/laptop';
import { createDchozaurus, createIgarzarus, createOgozaurus, createStatitezarus, STATITEZARUS_SCALE } from './cast';
import {
  BUG_PATH,
  CALL,
  CHAIR_TOP,
  HOME_CHAIR,
  OGO_FROM,
  OGO_STOP,
  SCREEN,
  SEATS,
  createHomeOffice,
  createMeetingRoom,
  createPinaColada,
  paintHack,
} from './sets';
import { CUE, LINES, mouthAt, postsAt, type Who } from './timeline';

// The meeting room. Statitezarus at the head of the table, under the big screen; Igarzarus and Lulu either side;
// Dchozaurus on the call (his home office, rendered into the screen every frame); Ogozaurus at the door, later.

/** The call's picture: 4:3, sharp enough to fill the frame in a close-up. */
const CALL_PX = { w: 800, h: 600 } as const;
/** Ogozaurus, back from the offsite: his jaw a little open in a grin (0..1), and his eyes smiling (a share of
 * their height). */
const OGO_GRIN = 0.22;
const OGO_HAPPY_EYES = 0.7;
/** His piña colada: cocktail-sized for him (he's big). */
const DRINK_SCALE = 1.3;
/** A walk-cycle step (seconds), and the door's swing (radians, into the room). */
const STEP = 0.4;
const DOOR_OPEN = 1.4;
/** How long after each post a pinged phone buzzes, and how long they glance at it (seconds). */
const GLANCE = 0.9; // (Dchozaurus, at home)
/** The laptop shot stands back this many screen widths: the screen fills the frame's width. */
const LAPTOP_BACK = 1.95;
/** A shot of a screen stands back far enough to fill the frame's width with it (× its width). */
const FILL = 1.9;
/** How far past the bug line the bug keeps crawling (seconds), and its crawl's period. */
const CRAWL_S = 3.0;

const v = new THREE.Vector3();
const lineOf = (who: Who, t: number) => LINES.find(l => l.who === who && t >= l.from && t < l.to);

/** A seated Ornithomimus: hips on the seat, feet dangling over its edge. */
function sit(rig: OrnithomimusRig, at: THREE.Vector3, yaw: number, scale: number, t: number) {
  rig.root.position.set(at.x, CHAIR_TOP - (ORNITHO_SEAT - 0.05) * scale, at.z);
  rig.root.rotation.y = yaw;
  rig.dangleFeet(t * 2);
}

export function createRoomLocation(stage: Stage): Location & { dispose(): void } {
  let posts = 0;
  const room = createMeetingRoom((ctx, w, h) => paintHack(ctx, w, h, posts));
  const { hack } = room;
  const home = createHomeOffice();
  const callTarget = new THREE.RenderTarget(CALL_PX.w, CALL_PX.h);
  // a render target comes out upside down on the screen: sample it flipped
  callTarget.texture.repeat.set(1, -1);
  callTarget.texture.offset.set(0, 1);
  room.callMat.map = callTarget.texture;
  const webcam = new THREE.PerspectiveCamera(45, CALL_PX.w / CALL_PX.h, 0.1, 50);

  const stati = createStatitezarus();
  const igar = createIgarzarus();
  const dcho = createDchozaurus();
  const ogo = createOgozaurus();
  const lulu = createLulu();
  const hair = addPonytail(lulu);
  addFlannel(lulu);
  room.scene.add(stati.root, igar.root, ogo.root, lulu.root);
  home.scene.add(dcho.root);
  const drink = createPinaColada();
  drink.scale.setScalar(DRINK_SCALE);
  room.scene.add(drink);
  const feet = new Map([stati, igar, dcho, ogo].map(rig => [rig, rig.feet.map(f => f.position.clone())] as const));
  const rest = (rig: typeof stati | typeof ogo, t: number) => restRig(rig, feet.get(rig)!, t);

  /** A ping on the phone: just after each post, for a moment. */
  const pinged = (t: number) => CUE.posts.some(p => t >= p + 0.2 && t < p + 0.2 + GLANCE);

  /** Statitezarus, beat by beat: posting (paws on the keys), asking (hopeful), Ruby to Elm again (head down), the bug
   * (eyes wide). */
  const STATI_MOODS = {
    posting(t: number) {
      for (const side of [-1, 1] as const) {
        const arm = armOf(stati, side);
        const tap = Math.abs(Math.sin(t * 14 + side)) * 0.05;
        reachArm(arm, arm.parent!.worldToLocal(v.set(side * 0.25, 1.32 + tap, -3.9)));
      }
      stati.head.rotation.x = 0.25;
    },
    asking() {
      stati.head.rotation.z = 0.15;
      for (const e of stati.eyes) e.scale.set(1.2, 1.2, 1);
    },
    deflated() {
      stati.head.rotation.x = 0.4;
      stati.torso.rotation.x = 0.15;
    },
    startled() {
      for (const e of stati.eyes) e.scale.set(1.3, 1.3, 1);
    },
    calm() {},
  } as const;
  const statiAt = cuts<keyof typeof STATI_MOODS>([
    [0, 'posting'],
    [CUE.tagged[1], 'calm'],
    [LINES[0]!.from, 'asking'],
    [LINES[0]!.to, 'calm'],
    [LINES[1]!.from, 'deflated'],
    [CUE.bug, 'startled'],
    [CUE.door, 'calm'],
  ]);

  function poseStatitezarus(t: number) {
    rest(stati, t);
    sit(stati, SEATS.Statitezarus.at, SEATS.Statitezarus.yaw, STATITEZARUS_SCALE, t);
    stati.setMouth(mouthAt('Statitezarus', t));
    stati.root.updateMatrixWorld(true);
    STATI_MOODS[statiAt(t)](t);
    stati.updateLegs(1);
  }

  function poseIgarzarus(t: number) {
    rest(igar, t + 1.1);
    sit(igar, SEATS.Igarzarus.at, SEATS.Igarzarus.yaw, 1, t + 1);
    igar.setMouth(mouthAt('Igarzarus', t));
    igar.head.rotation.y = -0.35; // toward Statitezarus and the screen
    igar.root.updateMatrixWorld(true);
    if (t >= CUE.posts[0] && t < CUE.tagged[1]) {
      // at his laptop, "Hack" open: one ping after another; paws on the keys
      igar.head.rotation.set(0.35, 0, 0);
      hack.group.updateMatrixWorld(true);
      for (const side of [-1, 1] as const) {
        const arm = armOf(igar, side);
        reachArm(arm, arm.parent!.worldToLocal(hack.group.localToWorld(hack.key(side * 0.5, 0.6, v))));
      }
    }
    if (lineOf('Igarzarus', t)) {
      // a paw out: "when?"
      armOf(igar, 1).rotation.set(-1.2, 0, 0.6 + Math.sin(t * 6) * 0.1);
      igar.head.rotation.z = 0.1;
    }
    if (t >= CUE.door) igar.head.rotation.y = 0.6; // to the door
    igar.updateLegs(1);
  }

  function poseLulu(t: number) {
    resetLulu(lulu);
    hair.ponytail.rotation.set(0.1, 0, 0);
    idleLulu(lulu, t, { eyesOpen: 0.85 });
    lulu.root.position.set(SEATS.Lulu.at.x, CHAIR_TOP - 0.08, SEATS.Lulu.at.z);
    lulu.root.rotation.y = SEATS.Lulu.yaw;
    for (const f of lulu.feet) f.position.z += 0.5; // over the seat's edge
    lulu.setMouth(mouthAt('Lulu', t));
    lulu.head.rotation.y = -0.25;
    const confused = t >= CUE.confused[0];
    if (confused) {
      // lost: head tilted, eyes blinking, a little shrug
      lulu.head.rotation.z = 0.3 * ease(seg(t, CUE.confused[0], CUE.confused[0] + 0.5));
      lulu.head.rotation.y = 0.2;
      for (const e of lulu.eyes) e.scale.y = Math.abs(Math.sin(t * 2.2)) > 0.97 ? 0.1 : 1;
      lulu.root.updateMatrixWorld(true);
      for (const side of [-1, 1] as const)
        reachLulu(lulu, side, lulu.body.localToWorld(v.set(side * 1.0, 2.0 + Math.sin(t * 3) * 0.05, 0.9)));
    }
  }

  function poseOgozaurus(t: number) {
    rest(ogo, t);
    ogo.root.visible = drink.visible = t >= CUE.door;
    room.door.rotation.y = DOOR_OPEN * ease(seg(t, CUE.door, CUE.door + 0.6));
    const k = ease(seg(t, CUE.door + 0.3, CUE.inside));
    ogo.root.position.lerpVectors(OGO_FROM, OGO_STOP, k);
    ogo.root.rotation.y = lerp(Math.PI / 2, 1.0, ease(seg(t, CUE.inside - 0.3, CUE.inside + 0.4)));
    if (k > 0 && k < 1) {
      // big T-Rex steps
      const p = (Math.PI * (t - CUE.door)) / STEP;
      ogo.root.position.y += Math.abs(Math.sin(p)) * 0.15;
      for (const f of ogo.feet) f.position.y += Math.max(0, Math.sin(p + (f.userData.side > 0 ? 0 : Math.PI))) * 0.35;
    }
    // all smiles, back from the offsite: a grin (teeth showing), cheeks up, happy eyes
    ogo.setMouth(Math.max(OGO_GRIN, mouthAt('Ogozaurus', t)));
    for (const c of ogo.cheeks) c.scale.set(1.3, 1.0, 0.35);
    for (const e of ogo.eyes) e.scale.y *= OGO_HAPPY_EYES;
    // his piña colada, in his near paw: held out front, raised a little on his line (cheers)
    const cheers = lineOf('Ogozaurus', t) ? ease(seg(t, LINES[6]!.from, LINES[6]!.from + 0.4)) : 0;
    ogo.root.updateMatrixWorld(true);
    drink.position.copy(ogo.posture.localToWorld(v.set(0.6, lerp(1.3, 1.7, cheers), 1.25)));
    drink.rotation.set(0, ogo.root.rotation.y, 0);
    drink.updateMatrixWorld(true);
    const paw = armOf(ogo, 1);
    reachArm(paw, paw.parent!.worldToLocal(drink.localToWorld(v.set(0, 0.25, 0))));
    if (cheers > 0) {
      armOf(ogo, -1).rotation.set(-1.0, 0, -0.9); // his other tiny arm out: "well?"
      ogo.head.rotation.z = -0.12;
    }
  }

  /** Dchozaurus on his chair: glancing at each ping, eyes to the ceiling at the tags, a paw out when he talks. */
  function seated(t: number) {
    sit(dcho, HOME_CHAIR, 0, 1, t);
    if (pinged(t)) dcho.head.rotation.x = 0.4; // another tag 🫠
    if (t >= CUE.tagged[0] && t < CUE.tagged[1]) {
      dcho.head.rotation.x = -0.3;
      dcho.head.rotation.z = 0.15;
    }
    if (lineOf('Dchozaurus', t)) armOf(dcho, 1).rotation.set(-1.1, 0, 0.5 + Math.sin(t * 5) * 0.1);
    dcho.updateLegs(1);
  }
  /** Up on the chair seat with a jump, paws up; at the floor beat, looking down at the bug and pointing at it. */
  function onTheChair(t: number) {
    const jump = Math.sin(Math.PI * seg(t, CUE.bug, CUE.bug + 0.5));
    dcho.root.position.set(HOME_CHAIR.x, CHAIR_TOP + jump * 0.8, HOME_CHAIR.z);
    for (const e of dcho.eyes) e.scale.set(1.35, 1.35, 1);
    for (const arm of dcho.arms) arm.rotation.set(-0.3, 0, arm.userData.side * 2.6);
    if (t >= CUE.floor[0]) {
      dcho.head.rotation.x = 0.6;
      armOf(dcho, 1).rotation.set(-2.2, 0, 0.3);
    }
    dcho.updateLegs(0);
  }
  /** The bug: out from under the desk at the bug cue, back and forth across the floor, legs ticking. */
  function crawl(t: number) {
    const k = seg(t, CUE.bug, CUE.floor[1] + CRAWL_S);
    home.bug.group.visible = t >= CUE.bug;
    home.bug.group.position.set(lerp(BUG_PATH.from, BUG_PATH.to, Math.sin(k * Math.PI)), 0, BUG_PATH.z);
    home.bug.group.rotation.y = Math.cos(k * Math.PI) >= 0 ? 0 : Math.PI;
    home.bug.legs.forEach((leg, i) => (leg.rotation.z = Math.sin(t * 30 + i) * 0.4));
  }

  function poseDchozaurus(t: number) {
    rest(dcho, t + 0.5);
    dcho.setMouth(mouthAt('Dchozaurus', t));
    if (t < CUE.bug) seated(t);
    else onTheChair(t);
    crawl(t);
  }

  /** The call: his webcam, framed on him; at the bug, it takes in the floor too. */
  function film(t: number) {
    // he's up on his chair: the webcam tilts up after him, then wide to take in the floor (and the bug)
    const up = ease(seg(t, CUE.bug, CUE.bug + 0.4));
    const floor = ease(seg(t, CUE.floor[0], CUE.floor[0] + 0.6));
    webcam.position.set(lerp(0, 0.3, floor), lerp(3.2, 3.6, up), lerp(lerp(4.2, 5.6, up), 7.0, floor));
    webcam.lookAt(lerp(0, 0.3, floor), lerp(lerp(2.9, 3.6, up), 2.2, floor), 0);
    stage.renderer.setRenderTarget(callTarget);
    stage.renderer.render(home.scene, webcam);
    stage.renderer.setRenderTarget(null);
  }

  const headOf = (rig: { head: THREE.Object3D }) => rig.head.getWorldPosition(new THREE.Vector3());
  /** Close on someone's face, from the way they face, a little to one side. */
  function close(rig: { head: THREE.Object3D; root: THREE.Object3D }, dist: number, side = 0.6): Shot {
    const h = headOf(rig);
    const yaw = rig.root.rotation.y + side;
    return { cam: [h.x + Math.sin(yaw) * dist, h.y + 0.3, h.z + Math.cos(yaw) * dist], look: [h.x, h.y - 0.2, h.z] };
  }
  /** "Hack" on his laptop, as he sees it: straight on, filling the frame's width, his head out of the way. */
  function hackShot(): Shot {
    igar.root.visible = false; // we're him: his body would be between us and the screen
    hack.screen.updateMatrixWorld(true);
    const p = hack.screen.getWorldPosition(new THREE.Vector3());
    const n = new THREE.Vector3(0, 0, 1).transformDirection(hack.screen.matrixWorld);
    const cam = p.clone().addScaledVector(n, LAPTOP_SCREEN.w * LAPTOP_BACK);
    return { cam: [cam.x, cam.y, cam.z], look: [p.x, p.y, p.z] };
  }
  const callShot: Shot = { cam: [CALL.x, SCREEN.y, SCREEN.z + CALL.w * FILL], look: [CALL.x, SCREEN.y, SCREEN.z] };

  type RoomShot = 'wide' | 'chat' | 'stati' | 'igar' | 'call' | 'door' | 'ogo' | 'lulu';
  const shotAt = cuts<RoomShot>([
    [0, 'wide'],
    [CUE.posts[0], 'chat'],
    [CUE.posts[1] + 0.4, 'stati'],
    [CUE.posts[2], 'chat'],
    [CUE.posts[3] + 0.1, 'igar'],
    [CUE.posts[4], 'chat'],
    [CUE.tagged[0], 'call'],
    [CUE.tagged[0] + 1.8, 'igar'],
    [LINES[0]!.from, 'stati'],
    [LINES[1]!.from, 'igar'],
    [LINES[1]!.to + 0.2, 'stati'], // "at every opportunity": Statitezarus, head down
    [LINES[2]!.from, 'call'],
    [LINES[4]!.from, 'igar'],
    [LINES[5]!.from - 0.2, 'call'],
    [CUE.door, 'door'],
    [LINES[6]!.from, 'ogo'],
    [CUE.confused[0], 'lulu'],
  ]);
  const SHOTS: Record<RoomShot, (t: number) => Shot> = {
    wide: t => {
      const c = ease(seg(t, CUE.room, CUE.posts[0]));
      return { cam: [lerp(7, 5.5, c), lerp(7, 6.2, c), lerp(14, 12, c)], look: [-0.5, 3.0, -2.5] };
    },
    chat: () => hackShot(),
    stati: () => ({ cam: [0.7, 3.1, -1.7], look: [0, 2.3, -4.7] }),
    igar: () => close(igar, 3.2, 0.5),
    call: () => callShot,
    door: t => {
      const c = ease(seg(t, CUE.door, CUE.inside));
      return { cam: [3, 4.6, 9], look: [lerp(-8, -6.3, c), 2.8, lerp(0.5, 1.4, c)] };
    },
    ogo: () => close(ogo, 5.5, -0.2),
    lulu: () => close(lulu, 5.0, -0.5),
  };

  return {
    scene: room.scene,
    frame(t) {
      igar.root.visible = true;
      const n = postsAt(t);
      if (n !== posts) {
        posts = n;
        hack.repaint();
      }
      poseStatitezarus(t);
      poseIgarzarus(t);
      poseLulu(t);
      poseOgozaurus(t);
      poseDchozaurus(t);
      film(t);
      return SHOTS[shotAt(t)](t);
    },
    dispose() {
      callTarget.dispose();
      disposeObject(home.scene); // the call's scene isn't a location, so the director doesn't free it
    },
  };
}

import * as THREE from 'three';
import { ease, lerp, seg } from '../../engine/math';
import { cuts, type Location, type Shot } from '../../engine/director';
import { restRig } from '../../characters/rest';
import { ORNITHO_SEAT } from '../../characters/ornithomimus';
import { armOf, reachArm } from '../../characters/reach';
import { createRorit, RORIT_SCALE } from './cast';
import { SEAT, createTraffic } from './car';
import { dashAt, paintDash, type DashView } from './screens';
import { CUE, FROK, LINES, hazardOn, mouthAt } from './timeline';

// The Fesla, in the jam: Rorit at the wheel (Frok drives, mostly), on the phone hands-free. We see her face through
// the glass canopy, from ahead and to her right; the dash screen we see as she does, over the wheel.

/** She faces the way the car goes (+x). */
const FORWARD = Math.PI / 2;
/** Her head, turned to us (-) or to the dash screen (+), radians. */
const TO_US = -0.8;
const TO_SCREEN = 0.6;
/** How far the screen shot stands back from the glass (screen heights): it fills the frame, captions below. */
const POV_BACK = 1.75;
/** Her "FROK, NO!!": the one line we see her yell. */
const NO_FROK = LINES.find(l => l.text === 'FROK, NO!!')!;

/** The tag: Frok's message on the dash this long (seconds), then Rorit's facepalm. */
const FACEPALM_AFTER = 1.4;

/** The car's shot list: the dash whenever Frok or a call is on it, Rorit's face for her lines. */
type CarShot = 'opening' | 'screen' | 'face' | 'close' | 'jam';
const shotAt = cuts<CarShot>([
  [0, 'opening'],
  [CUE.install, 'screen'],
  [CUE.dial, 'face'],
  [CUE.sidewalk[0], 'screen'],
  [CUE.sidewalk[1], 'face'],
  [CUE.waiting, 'screen'], // Amazaurus, on call waiting
  [CUE.waiting + 1, 'face'],
  [CUE.wild[0], 'screen'], // "Tickets? On it!"
  [CUE.flood[0] + 0.3, 'jam'],
  [NO_FROK.from, 'close'],
  [NO_FROK.to, 'screen'],
  [CUE.tag[0], 'screen'],
  [CUE.tag[0] + FACEPALM_AFTER, 'close'],
]);

const v = new THREE.Vector3();

export function createDriveLocation(): Location {
  let view: DashView = { kind: 'map' };
  let painted = '';
  const traffic = createTraffic((ctx, w, h) => paintDash(ctx, w, h, view));
  const { fesla } = traffic;
  const { rig: rorit, ponytail } = createRorit();
  fesla.group.add(rorit.root);
  const feet = rorit.feet.map(f => f.position.clone());

  const grip = (side: -1 | 1, world: THREE.Vector3) => {
    const arm = armOf(rorit, side);
    reachArm(arm, arm.parent!.worldToLocal(world));
  };
  const onHead = (x: number, y: number, z: number) => rorit.head.localToWorld(v.set(x, y, z));

  /** Her paws on the wheel, at ten to two (Frok's driving), with a little bob when she talks. */
  function atTheWheel(t: number) {
    for (const side of [-1, 1] as const) grip(side, fesla.grip(side, v));
    if (LINES.some(l => l.who === 'Rorit' && t >= l.from && t < l.to)) rorit.head.rotation.x += Math.sin(t * 7) * 0.05;
  }
  /** FROK, NO!! Paws to her cheeks, eyes wide, beak open; she bounces with the car. */
  function panic(t: number) {
    for (const e of rorit.eyes) e.scale.set(1.3, 1.3, 1);
    rorit.setMouth(Math.max(0.7, mouthAt('Rorit', t)));
    rorit.head.rotation.y = TO_US * 0.6;
    rorit.root.updateMatrixWorld(true);
    for (const side of [-1, 1] as const) grip(side, onHead(side * 0.32, -0.15, 0.25));
  }
  /** Frok escalated to everyone: her near paw (-1 is on our side) over her eyes, head down. */
  function facepalm() {
    rorit.head.rotation.x = 0.35;
    rorit.head.rotation.y = TO_US * 0.5;
    rorit.root.updateMatrixWorld(true);
    grip(-1, onHead(0.05, 0.12, 0.42));
    grip(1, fesla.grip(1, v));
  }
  const handsAt = cuts<'wheel' | 'panic' | 'facepalm'>([
    [0, 'wheel'],
    [CUE.flood[0], 'panic'],
    [CUE.wild[1], 'wheel'],
    [CUE.tag[0] + FACEPALM_AFTER, 'facepalm'],
  ]);

  function poseRorit(t: number) {
    restRig(rorit, feet, t);
    ponytail.rotation.set(0.1, 0, 0);
    rorit.root.position.set(SEAT.x, SEAT.y - (ORNITHO_SEAT - 0.05) * RORIT_SCALE, SEAT.z);
    rorit.root.rotation.set(0, FORWARD, 0);
    rorit.dangleFeet(t * 2);
    rorit.root.visible = true;
    rorit.head.rotation.y = dashAt(t).kind === 'install' || FROK.some(f => t >= f.from && t < f.to) ? TO_SCREEN : TO_US;
    rorit.setMouth(mouthAt('Rorit', t));
    rorit.root.updateMatrixWorld(true);
    const hands = handsAt(t);
    if (hands === 'panic') panic(t);
    else if (hands === 'facepalm') facepalm();
    else atTheWheel(t);
    rorit.updateLegs(1);
  }

  /** The dash, as she sees it: straight on, close, her own head out of the way. */
  function screenShot(): Shot {
    rorit.root.visible = false;
    fesla.screen.updateMatrixWorld(true);
    const p = fesla.screen.getWorldPosition(new THREE.Vector3());
    const n = new THREE.Vector3(0, 0, 1).transformDirection(fesla.screen.matrixWorld);
    const cam = p.clone().addScaledVector(n, POV_BACK);
    return { cam: [cam.x, cam.y + 0.1, cam.z], look: [p.x, p.y - 0.12, p.z] };
  }
  /** Rorit, through her side window (clear of the window frames), a little ahead of her. */
  function faceShot(close: number): Shot {
    const h = rorit.head.getWorldPosition(v);
    return {
      cam: [h.x + lerp(1.8, 1.1, close), h.y + lerp(0.5, 0.15, close), h.z + lerp(6.0, 3.6, close)],
      look: [h.x, h.y - lerp(0.6, 0.3, close), h.z],
    };
  }

  const SHOTS: Record<CarShot, (t: number) => Shot> = {
    opening(t) {
      const c = ease(seg(t, 0, CUE.install));
      return { cam: [lerp(17, 12, c), lerp(7.5, 5.5, c), lerp(17, 12.5, c)], look: [0, 1.6, 0] };
    },
    screen: () => screenShot(),
    face: () => faceShot(0.75),
    close: () => faceShot(1),
    jam(t) {
      // the whole jam sees it: hazards, horn, the Fesla bouncing on its wheels
      const c = ease(seg(t, CUE.flood[0], NO_FROK.from));
      return { cam: [lerp(13, 11, c), lerp(4.5, 4, c), lerp(11, 9.5, c)], look: [0, 1.8, 0] };
    },
  };

  return {
    scene: traffic.scene,
    frame(t) {
      const wild = t >= CUE.flood[0] && t < CUE.wild[1] ? 1 : 0;
      traffic.drive(t, wild);
      fesla.flash(hazardOn(t));
      view = dashAt(t);
      const key = JSON.stringify(view);
      if (key !== painted) {
        painted = key;
        fesla.repaint();
      }
      fesla.group.updateMatrixWorld(true);
      poseRorit(t);
      return SHOTS[shotAt(t)](t);
    },
  };
}

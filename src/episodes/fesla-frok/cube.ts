import * as THREE from 'three';
import { ease, lerp, seg } from '../../engine/math';
import { cuts, type Location, type Shot } from '../../engine/director';
import { idleLulu, reachLulu } from '../../characters/lulu';
import { armOf, reachArm } from '../../characters/reach';
import { box, mat } from '../../world/interior';
import type { Amazaurus, OfficeLulu } from './cast';
import { AMAZAURUS_SPOT, LULU_AISLE, LULU_AT_CUBE, LULU_DESK, createMug, createOffice } from './office';
import { paintQueue, queueAt } from './screens';
import { CUE, LINES, mouthAt, redAt, speakerAt } from './timeline';

// The office: Lulu at her standing desk, on the phone with Rorit; Amazaurus in his cube, on his headset with her, going
// red; his monitor filling with Frok's tickets; then Lulu, with two mugs of tea.

/** Amazaurus faces us, turned a little toward his monitor (on his cube's left wall); his head to it, all the way. */
const AMAZAURUS_YAW = -0.2;
const TO_MONITOR = -0.9;
/** Turned to Lulu, when she's at his cube. */
const TO_LULU = 0.6;
/** Lulu at the cube: three-quarters to us, her head turned back to him. Walking in along the aisle: facing -x. */
const LULU_YAW = -0.75;
const LULU_TO_HIM = -0.45;
/** He takes the mug once it's halfway across. */
const HALF = 0.5;
/** A walk cycle step (seconds). */
const STEP = 0.36;
/** Lulu's last line, "Let me escalate…": she says it to us, not to him. */
const ESCALATE = LINES.find(l => l.text.startsWith('Let me escalate'))!;
/** Amazaurus's monitor shot: his POV, this far back from the screen (it fills the width, with room for captions). */
const MONITOR_BACK = 4.4;

const v = new THREE.Vector3();

/** Lulu's phone: a pink handset with a dark screen. */
function handset(): THREE.Group {
  const g = new THREE.Group();
  const body = box(0.3, 0.6, 0.06, mat(0xff8fab, 0.4));
  body.position.y = -0.3;
  const glass = box(0.26, 0.54, 0.01, mat(0x15161c, 0.2));
  glass.position.set(0, -0.27, 0.035);
  g.add(body, glass);
  return g;
}

export function createCubeLocation(me: OfficeLulu, amazaurus: Amazaurus): Location {
  let flood = 0;
  const office = createOffice((ctx, w, h) => paintQueue(ctx, w, h, flood));
  const lulu = me.rig;
  const az = amazaurus.rig;
  const phone = handset();
  const mugs = [createMug(0x16121f), createMug(0xffffff)] as const; // hers (METAL black), his
  office.scene.add(lulu.root, az.root, phone, ...mugs);

  /** On the call: he gestures more as it gets worse; at "2 MORE tickets", both fists up, shaking. */
  function onTheCall(t: number) {
    const upset = redAt(t);
    for (const arm of az.arms)
      arm.rotation.set(
        -0.5 - upset * 1.6 + Math.sin(t * 14) * 0.2 * upset,
        0,
        arm.userData.side * (0.35 + upset * 0.4),
      );
    az.head.rotation.y = Math.sin(t * 1.4) * 0.15;
    az.torso.rotation.x = 0.12 * upset; // leaning into it
  }
  /** The flood, on his monitor: he stares at it, then turns to us, eyes wide, and freezes. */
  function swamped(t: number) {
    az.head.rotation.y = t < CUE.swamped[0] + 1.0 ? TO_MONITOR : 0.15;
    for (const e of az.eyes) e.scale.set(1.35, 1.35, 1);
    az.setMouth(0.8);
  }
  const amazaurusAt = cuts<'listening' | 'swamped' | 'withLulu'>([
    [0, 'listening'],
    [CUE.swamped[0], 'swamped'],
    [CUE.cube[0] + 0.6, 'withLulu'],
  ]);

  function poseAmazaurus(t: number) {
    amazaurus.reset(t + 2.1);
    az.root.position.copy(AMAZAURUS_SPOT);
    az.root.rotation.y = AMAZAURUS_YAW;
    az.setMouth(mouthAt('Amazaurus', t));
    amazaurus.fume(redAt(t), t, speakerAt(t) === 'Amazaurus');
    const now = amazaurusAt(t);
    if (now === 'swamped') swamped(t);
    else if (now === 'withLulu') az.head.rotation.y = TO_LULU;
    else if (speakerAt(t) === 'Amazaurus') onTheCall(t);
    az.root.updateMatrixWorld(true);
  }

  /** At her desk, the phone to her ear, three-quarters to us. */
  function atHerDesk() {
    lulu.root.position.copy(LULU_DESK);
    lulu.root.rotation.y = -0.35;
    lulu.head.rotation.y = 0.3;
    lulu.root.updateMatrixWorld(true);
    phone.position.copy(lulu.face.localToWorld(v.set(0.8, 0.12, 0.2))); // out past her hair, at her cheek
    phone.quaternion.copy(lulu.face.getWorldQuaternion(new THREE.Quaternion()));
    phone.rotateY(-Math.PI / 2); // screen to her cheek, the pink back to us
    phone.updateMatrixWorld(true);
    reachLulu(lulu, 1, phone.localToWorld(v.set(0, -0.45, 0)));
  }

  /** She laughs: head back, eyes shut, a giggle in her shoulders. */
  function laugh(t: number) {
    for (const s of lulu.neck) s.rotation.x -= 0.08;
    lulu.head.rotation.x -= 0.25;
    for (const e of lulu.eyes) e.scale.y = 0.12;
    lulu.setMouth(0.5 + Math.abs(Math.sin(t * 16)) * 0.4);
    lulu.root.position.y += Math.abs(Math.sin(t * 16)) * 0.05;
  }

  /** With the tea: along the aisle, then at the cube, turned to us and to him. */
  function withTea(t: number) {
    const k = seg(t, CUE.cube[0], CUE.arrive);
    lulu.root.position.lerpVectors(LULU_AISLE, LULU_AT_CUBE, ease(k));
    const turn = ease(seg(t, CUE.arrive - 0.5, CUE.arrive + 0.3));
    lulu.root.rotation.y = lerp(-Math.PI / 2, LULU_YAW, turn);
    me.walk((t - CUE.cube[0]) / STEP, 1 - seg(t, CUE.arrive - 0.3, CUE.arrive));
    lulu.head.rotation.y = t >= ESCALATE.from && t < ESCALATE.to ? 0.2 : LULU_TO_HIM * turn;
    if (t >= CUE.laugh[0] && t < CUE.laugh[1]) laugh(t);
    lulu.root.updateMatrixWorld(true);
  }

  /** The mugs: one in each of Lulu's paws; at the give, his crosses to his paw, then up to his mouth. */
  function poseMugs(t: number) {
    mugs[0].position.copy(lulu.body.localToWorld(v.set(-0.55, 1.2, 1.05)));
    const given = ease(seg(t, CUE.give, CUE.give + 0.5));
    const sip = ease(seg(t, CUE.sip, CUE.sip + 0.4)) * (1 - ease(seg(t, CUE.sip + 1.2, CUE.sip + 1.6)));
    const his = lulu.body.localToWorld(new THREE.Vector3(0.55, 1.2, 1.05));
    const hisPaw = az.torso.localToWorld(new THREE.Vector3(0.5, 1.3, 1.1));
    const mouth = az.head.localToWorld(new THREE.Vector3(0.1, -0.5, 0.8));
    mugs[1].position.lerpVectors(his, hisPaw, given).lerp(mouth, sip);
    mugs[1].rotation.z = sip * 0.5;
    for (const m of mugs) m.updateMatrixWorld(true);
    const handle = (m: THREE.Object3D) => m.localToWorld(v.set(0.2, 0.18, 0));
    reachLulu(lulu, -1, handle(mugs[0]));
    if (given < 1) reachLulu(lulu, 1, handle(mugs[1]));
    if (given > HALF) {
      const arm = armOf(az, 1);
      reachArm(arm, arm.parent!.worldToLocal(handle(mugs[1])));
    }
  }

  function poseLulu(t: number) {
    me.reset();
    idleLulu(lulu, t, { eyesOpen: 0.95 });
    lulu.setMouth(mouthAt('Lulu', t));
    const tea = t >= CUE.cube[0];
    phone.visible = !tea;
    for (const m of mugs) m.visible = tea;
    if (!tea) return atHerDesk();
    withTea(t);
    poseMugs(t);
  }

  function monitorShot(): Shot {
    az.root.visible = false;
    office.monitor.updateMatrixWorld(true);
    const p = office.monitor.getWorldPosition(new THREE.Vector3());
    const n = new THREE.Vector3(0, 0, 1).transformDirection(office.monitor.matrixWorld);
    const cam = p.clone().addScaledVector(n, MONITOR_BACK);
    return { cam: [cam.x, cam.y + 0.2, cam.z], look: [p.x, p.y - 0.15, p.z] };
  }
  const faceOf = (head: THREE.Object3D) => head.getWorldPosition(new THREE.Vector3());

  function shot(t: number): Shot {
    if (t < CUE.amaz[0]) {
      const f = faceOf(lulu.face);
      return { cam: [f.x + 2.6, f.y + 0.1, f.z + 5.6], look: [f.x, f.y - 0.5, f.z] };
    }
    if (t < CUE.amaz[1]) {
      // Amazaurus on his headset: wide, then closer as it gets worse
      const c = ease(seg(t, CUE.red[0], CUE.red[1] - 1.5));
      const f = faceOf(az.head);
      return {
        cam: [lerp(2.2, f.x + 1.2, c), lerp(3.4, f.y + 0.3, c), lerp(8.5, f.z + 3.2, c)],
        look: [lerp(0.2, f.x, c), lerp(1.9, f.y - 0.3, c), lerp(-0.6, f.z, c)],
      };
    }
    if (t < CUE.swamped[0] + 1.0) return monitorShot();
    if (t < CUE.cube[0]) {
      const f = faceOf(az.head);
      return { cam: [f.x + 0.9, f.y + 0.3, f.z + 2.9], look: [f.x, f.y - 0.1, f.z] };
    }
    if (t < CUE.arrive) {
      const c = ease(seg(t, CUE.cube[0], CUE.arrive));
      return { cam: [lerp(0.5, -0.5, c), 5.0, lerp(14, 12.5, c)], look: [lerp(3.5, 1.6, c), 2.9, 0.3] };
    }
    if (t >= ESCALATE.from && t < ESCALATE.to + 0.4) {
      const f = faceOf(lulu.face);
      return { cam: [f.x - 1.6, f.y + 0.1, f.z + 5.0], look: [f.x - 0.2, f.y - 0.6, f.z] };
    }
    // the two of them, from front left
    return { cam: [-1.6, 3.9, 9.6], look: [1.3, 2.5, 0.2] };
  }

  return {
    scene: office.scene,
    frame(t) {
      const next = queueAt(t);
      if (next !== flood) {
        flood = next;
        office.repaintMonitor();
      }
      az.root.visible = true;
      poseAmazaurus(t);
      poseLulu(t);
      return shot(t);
    },
  };
}

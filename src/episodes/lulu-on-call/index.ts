import * as THREE from 'three';
import { seg, ease, lerp, clamp01 } from '../../engine/math';
import type { Episode } from '../../engine/types';
import { direct, overShoulder, type Shot } from '../../engine/director';
import { createLulu, idleLulu } from '../../characters/lulu';
import { armOf, reachArm, releaseArm } from '../../characters/reach';
import { addPonytail } from '../../props/ponytail';
import { addFlannel } from '../../props/flannel';
import { recentHit } from '../../band/timing';
import {
  CUE,
  DURATION,
  PACE,
  SCENES,
  WALK_END,
  scenePulse,
  playedCaptions,
  sceneAt,
  scriptTime,
  type SceneSpan,
} from './timeline';
import { linesAt, keystrokes } from '../../world/screen-script';
import { OFFICE_SCRIPT, NIGHT_SCRIPT } from './terminal';
import { CAPTIONS } from './captions';
import { atPace } from '../../engine/subtitles';
import { soundtrack, STEPS, GULPS } from './music';
import { createOffice, DESK_SPOT } from './sets/office';
import { createTown } from './sets/town';
import { createHome, SHAKE_SPOT, MAT_SPOT } from '../../world/lulu-home';
import { SHAKER_GRIP, SHAKER_LENGTH, SHAKER_SCALE } from '../../props/shaker';
import { createBedroom, BED_TOP } from '../../world/bedroom';

// Beat sheet (see timeline.ts for the exact cues and captions.ts for the story text)
//   0–16   office: types the task to the coding agent with her drumsticks, drums on the desk, logs off at 6
//   16–32  walks 20 km home through a tiny town in 30 min (time-lapse sunset), one stomp per beat
//   32–42  protein shake: shake it, chug it (long neck all the way down), flex
//   42–54  pilates: neck stretches, then "the hundred"
//   54–76  3 AM: asleep, the pager goes off, panics, hotfixes prod with the agent, git blame: herself

const OFFICE_KEYS = keystrokes(OFFICE_SCRIPT);
const NIGHT_KEYS = keystrokes(NIGHT_SCRIPT);
const scene = (id: SceneSpan['id']) => SCENES.find(s => s.id === id)!;
const WALK = scene('walk');
const WALK_BEAT = 60 / WALK.bpm;
const WALK_SPEED = 6; // units per second: giant strides
const ARRIVE = WALK_SPEED * (CUE.walkStop - CUE.walkStart);

/** Index of the latest time ≤ t (or -1). */
function lastIndex(times: readonly number[], t: number): number {
  let i = -1;
  while (i + 1 < times.length && times[i + 1]! <= t) i++;
  return i;
}

/** Eighth-note hits of a scene's tempo (for air drumming). */
const eighths = (s: SceneSpan, from: number, to: number) => {
  const step = 30 / s.bpm;
  const out: number[] = [];
  for (let t = s.from; t < to; t += step) if (t >= from) out.push(t);
  return out;
};

const episode: Episode = {
  id: 'lulu-on-call',
  title: 'Lulu On Call 📟',
  duration: DURATION,
  captions: atPace(playedCaptions(CAPTIONS), PACE),

  setup(stage) {
    const office = createOffice();
    const town = createTown();
    const home = createHome();
    const bedroom = createBedroom();
    const scenes = {
      office: office.scene,
      walk: town.scene,
      gains: home.scene,
      pilates: home.scene,
      night: bedroom.scene,
    };

    const lulu = createLulu();
    const hair = addPonytail(lulu);
    // her office look (off the clock she changes): the shirt on her body plus a sleeve on each arm
    const armParts = lulu.arms.map(a => a.children.length);
    const flannel = [addFlannel(lulu), ...lulu.arms.flatMap((a, i) => a.children.slice(armParts[i]))];
    const OFFICE = scene('office'),
      GAINS = scene('gains'),
      PILATES = scene('pilates');
    const deskHits = eighths(OFFICE, CUE.airDrum, CUE.logOff);
    const v = new THREE.Vector3(),
      n = new THREE.Vector3();
    const tmp = new THREE.Vector3();

    function resetLulu() {
      lulu.root.position.set(0, 0, 0);
      lulu.root.rotation.set(0, 0, 0);
      lulu.squash.rotation.set(0, 0, 0);
      lulu.squash.scale.set(1, 1, 1);
      lulu.squash.position.set(0, 0, 0);
      lulu.head.rotation.set(0, 0, 0);
      lulu.tail.rotation.set(0, 0, 0);
      for (const a of lulu.arms) {
        releaseArm(a); // undo last frame's reaching
        a.rotation.set(-0.3, 0, a.userData.side * 0.15);
      }
      for (const f of lulu.feet) f.position.y = 0;
      for (const c of lulu.cheeks) c.scale.set(1, 0.7, 0.35);
      for (const e of lulu.eyes) e.scale.set(1, 1, 1);
      for (const s of lulu.sticks) s.visible = false;
      lulu.setMouth(0);
      hair.ponytail.rotation.set(0.1, 0, 0);
    }

    /** Eyes: open amount (blinks are added by idleLulu), and how wide (surprise). */
    function eyes(wide = 1) {
      for (const e of lulu.eyes) {
        e.scale.x = wide;
        e.scale.z = wide;
        e.scale.y *= wide;
      }
    }

    /** Walk cycle at `phase` (1 = one step), scaled by `amount`. */
    function walkCycle(phase: number, amount: number) {
      const p = Math.PI * phase;
      lulu.root.position.y += Math.abs(Math.sin(p)) * 0.18 * amount;
      for (const f of lulu.feet)
        f.position.y = Math.max(0, Math.sin(p + (f.userData.side > 0 ? 0 : Math.PI))) * 0.4 * amount;
      lulu.squash.rotation.z = Math.sin(p) * 0.06 * amount;
      lulu.tail.rotation.y = Math.sin(p) * 0.35 * amount;
      for (const a of lulu.arms) a.rotation.x = -0.3 + Math.sin(p + (a.userData.side > 0 ? Math.PI : 0)) * 0.5 * amount;
      hair.ponytail.rotation.x = 0.1 + Math.abs(Math.sin(p - 0.5)) * 0.35 * amount;
      hair.ponytail.rotation.z = Math.sin(p - 0.5) * 0.25 * amount;
    }

    /** Drumstick taps: the arm whose turn it is comes down on each hit. */
    function stickTaps(t: number, hits: readonly number[], up: number, down: number) {
      const i = lastIndex(hits, t);
      for (const s of lulu.sticks) s.visible = true;
      lulu.arms.forEach((a, k) => {
        const mine = i >= 0 && i % 2 === k;
        const hit = mine ? Math.exp(-(t - hits[i]!) * 18) : 0;
        a.rotation.set(lerp(up, down, hit), 0, a.userData.side * 0.12);
      });
    }

    /** Reaches a paw out to a world point, elbow bent outward (the arms stretch, so anything is in reach). */
    function gripAt(side: -1 | 1, world: THREE.Vector3) {
      const pivot = armOf(lulu, side);
      const target = lulu.body.worldToLocal(tmp.copy(world));
      const elbow = pivot.position.clone().lerp(target, 0.5);
      elbow.x += side * 0.3;
      elbow.y -= 0.15;
      reachArm(pivot, target, elbow);
    }

    function officeScene(t: number): Shot {
      const beat = scenePulse(t, OFFICE);
      lulu.root.position.copy(DESK_SPOT);
      const working = t >= CUE.typeFrom && t < CUE.logOff;
      idleLulu(lulu, t, {
        eyesOpen: t >= CUE.airDrum && t < CUE.logOff ? 0.3 : 0.8,
        nod: beat * (t >= CUE.airDrum ? 0.25 : 0.06),
      });
      lulu.head.rotation.y = t < 3 ? 0.15 : working ? 0.55 : 0.2; // glancing at the monitor
      for (const s of lulu.sticks) s.visible = true;
      if (t < CUE.airDrum) stickTaps(t, OFFICE_KEYS, -0.85, -0.5);
      else if (t < CUE.logOff) {
        stickTaps(t, deskHits, -1.5, -0.55);
        lulu.setMouth(0.4 * beat);
        hair.ponytail.rotation.x = 0.1 + beat * 0.3;
      } else {
        // stand up, wave bye, walk off to the right
        const out = seg(t, CUE.logOff + 1.2, OFFICE.to);
        lulu.root.position.x += out * 7;
        lulu.root.rotation.y = lerp(0, Math.PI / 2, ease(seg(t, CUE.logOff + 1, CUE.logOff + 1.4)));
        const wave = lulu.arms.find(a => a.userData.side > 0)!;
        if (t < CUE.logOff + 1.2) {
          wave.rotation.set(-0.4, 0, 2.4 + Math.sin(t * 16) * 0.3);
          lulu.setMouth(0.5);
        } else walkCycle((t - CUE.logOff) / 0.35, 1);
      }

      const minutes = 58 + seg(t, 0, OFFICE.to) * 2.5;
      office.clock.set(minutes >= 60 ? 6 : 5, minutes % 60);
      office.screen.show(linesAt(OFFICE_SCRIPT, t), Math.floor(t * 2.5) % 2 === 0);

      if (t < 3) return { cam: [0, 4.6, 12], look: [0.3, 3.4, 0] };
      if (t < CUE.typeFrom) return { cam: [-1.4, 4.7, 8], look: [0.3, 3.8, 0.6] };
      if (t < 8.6) return { cam: [1.6, 3.4, 6.2], look: [0, 2.4, 1.2] }; // the sticks on the keys
      if ((t >= 8.6 && t < CUE.airDrum + 0.2) || (t >= 12.4 && t < CUE.logOff)) {
        office.monitor.getWorldPosition(v);
        office.monitor.getWorldDirection(n);
        return overShoulder(v, n, 4.2, 1.0, -0.75);
      }
      if (t < CUE.logOff) return { cam: [0.6, 4.4, 9.5], look: [0.4, 3.1, 0.6] };
      return { cam: [0.5, 4.6, 12.5], look: [1.5, 3.2, 0] };
    }

    function walkScene(t: number): Shot {
      const travel =
        WALK_SPEED * (clamp01((t - CUE.walkStart) / (CUE.walkStop - CUE.walkStart)) * (CUE.walkStop - CUE.walkStart));
      town.update(t, travel, ARRIVE, seg(t, WALK.from, WALK_END));
      lulu.root.position.set(-0.6, 0, 0);
      idleLulu(lulu, t, { eyesOpen: 0.85 });
      const walking = t >= CUE.walkStart && t < CUE.walkStop;
      if (walking) {
        walkCycle((t - CUE.walkStart) / WALK_BEAT, 1);
        const stomp = recentHit(t, STEPS, 10);
        lulu.squash.scale.set(1 + stomp * 0.04, 1 - stomp * 0.06, 1 + stomp * 0.04);
        lulu.setMouth(t >= CUE.walkShots[1] && t < CUE.walkShots[2] ? 0.35 : 0); // singing along to Walk
      }
      if (t >= CUE.walkStop) {
        lulu.root.rotation.y = lerp(0, -Math.PI / 2, ease(seg(t, CUE.walkStop + 0.2, CUE.walkStop + 0.9)));
        lulu.setMouth(0.4);
      }

      const [close, low, wide] = CUE.walkShots;
      if (t < close) return { cam: [7, 9.5, 15], look: [0, 1.5, -6] };
      if (t < low) return { cam: [4.2, 5.6, 9.5], look: [-0.4, 2.8, 0] };
      if (t < wide) return { cam: [-1.1, 1.3, 8.5], look: [-0.6, 3.6, 0] }; // low angle: she's huge
      return { cam: [3.2, 5.2, 11.5], look: [-2.6, 3, -1] };
    }

    // The shake bottle is held in both paws: upright in front of her belly while she shakes it, then lifted to her
    // mouth and tipped back to drink, like anyone would (her neck stays up; her tiny arms stretch to keep their grip).
    const UP = THREE.Object3D.DEFAULT_UP;
    const HOLD = new THREE.Vector3(0, 1.55, 1.25); // grip point, in body space
    const DRINK_DIR = new THREE.Vector3(0, 0.78, 0.62).normalize(); // from her mouth to the bottle's base: up and out
    const DRINK_AXIS = DRINK_DIR.clone().negate(); // base → spout: the bottle is upside down
    const DRINK_NOD = 0.3; // her neck dips only a little
    const DRINK_TILT = 0.5; // her head tips back
    const GRIP_AT = SHAKER_GRIP / SHAKER_SCALE; // grip height and distance from the axis, in bottle units
    const GRIP_OUT = 0.27;
    const mouth = new THREE.Vector3();
    const grip = new THREE.Vector3();
    const axis = new THREE.Vector3();
    const qBottle = new THREE.Quaternion();
    const qDrink = new THREE.Quaternion();
    const qSpin = new THREE.Quaternion();
    const qWobble = new THREE.Quaternion();
    const qBody = new THREE.Quaternion();
    const Z = new THREE.Vector3(0, 0, 1);

    function gainsScene(t: number): Shot {
      const beat = scenePulse(t, GAINS);
      lulu.root.position.copy(SHAKE_SPOT);
      lulu.root.rotation.y = 0.2;
      const drinking = t >= CUE.drink && t < CUE.flex;
      // 0 → 1 as she lifts the bottle to her mouth and tips it back, and back to 0 as she lowers it
      const k = drinking ? ease(seg(t, CUE.drink, CUE.drink + 0.7)) * (1 - ease(seg(t, CUE.flex - 0.5, CUE.flex))) : 0;
      const gulp = drinking ? recentHit(t, GULPS, 6) : 0;
      const tilt = DRINK_TILT + gulp * 0.12;
      const eyesOpen = drinking ? 0.15 : 0.85;

      if (k > 0) {
        // where her mouth is when she drinks: the bottle's spout goes there
        idleLulu(lulu, t, { eyesOpen, nod: DRINK_NOD });
        lulu.head.rotation.x -= tilt;
        lulu.root.updateMatrixWorld(true);
        mouth.set(0, -0.23, 0.72);
        lulu.body.worldToLocal(lulu.face.localToWorld(mouth));
      }
      idleLulu(lulu, t, { eyesOpen, nod: k * DRINK_NOD + (drinking ? 0 : beat * 0.05) });
      lulu.head.rotation.x -= k * tilt;
      lulu.root.updateMatrixWorld(true);

      const bottle = home.shaker;
      const holding = t >= CUE.grab && t < CUE.flex;
      if (!holding) {
        bottle.position.copy(home.counterTop);
        bottle.quaternion.identity();
        // flex those tiny arms
        if (t >= CUE.flex) {
          for (const a of lulu.arms) a.rotation.set(-0.2, 0, a.userData.side * (2.2 + beat * 0.25));
          lulu.setMouth(0.7);
          lulu.root.position.y += beat * 0.12;
        }
      } else {
        const shake = t >= CUE.shake && t < CUE.drink ? Math.sin(((t - CUE.shake) / 0.3) * Math.PI * 2) : 0;
        // the grip point and tilt, blended from "held upright at her belly" to "spout in her mouth, base up"
        grip.copy(HOLD);
        qBottle.identity();
        if (k > 0) {
          grip.lerp(mouth.clone().addScaledVector(DRINK_DIR, SHAKER_LENGTH - SHAKER_GRIP), k);
          qBottle.slerp(qDrink.setFromUnitVectors(UP, DRINK_AXIS), k);
        }
        grip.y += shake * 0.2;
        axis.set(0, 1, 0).applyQuaternion(qBottle);
        const base = grip.clone().addScaledVector(axis, -SHAKER_GRIP);
        // the label turns to the side as she tips it, so it shows from where the camera is
        const spin = k * (Math.PI / 2);
        lulu.body.getWorldQuaternion(qBody);
        bottle.quaternion
          .copy(qBody)
          .multiply(qBottle)
          .multiply(qSpin.setFromAxisAngle(UP, spin))
          .multiply(qWobble.setFromAxisAngle(Z, shake * 0.12));
        lulu.body.localToWorld(base);

        // reeled in from the counter, then held
        const pull = ease(seg(t, CUE.grab, CUE.grab + 0.6));
        if (pull < 1) {
          bottle.position.lerpVectors(home.counterTop, base, pull);
          bottle.quaternion.slerp(qBody.identity(), 1 - pull);
        } else bottle.position.copy(base);

        bottle.updateMatrixWorld(true);
        // paws on the left and right of the bottle (in bottle space, turned back by the label's spin)
        for (const side of [-1, 1] as const)
          gripAt(
            side,
            bottle.localToWorld(
              new THREE.Vector3(side * GRIP_OUT * Math.cos(spin), GRIP_AT, side * GRIP_OUT * Math.sin(spin)),
            ),
          );

        lulu.setMouth(k > 0 ? 0.22 * k : t >= CUE.shake ? 0.3 : 0);
        hair.ponytail.rotation.x = 0.1 + Math.abs(shake) * 0.15;
        for (const c of lulu.cheeks) c.scale.set(1 + gulp * 0.4, 0.7 + gulp * 0.3, 0.35 + gulp * 0.2);
        lulu.squash.scale.y = 1 + gulp * 0.03;
      }

      if (t < 34.4) return { cam: [0, 4.6, 12.5], look: [-1, 3, 0] };
      if (t < CUE.drink) return { cam: [0.2, 3.6, 7.2], look: [-1.5, 2.6, 0.5] };
      if (t < CUE.flex)
        return {
          cam: [SHAKE_SPOT.x + 8.6, 4.4, SHAKE_SPOT.z + 4.2],
          look: [SHAKE_SPOT.x + 0.1, 3.3, SHAKE_SPOT.z + 1.0],
        }; // from her side: the bottle reaches up to her mouth
      return { cam: [-1.4, 3.8, 8.5], look: [-1.5, 3, 0.4] };
    }

    function pilatesScene(t: number): Shot {
      const beat = 60 / PILATES.bpm;
      lulu.root.position.copy(MAT_SPOT);
      home.shaker.position.copy(home.counterTop);
      home.shaker.rotation.set(0, 0, 0);
      home.shaker.quaternion.identity();
      const lie = ease(seg(t, CUE.hundred, CUE.hundred + 0.9));
      const collapse = ease(seg(t, 53.1, 53.5));
      idleLulu(lulu, t, {
        eyesOpen: t < CUE.hundred ? 0.08 : t < 53.1 ? 0.55 : 0.08,
        nod: lie * 0.8 * (1 - collapse),
      });
      if (t >= CUE.stretch && t < CUE.hundred) {
        // slow side bends, two beats each way; arms out like a T
        const k = Math.sin((Math.PI * (t - CUE.stretch)) / (2 * beat)) * ease(seg(t, CUE.stretch, CUE.stretch + 0.6));
        lulu.neck.forEach(s => (s.rotation.z += k * 0.24));
        lulu.head.rotation.z = -k * 0.5;
        for (const a of lulu.arms) a.rotation.set(-0.1, 0, a.userData.side * 1.35);
        hair.ponytail.rotation.z = -k * 0.4;
      }
      if (t >= CUE.hundred) {
        lulu.squash.rotation.x = -lie * (1.15 + collapse * 0.3); // roll back onto the mat, feet up
        lulu.root.position.y += lie * 0.75;
        const pump = Math.sin((t - CUE.hundred) * Math.PI * 2 * (PILATES.bpm / 60) * 2) * (1 - collapse);
        for (const a of lulu.arms) a.rotation.set(-0.15 + pump * 0.35, 0, a.userData.side * (0.35 + collapse * 0.8));
        lulu.squash.position.y = Math.sin(t * 40) * 0.01 * lie * (1 - collapse); // effort tremble
        lulu.setMouth(collapse > 0 ? 0.9 : 0.15 + Math.abs(pump) * 0.2);
        for (const f of lulu.feet) f.position.y = Math.sin(t * 3 + f.userData.side) * 0.05 * (1 - collapse);
      }

      if (t < CUE.stretch) return { cam: [MAT_SPOT.x, 4.2, 11.5], look: [MAT_SPOT.x - 0.6, 2.6, 0] };
      if (t < CUE.hundred) return { cam: [MAT_SPOT.x, 4.2, 7.8], look: [MAT_SPOT.x, 3.5, 0.6] };
      return { cam: [MAT_SPOT.x + 5.5, 3.3, 6.5], look: [MAT_SPOT.x, 1.7, 0.2] };
    }

    function nightScene(t: number): Shot {
      const b = bedroom;
      const paged = t >= CUE.page;
      const jolt = ease(seg(t, CUE.page + 0.35, CUE.page + 0.75));
      const flop = ease(seg(t, 74.6, 75.3));
      const lying = Math.max(1 - jolt, flop);
      const typing = t >= CUE.laptop && t < 70.5;

      idleLulu(lulu, t * (paged && t < 70.5 ? 1.8 : 0.6), {
        eyesOpen: lying > 0.5 ? 0.08 : t > 70.5 ? 0.45 : 1,
        nod: typing ? 0.35 : 0,
      });
      // asleep on her side, neck down the pillow → sitting bolt upright
      const sit = new THREE.Vector3(0.6, BED_TOP - 0.05, -0.3),
        sleep = new THREE.Vector3(1.75, BED_TOP + 0.85, -0.5);
      lulu.root.position.lerpVectors(sit, sleep, lying);
      lulu.root.position.y += Math.sin(Math.PI * seg(t, CUE.page + 0.35, CUE.page + 0.9)) * 1.1; // the jump
      lulu.root.rotation.z = lying * 1.45;
      lulu.neck.forEach(s => (s.rotation.z += lying * 0.12));
      lulu.head.rotation.z = -lying * 0.7;

      if (paged && t < CUE.laptop) {
        // PANIC: eyes huge, head darting, arms flailing
        const panic = jolt;
        eyes(1 + panic * 0.35);
        lulu.setMouth(panic);
        lulu.head.rotation.y = Math.sin(t * 9) * 0.5 * panic;
        for (const a of lulu.arms)
          a.rotation.set(
            -1.4 + Math.sin(t * 22 + a.userData.side) * 0.5,
            0,
            a.userData.side * (0.8 + Math.sin(t * 17) * 0.4),
          );
        hair.ponytail.rotation.x = 0.1 + Math.abs(Math.sin(t * 9)) * 0.5 * panic;
      }
      if (typing) {
        eyes(1.15);
        lulu.head.rotation.y = 0.5;
        stickTaps(t, NIGHT_KEYS, -0.95, -0.45);
        lulu.setMouth(t >= 67.2 && t < 69.7 ? 0.25 : 0); // reading along
        lulu.root.position.y += Math.sin(t * 30) * 0.008;
      }
      if (t >= 70.5 && t < 74.6) {
        lulu.squash.rotation.x = -0.12 * ease(seg(t, 70.5, 71.2)); // phew
        if (t >= CUE.blame) {
          lulu.head.rotation.y = lerp(0.5, 0, ease(seg(t, CUE.blame, CUE.blame + 0.4))); // slowly turns to camera
          lulu.setMouth(0.25);
        } else lulu.head.rotation.y = 0.5;
      }

      // blanket: over her while asleep, flung off when she jumps, back on when she flops
      lulu.root.updateMatrixWorld(true);
      lulu.body.localToWorld(v.set(0, 1.0, 0));
      const off = Math.min(1, jolt * (1 - flop));
      b.blanket.position.set(v.x + off * 2.8, lerp(v.y, 0.5, off), v.z + 0.15 + off * 1.5);
      b.blanket.scale.set(1.45, lerp(0.8, 0.3, off), 1.25);
      b.blanket.rotation.z = off * 0.8;

      // Zzz
      lulu.face.localToWorld(tmp.set(0, 0.4, 0));
      b.zzz.forEach((z, i) => {
        const p = (((t * 0.6 + i / 3) % 1) + 1) % 1;
        z.position.set(tmp.x + 0.3 + p * 0.8, tmp.y + 0.3 + p * 1.5, tmp.z + 0.3);
        z.scale.setScalar(0.25 + p * 0.35);
        z.material.opacity = lying > 0.5 && !paged ? Math.sin(p * Math.PI) : 0;
      });

      // clock, pager, alarm light
      b.clock.set(t < 63 ? '3:07' : '3:08');
      b.pagerScreen.set(paged ? 'SEV-1\nPROD DOWN' : '');
      const blink = paged && Math.floor((t - CUE.page) * 4) % 2 === 0;
      b.led.material.color.set(blink ? 0xff2020 : 0x330000);
      const buzzing = paged && t < CUE.laptop;
      b.pager.position.set(-3.75 + (buzzing ? Math.sin(t * 90) * 0.025 : 0), 1.3, 0.45);
      b.pager.rotation.y = 0.4 + (buzzing ? Math.sin(t * 70) * 0.08 : 0);
      b.alarm.intensity = paged && t < 70.5 ? (blink ? 7 : 2) : 0;

      // laptop: appears on the bed and opens when she grabs it
      b.laptop.visible = t >= CUE.laptop - 0.4;
      b.laptop.position.set(2.1, BED_TOP, 1.1);
      b.laptop.rotation.y = Math.atan2(0.6 - 2.1, -0.3 - 1.1); // screen faces Lulu
      b.lid.rotation.x = -1.85 * ease(seg(t, CUE.laptop, CUE.laptop + 0.4));
      b.screen.show(linesAt(NIGHT_SCRIPT, t), Math.floor(t * 2.5) % 2 === 0);
      b.screen.mesh.getWorldPosition(v);
      b.screen.mesh.getWorldDirection(n);
      b.laptopGlow.position.copy(v).addScaledVector(n, 0.8);
      b.laptopGlow.intensity = t >= CUE.laptop && t < 74.6 ? 6 : 0;

      if (t < 56.4) return { cam: [0.4, 4.4, 11.5], look: [-0.6, 2, -0.5] };
      if (t < CUE.page) return { cam: [-1.6, 3.3, 5.6], look: [-2.8, 1.9, 0] };
      if (t < CUE.page + 0.35) {
        b.pager.getWorldPosition(tmp);
        return { cam: [tmp.x + 0.5, tmp.y + 1.3, tmp.z + 1.4], look: [tmp.x, tmp.y + 0.1, tmp.z] };
      }
      if (t < CUE.laptop) return { cam: [0.4, 4.6, 9], look: [0.5, 3.4, 0] };
      if (t < 66.5) return { cam: [3.2, 4.4, 7.8], look: [1, 2.9, 0.2] };
      if (t < 70.5) return overShoulder(v, n, 2.5, 0.8, 0.6);
      if (t < CUE.blame) return { cam: [0.6, 4.5, 9], look: [0.6, 3.4, 0] };
      if (t < 74.6) {
        const push = ease(seg(t, CUE.blame, 74.6));
        return { cam: [0.6, 4.3, lerp(7.5, 6.2, push)], look: [0.6, 3.9, 0] };
      }
      return { cam: [0.4, 4.4, 11.5], look: [-0.6, 2, -0.5] }; // back to the opening shot: asleep again
    }

    const cast = [lulu.root];
    const director = direct(
      stage,
      {
        office: { scene: scenes.office, cast, frame: officeScene },
        walk: { scene: scenes.walk, cast, frame: walkScene },
        gains: { scene: scenes.gains, cast, frame: gainsScene },
        pilates: { scene: scenes.pilates, cast, frame: pilatesScene },
        night: { scene: scenes.night, cast, frame: nightScene },
      },
      t => sceneAt(t).id,
    );

    return {
      update(videoTime) {
        const t = scriptTime(videoTime / PACE); // script time (the walk is shortened)
        resetLulu();
        for (const part of flannel) part.visible = sceneAt(t).id === 'office';
        director.update(t);
      },
      dispose: director.dispose,
    };
  },

  audio(bus, t0) {
    soundtrack(bus, t0);
  },
};

export default episode;

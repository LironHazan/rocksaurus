import * as THREE from 'three';
import { ease, lerp, seg } from '../../engine/math';
import { cuts } from '../../engine/director';
import { createLulu, idleLulu, reachLulu, resetLulu, walkLulu } from '../../characters/lulu';
import { createRorit, createSilvi, createYashinozarus } from '../../characters/coworkers';
import { createOmli } from '../../characters/omli';
import { restRig } from '../../characters/rest';
import { armOf, reachArm } from '../../characters/reach';
import type { CharacterRig } from '../../characters/types';
import { addPonytail } from '../../props/ponytail';
import { addFlannel } from '../../props/flannel';
import { recentHit } from '../../band/timing';
import { keystrokes } from '../../world/screen-script';
import { DESK_SPOT } from '../../world/lulu-office';
import { KEYBOARD } from './sets';
import { LULU_SCRIPT, YASHI_SCRIPT } from './terminal';
import { ASKERS, CUE, LINES, mouthAt } from './timeline';

// Who does what, as a function of t: Lulu at her desk, the askers walking up and away, Yashinozarus at his.

/** Where the askers come in from (the hallway: front right, past the open side of the room, never through a wall),
 * and where they stop by her desk. */
const ENTRY = new THREE.Vector3(5.6, 0, 10);
const BY_DESK = new THREE.Vector3(3.4, 0, 0.7);
/** A walking step (seconds), its bob and how high a foot lifts. */
const STEP = 0.42;
const BOB = 0.12;
const LIFT = 0.3;
/** At his desk: where she walks in from (the open front of his corner) and where she stands, beside him, and his
 * monitor, which she looks at. */
const CORNER_ENTRY = new THREE.Vector3(4.8, 0, 9.5);
const BESIDE_HIM = new THREE.Vector3(2.1, 0, 0.2);
const HIS_MONITOR = new THREE.Vector3(-1.55, 2.35, 1.75);
/** Her walk over: a step (seconds) and how big. */
const LULU_STEP = 0.5;
const LULU_STRIDE = 0.8;
/** Lulu's head turned to whoever's at her desk (radians), and to her monitor. */
const TO_ASKER = 0.7;
const TO_MONITOR = 0.5;
/** Her drumstick typing: raised, and down on a key. */
const STICK = { up: -0.85, down: -0.5 } as const;
/** How wide her eyes go at the ping, and how far her head goes down onto the desk at the end. */
const SHOCK = 1.35;
const FACE_PLANT = 1.5;

/** Her moods: how open her eyes are, how wide (the shock), and her mouth at rest. */
const MOODS = {
  plain: { eyes: 0.85, wide: 1, mouth: 0 },
  focused: { eyes: 0.35, wide: 1, mouth: 0 }, // in the zone
  shocked: { eyes: 0.85, wide: SHOCK, mouth: 0.7 }, // the ping
  smug: { eyes: 0.45, wide: 1, mouth: 0.15 }, // already on the latest 😎
} as const;
const moodAt = cuts<keyof typeof MOODS>([
  [0, 'plain'],
  [CUE.focus[0], 'focused'],
  [CUE.ping + 0.4, 'shocked'],
  [CUE.walkOver[0], 'plain'],
  [LINES[7]!.from, 'smug'],
  [CUE.back, 'plain'],
]);

const at = (who: string, t: number) => LINES.find(l => l.who === who && t >= l.from && t < l.to);

/** Lulu, typing with her drumsticks, turning to whoever asks; the sign, the shock, the smugness, the face plant. */
export function createLuluAtDesk() {
  const lulu = createLulu();
  const hair = addPonytail(lulu);
  addFlannel(lulu);
  const keys = keystrokes(LULU_SCRIPT);
  const v = new THREE.Vector3();

  function typing(t: number) {
    for (const s of lulu.sticks) s.visible = true;
    const i = keys.findLastIndex(k => k <= t);
    lulu.arms.forEach((a, k) => {
      const hit = i >= 0 && i % 2 === k ? recentHit(t, [keys[i]!], 18) : 0;
      a.rotation.set(lerp(STICK.up, STICK.down, hit), 0, a.userData.side * 0.12);
    });
  }

  /** Her face, by the beat she's in. */
  function face(t: number) {
    const mood = MOODS[moodAt(t)];
    const down = ease(seg(t, CUE.facePlant, CUE.facePlant + 0.6));
    idleLulu(lulu, t, { eyesOpen: mood.eyes, nod: down * FACE_PLANT });
    for (const e of lulu.eyes) e.scale.set(mood.wide, e.scale.y * mood.wide, mood.wide);
    lulu.setMouth(Math.max(mouthAt('Lulu', t), mood.mouth));
  }

  /** At his desk: walking over from the front of his corner, then beside him, looking at his screen. */
  function visiting(t: number) {
    const k = ease(seg(t, CUE.walkOver[0], CUE.walkOver[1]));
    lulu.root.position.lerpVectors(CORNER_ENTRY, BESIDE_HIM, k);
    const to = k < 1 ? BESIDE_HIM : HIS_MONITOR;
    lulu.root.rotation.y = Math.atan2(to.x - lulu.root.position.x, to.z - lulu.root.position.z);
    walkLulu(lulu, (t - CUE.walkOver[0]) / LULU_STEP, k > 0 && k < 1 ? LULU_STRIDE : 0, hair.ponytail);
  }

  return {
    rig: lulu,
    update(t: number, sign: THREE.Object3D, asking: boolean) {
      resetLulu(lulu);
      hair.ponytail.rotation.set(0.1, 0, 0);
      face(t);
      if (t >= CUE.walkOver[0] && t < CUE.back) {
        visiting(t);
        return;
      }
      lulu.root.position.copy(DESK_SPOT);
      lulu.head.rotation.y = asking ? TO_ASKER : TO_MONITOR;
      typing(t);
      // the third time, she just points at the sign
      if (at('Lulu', t) === LINES[5]) {
        lulu.root.updateMatrixWorld(true);
        reachLulu(lulu, 1, sign.getWorldPosition(v));
      }
    },
  };
}

/** Walking from `from` to `to` over [t0, t1]: the bob and the steps, facing the way they walk. */
function walk(rig: CharacterRig, from: THREE.Vector3, to: THREE.Vector3, t0: number, t1: number, t: number) {
  const k = ease(seg(t, t0, t1));
  rig.root.position.lerpVectors(from, to, k);
  if (k <= 0 || k >= 1) return;
  rig.root.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
  const p = (Math.PI * (t - t0)) / STEP;
  rig.root.position.y += Math.abs(Math.sin(p)) * BOB;
  for (const f of rig.feet) f.position.y += Math.max(0, Math.sin(p + (f.userData.side > 0 ? 0 : Math.PI))) * LIFT;
}

/** The three askers (Rorit, Silvi, Omli): each walks up, asks, waits for the answer, and walks off. */
export function createAskers() {
  const rorit = createRorit();
  const silvi = createSilvi();
  const rigs = { Rorit: rorit.rig, Silvi: silvi.rig, Omli: createOmli() };
  const ponytails = [rorit.ponytail, silvi.ponytail];
  const feet = new Map(Object.values(rigs).map(r => [r, r.feet.map(f => f.position.clone())]));
  /** Facing Lulu from beside her desk. */
  const toLulu = Math.atan2(DESK_SPOT.x - BY_DESK.x, DESK_SPOT.z - BY_DESK.z);
  return {
    rigs,
    /** Who's at her desk at t (between walking up and walking off), if anyone. */
    at: (t: number) => ASKERS.find(a => t >= a.walk[1] && t < a.leave[0]) ?? null,
    update(t: number) {
      for (const rig of Object.values(rigs)) rig.root.visible = false;
      for (const p of ponytails) p.rotation.set(0.1, 0, Math.sin(t * 2) * 0.05);
      for (const a of ASKERS) {
        if (t < a.walk[0] || t >= a.leave[1]) continue;
        const rig = rigs[a.who];
        restRig(rig, feet.get(rig)!, t);
        rig.root.visible = true;
        rig.root.rotation.y = toLulu;
        if (t < a.leave[0]) walk(rig, ENTRY, BY_DESK, a.walk[0], a.walk[1], t);
        else walk(rig, BY_DESK, ENTRY, a.leave[0], a.leave[1], t);
        rig.setMouth(mouthAt(a.who, t));
      }
    },
  };
}

/** Yashinozarus at his desk: typing, reading, saying very little. */
export function createYashiAtDesk() {
  const yashi = createYashinozarus();
  const feet = yashi.feet.map(f => f.position.clone());
  const keys = keystrokes(YASHI_SCRIPT);
  const paws = [armOf(yashi, -1), armOf(yashi, 1)] as const;
  const v = new THREE.Vector3();
  return {
    rig: yashi,
    update(t: number) {
      restRig(yashi, feet, t, { eyesOpen: 0.8 });
      yashi.head.rotation.y = 0.35; // to his monitor, on his left
      yashi.setMouth(mouthAt('Yashinozarus', t));
      if (at('Yashinozarus', t)) yashi.head.rotation.set(0.05, 0.15, -0.08); // to us, an eyebrow up
      yashi.root.updateMatrixWorld(true);
      const i = keys.findLastIndex(k => k <= t);
      paws.forEach((paw, k) => {
        const hit = i >= 0 && i % 2 === k ? recentHit(t, [keys[i]!], 18) : 0;
        const key = v.copy(KEYBOARD).add(new THREE.Vector3((k ? 1 : -1) * 0.25, 0.12 * (1 - hit), 0));
        reachArm(paw, paw.parent!.worldToLocal(key));
      });
    },
  };
}

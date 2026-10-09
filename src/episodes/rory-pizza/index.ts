import * as THREE from 'three';
import { seg, ease, lerp, clamp01 } from '../../engine/math';
import { createMeadow } from '../../world/meadow';
import { createPizzeria, createTable, TABLE_TOP } from '../../world/pizzeria';
import { createRory, idle, resetPose } from '../../characters/rory';
import { addGuitar, strumArm, freeArm } from '../../characters/rocker';
import { addMohawk } from '../../props/mohawk';
import { addTattoo } from '../../props/tattoo';
import { createPizza } from '../../props/pizza';
import { createThoughtBubble, createLightbulb } from '../../props/thought-bubble';
import { playRiff } from '../../audio/guitar';
import { riff, soundEffects, BEAT, CUES } from './music';
import type { Episode } from '../../engine/types';

// Beat sheet (all times are in music.ts → CUES)
//   0–12   hungry (pizza thought bubble), walks on the beat to Slice Sabbath, stops, sniffs
//   12–20  pizza drops on the table (ding!), happy jump, turns to the table, excited
//   20–32  three tries to reach it with tiny arms (lean, tiptoe, jump) → sad
//   32–42  idea 💡 → power chords make the slice hop over → into his mouth → chomp ×4
//   42–52  victory headbang, final chord, tiny burp

const backOut = (x: number) => {
  const k = 1.7;
  return 1 + (k + 1) * (x - 1) ** 3 + k * (x - 1) ** 2;
};
/** Pops in at a, out at b (0..~1.1). */
const pop = (t: number, a: number, b: number) =>
  t < a || t > b ? 0 : backOut(clamp01((t - a) / 0.25)) * clamp01((b - t) / 0.15);
/** Parabolic arc 0→h→0 over [a, b]. */
const arc = (t: number, a: number, b: number, h: number) => (t > a && t < b ? Math.sin(seg(t, a, b) * Math.PI) * h : 0);
/** 1 right after time c, decaying quickly. */
const hitAfter = (t: number, c: number, rate = 6) => (t >= c ? Math.exp(-(t - c) * rate) : 0);
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const RORY_X = -0.3; // where Rory stands at the table
const START_X = -9;
const TABLE_X = 1.7;
const WALK_ANGLE = 1.0; // 3/4 view: walking right, face toward us
const ESTABLISH = 6.5; // cut to a wide shot of Slice Sabbath as Rory walks up

const episode: Episode = {
  id: 'rory-pizza',
  title: "Rory's Pizza Run 🍕",
  duration: 52,

  setup({ scene, camera }) {
    const world = createMeadow(scene);
    const shop = createPizzeria();
    shop.scale.setScalar(1.6);
    shop.position.set(1.4, world.groundY(1.4, -5), -5);
    const table = createTable();
    const gy = world.groundY(TABLE_X, 0);
    table.position.set(TABLE_X, gy, 0);
    const { pizza, slice, sliceOffset } = createPizza();
    const bubble = createThoughtBubble();
    const bulb = createLightbulb();
    scene.add(shop, table, pizza, slice, bubble, bulb);

    const rory = createRory();
    addTattoo(rory);
    addGuitar(rory);
    addMohawk(rory);
    scene.add(rory.root);
    const strum = strumArm(rory),
      free = freeArm(rory);

    const top = gy + TABLE_TOP;
    const pizzaHome = v3(TABLE_X, top, 0);
    const sliceHome = pizzaHome.clone().add(sliceOffset);
    const tableEdge = v3(TABLE_X - 0.82, top, 0);
    const hopPoints = [0, 1, 2, 3].map(i => sliceHome.clone().lerp(tableEdge, i / 3));
    const mouth = new THREE.Vector3();
    const [walkStart, walkEnd] = CUES.walk;

    function eyesAt(t: number) {
      if (t >= 10.2 && t < 11.8) return 0.55; // dreamy sniffing
      if (t >= 20 && t < 28.6) return 0.7; // effort squint
      if (t >= 28.6 && t < CUES.idea) return 0.45; // sad
      if (t >= CUES.bites[0] && t < CUES.victory) return 0.15; // bliss
      if (t >= CUES.victory) return t > CUES.finalChord ? 0.15 : 0.3;
      return 1;
    }

    function update(t: number) {
      world.update(t);
      resetPose(rory);
      idle(rory, t, { eyesOpen: eyesAt(t) });
      strum.rotation.set(-0.9, 0, -0.2); // tiny arm rests on the strings
      const R = rory;
      const beatHit = Math.pow(1 - ((t / BEAT) % 1), 3);
      let x = RORY_X,
        y = 0,
        ry = 0,
        wide = 1;

      // ── Walk to the pizzeria ──────────────────────────────────────
      if (t < walkEnd) {
        const p = Math.max(0, (t - walkStart) / BEAT); // one step per beat
        x = lerp(START_X, RORY_X, seg(t, walkStart, walkEnd));
        ry = WALK_ANGLE;
        if (t >= walkStart) {
          y = Math.abs(Math.sin(Math.PI * p)) * 0.12;
          for (const f of R.feet)
            f.position.y = Math.max(0, Math.sin(Math.PI * p + (f.userData.side > 0 ? 0 : Math.PI))) * 0.25;
          R.torso.rotation.z += Math.sin(Math.PI * p) * 0.06;
          free.rotation.x = -0.5 + Math.sin(Math.PI * p) * 0.4;
          R.tail.rotation.y = Math.sin(Math.PI * p) * 0.3;
        }
      } else if (t < CUES.pizzaDrop) {
        // stop, face us, sniff the air
        ry = lerp(WALK_ANGLE, 0.25, ease(seg(t, walkEnd, walkEnd + 0.6)));
        R.head.rotation.x += -0.25 - CUES.sniffs.reduce((a, s) => a + hitAfter(t, s, 8) * 0.12, 0);
      }

      // ── Pizza arrives ─────────────────────────────────────────────
      if (t >= CUES.pizzaDrop && t < 20) {
        y = arc(t, 12.3, 12.9, 0.8) + (t > 14 ? beatHit * 0.06 : 0);
        ry = lerp(0.25, 0.9, ease(seg(t, 13, 14)));
        wide = 1.2;
        R.setMouth(t < 13 ? 0.6 : 0.3);
        R.tail.rotation.y = Math.sin(t * 14) * 0.35;
        if (t < 13) free.rotation.set(0.3, 0, 2.4); // yay!
      }

      // ── Can't reach it ────────────────────────────────────────────
      if (t >= 20 && t < CUES.idea) {
        ry = 0.9;
        let reach = 0;
        CUES.tries.forEach(([a, b], i) => {
          const r = ease(seg(t, a, a + 0.4)) * (1 - ease(seg(t, b - 0.4, b)));
          if (r <= 0) return;
          reach = r;
          if (i === 0) R.torso.rotation.x = 0.3 * r; // lean
          if (i === 1) {
            y = 0.25 * r;
            R.squash.scale.y = 1 + 0.08 * r;
          } // tiptoe
          if (i === 2) y = arc(t, 27.2, 27.9, 1.0); // jump
        });
        for (const a of R.arms) {
          const s = a.userData.side;
          a.rotation.set(
            lerp(a.rotation.x, -1.6, reach),
            0,
            lerp(a.rotation.z, s * 0.15, reach) + Math.sin(t * 30) * 0.12 * reach,
          );
        }
        if (reach > 0) R.setMouth(0.25);
        if ((t >= 22.5 && t < 23.5) || (t >= 25.5 && t < 26.5)) R.setFrown(true); // between tries: hmph
        if (t >= 28.6) {
          // sad
          const k = ease(seg(t, 28.6, 29.4));
          R.head.rotation.x += 0.35 * k;
          R.setFrown(true);
          ry = lerp(0.9, 0.4, k);
          for (const a of R.arms) a.rotation.set(-0.1, 0, a.userData.side * 0.1);
        }
      }

      // ── Idea → rock the slice over → eat ──────────────────────────
      if (t >= CUES.idea && t < CUES.victory) {
        ry = t < CUES.bites[0] ? 0.7 : lerp(0.7, 0.3, ease(seg(t, CUES.bites[0], CUES.bites[0] + 0.5)));
        wide = t < CUES.chords[0] ? 1.3 : 1;
        if (t < CUES.bites[0]) {
          const hit = Math.max(...[...CUES.chords, CUES.launch].map(c => hitAfter(t, c)));
          R.head.rotation.x += -0.2 + hit * 0.35;
          strum.rotation.x = -0.9 + hit * 0.6;
          free.rotation.set(0.3, 0, t < CUES.chords[0] ? 2.0 : 2.3 + hit * 0.3);
          R.setMouth(t < CUES.chords[0] ? 0.4 : 0.8 * hit);
        } else {
          const bite = Math.max(...CUES.bites.map(b => Math.sin(Math.PI * seg(t, b - 0.15, b + 0.15))));
          R.setMouth(bite);
          for (const c of R.cheeks) c.scale.set(1.35, 0.95, 0.5); // stuffed cheeks
          R.squash.scale.y = 1 + Math.sin(t * 9) * 0.02;
        }
      }

      // ── Victory jam ───────────────────────────────────────────────
      if (t >= CUES.victory) {
        ry = lerp(0.3, 0.15, ease(seg(t, CUES.victory, CUES.victory + 1)));
        if (t < CUES.finalChord) {
          R.head.rotation.x += -0.18 + beatHit * 0.5;
          free.rotation.set(0.3, 0, 2.2 + beatHit * 0.35);
          strum.rotation.x = -0.9 + Math.sin((t * Math.PI * 4) / BEAT) * 0.25;
          R.setMouth(0.8);
          y = Math.abs(Math.sin((t / BEAT) * Math.PI)) * 0.1;
        } else {
          R.head.rotation.x += -0.3;
          free.rotation.set(0.3, 0, 2.6);
          R.setMouth(t > CUES.burp && t < CUES.burp + 0.45 ? 0.5 : 1);
        }
      }

      R.root.position.set(x, world.groundY(x, 0) + y, 0);
      R.root.rotation.y = ry;
      for (const e of R.eyes) {
        e.scale.x = wide;
        e.scale.z = wide;
      }

      // ── Props ─────────────────────────────────────────────────────
      bubble.scale.setScalar(pop(t, 0.3, 2.8)); // hungry thought, follows him
      bubble.visible = bubble.scale.x > 0.001;
      bubble.position.set(x + 1.2, R.root.position.y + 4.1, 0.6);

      pizza.visible = slice.visible = t >= CUES.pizzaDrop;
      const drop = seg(t, CUES.pizzaDrop, CUES.pizzaDrop + 0.35);
      pizza.position.copy(pizzaHome);
      pizza.position.y += (1 - drop) ** 2 * 4 + arc(t, CUES.pizzaDrop + 0.35, CUES.pizzaDrop + 0.7, 0.15);

      // slice: rides with the pizza → 3 hops → launch → bites
      slice.rotation.set(0, 0, 0);
      slice.scale.setScalar(1);
      const hopIdx = CUES.chords.findIndex(c => t >= c && t < c + 0.45);
      const done = CUES.chords.filter(c => t >= c + 0.45).length;
      if (t < CUES.chords[0]) slice.position.copy(pizza.position).add(sliceOffset);
      else if (hopIdx >= 0) {
        const at = CUES.chords[hopIdx]!;
        const k = seg(t, at, at + 0.45);
        slice.position.lerpVectors(hopPoints[hopIdx]!, hopPoints[hopIdx + 1]!, k);
        slice.position.y += Math.sin(k * Math.PI) * 0.5;
        slice.rotation.y = k * Math.PI * 2;
      } else if (t < CUES.launch) slice.position.copy(hopPoints[done]!);
      else {
        R.root.updateMatrixWorld(true);
        R.head.localToWorld(mouth.set(0, -0.45, 1.35));
        if (t < CUES.bites[0]) {
          const k = seg(t, CUES.launch, CUES.bites[0]);
          slice.position.lerpVectors(hopPoints[3]!, mouth, k);
          slice.position.y += Math.sin(k * Math.PI) * 0.6;
          slice.rotation.set(-k * 1.2, 0, k * 0.6);
        } else {
          const eaten = CUES.bites.filter(b => t >= b).length;
          slice.position.copy(mouth);
          slice.rotation.set(-1.2, 0, 0.6);
          slice.scale.setScalar([1, 0.7, 0.45, 0.2, 0][eaten]!);
          slice.visible = eaten < 4;
        }
      }

      bulb.scale.setScalar(pop(t, CUES.idea, CUES.idea + 1.2));
      bulb.visible = bulb.scale.x > 0.001;
      bulb.position.set(x + 0.2, 4.2 + Math.sin(t * 6) * 0.05, 0.2);

      // ── Camera: one framing per story beat (hard cuts between them) ──
      let cam: [number, number, number], look: [number, number, number];
      if (t < ESTABLISH) {
        const cx = x + 0.6;
        cam = [cx, 2.6, 10];
        look = [cx, 1.9, 0];
      } else if (t < walkEnd) {
        cam = [1.2, 3.4, 14.5];
        look = [1.2, 3.7, -2];
      } // establishing shot: the whole shop + sign
      else if (t < 20) {
        const k = ease(seg(t, walkEnd, walkEnd + 1.5));
        cam = [lerp(RORY_X + 0.6, 0.9, k), 2.6, lerp(10, 8.5, k)];
        look = [lerp(RORY_X + 0.6, 0.9, k), 1.85, 0];
      } else if (t < 29) {
        cam = [0.7, 2.4, 7.5];
        look = [0.7, 1.8, 0];
      } else if (t < CUES.idea) {
        const k = ease(seg(t, 29, 31.5));
        cam = [lerp(0.7, 0, k), lerp(2.4, 2.6, k), lerp(7.5, 6, k)];
        look = [lerp(0.7, -0.2, k), lerp(1.8, 2.3, k), 0];
      } else if (t < CUES.bites[0]) {
        cam = [0.8, 2.6, 8];
        look = [0.8, 2.0, 0];
      } else if (t < CUES.victory) {
        cam = [0.1, 2.6, 5.6];
        look = [-0.1, 2.3, 0];
      } else {
        cam = [0.6 + Math.sin(t * 0.4) * 0.3, 3.6, 13.5];
        look = [0.9, 3.5, -1];
      } // wide: Rory + the roof sign
      camera.position.set(...cam);
      camera.lookAt(...look);
    }

    return { update };
  },

  audio(bus, t0) {
    playRiff(bus, t0, riff);
    soundEffects(bus, t0);
  },
};

export default episode;

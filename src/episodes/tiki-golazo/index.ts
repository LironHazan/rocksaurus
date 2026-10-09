import * as THREE from 'three';
import { clamp01, ease, lerp, seg } from '../../engine/math';
import { disposeObject } from '../../engine/dispose';
import type { Episode } from '../../engine/types';
import type { CharacterRig, Ellipsoid } from '../../characters/types';
import { createTyrannosaurus, TIKI_COLORS } from '../../characters/tyrannosaurus';
import { createRory, idle, resetPose } from '../../characters/rory';
import { createStegosaurus, STEGGY_COLORS } from '../../characters/stegosaurus';
import { addCap } from '../../props/cap';
import { addJersey, createBall, HOME_KIT, TREX_BODY } from '../../props/soccer';
import { sungNotes, mouthOpenAt } from '../../audio/vowels';
import { CAPTIONS } from './captions';
import { createPitch, cheerSign, GOAL, SIDELINE_Z } from './sets/pitch';
import {
  CUE,
  DURATION,
  MATE_HOME,
  MATE_PATH,
  NET_HIT,
  PASSES,
  TIKI_HOME,
  TIKI_PATH,
  along,
  ballAt,
  heading,
  netPush,
  speed,
  touches,
  type P2,
} from './timeline';
import { soundtrack, SIUU } from './music';

// Beat sheet (video seconds; see timeline.ts for the cues and captions.ts for the text)
//   0–4     Saturday morning at the pitch by the daycare; Tiki Taka jogs on
//   4–8     his back to us: RONALDO 7. He tries to point at it. Tiny arms.
//   8–12    kickoff, and tiki-taka: quick passes with a teammate while a dad chases the ball
//   12–19   Tiki goes solo: dribbles, one stepover, the defender sits down
//   19–20   the shot; the keeper dives the wrong way; the net bulges (on the V chord)
//   20–24   the celebration: run, jump, turn in the air, land, arms out — SIUUU
//   24–26.5 tiny arms can't high-five, so: belly bump
//   26.5–28 the kids on the touchline; his little one copies the celebration
//   28–30   final whistle, 1–0

type Vec = readonly [number, number, number];
interface Shot {
  cam: Vec;
  look: Vec;
}

const TOUCHES = touches();
const SHOUT = sungNotes(SIUU);
const yawOf = ([hx, hz]: P2) => Math.atan2(hx, hz);
/** Turns toward a target angle the short way round. */
const turn = (from: number, to: number, k: number) => {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return from + d * k;
};
/** 0 → 1 → 0 bell around `at`. */
const bell = (t: number, at: number, w: number) => Math.exp(-(((t - at) / w) ** 2));
/** A hop: 0 on the ground, up to 1 at the top, every `every` seconds. */
const hops = (t: number, every: number) => Math.sin(Math.PI * ((t / every) % 1));

/** A player: a holder for place and facing, around a rig the shared helpers pose. */
interface Player {
  rig: CharacterRig;
  holder: THREE.Group;
  /** Where the feet rest, to put them back each frame after running and kicking. */
  feet: THREE.Vector3[];
  /** The group the body (and kit) hangs from, for leaning. */
  body: THREE.Object3D;
}

const RORY_BODY: Ellipsoid = { center: [0, 1.2, 0], radii: [1, 1.1, 0.95] };

const episode: Episode = {
  id: 'tiki-golazo',
  title: 'Tiki Taka Scores a Golazo ⚽',
  duration: DURATION,
  captions: CAPTIONS,

  setup(stage) {
    const { camera } = stage;
    const pitch = createPitch();
    const scene = pitch.scene;
    stage.scene = scene; // this episode brings its own pitch

    function player(rig: CharacterRig, body: THREE.Object3D, scale = 1): Player {
      const holder = new THREE.Group();
      holder.scale.setScalar(scale);
      holder.add(rig.root);
      scene.add(holder);
      return { rig, holder, body, feet: rig.feet.map(f => f.position.clone()) };
    }

    // ── the dads ───────────────────────────────────────────────
    const tikiRig = createTyrannosaurus();
    // his long T-rex skull needs a deeper, longer fit than the stock cap: lower, back, and stretched front to back
    const cap = addCap(tikiRig, { position: [0, 0.3, 0.08], tilt: -0.14 });
    cap.scale.set(0.62, 0.66, 0.82);
    addJersey(tikiRig, tikiRig.posture, TREX_BODY, {
      ...HOME_KIT,
      number: '7',
      name: 'RONALDO',
    });
    const tiki = player(tikiRig, tikiRig.posture);

    const mateRig = createRory({ body: 0xf6a96a, belly: 0xfff3dc, bumps: 0xe0823b, cheeks: 0xffb3c1 });
    addJersey(mateRig, mateRig.torso, RORY_BODY, {
      ...HOME_KIT,
      number: '4',
      name: 'DAD',
    });
    const mate = player(mateRig, mateRig.torso);

    const defRig = createTyrannosaurus({ ...TIKI_COLORS, body: 0xb9a2ff, stripes: 0x8a6fe0, brow: 0x9d86f2 });
    addJersey(defRig, defRig.posture, TREX_BODY, {
      color: 0xe63946,
      trim: 0xffffff,
      shorts: 0x1b1b2e,
      ink: '#ffffff',
      number: '3',
      name: 'PAPA',
    });
    const defender = player(defRig, defRig.posture);

    const keeperRig = createStegosaurus({
      ...STEGGY_COLORS,
      body: 0x9bd69a,
      plates: 0x4fa86a,
      plateTips: 0x7fcf8f,
      bowTie: 0x2b2b2b,
      mustache: 0x5a3a22,
    });
    addJersey(keeperRig, keeperRig.torso, keeperRig.fit.torso, {
      color: 0xffd23f,
      trim: 0x1b1b2e,
      shorts: 0x1b1b2e,
      ink: '#1b1b2e',
      number: '1',
    });
    const keeper = player(keeperRig, keeperRig.torso);

    // ── the kids on the touchline ──────────────────────────────
    const littleRig = createTyrannosaurus({ ...TIKI_COLORS, body: 0x9fd6ff, stripes: 0x6fbbea, brow: 0x86c4f2 });
    addJersey(littleRig, littleRig.posture, TREX_BODY, { ...HOME_KIT, number: '7' }); // a mini replica
    const little = player(littleRig, littleRig.posture, 0.42);
    const kidRoryRig = createRory();
    const kidRory = player(kidRoryRig, kidRoryRig.torso, 0.45);
    const kidSteg = createStegosaurus({ ...STEGGY_COLORS, mustache: null });
    const kidSteggy = player(kidSteg, kidSteg.torso, 0.42);
    const sign = cheerSign('GO DADS!\n🦖⚽');
    sign.scale.setScalar(1.7); // held up high, so it reads from the pitch
    sign.position.set(0, 1.0, 1.1);
    kidRory.rig.torso.add(sign);
    const KIDS: readonly [Player, number][] = [
      [kidRory, 3.1],
      [little, 4.4],
      [kidSteggy, 5.7],
    ];

    const ball = createBall();
    scene.add(ball);

    function reset(p: Player) {
      resetPose(p.rig);
      p.rig.root.position.set(0, 0, 0);
      p.rig.feet.forEach((f, i) => f.position.copy(p.feet[i]!));
      p.body.rotation.set(p.body === p.rig.torso ? 0 : 0.1, 0, 0); // the T-rex posture keeps its forward lean
    }
    function place(p: Player, [x, z]: P2, yaw: number) {
      p.holder.position.set(x, 0, z);
      p.holder.rotation.y = yaw;
    }
    /** Running: a bounce, alternating feet, a forward lean, arms pumping, tail swinging. */
    function run(p: Player, t: number, amount: number, cadence = 3.4) {
      if (amount <= 0) return;
      const ph = t * cadence * Math.PI;
      p.rig.root.position.y += Math.abs(Math.sin(ph)) * 0.22 * amount;
      for (const f of p.rig.feet) {
        const s = f.userData.side > 0 ? 0 : Math.PI;
        f.position.y += Math.max(0, Math.sin(ph + s)) * 0.45 * amount;
        f.position.z += Math.cos(ph + s) * 0.3 * amount;
      }
      p.body.rotation.x += 0.18 * amount;
      p.rig.torso.rotation.z += Math.sin(ph) * 0.05 * amount;
      p.rig.tail.rotation.y = Math.sin(ph) * 0.35 * amount;
      for (const a of p.rig.arms)
        a.rotation.x = -0.6 + Math.sin(ph + (a.userData.side > 0 ? Math.PI : 0)) * 0.6 * amount;
    }
    /** A kick with the right foot, `dt` seconds after contact (negative = winding up). */
    function kick(p: Player, dt: number, power = 1) {
      if (dt < -0.3 * power || dt > 0.3) return;
      const foot = p.rig.feet.find(f => f.userData.side > 0)!;
      const swing = dt < 0 ? -ease(clamp01(1 + dt / (0.3 * power))) : 1 - ease(clamp01(dt / 0.3));
      // back on the wind-up, through the ball, then down
      foot.position.z += swing * 0.75 * power;
      foot.position.y += Math.abs(swing) * 0.4 * power;
      p.body.rotation.x += -0.12 * Math.abs(swing) * power;
    }
    /** Arms straight up, a fist pump. */
    function armsUp(p: Player, wave: number) {
      for (const a of p.rig.arms) {
        a.rotation.x = -2.6 + Math.sin(wave + a.userData.side) * 0.25;
        a.rotation.z = a.userData.side * 0.3;
      }
    }
    /** The celebration pose: chest out, legs apart, arms out and down at the sides. */
    function siuuPose(p: Player, k: number) {
      for (const a of p.rig.arms) {
        a.rotation.x = lerp(a.rotation.x, 0.15, k);
        a.rotation.z = lerp(a.rotation.z, a.userData.side * 1.25, k);
      }
      p.rig.feet.forEach(f => (f.position.x += f.userData.side * 0.25 * k));
      p.body.rotation.x -= 0.18 * k;
      p.rig.head.rotation.x -= 0.25 * k;
    }
    const nearest = (t: number) => {
      let best = Infinity;
      for (const x of TOUCHES) if (Math.abs(t - x) < Math.abs(best)) best = t - x;
      return best;
    };

    function tikiPart(t: number) {
      const p = tiki;
      reset(p);
      idle(p.rig, t, { eyesOpen: 1 });
      const pos = along(TIKI_PATH, t);
      const v = speed(TIKI_PATH, t);
      let yaw = yawOf(heading(TIKI_PATH, t));
      if (t < CUE.arrive[1]) {
        run(p, t, Math.max(0.4, v));
      } else if (t < CUE.whistle) {
        // back to the camera; tries to point at the name with his tiny arms, then turns round, proud
        yaw = turn(yawOf([1, -0.6]), Math.PI, ease(seg(t, CUE.shirt[0], CUE.shirt[0] + 0.6)));
        if (t > CUE.turnRound[0]) {
          yaw = turn(Math.PI, 0.25, ease(seg(t, CUE.turnRound[0], CUE.turnRound[1])));
          const pat = p.rig.arms.find(a => a.userData.side > 0)!; // a paw on the crest
          pat.rotation.set(-1.5, 0, -0.75 + Math.sin(t * 8) * 0.08);
          p.body.rotation.x -= 0.08; // chest out
        }
        const pk = seg(t, CUE.point[0], CUE.point[0] + 0.3) * (1 - seg(t, CUE.point[1] - 0.3, CUE.point[1]));
        if (pk > 0) {
          for (const a of p.rig.arms) {
            const strain = Math.sin(t * 9 + a.userData.side * 1.3) * 0.25;
            a.rotation.x = lerp(-0.5, 2.3 + strain, pk);
            a.rotation.z = a.userData.side * lerp(0.35, 0.6, pk);
          }
          p.rig.head.rotation.y = Math.sin(t * 2.6) * 0.7 * pk; // looking over one shoulder, then the other
          p.rig.torso.rotation.y = Math.sin(t * 2.6) * 0.2 * pk;
          p.rig.squash.scale.y = 1 + Math.sin(t * 9) * 0.015 * pk;
        }
      } else if (t < CUE.dribble[0]) {
        // passing: face the teammate, kick on each of his passes
        yaw = yawOf([MATE_HOME[0] - TIKI_HOME[0], MATE_HOME[1] - TIKI_HOME[1]]);
        const mine = PASSES.filter(([, , fromTiki]) => fromTiki).map(([kick]) => kick);
        kick(p, t - mine.reduce((b, x) => (Math.abs(t - x) < Math.abs(t - b) ? x : b), -9));
      } else if (t < CUE.shot + 0.3) {
        run(p, t, Math.max(v, t < CUE.shot - 0.4 ? 0.55 : 0));
        if (t > CUE.stepover[0] && t < CUE.stepover[1]) {
          // the stepover: the body sells the fake one way, the feet go the other
          const k = seg(t, CUE.stepover[0], CUE.stepover[1]);
          p.rig.torso.rotation.z += Math.sin(k * Math.PI * 2) * 0.25;
          p.rig.root.position.x += Math.sin(k * Math.PI * 2) * 0.3;
        }
        const dt = nearest(t);
        kick(p, dt, Math.abs(t - CUE.shot) < 0.5 ? 1.6 : 0.6);
        if (t > CUE.shot - 0.6) yaw = turn(yaw, yawOf([1, -0.3]), seg(t, CUE.shot - 0.6, CUE.shot - 0.3));
      } else if (t < CUE.run[0]) {
        yaw = yawOf([1, -0.3]);
        if (t > CUE.goal) armsUp(p, t * 10); // it's in!
      } else if (t < CUE.jump[0]) {
        run(p, t, 1, 4);
        for (const a of p.rig.arms) a.rotation.z = a.userData.side * 0.9; // airplane
      } else if (t < CUE.siuu[0]) {
        // the jump: up, a turn in the air, legs tucked
        const k = seg(t, CUE.jump[0], CUE.jump[1]);
        const runYaw = yawOf(heading(TIKI_PATH, CUE.jump[0] - 0.05));
        yaw = lerp(runYaw, Math.PI * 2, ease(k)); // a full turn in the air, landing face on
        p.rig.root.position.y = Math.sin(Math.PI * k) * 1.7;
        for (const f of p.rig.feet) f.position.y += Math.sin(Math.PI * k) * 0.5;
        siuuPose(p, k * 0.6);
      } else if (t < 23.9) {
        yaw = 0;
        const land = seg(t, CUE.siuu[0], CUE.siuu[0] + 0.2);
        p.rig.squash.scale.y = 1 - 0.12 * Math.sin(Math.PI * land);
        siuuPose(p, 1);
        p.rig.setMouth(mouthOpenAt(SHOUT, t));
      } else if (t < 25.6) {
        // turns to his teammate; belly bump
        yaw = turn(0, -Math.PI / 2, ease(seg(t, 23.9, 24.25)));
        const hop = seg(t, CUE.bump - 0.4, CUE.bump);
        p.rig.root.position.y = Math.sin(Math.PI * hop) * 0.5 * (t < CUE.bump ? 1 : 0);
        p.body.rotation.x -= 0.3 * bell(t, CUE.bump, 0.2); // bellies first
        p.rig.setMouth(0.5 * bell(t, CUE.bump + 0.25, 0.3));
        armsUp(p, t * 8);
      } else if (t < CUE.final) {
        // waves at the camera
        yaw = turn(-Math.PI / 2, -0.3, ease(seg(t, 25.7, 26.2)));
        const arm = p.rig.arms.find(a => a.userData.side > 0)!;
        arm.rotation.x = -2.6;
        arm.rotation.z = 0.5 + Math.sin(t * 9) * 0.4;
      } else {
        yaw = turn(-0.3, 0, ease(seg(t, CUE.final, CUE.final + 0.5)));
        siuuPose(p, ease(seg(t, CUE.final + 0.3, CUE.final + 0.8)));
        p.rig.setMouth(0.4);
      }
      place(p, pos, yaw);
    }

    function matePart(t: number) {
      const p = mate;
      reset(p);
      idle(p.rig, t + 1.3, { eyesOpen: 1 });
      const pos = along(MATE_PATH, t);
      const v = speed(MATE_PATH, t);
      let yaw = yawOf([TIKI_HOME[0] - MATE_HOME[0], TIKI_HOME[1] - MATE_HOME[1]]);
      if (t < CUE.dribble[0]) {
        const mine = PASSES.filter(([, , fromTiki]) => !fromTiki).map(([k]) => k);
        kick(p, t - mine.reduce((b, x) => (Math.abs(t - x) < Math.abs(t - b) ? x : b), -9));
      } else if (t < CUE.goal) {
        yaw = yawOf(heading(MATE_PATH, t));
        run(p, t, Math.max(v, 0.3));
        if (v < 0.05) yaw = yawOf([1, 0.4]);
      } else if (t < 23.0) {
        yaw = yawOf([0, 1]);
        p.rig.root.position.y = hops(t - CUE.goal, 0.45) * 0.45;
        armsUp(p, t * 10);
        p.rig.setMouth(0.7);
      } else if (t < CUE.bump - 0.4) {
        yaw = yawOf(heading(MATE_PATH, t));
        run(p, t, Math.max(v, 0.6));
      } else if (t < 25.6) {
        yaw = Math.PI / 2;
        const hop = seg(t, CUE.bump - 0.4, CUE.bump);
        p.rig.root.position.y = Math.sin(Math.PI * hop) * 0.5 * (t < CUE.bump ? 1 : 0);
        p.rig.torso.rotation.x -= 0.3 * bell(t, CUE.bump, 0.2);
        p.rig.setMouth(0.6 * bell(t, CUE.bump + 0.25, 0.3));
        armsUp(p, t * 8);
      } else {
        yaw = turn(Math.PI / 2, t < CUE.final ? 0.3 : 0, ease(seg(t, 25.8, 26.3)) * (t < CUE.final ? 1 : 0));
        if (t >= CUE.final) {
          yaw = 0;
          armsUp(p, t * 8);
          p.rig.setMouth(0.5);
        }
      }
      place(p, pos, yaw);
    }

    const MID: P2 = [(TIKI_HOME[0] + MATE_HOME[0]) / 2, (TIKI_HOME[1] + MATE_HOME[1]) / 2];
    const DEF_START: P2 = [3.4, -3.4];
    const BLOCK: P2 = [3.8, -0.9];
    const SAT: P2 = [3.4, -2.1];
    /** The defender, during the passes: always heading for where the ball was half a second ago. */
    const chasing = (t: number): P2 => {
      const [bx, , bz] = ballAt(t - 0.45);
      return [MID[0] + (bx - MID[0]) * 0.55, MID[1] + (bz - MID[1]) * 0.55];
    };
    function defenderPart(t: number) {
      const p = defender;
      reset(p);
      idle(p.rig, t + 0.6, { eyesOpen: 1 });
      // waits upfield (out of the way of the shirt reveal), then jogs in to chase the ball
      const arrive = ease(seg(t, CUE.whistle - 0.6, PASSES[0]![0] + 0.4));
      let pos: P2 = [lerp(DEF_START[0], MID[0], arrive), lerp(DEF_START[1], MID[1], arrive)];
      let yaw = yawOf([TIKI_HOME[0] - pos[0], TIKI_HOME[1] - pos[1]]);
      if (t < PASSES[0]![0]) run(p, t, arrive > 0 && arrive < 1 ? 0.6 : 0);
      else if (t < CUE.dribble[0]) {
        const chase = chasing(t);
        const k = ease(seg(t, PASSES[0]![0], PASSES[0]![0] + 0.4));
        pos = [lerp(MID[0], chase[0], k), lerp(MID[1], chase[1], k)];
        const [bx, , bz] = ballAt(t);
        yaw = yawOf([bx - pos[0], bz - pos[1]]);
        const ahead = chasing(t + 0.1);
        run(p, t, clamp01(Math.hypot(ahead[0] - pos[0], ahead[1] - pos[1]) * 4), 4);
        p.rig.setMouth(0.3); // puffing
      } else if (t < CUE.tackle[0]) {
        const k = ease(seg(t, CUE.dribble[0], CUE.dribble[0] + 2.4));
        const from = chasing(CUE.dribble[0] - 0.01);
        pos = [lerp(from[0], BLOCK[0], k), lerp(from[1], BLOCK[1], k)];
        yaw = turn(yawOf([1, 0]), -Math.PI / 2, k);
        run(p, t, k < 1 ? 0.7 : 0);
        if (k >= 1) p.rig.root.position.y = hops(t, 0.35) * 0.06; // on his toes
      } else if (t >= CUE.tackle[0]) {
        // bites on the stepover: lunges the wrong way and ends up on his tail
        const k = ease(seg(t, CUE.tackle[0], CUE.tackle[1]));
        pos = [lerp(BLOCK[0], SAT[0], k), lerp(BLOCK[1], SAT[1], k)];
        yaw = -Math.PI / 2 - 0.4 * k;
        const getUp = ease(seg(t, 26.0, 26.7));
        const sit = k * (1 - getUp);
        p.rig.root.position.y = -0.55 * sit;
        p.body.rotation.x -= 0.45 * sit;
        for (const f of p.rig.feet) {
          f.position.z += 0.5 * sit;
          f.position.y += 0.35 * sit;
        }
        p.rig.head.rotation.z = Math.sin(t * 5) * 0.15 * sit; // seeing stars
        if (getUp > 0) {
          yaw = turn(yaw, 0.6, getUp);
          // claps his tiny paws: good game
          for (const a of p.rig.arms) {
            a.rotation.x = -1.3;
            a.rotation.z = -a.userData.side * (0.1 + 0.25 * Math.abs(Math.sin(t * 9))) * getUp;
          }
        }
      }
      place(p, pos, yaw);
    }

    const KEEP: P2 = [GOAL.x - 1.1, 0];
    function keeperPart(t: number) {
      const p = keeper;
      reset(p);
      idle(p.rig, t + 2, { eyesOpen: 1 });
      const [, , bz] = ballAt(t);
      let pos: P2 = [KEEP[0], THREE.MathUtils.clamp(bz * 0.35, -1.2, 1.2)];
      const yaw = -Math.PI / 2;
      if (t < CUE.dive[0]) {
        // ready: knees bent, paws out, side to side
        p.rig.squash.scale.y = 0.94;
        p.rig.root.position.y = hops(t, 0.5) * 0.05;
        for (const a of p.rig.arms) a.rotation.set(-1.0, 0, a.userData.side * 0.7);
      } else {
        // dives the wrong way, lies there, gets up, hands on hips
        const k = ease(seg(t, CUE.dive[0], CUE.dive[1]));
        const up = ease(seg(t, 24.0, 24.8));
        const from = THREE.MathUtils.clamp(ballAt(CUE.dive[0])[2] * 0.35, -1.2, 1.2);
        pos = [KEEP[0], lerp(from, 2.6, k)];
        p.rig.root.rotation.z = -1.35 * k * (1 - up);
        p.rig.root.position.y = Math.sin(Math.PI * k) * 0.9 * (1 - up) + 0.5 * k * (1 - up);
        for (const a of p.rig.arms) a.rotation.set(-1.2 * k * (1 - up), 0, a.userData.side * 2.2 * k * (1 - up));
        if (t > CUE.dive[1] && up === 0)
          for (const f of p.rig.feet) f.position.y += Math.max(0, Math.sin(t * 12)) * 0.15; // kicks the grass
        if (up > 0) for (const a of p.rig.arms) a.rotation.set(-0.3, 0, a.userData.side * 0.9 * up); // paws on hips
        p.rig.setFrown(t > CUE.goal && t < 26);
      }
      place(p, pos, yaw);
    }

    function kidsPart(t: number) {
      KIDS.forEach(([p, x], i) => {
        reset(p);
        idle(p.rig, t + i, { eyesOpen: 1 });
        let yaw = 0;
        const cheering = (t > CUE.goal && t < CUE.goal + 2.6) || t > CUE.final;
        if (cheering) {
          p.rig.root.position.y = hops(t + i * 0.13, 0.36) * 0.8;
          armsUp(p, t * 10 + i);
          p.rig.setMouth(0.7);
        } else {
          p.rig.root.position.y = hops(t + i * 0.3, 0.6) * 0.15;
        }
        if (p === little && t > CUE.kidJump[0] - 0.3 && t < CUE.final) {
          // copies daddy: run-up, jump, turn, land, arms out
          const k = seg(t, CUE.kidJump[0], CUE.kidJump[1]);
          yaw = lerp(0, Math.PI * 2, ease(k)); // a full spin, like daddy
          p.rig.root.position.y = Math.sin(Math.PI * k) * 1.4;
          siuuPose(p, t > CUE.kidJump[1] ? 1 : k * 0.6);
          if (t > CUE.kidJump[1]) p.rig.setMouth(0.6);
        }
        if (p === kidRory) sign.rotation.z = Math.sin(t * (cheering ? 9 : 3)) * (cheering ? 0.3 : 0.12);
        place(p, [x, SIDELINE_Z + (i === 1 ? 0.4 : 0)], yaw);
      });
    }

    function shot(t: number): Shot {
      if (t < CUE.shirt[0]) {
        // from the daycare across the road, down onto the pitch as Tiki jogs on
        const k = ease(seg(t, 0, 3.6));
        const [tx, tz] = along(TIKI_PATH, t);
        return {
          cam: [lerp(-3, tx + 1.2, k), lerp(6.5, 3.4, k), lerp(14, tz + 8.5, k)],
          look: [lerp(-3, tx, k), lerp(4.2, 2.3, k), lerp(-22, tz, k)],
        };
      }
      if (t < CUE.whistle) {
        const k = ease(seg(t, CUE.shirt[0], CUE.whistle));
        const [x, , z] = [TIKI_HOME[0], 0, TIKI_HOME[1]];
        return { cam: [x + 0.4, lerp(3.4, 3.0, k), z + lerp(8.0, 6.2, k)], look: [x, lerp(2.4, 2.5, k), z] };
      }
      if (t < CUE.dribble[0]) return { cam: [1.4, 6.0, 13.5], look: [-0.6, 1.0, -0.4] };
      if (t < CUE.shot - 0.3) {
        const [tx, tz] = along(TIKI_PATH, t);
        const k = ease(seg(t, CUE.dribble[0], CUE.dribble[0] + 0.8));
        return {
          cam: [lerp(1.4, tx + 1.8, k), lerp(6.0, 4.0, k), lerp(13.5, tz + 11, k)],
          look: [lerp(-0.6, tx + 1.6, k), lerp(1.0, 1.8, k), lerp(-0.4, tz - 1, k)],
        };
      }
      if (t < CUE.goal + 0.6) {
        // from in front of the box: Tiki's face as he shoots, the keeper diving toward us, the goal behind
        const k = ease(seg(t, CUE.shot - 0.3, CUE.goal + 0.6));
        return {
          cam: [lerp(8.4, 9.0, k), lerp(3.6, 3.4, k), lerp(13.4, 14.0, k)],
          look: [lerp(8.2, 9.2, k), 1.8, 0],
        };
      }
      if (t < CUE.siuu[1] + 0.5) {
        const [tx, tz] = along(TIKI_PATH, t);
        const air = Math.sin(Math.PI * seg(t, CUE.jump[0], CUE.jump[1]));
        return { cam: [tx + 0.5, 3.5, Math.max(tz + 9, 12.5)], look: [tx, 2.7 + air * 0.8, tz] };
      }
      if (t < CUE.kids[0]) return { cam: [2.6, 3.0, 16], look: [2.6, 2.2, 4.9] };
      if (t < CUE.final) {
        const k = ease(seg(t, CUE.kids[0], CUE.final));
        return { cam: [4.4, lerp(2.2, 1.9, k), SIDELINE_Z + lerp(8.8, 7.6, k)], look: [4.4, 1.0, SIDELINE_Z] };
      }
      const k = ease(seg(t, CUE.final, DURATION));
      return { cam: [3.2, lerp(3.2, 3.6, k), lerp(14, 15.2, k)], look: [3.2, 2.3, 0] };
    }

    function update(t: number) {
      tikiPart(t);
      matePart(t);
      defenderPart(t);
      keeperPart(t);
      kidsPart(t);

      const [bx, by, bz] = ballAt(t);
      ball.position.set(bx, by, bz);
      ball.rotation.set(bz / 0.36, 0, -bx / 0.36); // rolls with the distance travelled
      pitch.goal.bulge(netPush(t), NET_HIT.y, NET_HIT.z);
      pitch.board.setScore(t >= CUE.score ? 1 : 0, 0);

      const s = shot(t);
      camera.position.set(...s.cam);
      camera.lookAt(...s.look);
    }

    return {
      update,
      dispose() {
        disposeObject(scene);
      },
    };
  },

  audio(bus, t0) {
    soundtrack(bus, t0);
  },
};

export default episode;

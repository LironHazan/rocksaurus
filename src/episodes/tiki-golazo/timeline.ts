import { clamp01, ease, lerp, seg } from '../../engine/math';
import { GOAL } from './sets/pitch';

// Tiki Taka's Saturday-morning game with the daycare dads. Times are video seconds. The music is a 12-bar
// blues shuffle at 120 BPM (a bar is 2 s): two bars of intro, the twelve bars, and a one-bar ending. The goal
// lands on the V chord, bar 10.

export const BPM = 120;
export const BAR = 2;
export const DURATION = 30; // 15 bars

export const CUE = {
  arrive: [0.6, 3.6], // Tiki jogs onto the pitch
  shirt: [4.0, 8.0], // back to the camera: RONALDO 7
  point: [4.6, 6.3], // tries to point at the name on his back (tiny arms)
  turnRound: [6.5, 7.1], // then turns round to show off the crest
  whistle: 8.0, // kickoff
  dribble: [12.0, 19.2],
  stepover: [15.2, 16.0],
  tackle: [15.5, 16.3], // the defender bites on the feint, slides, and sits down
  shot: 19.2,
  goal: 20.0, // the net bulges
  dive: [19.45, 20.1], // the keeper dives the wrong way
  score: 20.6, // the scoreboard flips to 1–0
  run: [20.2, 21.8], // Tiki runs off to celebrate
  jump: [21.8, 22.5], // jumps and turns in the air…
  siuu: [22.5, 23.9], // …lands, arms out, back to the camera
  bump: 25.0, // belly bump with his teammate
  kids: [26.5, 28.3], // cut to the kids on the touchline
  kidJump: [27.0, 27.6], // the little one copies the celebration
  final: 28.3, // the final whistle, everyone in the shot
} as const;

export type P2 = readonly [x: number, z: number];
type Key = readonly [t: number, x: number, z: number];

/**
 * Where a key-framed path is at time t: a smooth curve through the keys (Catmull-Rom), so a runner flows through
 * each key instead of stopping at it. Keys that repeat a position are holds: standing still.
 */
export function along(keys: readonly Key[], t: number): P2 {
  if (t <= keys[0]![0]) return [keys[0]![1], keys[0]![2]];
  for (let i = 1; i < keys.length; i++) {
    const [t2, x2, z2] = keys[i]!;
    if (t >= t2) continue;
    const [t1, x1, z1] = keys[i - 1]!;
    if (x1 === x2 && z1 === z2) return [x1, z1];
    const [, x0, z0] = keys[i - 2] ?? keys[i - 1]!;
    const [, x3, z3] = keys[i + 1] ?? keys[i]!;
    const k = (t - t1) / (t2 - t1);
    const cr = (p0: number, p1: number, p2: number, p3: number) =>
      0.5 * (2 * p1 + (p2 - p0) * k + (2 * p0 - 5 * p1 + 4 * p2 - p3) * k * k + (3 * p1 - p0 - 3 * p2 + p3) * k ** 3);
    return [cr(x0, x1, x2, x3), cr(z0, z1, z2, z3)];
  }
  const last = keys.at(-1)!;
  return [last[1], last[2]];
}

/** Direction of travel along a path (unit, or [0, 0] when standing still). */
export function heading(keys: readonly Key[], t: number): P2 {
  const [x0, z0] = along(keys, t - 0.05);
  const [x1, z1] = along(keys, t + 0.05);
  const len = Math.hypot(x1 - x0, z1 - z0);
  return len < 1e-4 ? [0, 0] : [(x1 - x0) / len, (z1 - z0) / len];
}

/** Moving fast enough to be running (0 standing … 1 full sprint). */
export const speed = (keys: readonly Key[], t: number): number => {
  const [x0, z0] = along(keys, t - 0.05);
  const [x1, z1] = along(keys, t + 0.05);
  return clamp01(Math.hypot(x1 - x0, z1 - z0) / 0.1 / 4.5);
};

// Tiki stands upfield of his teammate, so he faces the camera while they pass
export const TIKI_HOME: P2 = [-2, -2.2];
export const MATE_HOME: P2 = [0.8, 2.0];

export const TIKI_PATH: readonly Key[] = [
  [CUE.arrive[0], -10, 4.2],
  [CUE.arrive[1], ...TIKI_HOME],
  [CUE.dribble[0], ...TIKI_HOME],
  [13.6, 0.2, -0.6],
  [CUE.stepover[0], 2.2, 1.0],
  [CUE.stepover[1], 3.4, 2.3], // cuts round the defender
  [17.6, 5.2, 1.8],
  [19.0, 6.2, 1.2],
  [CUE.run[0], 6.4, 1.2],
  [CUE.run[1], 4.2, 4.6],
  [CUE.jump[1], 4.0, 4.9],
  [24.2, 4.0, 4.9],
  [CUE.bump, 3.55, 4.9], // into the belly bump…
  [25.5, 4.4, 4.9], // …and bounced back
];

export const MATE_PATH: readonly Key[] = [
  [0, ...MATE_HOME],
  [CUE.dribble[0], ...MATE_HOME],
  [13.4, -2.6, 4.2], // drops back out of the camera's way and watches
  [23.0, -2.6, 4.2],
  [24.6, 1.2, 4.9],
  [CUE.bump, 1.55, 4.9], // belly to belly (their bellies stick out ~1 each)
  [25.5, 0.8, 4.9],
  [26.5, 0.8, 4.9],
  [28.2, 2.0, 5.2], // next to Tiki for the final whistle
];

/** The tiki-taka: quick passes between Tiki and his teammate, faster each time. [kick, arrive, from Tiki?] */
export const PASSES: readonly (readonly [kick: number, arrive: number, fromTiki: boolean])[] = [
  [8.3, 8.95, false],
  [9.25, 9.85, true],
  [10.1, 10.65, false],
  [10.85, 11.35, true],
  [11.5, 11.95, false],
];

/** Every time a foot meets the ball (for the thump sound and the kicking leg). */
const TOUCH_EVERY = 0.55;
export function touches(): number[] {
  const out = PASSES.map(p => p[0]);
  for (let t = CUE.dribble[0] + TOUCH_EVERY; t < CUE.shot - 0.2; t += TOUCH_EVERY) out.push(t);
  out.push(CUE.shot);
  return out;
}

const R = 0.36; // ball radius
const NET = { x: GOAL.x + 0.6, y: 2.4, z: -2.3 } as const; // where the shot hits the net
export const NET_HIT = NET;

export function ballAt(t: number): readonly [number, number, number] {
  const foot = (p: P2, toward: P2, d = 0.95): P2 => {
    const dx = toward[0] - p[0],
      dz = toward[1] - p[1];
    const len = Math.hypot(dx, dz) || 1;
    return [p[0] + (dx / len) * d, p[1] + (dz / len) * d];
  };
  const atTiki = foot(TIKI_HOME, MATE_HOME),
    atMate = foot(MATE_HOME, TIKI_HOME);
  if (t < PASSES[0]![0]) return [atMate[0], R, atMate[1]];
  if (t < CUE.dribble[0]) {
    for (const [kick, arrive, fromTiki] of PASSES) {
      const [a, b] = fromTiki ? [atTiki, atMate] : [atMate, atTiki];
      if (t < kick) return [a[0], R, a[1]];
      if (t < arrive) {
        const k = (t - kick) / (arrive - kick);
        return [lerp(a[0], b[0], k), R + Math.sin(Math.PI * k) * 0.12, lerp(a[1], b[1], k)];
      }
    }
    return [atTiki[0], R, atTiki[1]];
  }
  if (t < CUE.shot) {
    // dribbling: pushed ahead on every touch, then Tiki catches up
    const [x, z] = along(TIKI_PATH, t);
    const [hx, hz] = heading(TIKI_PATH, t);
    const f = ((t - CUE.dribble[0]) / TOUCH_EVERY) % 1;
    const ahead = 1.0 + 0.45 * Math.sin(Math.PI * f);
    const settle = ease(seg(t, CUE.dribble[0], CUE.dribble[0] + 0.4)); // from where the last pass stopped
    return [lerp(atTiki[0], x + hx * ahead, settle), R, lerp(atTiki[1], z + hz * ahead, settle)];
  }
  const [sx, sz] = along(TIKI_PATH, CUE.shot);
  const start = [sx + 1.0, R, sz] as const;
  if (t < CUE.goal) {
    const k = seg(t, CUE.shot, CUE.goal);
    return [lerp(start[0], NET.x, k), lerp(start[1], NET.y, k) + Math.sin(Math.PI * k) * 0.7, lerp(start[2], NET.z, k)];
  }
  // drops out of the net and rolls to a stop at the back of the goal
  const k = seg(t, CUE.goal, CUE.goal + 0.55);
  const bounce = Math.abs(Math.cos(k * Math.PI * 1.5)) * (1 - k);
  return [lerp(NET.x, GOAL.x + 1.5, ease(k)), R + (NET.y - R) * (1 - k) * (1 - k) + bounce * 0.4, NET.z + k * 0.2];
}

/** How far the net is pushed out (0..1): snaps out when the ball hits, then sways back. */
export const netPush = (t: number): number =>
  t < CUE.goal ? 0 : Math.exp(-(t - CUE.goal) * 3) * Math.min(1, (t - CUE.goal) / 0.08);

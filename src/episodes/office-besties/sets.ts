import * as THREE from 'three';
import { box, mat, picture, ROUND } from '../../world/interior';
import { createProteinBar, BAR_LENGTH, type ProteinBar } from '../../props/protein-bar';

// ── Lulu's emergency protein stash ─────────────────────────────

const FLAVOURS = [
  ['#e2582b', 'Choc Fudge Brownie'],
  ['#3a7bd5', 'Cookies & Cream'],
  ['#d6336c', 'Raspberry Riff'],
  ['#2b2b35', 'Black Metal Mocha'],
  ['#f2a900', 'Salted Caramel'],
  ['#2f9e6a', 'Mint Choc Chip'],
] as const;

const CRATE = { w: 1.6, h: 0.5, d: 0.75 };
/** Bars stand on end in the crate (long side up, label to the front). */
export const UPRIGHT = new THREE.Euler(0, Math.PI / 2, Math.PI / 2);
const slot = (col: number, row: number) =>
  new THREE.Vector3(-CRATE.w / 2 + 0.17 + col * 0.255, 0.06 + BAR_LENGTH / 2, CRATE.d / 2 - 0.2 - row * 0.3);
/** Where the bar she grabs stands: front row, among the Choc Fudge (crate space). */
export const STASH_TOP = slot(0, 0);

/**
 * Lulu's emergency protein stash: a wooden crate on the kitchen counter with bars standing in neat rows, one
 * flavour per row, labels to the front, and a chalkboard tag: 40 g protein. Origin at the crate's base. `bar` is the one she
 * grabs (a separate prop, so it can leave the crate).
 */
export function createStash(): { group: THREE.Group; bar: ProteinBar } {
  const group = new THREE.Group();
  const wood = mat(0xd6a86a, 0.8);
  const dark = mat(0xa8784a, 0.85);
  // the crate: a floor and slatted sides, corner posts
  const floor = box(CRATE.w, 0.06, CRATE.d, dark);
  group.add(floor);
  for (const [w, d, x, z] of [
    [CRATE.w, 0.05, 0, CRATE.d / 2],
    [CRATE.w, 0.05, 0, -CRATE.d / 2],
    [0.05, CRATE.d, CRATE.w / 2, 0],
    [0.05, CRATE.d, -CRATE.w / 2, 0],
  ] as const)
    for (const y of [0.04, 0.24]) {
      const slat = box(w, 0.16, d, wood);
      slat.position.set(x, y, z);
      group.add(slat);
    }
  for (const x of [-1, 1])
    for (const z of [-1, 1]) {
      const post = box(0.07, CRATE.h, 0.07, dark);
      post.position.set((x * (CRATE.w - 0.04)) / 2, 0, (z * (CRATE.d - 0.04)) / 2);
      group.add(post);
    }
  // the bars: a row per flavour (front to back), standing on end
  for (let col = 0; col < 6; col++)
    for (let row = 0; row < 2; row++) {
      if (col === 0 && row === 0) continue; // the one she grabs
      const [colour, flavour] = FLAVOURS[row === 0 ? col : (col + 3) % FLAVOURS.length]!;
      const b = createProteinBar({ colour, flavour });
      b.group.position.copy(slot(col, row));
      b.group.rotation.copy(UPRIGHT);
      group.add(b.group);
    }
  const bar = createProteinBar();
  bar.group.position.copy(STASH_TOP);
  bar.group.rotation.copy(UPRIGHT);
  group.add(bar.group);
  // the chalkboard tag on the front
  const tag = picture(
    1.0,
    0.3,
    (ctx, w, h) => {
      ctx.fillStyle = '#23302a';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${h * 0.42}px ${ROUND}`;
      ctx.fillText('40 g protein', w / 2, h * 0.55);
    },
    { frame: 0x8a5a3a },
  );
  tag.position.set(0, 0.24, CRATE.d / 2 + 0.06);
  group.add(tag);
  return { group, bar };
}

/** Where each of them sits on the campus bench (x along it). */
export const SEATS = { lulu: -2.3, rorit: -0.2, silvi: 1.9 } as const;
/** Where Lulu walks in from (the left), and where she stops to hand the bar over: just in front of Rorit. */
export const LULU_ENTER = new THREE.Vector3(-12, 0, 3.6);
export const LULU_HANDOFF = new THREE.Vector3(-1.4, 0, 2.95);

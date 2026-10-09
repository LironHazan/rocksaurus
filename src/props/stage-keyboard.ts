import * as THREE from 'three';
import { midi as toMidi, type Note } from '../audio/notes';
import { ball, enableShadows } from '../characters/materials';

/** Lowest and highest keys (3 octaves). */
const KEY_RANGE = { low: toMidi('C3'), high: toMidi('B5') } as const;
const WHITE_W = 0.085;
const BLACK_PCS = new Set([1, 3, 6, 8, 10]);
const KEYS_TOP = 1.08; // low stand, so the player's shirt shows above the keys

export interface StageKeyboard {
  group: THREE.Group;
  /** Sets every key's press amount for this frame (0 = up, 1 = fully down). */
  setPressed(levels: ReadonlyMap<number, number>): void;
  /** Point on top of a key (keyboard space), e.g. to put a paw on it. */
  keyTop(note: Note): THREE.Vector3;
  /** Pulses the screen and LEDs (0..1), e.g. on the beat. */
  glow(k: number): void;
}

/**
 * Rock stage keyboard on an X-stand: slim black synth body with a glowing screen, knobs and pitch/mod wheels,
 * a 3-octave keyboard whose keys press down, and a plain back panel facing the audience.
 * The player stands at −z facing +z; the keys' front edge is at z ≈ −0.2.
 */
export function createStageKeyboard(): StageKeyboard {
  const body = new THREE.MeshPhysicalMaterial({ color: 0x15151c, roughness: 0.3, clearcoat: 0.6 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x9aa0aa, metalness: 0.6, roughness: 0.35 });
  const ivory = new THREE.MeshStandardMaterial({ color: 0xfaf6ee, roughness: 0.35 });
  const ebony = new THREE.MeshStandardMaterial({ color: 0x0d0d10, roughness: 0.3 });
  const screen = new THREE.MeshStandardMaterial({ color: 0x3fd4ff, emissive: 0x3fd4ff, emissiveIntensity: 0.6 });
  const led = new THREE.MeshStandardMaterial({ color: 0xff3fa4, emissive: 0xff3fa4, emissiveIntensity: 0.8 });
  const group = new THREE.Group();

  // synth body
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.14, 0.62), body);
  chassis.position.set(0, KEYS_TOP - 0.1, 0.05);
  group.add(chassis);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 0.2), body); // raised control panel behind the keys
  panel.position.set(0, KEYS_TOP + 0.02, 0.27);
  group.add(panel);
  const display = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.01, 0.1), screen);
  display.position.set(0, KEYS_TOP + 0.085, 0.26);
  group.add(display);
  for (let i = 0; i < 6; i++) group.add(ball(0.025, metal, [-0.9 + i * 0.1, KEYS_TOP + 0.09, 0.26], [1, 0.6, 1], 10)); // knobs
  for (let i = 0; i < 4; i++) group.add(ball(0.015, led, [0.4 + i * 0.12, KEYS_TOP + 0.085, 0.3], [1, 0.5, 1], 8)); // LEDs
  for (const x of [-1.08, -1.0]) {
    // pitch + mod wheels
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16), ebony);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, KEYS_TOP, -0.05);
    group.add(wheel);
  }

  // plain back panel facing the audience (the band logo lives on the kick drum)
  const back = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.28), body);
  back.position.set(0, KEYS_TOP - 0.05, 0.37);
  group.add(back);

  // X-stand
  for (const s of [-1, 1]) {
    for (const tilt of [-0.55, 0.55]) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.15, 10), metal);
      bar.position.set(s * 0.6, 0.5, 0.05);
      bar.rotation.x = tilt;
      group.add(bar);
    }
    group.add(ball(0.05, metal, [s * 0.6, 0.5, 0.05]));
  }

  // keys: each pivots at its back end so the front dips when pressed
  const keys = new Map<number, THREE.Group>();
  const keyX = new Map<number, number>();
  const range = [...Array(KEY_RANGE.high - KEY_RANGE.low + 1).keys()].map(i => KEY_RANGE.low + i);
  const whiteCount = range.filter(m => !BLACK_PCS.has(m % 12)).length;
  const x0 = -((whiteCount - 1) * WHITE_W) / 2 + 0.08;
  let whiteIndex = 0;
  for (const m of range) {
    const black = BLACK_PCS.has(m % 12);
    const x = black ? x0 + (whiteIndex - 0.5) * WHITE_W : x0 + whiteIndex * WHITE_W;
    if (!black) whiteIndex++;
    const len = black ? 0.24 : 0.4;
    const pivot = new THREE.Group();
    pivot.position.set(x, black ? KEYS_TOP + 0.025 : KEYS_TOP - 0.02, 0.18);
    const key = new THREE.Mesh(
      new THREE.BoxGeometry(black ? 0.05 : WHITE_W - 0.006, black ? 0.06 : 0.05, len),
      black ? ebony : ivory,
    );
    key.position.z = -len / 2;
    pivot.add(key);
    group.add(pivot);
    keys.set(m, pivot);
    keyX.set(m, x);
  }

  enableShadows(group);

  return {
    group,
    setPressed(levels) {
      for (const [m, pivot] of keys) pivot.rotation.x = -0.09 * (levels.get(m) ?? 0);
    },
    keyTop(note) {
      const m = Math.min(KEY_RANGE.high, Math.max(KEY_RANGE.low, toMidi(note)));
      return new THREE.Vector3(keyX.get(m) ?? 0, KEYS_TOP + 0.06, -0.1);
    },
    glow(k) {
      screen.emissiveIntensity = 0.6 + k * 0.8;
      led.emissiveIntensity = 0.8 + k * 1.5;
    },
  };
}

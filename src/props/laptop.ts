import * as THREE from 'three';
import { box, createScreen, mat, type Screen, type ScreenTheme } from '../world/interior';

export interface Laptop {
  /** Origin at the middle of the base's underside; the keys are toward +z (where the user sits). */
  group: THREE.Group;
  /** Hinged at the back edge: rotation.x = -1.85 is open, 0 is closed. */
  lid: THREE.Group;
  screen: Screen;
  /** A key position (in laptop space) for paws to type on: u, v in -1..1 across the keyboard. */
  key(u: number, v: number, out?: THREE.Vector3): THREE.Vector3;
}

/** A laptop whose screen shows a screen script (see world/screen-script). Opens with `open(k)` via lid.rotation. */
export function createLaptop({ header = '', theme = 'document' as ScreenTheme, color = 0xb8bcc8 } = {}): Laptop {
  const group = new THREE.Group();
  const shell = mat(color, 0.3, { metalness: 0.5 });
  group.add(box(1.5, 0.06, 1, shell));
  const keys = box(1.25, 0.012, 0.45, mat(0x2a2a35, 0.6));
  keys.position.set(0, 0.06, -0.08);
  group.add(keys);
  const lid = new THREE.Group();
  lid.position.set(0, 0.06, -0.5);
  const lidShell = box(1.5, 0.05, 1, shell);
  lidShell.position.z = 0.5;
  const screen = createScreen(1.38, 0.9, { header, theme, px: 900 });
  screen.mesh.rotation.x = Math.PI / 2; // faces down onto the keys while closed
  screen.mesh.position.set(0, -0.005, 0.5);
  lid.add(lidShell, screen.mesh);
  lid.rotation.x = -1.85;
  group.add(lid);
  return {
    group,
    lid,
    screen,
    key: (u, v, out = new THREE.Vector3()) => out.set(u * 0.55, 0.07, -0.08 + v * 0.18),
  };
}

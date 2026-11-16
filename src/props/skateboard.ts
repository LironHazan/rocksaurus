import * as THREE from 'three';
import { box, mat } from '../world/interior';

// A skateboard, nose toward +z: a deck with kicked-up ends (grip tape on top, a print underneath), two trucks, four
// wheels. Wide: sized for a long-neck's stance, her feet side by side.

/** The deck: length, width, thickness, and how high its top stands off the ground. */
const DECK = { length: 2.9, width: 1.6, thick: 0.08 } as const;
export const DECK_TOP = 0.42;
/** The wheels: radius, how far in from each end, how far apart across. */
const WHEEL = { r: 0.14, inset: 0.55, track: 1.25 } as const;
/** How far each end of the deck kicks up (radians), and how long the kicked-up part is. */
const KICK = { angle: 0.35, length: 0.35 } as const;

/** A skateboard; its group's origin is on the ground under its middle. */
export function createSkateboard({ deck = 0xff6fa8, wheels = 0xfff1b8 } = {}): THREE.Group {
  const g = new THREE.Group();
  const grip = mat(0x1b1b22, 0.95);
  const wood = mat(deck, 0.6);
  const flat = DECK.length - 2 * KICK.length;
  const middle = box(DECK.width, DECK.thick, flat, wood);
  middle.position.y = DECK_TOP - DECK.thick;
  const top = box(DECK.width - 0.02, 0.01, flat, grip);
  top.position.y = DECK_TOP;
  g.add(middle, top);
  // the nose and the tail, kicked up
  for (const end of [-1, 1]) {
    const kick = new THREE.Group();
    kick.position.set(0, DECK_TOP - DECK.thick, (end * flat) / 2);
    kick.rotation.x = -end * KICK.angle;
    const part = box(DECK.width, DECK.thick, KICK.length, wood);
    part.position.z = (end * KICK.length) / 2;
    kick.add(part);
    g.add(kick);
  }
  // the trucks and the wheels
  const metal = mat(0xb8bcc6, 0.3, { metalness: 0.7 });
  const urethane = mat(wheels, 0.5);
  for (const end of [-1, 1]) {
    const z = end * (DECK.length / 2 - WHEEL.inset);
    const truck = box(WHEEL.track, 0.08, 0.14, metal);
    truck.position.set(0, WHEEL.r, z);
    g.add(truck);
    for (const side of [-1, 1]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(WHEEL.r, WHEEL.r, 0.1, 16), urethane);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set((side * WHEEL.track) / 2, WHEEL.r, z);
      g.add(wheel);
    }
  }
  return g;
}

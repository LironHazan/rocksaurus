import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { enableShadows } from '../characters/materials';

function cushion(w: number, h: number, d: number, material: THREE.Material, r = 0.12): THREE.Mesh {
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, h / 2, w / 2, d / 2)), material);
}

export interface SeatOptions {
  /** Seat width (across), in metres; dinosaurs need big chairs. */
  width?: number;
  colour?: number;
  legs?: number;
}

/** The seat's top, where a sitter's hips go (in the chair's space). */
export const SEAT_HEIGHT = 1.05;

/**
 * An upholstered seat facing +z: a plump seat cushion, a back, rolled arms and short wooden legs. `width` makes it
 * an armchair (≈2.4) or a couch (≈5).
 */
export function createSeat({ width = 2.4, colour = 0x7a4b8c, legs = 0x4a3020 }: SeatOptions = {}): THREE.Group {
  const g = new THREE.Group();
  const fabric = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.92 });
  const darker = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colour).multiplyScalar(0.8),
    roughness: 0.95,
  });
  const D = 2.0; // depth
  const base = cushion(width, 0.55, D, darker, 0.1);
  base.position.y = 0.5;
  g.add(base);
  const seat = cushion(width - 0.6, 0.32, D - 0.4, fabric, 0.14);
  seat.position.set(0, SEAT_HEIGHT - 0.16, 0.12);
  g.add(seat);
  const back = cushion(width, 1.7, 0.5, fabric, 0.2);
  back.position.set(0, 1.4, -D / 2 + 0.25);
  back.rotation.x = -0.12;
  g.add(back);
  for (const s of [-1, 1]) {
    const arm = cushion(0.42, 1.0, D, fabric, 0.18);
    arm.position.set(s * (width / 2 - 0.2), 1.0, 0);
    g.add(arm);
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, D, 20), fabric);
    roll.rotation.x = Math.PI / 2;
    roll.position.set(s * (width / 2 - 0.2), 1.48, 0);
    g.add(roll);
  }
  const wood = new THREE.MeshStandardMaterial({ color: legs, roughness: 0.6 });
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.25, 10), wood);
      leg.position.set(sx * (width / 2 - 0.2), 0.12, sz * (D / 2 - 0.2));
      g.add(leg);
    }
  enableShadows(g);
  return g;
}

import * as THREE from 'three';
import { cylinder, mat, ROUND } from '../world/interior';
import { textTexture } from '../world/text-texture';

/** A shaker sized for a dinosaur. */
export const SHAKER_SCALE = 1.35;
/** Height of the bottle's middle, where paws grip it. */
export const SHAKER_GRIP = 0.42 * SHAKER_SCALE;
/** Base to spout tip. */
export const SHAKER_LENGTH = 0.97 * SHAKER_SCALE;

/** The protein shaker: tall bottle, screw lid with a spout, a big PROTEIN label. Origin at its base. */
export function createShaker(): THREE.Group {
  const g = new THREE.Group();
  g.add(
    cylinder(0.24, 0.21, 0.75, new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.25, transmission: 0.2 })),
  );
  const shake = cylinder(0.215, 0.195, 0.55, mat(0xb88a6a, 0.9)); // chocolate, obviously
  shake.position.y = 0.02;
  g.add(shake);
  const lid = cylinder(0.25, 0.25, 0.16, mat(0x16121f, 0.4));
  lid.position.y = 0.75;
  const spout = cylinder(0.06, 0.08, 0.14, mat(0x16121f, 0.4));
  spout.position.set(0.08, 0.9, 0);
  g.add(lid, spout);
  // the label wraps around the front of the bottle
  const labelTex = textTexture(
    512,
    192,
    (ctx, w, h) => {
      ctx.fillStyle = '#16121f';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#e63946';
      ctx.fillRect(0, h * 0.08, w, h * 0.06);
      ctx.fillRect(0, h * 0.86, w, h * 0.06);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${h * 0.34}px ${ROUND}`;
      ctx.fillText('PROTEIN', w / 2, h * 0.42);
      ctx.fillStyle = '#ffd36b';
      ctx.font = `600 ${h * 0.17}px ${ROUND}`;
      ctx.fillText('IRON MAN FLAVOR', w / 2, h * 0.7);
    },
    ['700 40px Fredoka'],
  );
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.233, 0.227, 0.3, 32, 1, true, -1.15, 2.3),
    new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.6 }),
  );
  label.position.y = 0.42;
  g.add(label);
  g.scale.setScalar(SHAKER_SCALE);
  return g;
}

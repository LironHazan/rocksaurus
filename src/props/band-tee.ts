import * as THREE from 'three';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
import { textTexture } from '../world/text-texture';
import { enableShadows } from '../characters/materials';
import type { FittedRig } from '../characters/types';

export interface BandTeeOptions {
  /** Text printed across the chest. */
  text: string;
  color?: number;
  ink?: string;
  /** Print font (CSS family, loaded in index.html). */
  font?: string;
}

/**
 * A band T-shirt: a fitted shell over the upper body, short sleeves on the arms, and a printed text on the chest
 * (projected onto the curved shirt so it follows the body). Uses a plain font — not any band's logo artwork.
 */
export function addBandTee(
  rig: FittedRig,
  { text, color = 0x16161c, ink = '#f2efe6', font = "'Cinzel'" }: BandTeeOptions,
) {
  const cloth = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  // the shirt fits the body the rig publishes, so it follows any change to the shape
  const [cx, cy, cz] = rig.fit.torso.center;
  const [rx, ry, rz] = rig.fit.torso.radii;

  const shirt = new THREE.Mesh(
    new THREE.SphereGeometry(1, 56, 36, 0, Math.PI * 2, Math.PI * 0.1, Math.PI * 0.55),
    cloth,
  );
  shirt.scale.set(rx * 1.035, ry * 1.035, rz * 1.035);
  shirt.position.set(cx, cy, cz);
  rig.torso.add(shirt);

  for (const arm of rig.arms) {
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.08, 8, 16), cloth);
    sleeve.position.y = -0.06;
    arm.add(sleeve);
  }

  // chest print, projected onto the shirt
  const print = textTexture(
    1024,
    256,
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = ink;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let size = 150;
      ctx.font = `700 ${size}px ${font}, Georgia, serif`;
      const width = ctx.measureText(text).width;
      if (width > w * 0.94) size *= (w * 0.94) / width;
      ctx.font = `700 ${size}px ${font}, Georgia, serif`;
      ctx.fillText(text, w / 2, h / 2);
    },
    [`700 150px ${font}`],
  );
  // DecalGeometry works in world space: project at the chest's world position, then bring the result back
  // into torso space — so this works wherever the character already stands.
  rig.root.updateMatrixWorld(true);
  const chest = rig.torso.localToWorld(new THREE.Vector3(cx, cy + ry * 0.18, cz + rz * 1.02));
  const facing = new THREE.Euler().setFromQuaternion(rig.torso.getWorldQuaternion(new THREE.Quaternion()));
  const geometry = new DecalGeometry(shirt, chest, facing, new THREE.Vector3(rx * 1.3, rx * 0.33, 0.9));
  geometry.applyMatrix4(rig.torso.matrixWorld.clone().invert());
  const decal = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      map: print,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      roughness: 0.9,
    }),
  );
  rig.torso.add(decal);

  enableShadows(shirt);
  return shirt;
}

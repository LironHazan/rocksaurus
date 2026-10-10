import * as THREE from 'three';
import { ball } from './materials';
import { createTyrannosaurus, TIKI_COLORS } from './tyrannosaurus';
import type { FittedRig } from './types';
import { addBandTee } from '../props/band-tee';
import { TREX_BODY } from '../props/soccer';

const OMLI_COLORS = {
  ...TIKI_COLORS,
  body: 0x8a5a3c, // brown
  stripes: 0x6b4229,
  belly: 0xe8c9a8,
  brow: 0x704630,
};

/**
 * Omli: Lulu's teammate, the stand-in bassist. A T-Rex like Tiki, but brown, bald and very muscular: a broad chest
 * with pecs under his black PANTERA tee (plain lettering, not the band's logo artwork), and huge biceps on those
 * tiny arms.
 */
export function createOmli() {
  const rig = createTyrannosaurus(OMLI_COLORS);
  rig.posture.scale.set(1.12, 1, 1.06); // broad
  const tee = 0x111114;
  // the tee goes on the leaning upper body (the posture), where the T-Rex's body is
  const shirted: FittedRig = { ...rig, torso: rig.posture, fit: { torso: TREX_BODY, head: [1, 1, 1] } };
  addBandTee(shirted, { text: 'PANTERA', font: "'Metal Mania'", color: tee, ink: '#ece6da' });
  const cloth = new THREE.MeshStandardMaterial({ color: tee, roughness: 0.95 });
  for (const s of [-1, 1]) {
    rig.posture.add(ball(0.4, cloth, [s * 0.42, 2.1, 0.8], [1, 0.75, 0.5])); // pecs
    rig.posture.add(ball(0.46, cloth, [s * 0.9, 2.25, 0.15], [1, 0.9, 1])); // big shoulders
  }
  const skin = new THREE.MeshPhysicalMaterial({ color: OMLI_COLORS.body, roughness: 0.6, sheen: 0.6 });
  for (const arm of rig.arms) {
    arm.add(ball(0.26, skin, [0, -0.2, 0.08], [1, 1.2, 1])); // biceps
    arm.add(ball(0.17, skin, [0, -0.05, -0.1], [1, 1.1, 1])); // triceps
  }
  return rig;
}

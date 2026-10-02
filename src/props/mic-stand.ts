import * as THREE from 'three';
import { ball, enableShadows } from '../characters/materials';

export interface MicStand {
  group: THREE.Group;
  /** The mic's grille (stand space) — the singer's mouth goes here. */
  mic: THREE.Vector3;
  /** Where paws hold the stand (stand space), left and right. */
  grips: [THREE.Vector3, THREE.Vector3];
}

/** Classic straight mic stand on a round base, with a silver ball-grille mic angled toward the singer (−z). */
export function createMicStand({ height = 2.35 } = {}): MicStand {
  const chrome = new THREE.MeshStandardMaterial({
    color: 0xc9ced8,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0x222228,
  });
  const black = new THREE.MeshStandardMaterial({ color: 0x15151a, roughness: 0.5 });
  const grille = new THREE.MeshStandardMaterial({
    color: 0xb8bcc6,
    metalness: 0.7,
    roughness: 0.45,
    emissive: 0x1a1a20,
  });
  const group = new THREE.Group();

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.06, 32), black);
  base.position.y = 0.03;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, height, 12), chrome);
  pole.position.y = height / 2;
  const clutch = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12), black);
  clutch.position.y = height * 0.6;
  group.add(base, pole, clutch);

  // mic: handle tilted toward the singer, ball grille on top
  const mic = new THREE.Group();
  mic.position.set(0, height, 0);
  mic.rotation.x = -0.6;
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.3, 16), black);
  handle.position.y = 0.12;
  mic.add(handle, ball(0.085, grille, [0, 0.3, 0], [1, 1, 1], 20));
  group.add(mic);

  enableShadows(group);
  group.updateMatrixWorld(true);
  const micTop = mic.localToWorld(new THREE.Vector3(0, 0.3, 0)).sub(group.position);
  return {
    group,
    mic: micTop,
    grips: [new THREE.Vector3(-0.02, height - 0.25, -0.04), new THREE.Vector3(0.02, height - 0.55, -0.04)],
  };
}

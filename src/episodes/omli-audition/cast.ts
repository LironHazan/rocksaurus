import * as THREE from 'three';
import { ball, enableShadows } from '../../characters/materials';
import { taperedTube } from '../../props/tube';
import { createTyrannosaurus, TIKI_COLORS } from '../../characters/tyrannosaurus';
import { createParasaurolophus } from '../../characters/parasaurolophus';
import { createStegosaurus } from '../../characters/stegosaurus';
import { addBandTee } from '../../props/band-tee';
import { addCap } from '../../props/cap';
import { addGlasses } from '../../props/glasses';
import { addGothOutfit } from '../../props/goth-outfit';
import { addShortHair } from '../../props/short-hair';
import { addJersey, HOME_KIT, TREX_BODY } from '../../props/soccer';

/**
 * Tiki Taka, hurt in the dads' league: his lucky RONALDO 7 shirt, his cap, and a broken right arm. The cast is one
 * bent orange tube from his shoulder, down to the elbow and across his tummy (signed by the band), ending in a white
 * cuff with his paw poking out; a navy sling cradles the forearm, its strap over his shoulder and round his neck.
 * It's all on his upper body, so it moves with him; the real (tiny) arm on that side is hidden.
 */
export function createInjuredTiki() {
  const rig = createTyrannosaurus();
  addCap(rig, { position: [0, 0.3, 0.08], tilt: -0.14 }).scale.set(0.62, 0.66, 0.82);
  addJersey(rig, rig.posture, TREX_BODY, { ...HOME_KIT, number: '7', name: 'RONALDO' });
  const arm = rig.arms.find(a => a.userData.side > 0)!;
  arm.visible = false;

  // the cast: one bent tube of orange fibreglass from the shoulder, down to the elbow, across his tummy to the wrist
  const SHOULDER = new THREE.Vector3(0.66, 1.98, 0.74); // inside the body, so the cast grows out of it
  const ELBOW = new THREE.Vector3(0.66, 1.34, 1.14);
  const WRIST = new THREE.Vector3(-0.28, 1.44, 1.3);
  const castPath = new THREE.CatmullRomCurve3([
    SHOULDER,
    new THREE.Vector3(0.7, 1.62, 1.0),
    ELBOW,
    new THREE.Vector3(0.2, 1.36, 1.27),
    WRIST,
  ]);
  const fibreglass = new THREE.MeshStandardMaterial({ color: 0xff8c42, roughness: 0.8 });
  const cast = new THREE.Mesh(
    taperedTube(castPath, s => 0.2 - s * 0.03, { segments: 48, radial: 20 }),
    fibreglass,
  );
  rig.posture.add(cast);
  // the white padding at the wrist, and his paw poking out
  const end = castPath.getTangentAt(1);
  const cuff = new THREE.Mesh(
    new THREE.TorusGeometry(0.17, 0.05, 10, 24),
    new THREE.MeshStandardMaterial({ color: 0xf6f4ee, roughness: 0.95 }),
  );
  cuff.position.copy(WRIST);
  cuff.lookAt(WRIST.clone().add(end));
  rig.posture.add(cuff);
  const skin = new THREE.MeshPhysicalMaterial({ color: TIKI_COLORS.body, roughness: 0.85, sheen: 1 });
  rig.posture.add(ball(0.14, skin, WRIST.clone().addScaledVector(end, 0.13).toArray()));
  // band signatures: a few dark marker strokes round the forearm
  const marker = new THREE.MeshBasicMaterial({ color: 0x1b1b22 });
  for (const k of [0.68, 0.78, 0.88]) {
    const at = castPath.getPointAt(k);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2 - k * 0.03 + 0.005, 0.01, 4, 20, 2.2), marker);
    ring.position.copy(at);
    ring.lookAt(at.clone().add(castPath.getTangentAt(k)));
    rig.posture.add(ring);
  }

  // the sling: a navy cradle under the forearm, the strap from it over his right shoulder, round his neck and back
  const cloth = new THREE.MeshStandardMaterial({ color: 0x1b2a4a, roughness: 0.9, side: THREE.DoubleSide });
  const cradle = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), cloth);
  cradle.scale.set(0.58, 0.26, 0.27);
  cradle.position.copy(ELBOW).lerp(WRIST, 0.5);
  cradle.position.y -= 0.03;
  cradle.rotation.z = Math.atan2(WRIST.y - ELBOW.y, WRIST.x - ELBOW.x) - Math.PI;
  rig.posture.add(cradle);
  const strapPath = new THREE.CatmullRomCurve3(
    (
      [
        [0.86, 1.4, 1.1], // the elbow end of the cradle
        [0.95, 1.95, 0.85], // up the outside of the cast, over his shoulder
        [0.3, 2.62, 0.25],
        [-0.3, 2.55, 0.35], // round the back of his neck
        [-0.62, 1.95, 0.95],
        [-0.36, 1.45, 1.28], // down to the wrist end
      ] as const
    ).map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  );
  rig.posture.add(
    new THREE.Mesh(
      taperedTube(strapPath, () => 0.06, { segments: 40, radial: 10 }),
      cloth,
    ),
  );
  enableShadows(rig.posture);
  return rig;
}

export function createParis() {
  const rig = createParasaurolophus();
  addGothOutfit(rig);
  return rig;
}

export function createSteggy() {
  const rig = createStegosaurus();
  addBandTee(rig, { text: 'DREAM THEATER' });
  addShortHair(rig);
  addGlasses(rig.head, { eyeX: 0.22, eyeY: 0.1, eyeZ: 0.52, rim: 0.14 });
  return rig;
}

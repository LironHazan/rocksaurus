import * as THREE from 'three';

const DOWN = new THREE.Vector3(0, -1, 0);
const UP = new THREE.Vector3(0, 1, 0);

function capsuleOf(pivot) {
  return pivot.children.find(c => c.isMesh && c.geometry.type === 'CapsuleGeometry');
}

/** Lazily creates the extra parts (paw, elbow joint, forearm) in the pivot's parent space. */
function parts(pivot) {
  if (pivot.userData.reach) return pivot.userData.reach;
  const arm = capsuleOf(pivot);
  const { radius } = arm.geometry.parameters;
  const length = arm.geometry.parameters.height ?? arm.geometry.parameters.length; // renamed in newer Three.js
  const mk = geo => {
    const m = new THREE.Mesh(geo, arm.material);
    m.castShadow = m.receiveShadow = true;
    pivot.parent.add(m);
    return m;
  };
  pivot.userData.reach = {
    arm,
    radius,
    full: length + radius * 2,
    paw: mk(new THREE.SphereGeometry(radius * 1.12, 20, 14)),
    joint: mk(new THREE.SphereGeometry(radius * 1.02, 16, 12)),
    forearm: mk(new THREE.CapsuleGeometry(radius * 0.95, length, 8, 16)),
  };
  return pivot.userData.reach;
}

/**
 * Poses a capsule arm (a shoulder pivot with a CapsuleGeometry child) so its paw lands on `target`.
 * With `elbow`, the arm bends: upper arm shoulder → elbow, forearm elbow → target. Use the elbow to
 * route the arm around an instrument (e.g. forearm resting over the top edge of a bass).
 * All points are in the pivot's parent space. Call every frame after resetPose().
 */
export function reachArm(pivot, target, elbow = null) {
  const p = parts(pivot);
  const end = elbow ?? target;

  // upper arm: shoulder → end
  const d = end.clone().sub(pivot.position);
  const len = d.length();
  pivot.quaternion.setFromUnitVectors(DOWN, d.clone().normalize());
  p.arm.scale.set(1, Math.max(0.2, len / p.full), 1);
  p.arm.position.y = -len / 2;

  p.joint.visible = p.forearm.visible = !!elbow;
  if (elbow) {
    p.joint.position.copy(elbow);
    const f = target.clone().sub(elbow);
    const flen = f.length();
    p.forearm.position.copy(elbow).addScaledVector(f, 0.5);
    p.forearm.quaternion.setFromUnitVectors(UP, f.normalize());
    p.forearm.scale.set(1, Math.max(0.2, flen / p.full), 1);
  }
  p.paw.position.copy(target);
}

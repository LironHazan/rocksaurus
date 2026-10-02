import * as THREE from 'three';

const DOWN = new THREE.Vector3(0, -1, 0);
const UP = new THREE.Vector3(0, 1, 0);

interface ReachParts {
  arm: THREE.Mesh;
  radius: number;
  full: number;
  paw: THREE.Mesh;
  joint: THREE.Mesh;
  forearm: THREE.Mesh;
}

function capsuleOf(pivot: THREE.Object3D): THREE.Mesh {
  const arm = pivot.children.find(
    c => (c as THREE.Mesh).isMesh && (c as THREE.Mesh).geometry.type === 'CapsuleGeometry',
  );
  if (!arm) throw new Error('reachArm: the pivot has no capsule arm');
  return arm as THREE.Mesh;
}

/** Lazily creates the extra parts (paw, elbow joint, forearm) in the pivot's parent space. */
function parts(pivot: THREE.Object3D): ReachParts {
  if (pivot.userData.reach) return pivot.userData.reach as ReachParts;
  const arm = capsuleOf(pivot);
  const params = (arm.geometry as THREE.CapsuleGeometry).parameters as {
    radius: number;
    height?: number;
    length?: number;
  };
  const radius = params.radius;
  const length = params.height ?? params.length ?? 0.2; // renamed in newer Three.js
  const mk = (geo: THREE.BufferGeometry) => {
    const m = new THREE.Mesh(geo, arm.material);
    m.castShadow = m.receiveShadow = true;
    pivot.parent!.add(m);
    return m;
  };
  const created: ReachParts = {
    arm,
    radius,
    full: length + radius * 2,
    paw: mk(new THREE.SphereGeometry(radius * 1.12, 20, 14)),
    joint: mk(new THREE.SphereGeometry(radius * 1.02, 16, 12)),
    forearm: mk(new THREE.CapsuleGeometry(radius * 0.95, length, 8, 16)),
  };
  pivot.userData.reach = created;
  return created;
}

/**
 * Poses a capsule arm (a shoulder pivot with a CapsuleGeometry child) so its paw lands on `target`.
 * With `elbow`, the arm bends: upper arm shoulder → elbow, forearm elbow → target. Use the elbow to
 * route the arm around an instrument (e.g. forearm resting over the top edge of a bass).
 * All points are in the pivot's parent space. Call every frame after resetPose().
 */
export function reachArm(pivot: THREE.Object3D, target: THREE.Vector3, elbow: THREE.Vector3 | null = null): void {
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

/** A rig's left (−1) or right (1) arm pivot. */
export function armOf(rig: { arms: readonly THREE.Object3D[] }, side: -1 | 1): THREE.Object3D {
  const arm = rig.arms.find(a => a.userData.side === side);
  if (!arm) throw new Error(`rig has no arm on side ${side}`);
  return arm;
}

import * as THREE from 'three';

const DOWN = new THREE.Vector3(0, -1, 0);
const UP = new THREE.Vector3(0, 1, 0);

interface ReachParts {
  arm: THREE.Mesh;
  /** Where the capsule sat before any reaching, to put it back. */
  restY: number;
  radius: number;
  full: number;
  paw: THREE.Mesh;
  joint: THREE.Mesh;
  forearm: THREE.Mesh;
}

type CapsuleArm = THREE.Mesh<THREE.CapsuleGeometry>;

const isCapsule = (o: THREE.Object3D): o is CapsuleArm =>
  o instanceof THREE.Mesh && o.geometry instanceof THREE.CapsuleGeometry;

/** The capsule mesh of an arm pivot, if it has one. */
export const findCapsule = (pivot: THREE.Object3D): CapsuleArm | undefined => pivot.children.find(isCapsule);

/** The capsule mesh of an arm pivot (every rig's arms are a shoulder pivot with a capsule child). */
export function capsuleOf(pivot: THREE.Object3D): CapsuleArm {
  const arm = findCapsule(pivot);
  if (!arm) throw new Error('reachArm: the pivot has no capsule arm');
  return arm;
}

/** Which side an arm or foot is on: `userData.side`, set by every rig (-1 left, 1 right). */
export function sideOf(part: THREE.Object3D): -1 | 1 {
  const side: unknown = part.userData.side;
  if (side !== -1 && side !== 1) throw new Error(`${part.name || 'part'} has no userData.side`);
  return side;
}

/** The extra parts reachArm adds to each pivot, created on first reach. */
const reachParts = new WeakMap<THREE.Object3D, ReachParts>();

/** Lazily creates the extra parts (paw, elbow joint, forearm) in the pivot's parent space. */
function parts(pivot: THREE.Object3D): ReachParts {
  const existing = reachParts.get(pivot);
  if (existing) return existing;
  const arm = capsuleOf(pivot);
  const { radius, height: length } = arm.geometry.parameters;
  const mk = (geo: THREE.BufferGeometry) => {
    const m = new THREE.Mesh(geo, arm.material);
    m.castShadow = m.receiveShadow = true;
    pivot.parent!.add(m);
    return m;
  };
  const created: ReachParts = {
    arm,
    restY: arm.position.y,
    radius,
    full: length + radius * 2,
    paw: mk(new THREE.SphereGeometry(radius * 1.12, 20, 14)),
    joint: mk(new THREE.SphereGeometry(radius * 1.02, 16, 12)),
    forearm: mk(new THREE.CapsuleGeometry(radius * 0.95, length, 8, 16)),
  };
  reachParts.set(pivot, created);
  return created;
}

/** An arm never squashes below this much of its length, however close the target: shorter looks like a stump. */
const SHORTEST_ARM = 0.2;

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
  p.arm.scale.set(1, Math.max(SHORTEST_ARM, len / p.full), 1);
  p.arm.position.y = -len / 2;

  p.joint.visible = p.forearm.visible = !!elbow;
  if (elbow) {
    p.joint.position.copy(elbow);
    const f = target.clone().sub(elbow);
    const flen = f.length();
    p.forearm.position.copy(elbow).addScaledVector(f, 0.5);
    p.forearm.quaternion.setFromUnitVectors(UP, f.normalize());
    p.forearm.scale.set(1, Math.max(SHORTEST_ARM, flen / p.full), 1);
  }
  p.paw.position.copy(target);
}

/**
 * Undoes `reachArm`: hides the extra paw, elbow and forearm and puts the capsule back at its natural length, so
 * the arm can be posed by rotating the pivot again. Safe to call on an arm that never reached.
 */
export function releaseArm(pivot: THREE.Object3D): void {
  const p = reachParts.get(pivot);
  if (!p) return;
  p.paw.visible = p.joint.visible = p.forearm.visible = false;
  p.arm.scale.set(1, 1, 1);
  p.arm.position.y = p.restY;
}

/** A rig's left (−1) or right (1) arm pivot. */
export function armOf(rig: { arms: readonly THREE.Object3D[] }, side: -1 | 1): THREE.Object3D {
  const arm = rig.arms.find(a => sideOf(a) === side);
  if (!arm) throw new Error(`rig has no arm on side ${side}`);
  return arm;
}

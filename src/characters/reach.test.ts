import * as THREE from 'three';
import { reachArm, releaseArm, armOf } from './reach';

/** A shoulder pivot with a capsule arm hanging from it, like every rig's arms. */
function arm() {
  const parent = new THREE.Group();
  const pivot = new THREE.Group();
  pivot.position.set(0.7, 1.5, 0.5);
  const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.2, 4, 8), new THREE.MeshBasicMaterial());
  capsule.position.y = -0.16;
  pivot.add(capsule);
  parent.add(pivot);
  return { parent, pivot, capsule };
}

describe('reachArm / releaseArm', () => {
  it('stretches the arm to put the paw on the target', () => {
    const { pivot, capsule } = arm();
    reachArm(pivot, new THREE.Vector3(0.7, 1.5, 2.5));
    expect(capsule.scale.y).toBeGreaterThan(3);
    expect(capsule.position.y).toBeLessThan(-0.5);
  });

  it('bends at the elbow when given one, and shows the extra parts', () => {
    const { pivot, parent } = arm();
    reachArm(pivot, new THREE.Vector3(0.3, 1.5, 2), new THREE.Vector3(1, 1.4, 1.2));
    const extras = parent.children.filter(c => c !== pivot);
    expect(extras).toHaveLength(3);
    expect(extras.every(c => c.visible)).toBe(true);
  });

  it('puts the arm back as it was once released', () => {
    const { pivot, parent, capsule } = arm();
    reachArm(pivot, new THREE.Vector3(0.3, 1.5, 2), new THREE.Vector3(1, 1.4, 1.2));
    releaseArm(pivot);
    expect(capsule.scale.toArray()).toEqual([1, 1, 1]);
    expect(capsule.position.y).toBeCloseTo(-0.16, 10);
    expect(parent.children.filter(c => c !== pivot).every(c => !c.visible)).toBe(true);
  });

  it('is safe on an arm that never reached', () => {
    const { pivot, capsule } = arm();
    expect(() => releaseArm(pivot)).not.toThrow();
    expect(capsule.position.y).toBeCloseTo(-0.16, 10);
  });
});

describe('armOf', () => {
  it('finds an arm by side, not by index', () => {
    const left = new THREE.Group(),
      right = new THREE.Group();
    left.userData.side = -1;
    right.userData.side = 1;
    expect(armOf({ arms: [right, left] }, -1)).toBe(left);
    expect(() => armOf({ arms: [left] }, 1)).toThrow();
  });
});

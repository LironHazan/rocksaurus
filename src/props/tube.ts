import * as THREE from 'three';

export interface TubeOptions {
  segments?: number;
  radial?: number;
}

/** A tube along `curve` whose radius follows radiusAt(s) for s = 0..1 (Three's TubeGeometry can't taper). */
export function taperedTube(
  curve: THREE.Curve<THREE.Vector3>,
  radiusAt: (s: number) => number,
  { segments = 64, radial = 24 }: TubeOptions = {},
): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(segments, false);
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const s = i / segments;
    const c = curve.getPointAt(s);
    const r = radiusAt(s);
    const N = frames.normals[i]!;
    const B = frames.binormals[i]!;
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const n = N.clone().multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a));
      pos.push(c.x + n.x * r, c.y + n.y * r, c.z + n.z * r);
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1); // counter-clockwise from outside → normals face out
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** CatmullRom curve through [x, y, z] points. */
export const curve3 = (pts: readonly [number, number, number][]) =>
  new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));

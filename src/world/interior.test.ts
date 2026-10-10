import * as THREE from 'three';
import { box, cylinder } from './interior';
import { ball } from '../characters/materials';

const m = new THREE.MeshBasicMaterial();

describe('shared geometry', () => {
  it('boxes, cylinders and balls the same size share one geometry; other sizes get their own', () => {
    expect(box(1, 2, 3, m).geometry).toBe(box(1, 2, 3, m).geometry);
    expect(box(1, 2, 3, m).geometry).not.toBe(box(1, 2, 4, m).geometry);
    expect(cylinder(0.2, 0.3, 1, m).geometry).toBe(cylinder(0.2, 0.3, 1, m).geometry);
    expect(cylinder(0.2, 0.3, 1, m, 8).geometry).not.toBe(cylinder(0.2, 0.3, 1, m).geometry);
    expect(ball(0.5, m, [0, 0, 0]).geometry).toBe(ball(0.5, m, [1, 2, 3], [2, 1, 1]).geometry);
    expect(ball(0.5, m, [0, 0, 0]).geometry).not.toBe(ball(0.5, m, [0, 0, 0], [1, 1, 1], 12).geometry);
  });

  it('still stands a box and a cylinder on their base', () => {
    const b = box(1, 2, 1, m).geometry;
    b.computeBoundingBox();
    expect(b.boundingBox!.min.y).toBeCloseTo(0);
    expect(b.boundingBox!.max.y).toBeCloseTo(2);
    const c = cylinder(0.5, 0.5, 3, m).geometry;
    c.computeBoundingBox();
    expect(c.boundingBox!.min.y).toBeCloseTo(0);
    expect(c.boundingBox!.max.y).toBeCloseTo(3);
  });
});

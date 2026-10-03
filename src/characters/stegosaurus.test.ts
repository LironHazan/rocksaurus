import type * as THREE from 'three';
import { createStegosaurus } from './stegosaurus';

/**
 * The band tee and the short hair size themselves from `rig.fit`, so the fit has to describe the body and head
 * the rig really builds. If Steggy's proportions change, this fails — a prompt to check the clothes still fit.
 */
describe('stegosaurus fit', () => {
  const radiiOf = (mesh: THREE.Mesh) => {
    const { radius } = (mesh.geometry as THREE.SphereGeometry).parameters;
    return [radius * mesh.scale.x, radius * mesh.scale.y, radius * mesh.scale.z];
  };

  it('publishes a torso fit matching the body it builds', () => {
    const rig = createStegosaurus();
    const body = rig.torso.getObjectByName('body') as THREE.Mesh;
    expect(body).toBeDefined();
    expect([body.position.x, body.position.y, body.position.z]).toEqual(rig.fit.torso.center);
    expect(radiiOf(body)).toEqual(rig.fit.torso.radii);
  });

  it('publishes a head fit matching the skull it builds', () => {
    const rig = createStegosaurus();
    const skull = rig.head.getObjectByName('skull') as THREE.Mesh;
    expect(skull).toBeDefined();
    expect(radiiOf(skull)).toEqual(rig.fit.head);
  });
});

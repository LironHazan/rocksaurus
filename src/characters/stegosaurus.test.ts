import * as THREE from 'three';
import { createStegosaurus } from './stegosaurus';

/**
 * The band tee and the short hair size themselves from `rig.fit`, so the fit has to describe the body and head
 * the rig really builds. If Steggy's proportions change, this fails — a prompt to check the clothes still fit.
 */
describe('stegosaurus fit', () => {
  /** The named sphere in `root`; fails the test if it is missing or not a sphere. */
  const sphereNamed = (root: THREE.Object3D, name: string) => {
    const mesh = root.getObjectByName(name);
    if (!(mesh instanceof THREE.Mesh && mesh.geometry instanceof THREE.SphereGeometry))
      throw new Error(`no sphere named ${name}`);
    return mesh;
  };
  const radiiOf = (mesh: THREE.Mesh<THREE.SphereGeometry>) => {
    const { radius } = mesh.geometry.parameters;
    return [radius * mesh.scale.x, radius * mesh.scale.y, radius * mesh.scale.z];
  };

  it('publishes a torso fit matching the body it builds', () => {
    const rig = createStegosaurus();
    const body = sphereNamed(rig.torso, 'body');
    expect([body.position.x, body.position.y, body.position.z]).toEqual(rig.fit.torso.center);
    expect(radiiOf(body)).toEqual(rig.fit.torso.radii);
  });

  it('publishes a head fit matching the skull it builds', () => {
    const rig = createStegosaurus();
    const skull = sphereNamed(rig.head, 'skull');
    expect(radiiOf(skull)).toEqual(rig.fit.head);
  });
});

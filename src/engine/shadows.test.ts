import * as THREE from 'three';
import { dropTinyShadowCasters } from './shadows';
import { disposeObject } from './dispose';

/** A sphere mesh that casts and receives shadows, `radius` across in its own geometry. */
function caster(radius: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius), new THREE.MeshStandardMaterial());
  m.castShadow = m.receiveShadow = true;
  return m;
}

describe('dropTinyShadowCasters', () => {
  it('keeps the big shapes casting, stops the small details, and leaves receiving alone', () => {
    const scene = new THREE.Scene();
    const body = caster(1);
    const eyelash = caster(0.02);
    scene.add(body, eyelash);
    dropTinyShadowCasters(scene);
    expect(body.castShadow).toBe(true);
    expect(eyelash.castShadow).toBe(false);
    expect(eyelash.receiveShadow).toBe(true);
  });

  it('measures in the world: a small geometry scaled up is a big shape, and the other way round', () => {
    const scene = new THREE.Scene();
    const blanket = caster(0.1);
    blanket.scale.setScalar(10);
    const shrunk = new THREE.Group();
    shrunk.scale.setScalar(0.05);
    const ball = caster(1);
    shrunk.add(ball);
    scene.add(blanket, shrunk);
    dropTinyShadowCasters(scene);
    expect(blanket.castShadow).toBe(true);
    expect(ball.castShadow).toBe(false);
  });

  it('never turns a non-caster into one', () => {
    const scene = new THREE.Scene();
    const glass = caster(2);
    glass.castShadow = false;
    scene.add(glass);
    dropTinyShadowCasters(scene);
    expect(glass.castShadow).toBe(false);
  });
});

describe('disposeObject', () => {
  it("frees a light's shadow map, which nothing else does", () => {
    const scene = new THREE.Scene();
    const key = new THREE.DirectionalLight();
    key.castShadow = true;
    scene.add(key);
    const freed = vi.spyOn(key.shadow, 'dispose');
    disposeObject(scene);
    expect(freed).toHaveBeenCalledTimes(1);
  });
});

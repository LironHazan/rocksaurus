import * as THREE from 'three';
import { FORMATS } from './formats';
import type { Stage } from './types';
import { browserStandIn } from '../test/browser-stand-in';
import { cuts, direct, overShoulder, type Shot } from './director';

function testStage(): Stage {
  const format = FORMATS.shorts;
  return {
    format,
    renderer: browserStandIn,
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(format.fov, format.width / format.height),
    canvas: document.createElement('canvas'),
    render() {},
    dispose() {},
  };
}

const still =
  (x: number): ((t: number) => Shot) =>
  () => ({ cam: [x, 2, 10], look: [x, 2, 0] });

describe('cuts', () => {
  const where = cuts([
    [0, 'home'],
    [5, 'office'],
    [9, 'home'],
  ] as const);

  it('picks the latest cut at or before t', () => {
    expect([0, 4.99, 5, 8, 9, 30].map(where)).toEqual(['home', 'home', 'office', 'office', 'home', 'home']);
  });

  it('starts on the first location before the first cut', () => {
    expect(where(-1)).toBe('home');
  });

  it('rejects an empty or out-of-order cut list', () => {
    expect(() => cuts([])).toThrow(RangeError);
    expect(() =>
      cuts([
        [5, 'a'],
        [2, 'b'],
      ]),
    ).toThrow(RangeError);
  });
});

describe('direct', () => {
  it('cuts to the location at t, moves the cast in, and films its shot', () => {
    const stage = testStage();
    const home = new THREE.Scene(),
      office = new THREE.Scene();
    const lulu = new THREE.Group();
    const director = direct(
      stage,
      {
        home: { scene: home, cast: [lulu], frame: still(1) },
        office: { scene: office, cast: [lulu], frame: still(2) },
      },
      cuts([
        [0, 'home'],
        [5, 'office'],
      ]),
    );

    director.update(1);
    expect(stage.scene).toBe(home);
    expect(lulu.parent).toBe(home);
    expect(stage.camera.position.toArray()).toEqual([1, 2, 10]);

    director.update(6);
    expect(stage.scene).toBe(office);
    expect(lulu.parent).toBe(office);
    expect(stage.camera.position.toArray()).toEqual([2, 2, 10]);

    // a seek back lands on the same picture as playing there
    director.update(1);
    expect(stage.scene).toBe(home);
    expect(lulu.parent).toBe(home);
  });

  it('takes the stage back when something else swapped its scene (the outro, on a seek back)', () => {
    const stage = testStage();
    const home = new THREE.Scene();
    const director = direct(stage, { home: { scene: home, frame: still(1) } }, () => 'home');
    director.update(0);
    stage.scene = new THREE.Scene();
    director.update(0.5);
    expect(stage.scene).toBe(home);
  });

  it('resets the camera roll before each shot', () => {
    const stage = testStage();
    const director = direct(stage, { home: { scene: new THREE.Scene(), frame: still(1) } }, () => 'home');
    stage.camera.up.set(1, 0, 0);
    director.update(0);
    expect(stage.camera.up.toArray()).toEqual([0, 1, 0]);
  });

  it('frees a scene that several locations share once', () => {
    const stage = testStage();
    const shop = new THREE.Scene();
    const box = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    shop.add(box);
    const freed = vi.spyOn(box.geometry, 'dispose');
    direct(
      stage,
      { browse: { scene: shop, frame: still(1) }, pay: { scene: shop, frame: still(2) } },
      () => 'browse',
    ).dispose();
    expect(freed).toHaveBeenCalledTimes(1);
  });
});

describe('overShoulder', () => {
  it('backs off along the flattened screen normal, swung by the angle, and looks at the screen', () => {
    const screen = new THREE.Vector3(1, 2, 3);
    const shot = overShoulder(screen, new THREE.Vector3(0, 0.5, 1), 2, 0.5, 0);
    expect(shot.look).toEqual([1, 2, 3]);
    expect(shot.cam[0]).toBeCloseTo(1);
    expect(shot.cam[1]).toBeCloseTo(2.5);
    expect(shot.cam[2]).toBeCloseTo(5);
    const swung = overShoulder(screen, new THREE.Vector3(0, 0, 1), 2, 0, Math.PI / 2);
    expect(swung.cam[0]).toBeCloseTo(3);
    expect(swung.cam[2]).toBeCloseTo(3);
  });
});

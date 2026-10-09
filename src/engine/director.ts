import * as THREE from 'three';
import { disposeObject } from './dispose';
import type { EpisodeScene, Stage } from './types';

// The director cuts between a Short's locations and points the camera. Each frame: the location at t gets the stage
// (with its cast moved in), the location poses itself and returns its shot, and the camera takes that shot. Which
// location is on screen is read from t alone, never carried between frames, so a seek lands on the right picture.

type Vec3 = readonly [number, number, number];

/** The camera's position and the point it looks at, in world units. */
export interface Shot {
  cam: Vec3;
  look: Vec3;
}

/** One place a Short cuts to. Several locations may share a scene: a cut to a new beat in the same room. */
export interface Location {
  scene: THREE.Scene;
  /** Characters that appear in more than one scene: moved into this one when the Short cuts to it. */
  cast?: readonly THREE.Object3D[];
  /** Poses the location at time t and returns the shot to film it with. */
  frame(t: number): Shot;
}

/** Plays `locations`, cutting to `where(t)`. `dispose()` frees every location's scene. */
export function direct<W extends string>(
  stage: Stage,
  locations: Readonly<Record<W, Location>>,
  where: (t: number) => NoInfer<W>,
): Required<EpisodeScene> {
  const { camera } = stage;
  return {
    update(t) {
      const here = locations[where(t)];
      if (stage.scene !== here.scene) {
        for (const o of here.cast ?? []) here.scene.add(o);
        stage.scene = here.scene;
      }
      camera.up.set(0, 1, 0);
      const shot = here.frame(t);
      camera.position.set(...shot.cam);
      camera.lookAt(...shot.look);
    },
    dispose() {
      for (const s of new Set(Object.values<Location>(locations).map(l => l.scene))) disposeObject(s);
    },
  };
}

/** A cut list, `[[from, location], …]` sorted by `from`, as a `where(t)` for `direct`. Before the first cut: the first. */
export function cuts<W extends string>(list: readonly (readonly [number, W])[]): (t: number) => W {
  if (list.length === 0) throw new RangeError('a cut list needs at least one cut');
  for (let i = 1; i < list.length; i++)
    if (list[i]![0] < list[i - 1]![0]) throw new RangeError(`cut ${i} (${list[i]![1]}) is before the cut ahead of it`);
  return t => {
    let here = list[0]![1];
    for (const [from, w] of list) if (t >= from) here = w;
    return here;
  };
}

const flat = new THREE.Vector3();

/**
 * A shot of a screen at `pos` facing `normal`, from beside the character who reads it: `angle` swings the camera off
 * the screen's axis (radians, around the vertical) so their head doesn't block it; `rise` lifts it; `dist` backs off.
 */
export function overShoulder(
  pos: THREE.Vector3,
  normal: THREE.Vector3,
  dist: number,
  rise: number,
  angle: number,
): Shot {
  const dir = flat.copy(normal).setY(0).normalize().applyAxisAngle(THREE.Object3D.DEFAULT_UP, angle);
  return { cam: [pos.x + dir.x * dist, pos.y + rise, pos.z + dir.z * dist], look: [pos.x, pos.y, pos.z] };
}

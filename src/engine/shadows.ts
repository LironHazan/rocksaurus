import * as THREE from 'three';

// Every mesh a shadow-casting light sees is drawn again into its shadow map. The sets and rigs mark everything as a
// caster (enableShadows, box(), …), down to eyelashes, spots and buttons, whose shadows are a few blurred texels of a
// 2048² map at most: across the Shorts, 43% of the casters are that small. So the stage keeps only the shapes that
// throw a visible shadow. Everything still RECEIVES shadows.

/** Meshes smaller than this (bounding-sphere radius, world units) don't cast: under 0.3 across, a shadow that small
 * is a smudge of a few texels at our shadow-map resolution. */
const MIN_CASTER_RADIUS = 0.15;

const center = new THREE.Vector3();
const turn = new THREE.Quaternion();
const size = new THREE.Vector3();

/** How big a mesh is in the world: its geometry's bounding sphere, scaled by its world scale. */
function worldRadius(mesh: THREE.Mesh): number {
  mesh.geometry.computeBoundingSphere();
  const sphere = mesh.geometry.boundingSphere;
  if (!sphere) return 0;
  mesh.matrixWorld.decompose(center, turn, size);
  return sphere.radius * Math.max(Math.abs(size.x), Math.abs(size.y), Math.abs(size.z));
}

/** Stops the small meshes in `scene` from casting shadows (they keep receiving them). Call once per scene. */
export function dropTinyShadowCasters(scene: THREE.Scene): void {
  scene.updateMatrixWorld(true);
  scene.traverse(o => {
    if (o instanceof THREE.Mesh && o.castShadow && worldRadius(o) < MIN_CASTER_RADIUS) o.castShadow = false;
  });
}

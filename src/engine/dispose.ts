import * as THREE from 'three';

/**
 * Frees GPU memory for everything under `root`: geometries, materials and their textures, and the lights' shadow
 * maps (a 2048² render target per shadow-casting light, which nothing else frees).
 */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse(obj => {
    if (obj instanceof THREE.Light) obj.dispose();
    if (!(obj instanceof THREE.Mesh || obj instanceof THREE.Sprite)) return;
    obj.geometry.dispose();
    const materials: THREE.Material[] = [obj.material].flat();
    for (const m of materials) {
      for (const value of Object.values(m)) {
        if (value instanceof THREE.Texture) value.dispose();
      }
      m.dispose();
    }
  });
}

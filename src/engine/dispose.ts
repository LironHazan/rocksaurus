import type * as THREE from 'three';

/** Frees GPU memory for everything under `root` (geometries, materials and their textures). */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse(obj => {
    const mesh = obj as THREE.Mesh;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const m of materials) {
      for (const value of Object.values(m)) {
        if (value && typeof value === 'object' && 'isTexture' in value) (value as THREE.Texture).dispose();
      }
      m.dispose();
    }
  });
}

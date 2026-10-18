import * as THREE from './threejs/three.module.js';
import {GLTFLoader} from './threejs/loaders/GLTFLoader.js';

// Keep baked placements and interaction IDs for conductors and reset controls.
export function sceneryModelSource(source) {
 const name = new URL(source).pathname.match(/\/assets\/(conductor|resetStone)\.obj$/)?.[1];
 if (!name) return source;
 const file = name === 'resetStone' ? 'shrine.gltf' : 'shrine_candles.gltf';
 return new URL('../../media/models/inside/shrine_light/' + file, import.meta.url).href;
}

/** Flatten glTF node transforms for the world's shared, instanced geometry. */
export function bakeShrineModel(root) {
 root.updateMatrixWorld(true);
 const bounds = new THREE.Box3().setFromObject(root);
 const scale = .75 / (bounds.max.y - bounds.min.y);
 const center = bounds.getCenter(new THREE.Vector3());
 const fit = new THREE.Matrix4().makeScale(scale, scale, scale)
  .multiply(new THREE.Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z));
 const model = new THREE.Group(), originals = new Set();
 root.traverse(child => {
  if (!child.isMesh) return;
  const geometry = child.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(fit, child.matrixWorld));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, child.material);
  mesh.name = child.name;
  model.add(mesh);
  originals.add(child.geometry);
 });
 for (const geometry of originals) geometry.dispose();
 return model;
}

export async function loadShrineModel(source) {
 return bakeShrineModel((await new GLTFLoader().loadAsync(source)).scene);
}

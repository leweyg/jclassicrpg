import * as THREE from './threejs/three.module.js';
import { GLTFLoader } from './threejs/loaders/GLTFLoader.js';

/** Actor IDs stay independent of filenames and of the baked world pack. */
export function modelForActor(data, actorId) {
 const id = data.actorModels?.[actorId];
 return data.models?.find(model => model.id === id) ?? null;
}

/** The KeyKit exports contain a T-pose rig, but no animation clips. */
export function applyIdlePose(root) {
 for (const [name, angle] of [['upperarm.l', -65], ['upperarm.r', 65]]) {
  const bone = root.getObjectByName(name) ?? root.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name));
  if (!bone?.isBone) continue;
  root.updateMatrixWorld(true);
  const parent = bone.parent.getWorldQuaternion(new THREE.Quaternion());
  const turn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(angle));
  bone.quaternion.premultiply(parent.clone().invert().multiply(turn).multiply(parent));
 }
 root.updateMatrixWorld(true);
}

/** Bake the requested pose and all mesh transforms for ordinary instancing.
 * Shared textures/materials are preserved; no per-actor skeleton or frame loop.
 */
export function bakeCharacterModel(gltf, definition) {
 const root = gltf.scene;
 const clip = gltf.animations?.find(animation => animation.name === definition.pose);
 let mixer;
 if (clip) {
  mixer = new THREE.AnimationMixer(root);
  mixer.clipAction(clip).play();
  mixer.update(0);
 } else if (definition.pose === 'Idle') applyIdlePose(root);
 root.scale.multiply(new THREE.Vector3(...(definition.scale ?? [1, 1, 1])));
 root.updateMatrixWorld(true);
 root.traverse(child => { if (child.isSkinnedMesh) child.skeleton.update(); });
 const model = new THREE.Group(), vertex = new THREE.Vector3();
 root.traverse(child => {
  if (!child.isMesh) return;
  const geometry = child.geometry.clone();
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
   child.getVertexPosition(i, vertex).applyMatrix4(child.matrixWorld);
   positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  geometry.deleteAttribute('skinIndex');
  geometry.deleteAttribute('skinWeight');
  geometry.morphAttributes = {};
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, child.material);
  mesh.name = child.name;
  model.add(mesh);
 });
 mixer?.stopAllAction();
 mixer?.uncacheRoot(root);
 const geometries = new Set(), skeletons = new Set();
 root.traverse(child => { if (child.isMesh) geometries.add(child.geometry); if (child.isSkinnedMesh) skeletons.add(child.skeleton); });
 for (const geometry of geometries) geometry.dispose();
 for (const skeleton of skeletons) skeleton.dispose();
 return model;
}

export async function loadCharacterModel(definition) {
 const url = new URL('../../' + definition.source, import.meta.url);
 return bakeCharacterModel(await new GLTFLoader().loadAsync(url.href), definition);
}

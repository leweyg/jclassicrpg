import * as THREE from './threejs/three.module.js';

/** A fixed portrait cut: no animation, timers, or changes to player position. */
export function frameConversation(camera, bounds) {
 const size = bounds.getSize(new THREE.Vector3());
 const target = bounds.getCenter(new THREE.Vector3());
 target.y = bounds.min.y + size.y * 0.56;
 camera.fov = 32;
 camera.near = 0.03;
 camera.updateProjectionMatrix();
 const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
 const distance = Math.max(size.y * 1.12, size.x / Math.max(camera.aspect, 0.1) * 1.15) / (2 * tangent);
 const forward = camera.getWorldDirection(new THREE.Vector3());
 camera.position.copy(target).addScaledVector(forward, -(distance + size.z / 2));
 camera.updateMatrixWorld(true);
}

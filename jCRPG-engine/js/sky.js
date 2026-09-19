import * as THREE from './threejs/three.module.js';

/** Use the shipped cube faces without three.js's default X reflection.
 * Sampling +X instead of -X corrects horizontal orientation; Y/Z stay intact.
 */
export function createSky(texture) {
	const shader = THREE.ShaderLib.cube;
	const uniforms = THREE.UniformsUtils.clone(shader.uniforms);
	uniforms.tCube.value = texture;
	uniforms.tFlip.value = 1;
	const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.ShaderMaterial({
		name: 'JClassicSky', uniforms, vertexShader: shader.vertexShader, fragmentShader: shader.fragmentShader,
		side: THREE.BackSide, depthTest: false, depthWrite: false, fog: false, toneMapped: false,
	}));
	mesh.frustumCulled = false;
	mesh.renderOrder = -1000;
	mesh.onBeforeRender = function (renderer, scene, camera) { this.matrixWorld.copyPosition(camera.matrixWorld); };
	return mesh;
}

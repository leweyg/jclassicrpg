import * as THREE from './threejs/three.module.js';

// One-time calibration. Rotation is counterclockwise in UV space, after flips.
// Order matches BoxGeometry / CubeTextureLoader: +X, -X, +Y, -Y, +Z, -Z.
export const SKY_FACE_ORIENTATIONS = Object.freeze([
	{ name: 'east', rotation: 0, flipU: true, flipV: false },
	{ name: 'west', rotation: 0, flipU: true, flipV: false },
	{ name: 'top', rotation: 270, flipU: true, flipV: false },
	{ name: 'bottom', rotation: 90, flipU: true, flipV: false },
	{ name: 'south', rotation: 0, flipU: true, flipV: false },
	{ name: 'north', rotation: 0, flipU: true, flipV: false },
]);

function pinToFarPlane(shader) {
	shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>',
		'#include <project_vertex>\n gl_Position.z = gl_Position.w;');
}

/** A single closed cube; face UVs are baked once, with exactly coincident edges. */
export function createSky(cubeTexture) {
	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const uv = geometry.attributes.uv;
	const materials = SKY_FACE_ORIENTATIONS.map((orientation, face) => {
		const turns = ((orientation.rotation / 90) % 4 + 4) % 4;
		if (!Number.isInteger(turns)) throw new Error('Sky rotations must be multiples of 90 degrees');
		for (let i = face * 4; i < face * 4 + 4; i++) {
			let u = uv.getX(i) - 0.5, v = uv.getY(i) - 0.5;
			if (orientation.flipU) u = -u;
			if (orientation.flipV) v = -v;
			for (let turn = 0; turn < turns; turn++) { const previousU = u; u = -v; v = previousU; }
			uv.setXY(i, u + 0.5, v + 0.5);
		}
		const texture = new THREE.Texture(cubeTexture.images[face]);
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
		// Avoid unrelated face mip levels or wrapping bleeding into a shared edge.
		texture.minFilter = texture.magFilter = THREE.LinearFilter;
		texture.generateMipmaps = false;
		texture.needsUpdate = true;
		const material = new THREE.MeshBasicMaterial({
			name: `Sky ${orientation.name}`, map: texture, side: THREE.BackSide,
			depthTest: false, depthWrite: false, fog: false, toneMapped: false,
		});
		material.onBeforeCompile = pinToFarPlane;
		return material;
	});
	const mesh = new THREE.Mesh(geometry, materials);
	mesh.frustumCulled = false;
	mesh.renderOrder = -1000;
	mesh.onBeforeRender = function (renderer, scene, camera) { this.matrixWorld.copyPosition(camera.matrixWorld); };
	return mesh;
}

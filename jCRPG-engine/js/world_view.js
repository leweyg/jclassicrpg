import * as THREE from './threejs/three.module.js';
import { BakedView } from './world/baked_view.js';
import { loadObjModel } from './obj_mtl_loader.js';
import { CHUNK_SIZE, GRID_SIDE, GRID_STEP, VEGETATION_PER_CHUNK } from './world_stream.js';

const SPECIES = [
	['tree', 'pine_bb1.obj', 1.2, 1.8], ['tree', 'great_pine_bb1.obj', 0.6, 0.9],
	['tree', 'palm_02.obj', 1, 1.4], ['tree', 'high_bb_1.obj', 0.8, 1.2, 1.5],
	['bush', 'Bush_01.obj', 1, 1.6], ['bush', 'bush1.obj', 1.2, 2], ['bush', 'bush2.obj', 1, 1.5],
];
const COLORS = [0x9ca979, 0x6b8852, 0x939184, 0x397caa, 0xaa9874, 0xc0b38e].map(c => new THREE.Color(c));
const CLIMATE_COLORS = [0xffffff, 0xdbe4e7, 0xd5b97f, 0x85ab61].map(c => new THREE.Color(c));

/** Fixed pool: shared asset geometry/materials, reusable terrain and instance buffers.
 * Once ready, walking performs no model fetches and creates no scene objects.
 */
export class WorldView {
	constructor(scene, stream, wake = null) {
		this.scene = scene;
		this.stream = stream;
		this.slots = [];
		this.dummy = new THREE.Object3D();
		this.color = new THREE.Color();
		this.bakedView = stream.manifest ? new BakedView(scene, stream, wake) : null;
	}

	async build() {
		const assets = await Promise.all([
			loadObjModel('media/models/ground', 'ground_1.obj'),
			...SPECIES.map(([dir, file]) => loadObjModel(`media/models/${dir}`, file, {vegetation:true})),
		]);
		this.models = assets.slice(1);
		this.models.forEach((model, index) => model.traverse(child => {
			if (child.isMesh && !child.material.map) child.material.color.setHSL(0.28 + ((index * 37) % 10) / 100, 0.45, 0.32);
		}));
		const material = assets[0].children[0].material.clone();
		material.vertexColors = true;
		const indices = [];
		for (let z = 0; z < GRID_SIDE - 1; z++) for (let x = 0; x < GRID_SIDE - 1; x++) {
			const a = z * GRID_SIDE + x, b = a + 1, c = a + GRID_SIDE, d = c + 1;
			indices.push(a, d, b, a, c, d);
		}
		for (let i = 0; i < this.stream.chunks.length; i++) {
			const geometry = new THREE.BufferGeometry();
			const count = GRID_SIDE * GRID_SIDE;
			geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
			geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
			geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
			geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
			geometry.setIndex(indices);
			for (let z = 0, j = 0; z < GRID_SIDE; z++) for (let x = 0; x < GRID_SIDE; x++, j++) {
				geometry.attributes.position.setXYZ(j, x * GRID_STEP, 0, z * GRID_STEP);
				geometry.attributes.uv.setXY(j, x, z);
			}
			const terrain = new THREE.Mesh(geometry, material);
			terrain.receiveShadow = true;
			const group = new THREE.Group();
			group.add(terrain);
			const vegetation = this.models.map(model => model.children.map(child => {
				const mesh = new THREE.InstancedMesh(child.geometry, child.material, VEGETATION_PER_CHUNK);
				mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
				mesh.castShadow = true;
				mesh.receiveShadow = true;
				mesh.count = 0;
				group.add(mesh);
				return mesh;
			}));
			this.scene.add(group);
			this.slots.push({ group, terrain, vegetation, counts: new Uint16Array(SPECIES.length), revision: -1 });
		}
		this.sync();
	}

	setRealm(realm, save) {
		for (const slot of this.slots) slot.group.visible = realm !== 'cave';
		this.bakedView?.setRealm(realm, save);
	}

	sync() {
		this.bakedView?.sync();
		for (let i = 0; i < this.slots.length; i++) {
			const slot = this.slots[i], chunk = this.stream.chunks[i];
			if (slot.revision === chunk.revision) continue;
			slot.revision = chunk.revision;
			slot.group.position.set(chunk.x * CHUNK_SIZE, 0, chunk.z * CHUNK_SIZE);
			const geometry = slot.terrain.geometry;
			for (let j = 0; j < chunk.heights.length; j++) {
				geometry.attributes.position.setY(j, chunk.heights[j]);
				this.color.copy(COLORS[chunk.types[j]]);
				if (chunk.types[j] < 3) this.color.multiply(CLIMATE_COLORS[chunk.climates[j]]);
				geometry.attributes.color.setXYZ(j, this.color.r, this.color.g, this.color.b);
			}
			geometry.attributes.position.needsUpdate = true;
			geometry.attributes.color.needsUpdate = true;
			geometry.computeVertexNormals();
			geometry.computeBoundingSphere();
			slot.counts.fill(0);
			for (let j = 0; j < chunk.plantCount; j++) {
				const p = j * 6, plants = chunk.vegetation;
				let species = Math.floor(plants[p + 3] * SPECIES.length);
				const climate = chunk.climates[Math.min(16, Math.floor(plants[p + 2] / 2)) * GRID_SIDE + Math.min(16, Math.floor(plants[p] / 2))];
				if (species === 2 && climate < 2) species = 0; // palms only in warmer belts
				const scale = SPECIES[species][2] + plants[p + 4] * (SPECIES[species][3] - SPECIES[species][2]);
				this.dummy.position.set(plants[p], plants[p + 1], plants[p + 2]);
				this.dummy.rotation.y = plants[p + 5];
				// Broaden only the tall deciduous species; retain its original height.
				const width = scale * (SPECIES[species][4] ?? 1);
				this.dummy.scale.set(width, scale, width);
				this.dummy.updateMatrix();
				for (let k = 0; k < slot.vegetation[species].length; k++) slot.vegetation[species][k].setMatrixAt(slot.counts[species], this.dummy.matrix);
				slot.counts[species]++;
			}
			for (let species = 0; species < SPECIES.length; species++) {
				const meshes = slot.vegetation[species];
				for (let k = 0; k < meshes.length; k++) {
					const mesh = meshes[k];
					mesh.count = slot.counts[species];
					mesh.visible = mesh.count > 0;
					mesh.instanceMatrix.needsUpdate = true;
					if (mesh.visible) mesh.computeBoundingSphere();
				}
			}
		}
	}
}

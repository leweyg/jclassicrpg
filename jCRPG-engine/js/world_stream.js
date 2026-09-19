/** Bounded surface cache for the frozen world; no DOM or three.js dependencies. */
import { Terrain, javaMix, wrap } from './frozen_world.js';
export const CHUNK_SIZE = 32;
export const CHUNK_RADIUS = 2;
export const GRID_STEP = 2;
export const GRID_SIDE = CHUNK_SIZE / GRID_STEP + 1;
export const VEGETATION_PER_CHUNK = 64;
const DIAMETER = CHUNK_RADIUS * 2 + 1;

export class WorldStream {
	constructor(world) {
		this.world = world;
		this.centerX = NaN;
		this.centerZ = NaN;
		this.chunks = Array.from({ length: DIAMETER * DIAMETER }, () => ({
			x: NaN, z: NaN, revision: 0,
			heights: new Float32Array(GRID_SIDE * GRID_SIDE),
			types: new Uint8Array(GRID_SIDE * GRID_SIDE),
			climates: new Uint8Array(GRID_SIDE * GRID_SIDE),
			// Per plant: local x, absolute height, local z, species fraction, scale fraction, rotation.
			vegetation: new Float32Array(VEGETATION_PER_CHUNK * 6), plantCount: 0,
		}));
	}

	/** Same triangle interpolation as the rendered two-unit terrain grid. */
	heightAt(x, z) {
		const gx = Math.floor(x / GRID_STEP) * GRID_STEP, gz = Math.floor(z / GRID_STEP) * GRID_STEP;
		const u = (x - gx) / GRID_STEP, v = (z - gz) / GRID_STEP;
		const a = this.world.heightAt(gx, gz), d = this.world.heightAt(gx + GRID_STEP, gz + GRID_STEP);
		if (u >= v) return a * (1 - u) + this.world.heightAt(gx + GRID_STEP, gz) * (u - v) + d * v;
		return a * (1 - v) + this.world.heightAt(gx, gz + GRID_STEP) * (v - u) + d * u;
	}

	/** Only rebuilds recycled slots when a chunk boundary is crossed. */
	update(x, z) {
		const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
		if (cx === this.centerX && cz === this.centerZ) return false;
		this.centerX = cx; this.centerZ = cz;
		for (let gx = cx - CHUNK_RADIUS; gx <= cx + CHUNK_RADIUS; gx++) {
			for (let gz = cz - CHUNK_RADIUS; gz <= cz + CHUNK_RADIUS; gz++) {
				const chunk = this.chunks[wrap(gx, DIAMETER) * DIAMETER + wrap(gz, DIAMETER)];
				if (chunk.x === gx && chunk.z === gz) continue;
				chunk.x = gx; chunk.z = gz;
				this._fill(chunk);
				chunk.revision++;
			}
		}
		return true;
	}

	_fill(chunk) {
		const ox = chunk.x * CHUNK_SIZE, oz = chunk.z * CHUNK_SIZE;
		for (let z = 0, i = 0; z < GRID_SIDE; z++) for (let x = 0; x < GRID_SIDE; x++, i++) {
			const wx = ox + x * GRID_STEP, wz = oz + z * GRID_STEP;
			chunk.heights[i] = this.world.heightAt(wx, wz);
			chunk.types[i] = this.world.typeAt(wx, wz);
			chunk.climates[i] = this.world.climateAt(wx, wz);
		}
		chunk.plantCount = 0;
		// Decorative flora uses a stable coordinate hash; it does not generate geography.
		for (let i = 0; i < VEGETATION_PER_CHUNK; i++) {
			const wx0 = wrap(ox, this.world.sizeX), wz0 = wrap(oz, this.world.sizeZ);
			const x = (javaMix(wx0, wz0, i * 7 + 1) >>> 0) % 32000 / 1000;
			const z = (javaMix(wx0, wz0, i * 7 + 2) >>> 0) % 32000 / 1000;
			const type = this.world.typeAt(ox + x, oz + z);
			if (type >= Terrain.WATER || (type !== Terrain.FOREST && i % 8 !== 0)) continue;
			const offset = chunk.plantCount++ * 6;
			chunk.vegetation[offset] = x;
			chunk.vegetation[offset + 1] = this.heightAt(ox + x, oz + z);
			chunk.vegetation[offset + 2] = z;
			chunk.vegetation[offset + 3] = (javaMix(wx0, wz0, i * 7 + 3) >>> 0) % 1000 / 1000;
			chunk.vegetation[offset + 4] = (javaMix(wx0, wz0, i * 7 + 4) >>> 0) % 1000 / 1000;
			chunk.vegetation[offset + 5] = (javaMix(wx0, wz0, i * 7 + 5) >>> 0) % 6283 / 1000;
		}
	}
}

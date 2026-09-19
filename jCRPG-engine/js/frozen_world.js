/** Surface adapter for the bundled frozen save. Geography/settlement locations
 * come from the export. Surface meshes, flora placement and river/coast detail
 * are simplified; caves, buildings, roads and encounters are not implemented.
 */
export const Terrain = Object.freeze({ PLAIN: 0, FOREST: 1, MOUNTAIN: 2, WATER: 3, SETTLEMENT: 4, SHRINE: 5 });
export const TERRAIN_NAMES = ['Plains', 'Forest', 'Mountains', 'Water', 'Settlement', 'Shrine'];
export const wrap = (value, size) => ((value % size) + size) % size;

// HashUtil.mix, including Java's signed 32-bit overflow and unsigned shifts.
export function javaMix(a, b, c, seed = 0) {
	a = (a + seed) | 0; b = (b - seed) | 0; c = (c + seed) | 0;
	a = (a - b - c) ^ (c >>> 13); b = (b - c - a) ^ (a << 8); c = (c - a - b) ^ (b >>> 13);
	a = (a - b - c) ^ (c >>> 12); b = (b - c - a) ^ (a << 16); c = (c - a - b) ^ (b >>> 5);
	a = (a - b - c) ^ (c >>> 3); b = (b - c - a) ^ (a << 10); c = (c - a - b) ^ (b >>> 15);
	return c === -2147483648 ? c : Math.abs(c);
}

let loadPromise;
export function loadFrozenWorld() {
	if (!loadPromise) loadPromise = fetch('jCRPG-engine/json/frozen_world.json')
		.then(response => {
			if (!response.ok) throw new Error(`Frozen world: HTTP ${response.status}`);
			return response.json();
		}).then(data => new FrozenWorld(data)).catch(error => { loadPromise = null; throw error; });
	return loadPromise;
}

export class FrozenWorld {
	constructor(data) {
		if (data.version !== 1 || data.sizeX !== 1600 || data.sizeZ !== 1600 || data.cellSize !== 40) {
			throw new Error('Unsupported frozen world export');
		}
		this.sizeX = data.sizeX;
		this.sizeZ = data.sizeZ;
		this.seed = data.seed;
		this.geographySeed = data.geographySeed;
		this.groundLevel = data.groundLevel;
		this.spawn = data.spawn;
		this.layers = Object.fromEntries(data.layers.map(layer => [layer.kind, { ...layer, cells: Uint8Array.from(layer.cells) }]));
		this.landmarks = data.landmarks;
		this.climates = new Uint8Array(1600);
		const climateTypes = ['Continental', 'Arctic', 'Desert', 'Tropical'];
		for (const belt of data.climates) for (let i = 0; i < 1600; i++) {
			if (belt.cells[i]) this.climates[i] = Math.max(0, climateTypes.indexOf(belt.kind));
		}
		this.landmarkCells = Array.from({ length: 1600 }, () => []);
		for (const landmark of this.landmarks) {
			for (let z = Math.floor(landmark.z / 40); z <= Math.floor((landmark.z + landmark.sizeZ - 1) / 40); z++) {
				for (let x = Math.floor(landmark.x / 40); x <= Math.floor((landmark.x + landmark.sizeX - 1) / 40); x++) {
					this.landmarkCells[wrap(z, 40) * 40 + wrap(x, 40)].push(landmark);
				}
			}
		}
	}

	_cell(x, z) { return Math.floor(z / 40) * 40 + Math.floor(x / 40); }

	landmarkAt(x, z) {
		x = wrap(x, this.sizeX); z = wrap(z, this.sizeZ);
		const landmarks = this.landmarkCells[this._cell(x, z)];
		for (let i = 0; i < landmarks.length; i++) {
			const l = landmarks[i];
			if (x >= l.x && x < l.x + l.sizeX && z >= l.z && z < l.z + l.sizeZ) return l;
		}
		return null;
	}

	_oceanAt(x, z) {
		const ocean = this.layers.Ocean;
		const density = ocean.density * ocean.magnification;
		const densityModifier = javaMix(Math.floor(x / density) + this.geographySeed, 0, Math.floor(z / density), this.seed) % 100 - 50;
		return ocean.cells[this._cell(x, z)] &&
			javaMix(Math.floor(x / 40) + this.geographySeed, 0, Math.floor(z / 40), this.seed) % 100 + densityModifier >= ocean.noWaterPercentage;
	}

	_riverAt(x, z) {
		// Simplified channel joining the actual saved river boundary cells.
		const cells = this.layers.River.cells;
		const cx = Math.floor(x / 40), cz = Math.floor(z / 40);
		if (!cells[cz * 40 + cx]) return false;
		const lx = x % 40, lz = z % 40, width = this.layers.River.width + 1;
		return (Math.abs(lx - 20) <= width && ((lz >= 20 && cells[wrap(cz + 1, 40) * 40 + cx]) ||
			(lz <= 20 && cells[wrap(cz - 1, 40) * 40 + cx]))) ||
			(Math.abs(lz - 20) <= width && ((lx >= 20 && cells[cz * 40 + wrap(cx + 1, 40)]) ||
			(lx <= 20 && cells[cz * 40 + wrap(cx - 1, 40)])));
	}

	typeAt(x, z) {
		x = wrap(x, this.sizeX); z = wrap(z, this.sizeZ);
		const landmark = this.landmarkAt(x, z);
		if (landmark) return landmark.kind === 'RoadShrine' ? Terrain.SHRINE : Terrain.SETTLEMENT;
		if (this._oceanAt(x, z) || this._riverAt(x, z)) return Terrain.WATER;
		const index = this._cell(x, z);
		if (this.layers.Forest.cells[index]) return Terrain.FOREST;
		if (this.layers.Mountain.cells[index]) return Terrain.MOUNTAIN;
		return Terrain.PLAIN;
	}

	climateAt(x, z) { return this.climates[this._cell(wrap(x, this.sizeX), wrap(z, this.sizeZ))]; }

	heightAt(x, z) {
		x = Math.floor(wrap(x, this.sizeX)); z = Math.floor(wrap(z, this.sizeZ));
		const landmark = this.landmarkAt(x, z);
		if (landmark) return landmark.y;
		if (this._oceanAt(x, z)) return this.layers.Ocean.worldGroundLevel;
		if (this._riverAt(x, z)) return this.layers.River.worldGroundLevel;
		const index = this._cell(x, z), lx = x % 40, lz = z % 40;
		// Geography.calculateTransformedCoordinates + Plain/Forest/Mountain.getPointHeightInside.
		if (this.layers.Mountain.cells[index]) {
			const mountain = this.layers.Mountain;
			const bump = 400 - (lx - 20) ** 2 - (lz - 20) ** 2 + Math.max(0, 25 - (lx - 20) ** 2 - (lz - 20) ** 2) * 5;
			return mountain.worldGroundLevel + Math.max(0, bump / 160) * mountain.worldRelHeight +
				(javaMix(Math.floor(x / 3), Math.floor(z / 3), 0, this.seed) % 100 - 50) / 60;
		}
		const forest = this.layers.Forest.cells[index];
		const hill = Math.max(0, 25 - (lx % 10 - 20) ** 2 - (lz % 10 - 20) ** 2) * 5;
		return this.groundLevel + Math.max(0,
			(javaMix(Math.floor(x / 5), Math.floor(z / 5), 0, this.seed) % 100 - 30) / (forest ? 50 : 70) + hill / (forest ? 40 : 80));
	}
}

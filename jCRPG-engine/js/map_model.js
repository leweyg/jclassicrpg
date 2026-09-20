import { wrap } from './frozen_world.js';

export const VISIBLE_RADIUS = 58; // Scene fog end, in world units.
export const MINIMAP_RADIUS = VISIBLE_RADIUS * 2;
export const MARKER_STYLES = Object.freeze({
	shrine: { label: 'Shrines', color: '#ffe399', symbol: '✦' },
	settlement: { label: 'Settlements', color: '#f2b075', symbol: '■' },
	dungeon: { label: 'Dungeons / mazes', color: '#df9df0', symbol: '◆' },
	cave: { label: 'Cave regions', color: '#b9c7df', symbol: '▲' },
	storage: { label: 'Storage', color: '#80ddd0', symbol: '▣' },
	mission: { label: 'Missions', color: '#ffca63', symbol: '!' },
	puzzle: { label: 'Puzzles', color: '#c9adff', symbol: '?' },
	start: { label: 'Starting point', color: '#aee4b5', symbol: '⚑' },
	other: { label: 'Other locations', color: '#ffffff', symbol: '●' },
});

export function wrappedDelta(value, center, size) { return wrap(value - center + size / 2, size) - size / 2; }

/** Preserve markers even if their type/gameplay has not been ported. */
export function buildMapMarkers(world, additional = []) {
	const markers = world.landmarks.map(l => ({
		id: `${l.kind}:${l.id}:${l.x}:${l.z}`,
		kind: l.kind === 'RoadShrine' ? 'shrine' : 'settlement',
		name: l.name, x: wrap(l.x + l.sizeX / 2, world.sizeX), y: l.y,
		z: wrap(l.z + l.sizeZ / 2, world.sizeZ), implemented: world.compiled && l.kind === 'SimpleDistrict',
	}));
	for (const marker of additional) {
		if (!Number.isFinite(marker.x) || !Number.isFinite(marker.z)) continue;
		markers.push({ ...marker, x: wrap(marker.x, world.sizeX), z: wrap(marker.z, world.sizeZ) });
	}
	// One surface destination per connected saved cave region, not an invented entrance.
	const cells = world.layers.Cave.cells, seen = new Uint8Array(cells.length);
	const queue = new Int16Array(cells.length);
	for (let cell = 0; cell < cells.length; cell++) {
		if (!cells[cell] || seen[cell]) continue;
		let head = 0, tail = 1;
		queue[0] = cell; seen[cell] = 1;
		while (head < tail) {
			const i = queue[head++], x = i % 40, z = Math.floor(i / 40);
			for (const neighbor of [z * 40 + wrap(x - 1, 40), z * 40 + wrap(x + 1, 40), wrap(z - 1, 40) * 40 + x, wrap(z + 1, 40) * 40 + x]) {
				if (cells[neighbor] && !seen[neighbor]) { seen[neighbor] = 1; queue[tail++] = neighbor; }
			}
		}
		const middle = queue[Math.floor(tail / 2)];
		markers.push({ id: `cave:${cell}`, kind: 'cave', name: `Cave region ${cell + 1}`,
			x: (middle % 40) * 40 + 20, z: Math.floor(middle / 40) * 40 + 20,
			implemented: false, note: `${tail} map cells; surface destination, entrance not implemented` });
	}
	markers.push({ id: 'start', kind: 'start', name: 'Saved starting point', ...world.spawn, implemented: true });
	return markers;
}

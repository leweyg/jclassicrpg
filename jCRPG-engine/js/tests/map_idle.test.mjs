import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FrozenWorld } from '../frozen_world.js';
import { buildMapMarkers, MINIMAP_RADIUS, VISIBLE_RADIUS, wrappedDelta } from '../map_model.js';
import { SceneRenderer } from '../render_engine.js';
import { createSky } from '../sky.js';
import * as THREE from '../threejs/three.module.js';
const data = JSON.parse(fs.readFileSync(new URL('../../json/frozen_world.json', import.meta.url)));
const world = new FrozenWorld(data);

test('map includes unimplemented saved locations and retains unknown/future marker types', () => {
	const markers = buildMapMarkers(world, [...world.additionalMapMarkers,
		{ id: 'future', name: 'Future puzzle', kind: 'puzzle', x: 70, z: 80, implemented: false },
		{ id: 'unknown', name: 'Unknown content', kind: 'unknown', x: 20, z: 30, implemented: false }]);
	assert.equal(markers.filter(m => m.kind === 'shrine').length, 173);
	assert.equal(markers.filter(m => m.kind === 'settlement').length, 183);
	assert.equal(markers.filter(m => m.kind === 'dungeon').length, 25);
	assert.equal(markers.filter(m => m.kind === 'storage').length, 1);
	assert.ok(markers.some(m => m.kind === 'cave'));
	assert.ok(markers.some(m => m.id === 'future'));
	assert.ok(markers.some(m => m.id === 'unknown'));
	assert.ok(markers.filter(m => m.kind === 'dungeon').every(m => m.implemented === false));
	for (const marker of markers) {
		assert.ok(marker.x >= 0 && marker.x < world.sizeX && marker.z >= 0 && marker.z < world.sizeZ);
		if (marker.kind === 'cave') assert.equal(world.layers.Cave.cells[Math.floor(marker.z / 40) * 40 + Math.floor(marker.x / 40)], 1);
	}
	assert.equal(new Set(markers.map(m => m.id)).size, markers.length);
});

test('nearby map doubles sight radius and projects markers across the globe seam', () => {
	assert.equal(MINIMAP_RADIUS, VISIBLE_RADIUS * 2);
	assert.equal(wrappedDelta(1599, 1, 1600), -2);
	assert.equal(wrappedDelta(1, 1599, 1600), 2);
});

test('sky is a closed cube with aligned geometry and calibrated face UVs', () => {
	const texture = new THREE.CubeTexture();
	const sky = createSky(texture);
	assert.equal(sky.material.length, 6);
	const geometry = sky.geometry, positions = geometry.attributes.position, uv = geometry.attributes.uv;
	// Every geometric edge (including each face's diagonal) occurs in exactly two triangles.
	const edges = new Map();
	const key = i => `${positions.getX(i)},${positions.getY(i)},${positions.getZ(i)}`;
	for (let i = 0; i < geometry.index.count; i += 3) {
		const triangle = [0, 1, 2].map(j => geometry.index.getX(i + j));
		for (let j = 0; j < 3; j++) {
			const edge = [key(triangle[j]), key(triangle[(j + 1) % 3])].sort().join('|');
			edges.set(edge, (edges.get(edge) ?? 0) + 1);
		}
	}
	assert.ok([...edges.values()].every(count => count === 2));
	// Top's (0,1) corner becomes (1,0); walls' (0,1) becomes (1,1).
	assert.deepEqual([uv.getX(8), uv.getY(8)], [1, 0]);
	assert.deepEqual([uv.getX(0), uv.getY(0)], [1, 1]);
	assert.ok([...uv.array].every(value => value === 0 || value === 1));
	for (const material of sky.material) {
		assert.equal(material.map.wrapS, THREE.ClampToEdgeWrapping);
		assert.equal(material.map.wrapT, THREE.ClampToEdgeWrapping);
		assert.equal(material.map.generateMipmaps, false);
		material.map.dispose(); material.dispose();
	}
	geometry.dispose(); texture.dispose();
});

test('render scheduler sleeps when idle, wakes for input, and stops on cancellation', () => {
	const oldDocument = globalThis.document, oldRAF = globalThis.requestAnimationFrame, oldCancel = globalThis.cancelAnimationFrame;
	const pending = new Map(), deltas = []; let next = 0, renders = 0;
	globalThis.document = { hidden: false };
	globalThis.requestAnimationFrame = callback => { pending.set(++next, callback); return next; };
	globalThis.cancelAnimationFrame = id => pending.delete(id);
	try {
		const r = Object.create(SceneRenderer.prototype);
		Object.assign(r, { _running: false, _inputEnabled: true, _movePointer: null, _pointers: new Map(), _frameId: null,
			_lastFrameTime: null, _joystickEl: { style: {} }, renderer: { render() { renders++; } },
			_applyLook() {}, _updateMovement(dt) { deltas.push(dt); }, onViewChange: null });
		r._boundFrame = now => r._renderFrame(now);
		const tick = now => { const [id, callback] = pending.entries().next().value; pending.delete(id); callback(now); };
		r.start(); assert.equal(pending.size, 1); tick(0);
		assert.equal(renders, 1); assert.equal(pending.size, 0);
		r.requestRender(); r.requestRender(); assert.equal(pending.size, 1); tick(16);
		assert.equal(pending.size, 0);
		r._movePointer = { startX: 0, curX: 10, startY: 0, curY: 0 };
		r.requestRender(); tick(32); assert.equal(pending.size, 1);
		assert.equal(deltas.at(-1), 0); // Waking from idle cannot jump ahead.
		tick(60032); assert.equal(deltas.at(-1), 0.1); // Long frame gaps stay capped.
		r.cancelInput(); assert.equal(pending.size, 0); assert.equal(r._lastFrameTime, null);
		r.setInputEnabled(false); r.requestRender(); tick(48); assert.equal(pending.size, 0);
		document.hidden = true; r.requestRender(); assert.equal(pending.size, 0);
		document.hidden = false; r.stop(); r.requestRender(); assert.equal(pending.size, 0);
	} finally {
		globalThis.document = oldDocument; globalThis.requestAnimationFrame = oldRAF; globalThis.cancelAnimationFrame = oldCancel;
	}
});

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

test('sky corrects only the default X reflection', () => {
	const texture = new THREE.CubeTexture();
	const sky = createSky(texture);
	assert.equal(sky.material.uniforms.tFlip.value, 1);
	assert.equal(sky.material.uniforms.tCube.value, texture);
	assert.match(sky.material.fragmentShader, /tFlip \* vWorldDirection.x, vWorldDirection.yz/);
	sky.geometry.dispose(); sky.material.dispose(); texture.dispose();
});

test('render scheduler sleeps when idle, wakes for input, and stops on cancellation', () => {
	const oldDocument = globalThis.document, oldRAF = globalThis.requestAnimationFrame, oldCancel = globalThis.cancelAnimationFrame;
	const pending = new Map(); let next = 0, renders = 0;
	globalThis.document = { hidden: false };
	globalThis.requestAnimationFrame = callback => { pending.set(++next, callback); return next; };
	globalThis.cancelAnimationFrame = id => pending.delete(id);
	try {
		const r = Object.create(SceneRenderer.prototype);
		Object.assign(r, { _running: false, _inputEnabled: true, _movePointer: null, _pointers: new Map(), _frameId: null,
			_lastFrameTime: null, _joystickEl: { style: {} }, renderer: { render() { renders++; } },
			_applyLook() {}, _updateMovement() {}, onViewChange: null });
		r._boundFrame = now => r._renderFrame(now);
		const tick = now => { const [id, callback] = pending.entries().next().value; pending.delete(id); callback(now); };
		r.start(); assert.equal(pending.size, 1); tick(0);
		assert.equal(renders, 1); assert.equal(pending.size, 0);
		r.requestRender(); r.requestRender(); assert.equal(pending.size, 1); tick(16);
		assert.equal(pending.size, 0);
		r._movePointer = { startX: 0, curX: 10, startY: 0, curY: 0 };
		r.requestRender(); tick(32); assert.equal(pending.size, 1);
		r.cancelInput(); assert.equal(pending.size, 0); assert.equal(r._lastFrameTime, null);
		r.setInputEnabled(false); r.requestRender(); tick(48); assert.equal(pending.size, 0);
		document.hidden = true; r.requestRender(); assert.equal(pending.size, 0);
		document.hidden = false; r.stop(); r.requestRender(); assert.equal(pending.size, 0);
	} finally {
		globalThis.document = oldDocument; globalThis.requestAnimationFrame = oldRAF; globalThis.cancelAnimationFrame = oldCancel;
	}
});

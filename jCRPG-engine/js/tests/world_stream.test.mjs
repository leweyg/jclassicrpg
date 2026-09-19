import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FrozenWorld, Terrain, javaMix } from '../frozen_world.js';
import { WorldStream, CHUNK_SIZE, GRID_SIDE } from '../world_stream.js';
import { GameState } from '../game_state.js';
import { SceneRenderer } from '../render_engine.js';
import * as THREE from '../threejs/three.module.js';
const data = JSON.parse(fs.readFileSync(new URL('../../json/frozen_world.json', import.meta.url)));
const world = new FrozenWorld(data);
const find = (stream, x, z) => stream.chunks.find(c => c.x === x && c.z === z);

test('frozen export covers the saved world and captured spawn, including landmarks beyond the sample', () => {
	assert.deepEqual(world.spawn, { x: 800, y: 41, z: 907 });
	assert.equal(data.xmlSha256.length, 64);
	assert.equal(data.landmarks.filter(l => l.kind === 'SimpleDistrict').length, 183);
	for (let i = 0; i < 1600; i++) {
		assert.equal(world.layers.Plain.cells[i] + world.layers.Forest.cells[i] + world.layers.Mountain.cells[i], 1);
	}
	assert.equal(world.typeAt(800, 907), Terrain.PLAIN);
});

test('Java hash preserves known signed-overflow values', () => {
	assert.equal(javaMix(0, 0, 0), 0);
	assert.equal(javaMix(1, 2, 3), 1212905214);
	assert.equal(javaMix(160, 181, 0), 595407872);
	assert.equal(javaMix(2147483647, -1, 32), 1329272718);
});

test('chunk crossings recycle only the departing row and retain every buffer', () => {
	const stream = new WorldStream(world);
	stream.update(800, 907);
	const buffers = stream.chunks.map(c => [c, c.heights, c.types, c.climates, c.vegetation]);
	const revisions = stream.chunks.map(c => c.revision);
	assert.equal(stream.update(801, 908), false);
	stream.update(832, 907);
	assert.equal(stream.chunks.filter((c, i) => c.revision !== revisions[i]).length, 5);
	for (let n = 0; n < 1000; n++) stream.update((n * 137) % 1600, (n * 317) % 1600);
	assert.equal(stream.chunks.length, 25);
	stream.chunks.forEach((c, i) => assert.deepEqual([c, c.heights, c.types, c.climates, c.vegetation].map((v, j) => v === buffers[i][j]), [true, true, true, true, true]));
});

test('revisited areas and wrapped coordinates reproduce identical terrain and vegetation', () => {
	const stream = new WorldStream(world);
	stream.update(800, 907);
	const saved = structuredClone(find(stream, 25, 28));
	stream.update(30, 80); stream.update(800, 907);
	const revisited = find(stream, 25, 28);
	assert.deepEqual(revisited.heights, saved.heights);
	assert.deepEqual(revisited.vegetation, saved.vegetation);
	assert.equal(revisited.plantCount, saved.plantCount);
	for (const [x, z] of [[0, 0], [-1, 1599], [800, 907], [1599, 1599]]) {
		assert.equal(world.heightAt(x, z), world.heightAt(x + 1600, z - 1600));
		assert.equal(world.typeAt(x, z), world.typeAt(x + 1600, z - 1600));
	}
});

test('neighboring chunk edges agree, including world seam', () => {
	const stream = new WorldStream(world);
	for (const x of [0, 800, 1599]) {
		stream.update(x, 907);
		const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(907 / CHUNK_SIZE);
		const a = find(stream, cx, cz), b = find(stream, cx + 1, cz);
		for (let z = 0; z < GRID_SIDE; z++) assert.equal(a.heights[z * GRID_SIDE + GRID_SIDE - 1], b.heights[z * GRID_SIDE]);
	}
});

test('party movement preserves position identity, follows terrain and wraps at world edges', () => {
	const state = new GameState();
	state.exploration = new WorldStream(world);
	const position = state.party.position;
	Object.assign(position, { x: 1599.9, y: 40, z: 0.1 });
	state.moveParty(0.2, -0.2);
	assert.equal(state.party.position, position);
	assert.ok(Math.abs(position.x - 0.1) < 1e-9);
	assert.ok(Math.abs(position.z - 1599.9) < 1e-9);
	assert.equal(position.y, state.exploration.heightAt(position.x, position.z));
	assert.equal('exploration' in state.toJSON(), false);
});

test('left swipe moves camera-left at every heading and stick/look scratch objects are reused', () => {
	const renderer = Object.create(SceneRenderer.prototype);
	renderer.gameState = new GameState();
	renderer.gameState.exploration = new WorldStream(world);
	renderer.camera = new THREE.PerspectiveCamera();
	renderer._sun = new THREE.DirectionalLight();
	renderer._stick = { x: 0, y: 0 };
	renderer._lookTarget = new THREE.Vector3();
	renderer._pitch = 0;
	renderer.worldView = { sync() {} };
	renderer._movePointer = { startX: 100, startY: 100, curX: 45, curY: 100 };
	for (const yaw of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
		renderer._yaw = yaw;
		Object.assign(renderer.gameState.party.position, { x: 800, y: 40, z: 907 });
		renderer._updateMovement(0.1);
		const p = renderer.gameState.party.position;
		const dotRight = (p.x - 800) * -Math.cos(yaw) + (p.z - 907) * Math.sin(yaw);
		assert.ok(dotRight < -0.39);
		assert.equal(renderer._moveVector(), renderer._stick);
		const target = renderer._lookTarget;
		renderer._applyLook();
		assert.equal(target, renderer._lookTarget);
	}
	renderer._movePointer.curY = 45;
	assert.ok(Math.abs(Math.hypot(renderer._moveVector().x, renderer._stick.y) - 1) < 1e-10);
});

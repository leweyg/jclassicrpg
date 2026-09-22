import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PLAY_DESTINATIONS, visitPlayDestination } from '../play_destinations.js';
import { GameState } from '../game_state.js';
import { FrozenWorld } from '../frozen_world.js';
import { BakedWorldStream } from '../world/baked_stream.js';
import { SaveDeltas } from '../world/save_deltas.js';

const base = new URL('../../worlds/seed0/v2/', import.meta.url);
const read = url => JSON.parse(fs.readFileSync(url));

test('homepage destinations land on walkable ground and retain saved progress', async () => {
 const state = new GameState();
 const world = new FrozenWorld(read(new URL('../../json/frozen_world.json', import.meta.url)));
 const stream = new BakedWorldStream(world, read(new URL('manifest.json', base)), base, {
  fetcher: async url => new Response(fs.readFileSync(url)),
 });
 state.exploration = stream;
 const stored = new Map();
 const storage = { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) };
 state.saveDeltas = new SaveDeltas(storage);
 state.saveDeltas.data.flags['existing-progress'] = true;
 const html = fs.readFileSync(new URL('../../../index.html', import.meta.url), 'utf8');
 try {
  for (const [id, destination] of Object.entries(PLAY_DESTINATIONS)) {
   assert.ok(html.includes(`play.html?location=${id}`));
   assert.equal(await visitPlayDestination(state, id), destination.name);
   const { x, y, z } = state.party.position;
   assert.equal(x, destination.position[0]);
   assert.equal(z, destination.position[2]);
   assert.equal(state.realm, 'surface');
   assert.ok(Number.isFinite(y));
   assert.ok(stream.canMove(x, y, z, x, z), `${id}: landing is blocked`);
   assert.ok([[0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]].some(([dx, dz]) => stream.canMove(x, y, z, x + dx, z + dz)), `${id}: no way out`);
   const resumed = new SaveDeltas(storage);
   assert.equal(resumed.data.flags['existing-progress'], true);
   assert.deepEqual(resumed.data.player, { x, y, z, realm: 'surface' });
  }
  const previous = { ...state.party.position };
  await assert.rejects(visitPlayDestination(state, 'invalid'), /Unknown destination/);
  await assert.rejects(visitPlayDestination(state, '__proto__'), /Unknown destination/);
  assert.deepEqual(state.party.position, previous);
 } finally { stream.dispose(); }
});

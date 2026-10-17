import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readingGoal, goalAction} from '../reading_mode.js';
import {GameState} from '../game_state.js';
import {FrozenWorld} from '../frozen_world.js';
import {BakedWorldStream} from '../world/baked_stream.js';
import {SaveDeltas} from '../world/save_deltas.js';
import {InteractionRuntime} from '../interactions/runtime.js';
import {MAIN_IDS} from '../../../scripts/main_story.mjs';
const base = new URL('../../worlds/seed0/v2/', import.meta.url);
const read = file => JSON.parse(fs.readFileSync(new URL(file, base)));
const content = Object.fromEntries(Object.entries(read('interactions/manifest.json').catalogs).map(([key, value]) => [key, read(value.url)]));

test('reading reaches real actors, shrines, cave entrances, items and fittings in story order', async () => {
    const state = new GameState();
    state.saveDeltas = new SaveDeltas();
    state.interactions = new InteractionRuntime(content, state.saveDeltas);
    const world = new FrozenWorld(read('../../../json/frozen_world.json'));
    state.exploration = new BakedWorldStream(world, read('manifest.json'), base, {
        fetcher: async url => new Response(fs.readFileSync(url)),
    });
    const engine = state.interactions;
    const arrive = async kind => {
        const goal = readingGoal(engine);
        assert.ok(goal);
        await state.teleport(goal.position[0], goal.position[2], goal.position[1], goal.realm ?? 'surface', {standBack:true});
        const action = goalAction(state, goal);
        assert.ok(action, JSON.stringify(goal));
        assert.equal(action.kind, kind);
        if (kind === 'actor') {
            const p = state.party.position;
            assert.ok(Math.hypot(p.x-action.position[0],p.z-action.position[2]) >= 0.275 - 1e-9);
            assert.ok(state.saveDeltas.data.camera);
        }
        return action;
    };
    await arrive('actor');
    engine.transact([{op:'talk',id:'actor:wammigmig:orro'}]);
    const shrine = await arrive('shrine');
    await state.interact(shrine);
    await arrive('actor');
    engine.transact([{op:'turnIn',id:MAIN_IDS[0]}]);
    await arrive('actor');
    engine.transact([{op:'talk',id:'actor:wammigmig:pella'}]);
    await state.interact(await arrive('portal'));
    const container = await arrive('container');
    await state.interact(container);
    engine.transact([{op:'take',id:container.targetId}]);
    await state.interact(await arrive('fitting'));
    engine.transact([{op:'turnIn',id:MAIN_IDS[1]}]);
    await arrive('actor');
    engine.transact([{op:'talk',id:'actor:boarman:regional:1'}]);
    const puzzle = engine.maps.puzzles['puzzle:boarman:regional:1'];
    for (let i = 0; i < 12 && !engine.save.data.puzzles[puzzle.id]?.completed; i++) {
        await state.interact(await arrive('puzzle'));
    }
    assert.equal(engine.save.data.puzzles[puzzle.id].completed, true);
    await arrive('actor');
});

test('reading ends cleanly with no remaining goals', () => {
    assert.equal(readingGoal({mainNavigationGoal:()=>null,navigationGoal:()=>null}), null);
});

test('reading control follows modal dialogs and returns to the page on close', async () => {
    const {keepReadingControlAccessible} = await import('../reading_mode.js');
    const originalDocument = globalThis.document;
    const originalObserver = globalThis.MutationObserver;
    let notify, disconnected = false;
    const host = (modal = false) => ({
        tagName: modal ? 'DIALOG' : 'BODY', open: modal, isConnected: true,
        matches: () => modal,
        append(bar) { bar.parentElement = this; },
    });
    const body = host(), conversation = host(true), menu = host(true);
    const handlers = new Map();
    const bar = {
        parentElement: body,
        addEventListener: (name, callback) => handlers.set(name, callback),
        removeEventListener: name => handlers.delete(name),
    };
    globalThis.document = {body, querySelectorAll: () => [conversation]};
    globalThis.MutationObserver = class {
        constructor(callback) { notify = callback; }
        observe() {}
        disconnect() { disconnected = true; }
    };
    try {
        const release = keepReadingControlAccessible(bar);
        assert.equal(bar.parentElement, conversation);
        notify([{target:menu}]);
        assert.equal(bar.parentElement, menu);
        menu.open = false;
        notify([{target:menu}]);
        assert.equal(bar.parentElement, conversation);
        conversation.open = false;
        notify([{target:conversation}]);
        assert.equal(bar.parentElement, body);
        let stopped = false;
        handlers.get('pointerup')({stopPropagation() { stopped = true; }});
        assert.equal(stopped, true, 'control clicks must not advance dialogue');
        release();
        assert.equal(disconnected, true);
        assert.equal(handlers.size, 0);
        assert.equal(bar.parentElement, body);
    } finally {
        globalThis.document = originalDocument;
        globalThis.MutationObserver = originalObserver;
    }
});

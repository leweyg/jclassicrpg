import test from 'node:test';
import assert from 'node:assert/strict';
import {SaveDeltas, validateSave, emptySave, resetStoredSave} from '../world/save_deltas.js';
import {SceneRenderer} from '../render_engine.js';

function fixture() {
    const stored = new Map();
    const storage = {getItem:key=>stored.get(key)??null, setItem:(key,value)=>stored.set(key,value), removeItem:key=>stored.delete(key)};
    const saveDeltas = new SaveDeltas(storage);
    const renderer = Object.assign(Object.create(SceneRenderer.prototype), {
        gameState:{saveDeltas, party:{position:{x:800,y:41,z:907}}, realm:'surface'},
        _yaw:1.75, _pitch:-0.45,
    });
    return {storage, saveDeltas, renderer};
}

test('refresh restores position and gameplay yaw/pitch, including during conversation', () => {
    const {storage, renderer} = fixture();
    renderer._conversation = {quaternion:'temporary portrait framing'};
    assert.equal(renderer.saveView(), true);
    const resumed = new SaveDeltas(storage);
    assert.deepEqual(resumed.data.player, {x:800,y:41,z:907,realm:'surface'});
    const fresh = Object.assign(Object.create(SceneRenderer.prototype), {
        gameState:{saveDeltas:resumed}, _yaw:Math.PI, _pitch:-0.08,
    });
    fresh.restoreView();
    assert.equal(fresh._yaw, 1.75);
    assert.equal(fresh._pitch, -0.45);
});

test('position-only saves and export/import retain direction; reset removes it', () => {
    const {storage, saveDeltas, renderer} = fixture();
    renderer.saveView();
    saveDeltas.persist({x:801,y:41,z:908}, 'surface');
    const imported = new SaveDeltas();
    imported.import(saveDeltas.export());
    renderer.gameState.saveDeltas = imported;
    renderer._yaw = 0;
    renderer._pitch = 0;
    renderer.restoreView();
    assert.equal(renderer._yaw, 1.75);
    assert.equal(renderer._pitch, -0.45);
    resetStoredSave(storage);
    assert.equal(new SaveDeltas(storage).data.camera, undefined);
});

test('older saves retain default direction; malformed camera data is rejected', () => {
    const {renderer} = fixture();
    renderer.restoreView();
    assert.equal(renderer._yaw, 1.75);
    assert.doesNotThrow(() => validateSave(emptySave()));
    for (const camera of [{yaw:NaN,pitch:0}, {yaw:0,pitch:Infinity}, {yaw:'1',pitch:0}, {yaw:0}, {yaw:0,pitch:2}]) {
        assert.throws(() => validateSave({...emptySave(),camera}));
    }
});

test('pagehide shutdown flushes the latest look angles before any render frame', () => {
    const {renderer, storage} = fixture();
    Object.assign(renderer, {
        _yaw:-2.3, _pitch:0.7, _pointers:new Map(), _keys:new Set(),
        _joystickEl:{style:{}}, _frameId:null,
    });
    renderer.gameState.events = {removeEventListener() {}};
    renderer.stop();
    assert.deepEqual(new SaveDeltas(storage).data.camera, {yaw:-2.3,pitch:0.7});
});

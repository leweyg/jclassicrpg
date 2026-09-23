import test from 'node:test';
import assert from 'node:assert/strict';
import {SceneRenderer} from '../render_engine.js';

function controls(t, intuition = true) {
 const target = () => ({listeners: {}, style: {}, addEventListener(type, fn) {this.listeners[type] = fn;}, emit(type, values = {}) {this.listeners[type]?.({type, pointerId: 1, pointerType: 'mouse', button: 0, clientX: 150, clientY: 100, preventDefault() {}, ...values});}});
 const win = target(), doc = target(), canvas = target();
 t.mock.method(globalThis, 'setTimeout', fn => {win.hold = fn; return 1;});
 t.mock.method(globalThis, 'clearTimeout', () => {win.hold = null;});
 const oldWindow = globalThis.window, oldDocument = globalThis.document;
 globalThis.window = win; globalThis.document = doc;
 t.after(() => {globalThis.window = oldWindow; globalThis.document = oldDocument;});
 canvas.getBoundingClientRect = () => ({left: 0, width: 200});
 const r = Object.assign(Object.create(SceneRenderer.prototype), {canvas, _inputEnabled: true, _keys: new Set(), _pointers: new Map(), _yaw: 0, _pitch: 0, _stick: {}, _joystickEl: {style: {}, knob: {style: {}}}, requestRender() {}, onInteract() {actions.push('interact');}, onIntuition() {actions.push('intuition');}, canIntuition: () => intuition, onGestureHighlight(value) {highlight = value;}});
 const actions = []; let highlight;
 r._bindControls();
 return {r, canvas, win, actions, highlight: () => highlight};
}
test('tap interacts; stationary hold highlights and activates intuition only on release', t => {
 const c = controls(t);
 c.canvas.emit('pointerdown'); assert.equal(c.highlight(), 'interact');
 c.canvas.emit('pointerup'); c.canvas.emit('lostpointercapture'); assert.deepEqual(c.actions, ['interact']);
 c.canvas.emit('pointerdown'); c.win.hold(); assert.equal(c.highlight(), 'intuition'); assert.equal(c.actions.length, 1);
 c.canvas.emit('pointerup'); assert.deepEqual(c.actions, ['interact', 'intuition']); assert.equal(c.highlight(), null);
});
test('unavailable intuition keeps interact; jitter does not turn or move', t => {
 const c = controls(t, false);
 c.canvas.emit('pointerdown', {clientX: 20}); c.canvas.emit('pointermove', {clientX: 23});
 assert.equal(c.r._movePointer, undefined); assert.equal(c.r._yaw, 0);
 c.win.hold(); assert.equal(c.highlight(), 'interact'); c.canvas.emit('pointerup', {clientX: 23}); assert.deepEqual(c.actions, ['interact']);
});
test('drag remains a drag after returning to origin and cancels the hold', t => {
 const c = controls(t);
 c.canvas.emit('pointerdown'); c.canvas.emit('pointermove', {clientX: 180});
 assert.notEqual(c.r._yaw, 0); assert.equal(c.win.hold, null); assert.equal(c.highlight(), null);
 c.canvas.emit('pointermove'); c.canvas.emit('pointerup'); assert.deepEqual(c.actions, []);
});
test('left drag moves; keyboard movement enables unpressed look and normalizes uppercase keys', t => {
 const c = controls(t);
 c.canvas.emit('pointerdown', {clientX: 20}); c.canvas.emit('pointermove', {clientX: 40}); assert.ok(c.r._moveVector().x > 0);
 c.canvas.emit('pointerup', {clientX: 40}); assert.deepEqual(c.actions, []);
 c.win.emit('keydown', {key: 'W'}); assert.equal(c.r._moveVector().y, -1);
 c.canvas.emit('pointermove', {movementX: 10}); assert.equal(c.r._yaw, -.06);
 c.win.emit('keyup', {key: 'w'}); c.canvas.emit('pointermove', {movementX: 10}); assert.equal(c.r._yaw, -.06);
 c.r._inputEnabled = false; c.win.emit('keydown', {key: 'w'}); assert.equal(c.r._keys.size, 0);
});
test('cancellation and simultaneous fingers never activate an action', t => {
 const c = controls(t);
 for (const event of ['pointercancel', 'lostpointercapture', 'pointerleave']) {
  c.canvas.emit('pointerdown'); c.canvas.emit(event); assert.equal(c.highlight(), null);
 }
 c.canvas.emit('pointerdown'); c.canvas.emit('pointerdown', {pointerId: 2});
 c.canvas.emit('pointerup'); c.canvas.emit('pointerup', {pointerId: 2}); assert.deepEqual(c.actions, []);
});

test('dialog backdrop advances the selected response without triggering journal or inventory actions', async t => {
 const {InteractionUI} = await import('../interactions/ui.js');
 const oldDocument = globalThis.document;
 t.after(() => {globalThis.document = oldDocument;});
 const actions = [], first = {click() {actions.push('first');}}, selected = {click() {actions.push('selected');}};
 let buttons = [first, selected];
 const ui = Object.assign(Object.create(InteractionUI.prototype), {state: {interactions: {panel: {kind: 'dialogue'}}}, body: {querySelectorAll: () => buttons}});
 globalThis.document = {activeElement: selected}; ui.advanceFromBackdrop(); assert.deepEqual(actions, ['selected']);
 globalThis.document.activeElement = {}; ui.advanceFromBackdrop(); assert.deepEqual(actions, ['selected', 'first']);
 ui.state.interactions.panel = null; ui.advanceFromBackdrop(); assert.equal(actions.length, 2);
 buttons = [{textContent: 'Continue exploring', click() {actions.push('close');}}]; ui.advanceFromBackdrop(); assert.equal(actions.at(-1), 'close');
});

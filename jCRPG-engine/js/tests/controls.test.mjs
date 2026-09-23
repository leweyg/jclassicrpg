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
 const ui = Object.assign(Object.create(InteractionUI.prototype), {primaryButton: first, backdropButtons: new Set(buttons)});
 globalThis.document = {activeElement: selected}; ui.advanceFromBackdrop(); assert.deepEqual(actions, ['selected']);
 globalThis.document.activeElement = {}; ui.advanceFromBackdrop(); assert.deepEqual(actions, ['selected', 'first']);
 ui.backdropButtons.clear(); ui.advanceFromBackdrop(); assert.equal(actions.length, 2);
 buttons = [{textContent: 'A completely different label', click() {actions.push('close');}}]; ui.primaryButton = buttons[0]; ui.backdropButtons.add(buttons[0]); ui.advanceFromBackdrop(); assert.equal(actions.at(-1), 'close');
});

test('toggled steering continuously combines forward/back movement and turning from a fixed origin', t => {
 const c=controls(t), moves=[];
 Object.assign(c.r,{gameState:{moveParty(x,z){moves.push([x,z]);return false;}},_syncCamera(){}});
 c.canvas.emit('pointerdown',{button:2,clientX:20});
 assert.equal(c.r._movePointer.side,'steer');assert.equal(c.highlight(),null);assert.equal(c.win.hold,null);
 c.canvas.emit('pointerup',{button:2,clientX:20});
 c.canvas.emit('lostpointercapture');
 c.canvas.emit('pointermove',{buttons:0,clientX:75,clientY:45});
 assert.equal(c.r._movePointer.startX,20);assert.equal(c.r._movePointer.startY,100);
 assert.equal(c.r._yaw,0,'pointer motion changes the stick, not the camera directly');
 assert.deepEqual(c.r._moveVector(),{x:0,y:-.25});
 assert.equal(c.r._hasMovement(),true);
 c.r._updateMovement(.1);const firstYaw=c.r._yaw;
 c.r._updateMovement(.1);assert.ok(Math.abs(c.r._yaw-firstYaw*2)<1e-10);
 assert.ok(firstYaw<0,'dragging right turns toward camera-right');
 assert.equal(c.r._pitch,0);assert.equal(moves.length,2);
 assert.ok(Math.abs(Math.hypot(...moves[0])-.1)<1e-10);
 c.canvas.emit('pointermove',{buttons:2,clientX:20,clientY:155});
 assert.deepEqual(c.r._moveVector(),{x:0,y:.25});
 c.canvas.emit('pointerdown',{button:0,clientX:20,clientY:155});
 c.canvas.emit('pointerup',{button:0,clientX:20,clientY:155});
 assert.equal(c.r._hasMovement(),false);assert.equal(c.r._movePointer,null);
 assert.deepEqual(c.actions,[]);
});

test('right drag can turn in place, ignores small jitter, recenters, and has frame-independent speed', t => {
 const c=controls(t);
 c.canvas.emit('pointerdown',{button:2});
 c.canvas.emit('pointermove',{buttons:2,clientX:154,clientY:104});
 assert.equal(c.r._hasMovement(),false);assert.deepEqual(c.r._moveVector(),{x:0,y:0});
 c.canvas.emit('pointermove',{buttons:2,clientX:95});
 assert.deepEqual(c.r._moveVector(),{x:0,y:0});assert.equal(c.r._hasMovement(),true);
 c.r._updateMovement(.1);const yaw=c.r._yaw;assert.ok(yaw>0);
 c.r._yaw=0;c.r._updateMovement(.05);c.r._updateMovement(.05);
 assert.ok(Math.abs(c.r._yaw-yaw)<1e-10);
 c.canvas.emit('pointermove',{buttons:2});assert.equal(c.r._hasMovement(),false);
 c.canvas.emit('pointerup',{button:2});assert.deepEqual(c.actions,[]);
});

test('toggled steering survives keyboard input and release, but stops on clicks, cancellation or blur', t => {
 const c=controls(t);c.r._frameId=null;
 c.win.emit('keydown',{key:'w'});
 c.canvas.emit('pointerdown',{button:2});c.canvas.emit('pointermove',{buttons:2,clientX:205});
 assert.equal(c.r._movePointer.side,'steer');assert.equal(c.r._yaw,0);
 c.win.emit('keyup',{key:'w'});
 c.canvas.emit('pointerup',{button:2});
 c.canvas.emit('pointermove',{buttons:0,clientX:205});
 assert.equal(c.r._movePointer.side,'steer','release keeps steering active');
 c.canvas.emit('pointerdown',{button:2});
 assert.equal(c.r._movePointer,null,'a second right click toggles steering off');
 for(const type of ['pointercancel','pointerleave']){
  c.canvas.emit('pointerdown',{button:2});c.canvas.emit('pointermove',{buttons:2,clientX:205});
  c.canvas.emit(type);assert.equal(c.r._hasMovement(),false);
 }
 c.canvas.emit('pointerdown',{button:2});c.win.emit('blur');
 assert.equal(c.r._movePointer,null);assert.equal(c.r._joystickEl.style.display,'none');
 c.r.setInputEnabled(false);c.canvas.emit('pointerdown',{button:2});
 assert.equal(c.r._pointers.size,0);assert.deepEqual(c.actions,[]);
});

test('steering reaches normal walking speed and never exceeds it, even far from the origin', t => {
 const c=controls(t), distances=[];
 Object.assign(c.r,{
  gameState:{moveParty(x,z){distances.push(Math.hypot(x,z));return false;}},
  _syncCamera(){},
 });
 c.win.emit('keydown',{key:'w'});c.r._updateMovement(.1);c.win.emit('keyup',{key:'w'});
 const walkingDistance=distances.pop();
 assert.ok(Math.abs(walkingDistance-.4)<1e-10);
 c.canvas.emit('pointerdown',{button:2});c.canvas.emit('pointerup',{button:2});
 for(const offset of [-10000,-196,196,10000]){
  c.canvas.emit('pointermove',{buttons:0,clientX:1000,clientY:100+offset});
  assert.equal(Math.abs(c.r._moveVector().y),1);
  c.r._updateMovement(.1);
  assert.ok(Math.abs(distances.pop()-walkingDistance)<1e-10);
 }
});

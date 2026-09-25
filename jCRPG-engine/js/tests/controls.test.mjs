import test from 'node:test';
import assert from 'node:assert/strict';
import {SceneRenderer} from '../render_engine.js';

function controls(t, intuition = true) {
 const target = () => ({listeners: {}, style: {}, addEventListener(type, fn) {this.listeners[type] = fn;}, emit(type, values = {}) {this.listeners[type]?.({type, pointerId: 1, pointerType: 'mouse', button: 0, clientX: 150, clientY: 100, preventDefault() {}, ...values});}});
 const win = target(), doc = target(), canvas = target();
 t.mock.method(globalThis, 'setTimeout', (fn, ms) => {if(ms===600) {win.hold=fn;return 1;} win.click=fn;return 2;});
 t.mock.method(globalThis, 'clearTimeout', id => {if(id===1)win.hold=null;if(id===2)win.click=null;});
 const oldWindow = globalThis.window, oldDocument = globalThis.document;
 globalThis.window = win; globalThis.document = doc;
 t.after(() => {globalThis.window = oldWindow; globalThis.document = oldDocument;});
 canvas.getBoundingClientRect = () => ({left: 0, width: 200});
 const r = Object.assign(Object.create(SceneRenderer.prototype), {canvas, _inputEnabled: true, _keys: new Set(), _pointers: new Map(), _yaw: 0, _pitch: 0, _stick: {}, _joystickEl: {style: {}, knob: {style: {}}}, requestRender() {}, onInteract() {actions.push('interact');}, onIntuition() {actions.push('intuition');}, canIntuition: () => intuition, onGestureHighlight(value) {highlight = value;}});
 const actions = []; let highlight;
 r._bindControls();
 return {r, canvas, win, doc, actions, highlight: () => highlight};
}
test('tap interacts; stationary hold highlights and activates intuition only on release', t => {
 const c = controls(t);
 c.canvas.emit('pointerdown'); assert.equal(c.highlight(), 'interact');
 c.canvas.emit('pointerup'); c.canvas.emit('lostpointercapture'); c.win.click(); assert.deepEqual(c.actions, ['interact']);
 c.canvas.emit('pointerdown'); c.win.hold(); assert.equal(c.highlight(), 'intuition'); assert.equal(c.actions.length, 1);
 c.canvas.emit('pointerup'); assert.deepEqual(c.actions, ['interact', 'intuition']); assert.equal(c.highlight(), null);
});
test('unavailable intuition keeps interact; jitter does not turn or move', t => {
 const c = controls(t, false);
 c.canvas.emit('pointerdown', {clientX: 20}); c.canvas.emit('pointermove', {clientX: 23});
 assert.equal(c.r._movePointer, undefined); assert.equal(c.r._yaw, 0);
 c.win.hold(); assert.equal(c.highlight(), 'interact'); c.canvas.emit('pointerup', {clientX: 23}); c.win.click(); assert.deepEqual(c.actions, ['interact']);
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
test('scroll moves forward/back and turns horizontally without leaving movement active', t => {
 const c = controls(t), moves = [];
 let renders = 0, syncs = 0, prevented = 0;
 Object.assign(c.r, {
  gameState: {moveParty(x,z) {moves.push([x,z]); return true;}},
  _syncCamera() {}, worldView: {sync() {syncs++;}}, requestRender() {renders++;},
 });
 const scroll = values => c.canvas.emit('wheel', {deltaX:0, deltaY:0, deltaMode:0, preventDefault() {prevented++;}, ...values});
 scroll({deltaY:-100});
 assert.ok(Math.abs(moves.reduce((sum, [,z]) => sum+z, 0)+1)<1e-10);
 assert.ok(moves.every(([x,z]) => x===0 && Math.abs(z)<=.25));
 moves.length=0;
 scroll({deltaY:100});
 assert.ok(Math.abs(moves.reduce((sum, [,z]) => sum+z, 0)-1)<1e-10);
 moves.length=0;
 scroll({deltaX:50}); assert.equal(c.r._yaw,.3); assert.equal(moves.length,0);
 scroll({deltaX:-100}); assert.equal(c.r._yaw,-.3);
 scroll({deltaX:50,deltaY:-20}); assert.equal(c.r._yaw,0);
 assert.equal(moves.length,1); assert.ok(Math.abs(moves[0][0])<1e-10); assert.equal(moves[0][1],-.2);
 assert.equal(c.r._pitch,0); assert.equal(c.r._hasMovement(),false);
 assert.equal(renders,5); assert.equal(prevented,5); assert.equal(syncs,9);
 assert.deepEqual(c.actions,[]);
});

test('scroll normalizes wheel units, caps large deltas, and respects dialogs and pinch zoom', t => {
 const c = controls(t), moves=[];
 let prevented=0;
 c.canvas.clientHeight=800;
 Object.assign(c.r,{gameState:{moveParty(x,z){moves.push([x,z]);return false;}},_syncCamera(){}});
 const scroll = values => c.canvas.emit('wheel',{deltaX:0,deltaY:1,deltaMode:0,preventDefault(){prevented++;},...values});
 scroll({deltaMode:1}); assert.ok(Math.abs(moves.pop()[1]-.16)<1e-10);
 scroll({deltaMode:2}); assert.ok(Math.abs(moves.reduce((sum,[,z])=>sum+z,0)-2.4)<1e-10);
 moves.length=0;
 scroll({ctrlKey:true,deltaX:10});
 scroll({defaultPrevented:true,deltaX:10});
 c.r._inputEnabled=false;scroll({deltaX:10});
 assert.deepEqual(moves,[]);assert.equal(c.r._yaw,0);assert.equal(prevented,2);
});

test('farewell E closes the dialog without reopening it through world controls', async t => {
 const {InteractionUI} = await import('../interactions/ui.js');
 const c = controls(t);
 c.r._inputEnabled = false;
 let open = true;
 const farewell = {tagName: 'BUTTON', click() {open = false; c.r._inputEnabled = true;}};
 document.activeElement = farewell;
 const ui = {dialog: {contains: element => element === farewell}, primaryButton: farewell};
 const event = {key: 'e', target: farewell, defaultPrevented: false, preventDefault() {this.defaultPrevented = true;}};
 InteractionUI.prototype.handleKeyDown.call(ui, event);
 c.win.listeners.keydown(event);
 assert.equal(open, false);
 assert.equal(c.r._inputEnabled, true);
 assert.deepEqual(c.actions, []);
 c.win.emit('keydown', {key: 'e'});
 assert.deepEqual(c.actions, ['interact']);
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

test('double-click fires intuition without a single-click interaction or latched movement', t => {
 const c=controls(t);
 for(let i=0;i<2;i++){c.canvas.emit('pointerdown');c.canvas.emit('pointerup');}
 c.canvas.emit('dblclick');
 assert.deepEqual(c.actions,['intuition']);assert.equal(c.win.click,null);
 assert.equal(c.r._hasMovement(),false);
 c.canvas.emit('pointerdown',{button:2});assert.deepEqual(c.actions,['intuition','intuition']);
 assert.equal(c.r._pointers.size,0);
});

test('one touch on either half steers with forward/back and turning, and stops on release', t => {
 const c=controls(t), moves=[];
 Object.assign(c.r,{gameState:{moveParty(x,z){moves.push([x,z]);return false;}},_syncCamera(){}});
 for(const x of [20,150]){
  c.canvas.emit('pointerdown',{pointerType:'touch',clientX:x});
  c.canvas.emit('pointermove',{pointerType:'touch',clientX:x+55,clientY:45});
  assert.deepEqual(c.r._moveVector(),{x:0,y:-.25});
  const before=c.r._yaw;c.r._updateMovement(.1);assert.ok(c.r._yaw<before);
  assert.equal(c.r._pitch,0);
  c.canvas.emit('pointerup',{pointerType:'touch',clientX:x+55,clientY:45});
  assert.equal(c.r._hasMovement(),false);
 }
 assert.equal(moves.length,2);assert.deepEqual(c.actions,[]);
});

test('two touches switch to dual sticks and stay dual until every finger lifts', t => {
 const c=controls(t);
 const emit=(type,id,x,y=100)=>c.canvas.emit(type,{pointerType:'touch',pointerId:id,clientX:x,clientY:y});
 emit('pointerdown',1,20);emit('pointermove',1,40);
 assert.equal(c.r._movePointer.side,'steer');
 emit('pointerdown',2,150);assert.equal(c.r._movePointer.side,'move');
 emit('pointermove',1,65,80);assert.ok(c.r._moveVector().x>0);
 const yaw=c.r._yaw;emit('pointermove',2,180);assert.ok(c.r._yaw<yaw);
 emit('pointerup',2,180);assert.equal(c.r._touchDual,true);
 emit('pointermove',1,80);assert.equal(c.r._movePointer.side,'move');
 emit('pointerup',1,80);assert.equal(c.r._touchDual,false);
 emit('pointerdown',3,150);emit('pointermove',3,180);assert.equal(c.r._movePointer.side,'steer');
 emit('pointercancel',3,180);assert.equal(c.r._hasMovement(),false);
 assert.deepEqual(c.actions,[]);
});

test('remaining right finger stays look-only after left finger lifts',t=>{
 const c=controls(t);
 c.canvas.emit('pointerdown',{pointerType:'touch',clientX:20});
 c.canvas.emit('pointerdown',{pointerType:'touch',pointerId:2,clientX:150});
 c.canvas.emit('pointerup',{pointerType:'touch',clientX:20});
 c.canvas.emit('pointermove',{pointerType:'touch',pointerId:2,clientX:180});
 assert.ok(c.r._yaw<0);assert.equal(c.r._hasMovement(),false);
 c.r._frameId=null;c.win.emit('blur');assert.equal(c.r._touchDual,false);
});

test('region intuition describes the current landscape, labyrinth, or cave',async()=>{
 const {InteractionUI}=await import('../interactions/ui.js');
 const state={realm:'surface',party:{position:{x:653.5,y:40,z:968.5}},exploration:{world:{landmarkAt:()=>({name:'Trawamtraaw'}),typeAt:()=>4},cellAt:()=>null}};
 const ui=Object.assign(Object.create(InteractionUI.prototype),{state});
 assert.equal(ui.regionIntuition().name,'Trawamtraaw');
 assert.match(ui.regionIntuition().summary,/653, 968/);
 state.exploration.cellAt=()=>({structure:{kind:'SimpleDungeonPart'}});
 assert.equal(ui.regionIntuition().name,'Labyrinth');assert.match(ui.regionIntuition().summary,/exits/);
 state.realm='cave';assert.equal(ui.regionIntuition().name,'Natural cave');
});

test('native touch menus and double-tap defaults are suppressed even after a panel opens',t=>{
 const c=controls(t);
 for(const enabled of [true,false]) {
  c.r._inputEnabled=enabled;
  for(const type of ['touchstart','touchend','dblclick']) {
   let prevented=false;
   c.canvas.emit(type,{cancelable:true,preventDefault(){prevented=true;}});
   assert.equal(prevented,true,`${type}: enabled=${enabled}`);
  }
 }
});

test('secondary-click context menu is blocked after Intuition retargets it to the panel',t=>{
 const c=controls(t);
 c.r.onIntuition=()=>{c.r._inputEnabled=false;};
 c.canvas.emit('pointerdown',{button:2});
 assert.equal(c.r._inputEnabled,false);
 let prevented=false;
 c.doc.emit('contextmenu',{target:{id:'interaction-panel'},preventDefault(){prevented=true;}});
 assert.equal(prevented,true);
});

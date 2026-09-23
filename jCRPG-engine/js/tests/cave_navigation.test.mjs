import test from 'node:test';
import assert from 'node:assert/strict';
import {navigationWaypoint} from '../interactions/cave_navigation.js';
import {CELL} from '../world/format.js';
import {WorldMap} from '../world_map.js';

function fixture() {
 const cells = new Map(['0:0','1:0','2:0','0:2'].map(key => [key, CELL.FLOOR]));
 const exit = {id: 'connected',kind:'cave',to:[2.5,42,.5],from:[2.5,60,.5]};
 const other = {id:'disconnected',kind:'cave',to:[.5,42,2.5],from:[.5,60,2.5]};
 let selected = {id:'quest',name:'Surface goal',position:[20,60,20],realm:'surface'}, reads = 0;
 const stream = {world:{sizeX:1600,sizeZ:1600},chunks:[{x:0,z:0,ready:true,revision:1}],portalIndex:[other,exit],cellAt(x,y,z) {reads++;const flags = cells.get(`${Math.floor(x)}:${Math.floor(z)}`);return flags && Math.floor(y)===42 ? {flags} : null;}};
 const state = {realm:'cave',party:{position:{x:.5,y:42,z:.5}},exploration:stream,interactions:{navigationGoal:()=>selected}};
 return {state,stream,exit,cells,select(goal){selected=goal;},reads:()=>reads};
}
test('surface or absent quest points to connected exit without changing the selected goal', () => {
 const f=fixture(), original=f.state.interactions.navigationGoal();
 assert.equal(navigationWaypoint(f.state).id,f.exit.id);
 assert.equal(navigationWaypoint(f.state).caveExit,true);
 assert.equal(f.state.interactions.navigationGoal(),original);
 f.state.realm='surface';assert.equal(navigationWaypoint(f.state),original);
 f.state.realm='cave';f.select(null);assert.equal(navigationWaypoint(f.state).id,f.exit.id);
});
test('only a goal within the same connected cave overrides the exit', () => {
 const f=fixture(), goal={id:'local',name:'Cave quest',realm:'cave',position:[1.5,42,.5]};
 f.select(goal);assert.equal(navigationWaypoint(f.state),goal);
 f.select({...goal,position:[.5,42,2.5]});assert.equal(navigationWaypoint(f.state).id,f.exit.id);
 f.select({...goal,position:[1.5,44,.5]});assert.equal(navigationWaypoint(f.state).id,f.exit.id);
});
test('connectivity is cached, respects walls, and updates after streaming or teleporting', () => {
 const f=fixture();navigationWaypoint(f.state);const reads=f.reads();
 f.state.party.position.x=1.5;navigationWaypoint(f.state);assert.equal(f.reads(),reads);
 f.cells.set('0:0',CELL.FLOOR|CELL.E);f.cells.set('1:0',CELL.FLOOR|CELL.W);f.stream.chunks[0].revision++;
 f.state.party.position.x=.5;assert.equal(navigationWaypoint(f.state),null,'never directs through walls to a disconnected exit');
 f.state.party.position.z=2.5;assert.equal(navigationWaypoint(f.state).id,'disconnected');
});
test('missing cave chunks do not produce a misleading waypoint and late loads wake the marker', () => {
 const f=fixture();f.cells.clear();assert.equal(navigationWaypoint(f.state),null);
 f.cells.set('0:0',CELL.FLOOR);f.cells.set('1:0',CELL.FLOOR);f.cells.set('2:0',CELL.FLOOR);f.stream.chunks[0].revision++;
 assert.equal(navigationWaypoint(f.state).id,f.exit.id);
});
test('world map hit testing identifies the temporary exit as a cave destination', () => {
 const f=fixture(), map={state:f.state,full:{width:100,getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})},viewport:{project:()=>({x:.5,y:.5})},markers:[]};
 const hit=WorldMap.prototype._hit.call(map,{clientX:50,clientY:50});
 assert.equal(hit.id,f.exit.id);assert.equal(hit.kind,'cave');assert.equal(hit.realm,'cave');assert.equal(hit.y,42);
});

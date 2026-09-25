import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mazeNavigation} from '../interactions/maze_navigation.js';
import {navigationWaypoint} from '../interactions/cave_navigation.js';
import {goalMapRadius} from '../minimap_zoom.js';
import {CELL} from '../world/format.js';
import {GameState} from '../game_state.js';
import {FrozenWorld} from '../frozen_world.js';
import {BakedWorldStream} from '../world/baked_stream.js';

function fixture() {
 const structure={id:'maze',kind:'SimpleDungeonPart'};
 const cells=new Map(Array.from({length:5},(_,i)=>[i,CELL.FLOOR]));
 let goal={id:'quest',position:[20,40,.5],realm:'surface'};
 const state={realm:'surface',party:{position:{x:2.5,y:40,z:.5}},interactions:{navigationGoal:()=>goal},exploration:{world:{sizeX:1600,sizeZ:1600},chunks:[{ready:true,revision:1}],portalIndex:[
  {id:'west',kind:'door',structureId:'maze',from:[.5,40,.5]},
  {id:'east',kind:'door',structureId:'maze',from:[4.5,40,.5]},
 ],cellAt(x,y,z){const flags=cells.get(Math.floor(x));return flags && Math.floor(z)===0 && Math.floor(y)===40 ? {flags,structure,floor:40}:null;}}};
 return {state,cells,select(g){goal=g;}};
}
test('maze exits stay visible while local goals win; outside goals choose a route without changing the selection',()=>{
 const f=fixture(),goal=f.state.interactions.navigationGoal();
 assert.equal(navigationWaypoint(f.state).id,'maze-exit:east');
 assert.equal(mazeNavigation(f.state,goal).exits.length,2);
 assert.equal(f.state.interactions.navigationGoal(),goal);
 f.select({id:'inside',realm:'surface',position:[1.5,40,.5]});
 const local=navigationWaypoint(f.state);
 assert.equal(local.id,'inside');assert.equal(local.interior,true);
 assert.equal(mazeNavigation(f.state,local).exits.length,2);
 assert.ok(goalMapRadius(f.state.party.position,local,'surface',1600,1600)<40);
 f.select(null);assert.ok(navigationWaypoint(f.state).mazeExit);
 f.state.party.position.z=2;
 assert.equal(navigationWaypoint(f.state),null);
 assert.equal(mazeNavigation(f.state,null),null);
});
test('walls and streaming changes exclude unreachable exits and goals',()=>{
 const f=fixture();navigationWaypoint(f.state);
 f.cells.set(3,CELL.FLOOR|CELL.E);f.cells.set(4,CELL.FLOOR|CELL.W);
 f.state.exploration.chunks[0].revision++;
 f.select({id:'blocked',realm:'surface',position:[4.5,40,.5]});
 assert.equal(navigationWaypoint(f.state).id,'maze-exit:west');
 assert.equal(mazeNavigation(f.state,null).exits.length,1);
 f.state.exploration.chunks[0].ready=false;f.cells.clear();
 assert.equal(mazeNavigation(f.state,null),null);
});
test('real baked maze exposes all four exits, retains its generator goal, and clears on leaving',async()=>{
 const read=url=>JSON.parse(fs.readFileSync(url));
 const base=new URL('../../worlds/seed0/v2/',import.meta.url);
 const world=new FrozenWorld(read(new URL('../../json/frozen_world.json',import.meta.url)));
 const stream=new BakedWorldStream(world,read(new URL('manifest.json',base)),base,{fetcher:async url=>new Response(fs.readFileSync(url))});
 const state=new GameState();state.exploration=stream;
 const maze=read(new URL('structures.json',base)).find(s=>s.kind==='SimpleDungeonPart');
 const portals=read(new URL('portals.json',base)).filter(p=>p.structureId===maze.id);
 try {
  await state.teleport(portals[0].to[0],portals[0].to[2],portals[0].to[1]);
  const outside={id:'far',position:[800,40,907],realm:'surface'};
  state.interactions={navigationGoal:()=>outside};
  const region=mazeNavigation(state,outside);
  assert.equal(region.exits.length,4);
  assert.equal(region.goal.mazeExit,true);
  const local={id:'local',position:portals[1].to,realm:'surface'};
  assert.equal(mazeNavigation(state,local).goal.id,'local');
  await state.teleport(800,907,41);
  assert.equal(navigationWaypoint(state),outside);
  assert.equal(mazeNavigation(state,outside),null);
 } finally {stream.dispose();}
});

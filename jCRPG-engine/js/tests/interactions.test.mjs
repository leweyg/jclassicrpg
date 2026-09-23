import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {InteractionRuntime,predicate} from '../interactions/runtime.js';
import {selectNearby} from '../interactions/nearby.js';
import {mapGoalPosition} from '../interactions/navigation.js';
import {initialPuzzle,puzzleStep,solvePuzzle} from '../interactions/puzzles.js';
import {SaveDeltas,validateSave} from '../world/save_deltas.js';
import {FrozenWorld} from '../frozen_world.js';
import {BakedWorldStream} from '../world/baked_stream.js';
const base=new URL('../../worlds/seed0/v2/',import.meta.url),read=file=>JSON.parse(fs.readFileSync(new URL(file,base)));
const manifest=read('interactions/manifest.json'),content=Object.fromEntries(Object.entries(manifest.catalogs).map(([key,desc])=>[key,read(desc.url)]));
const create=()=>new InteractionRuntime(content,new SaveDeltas({getItem:()=>null,setItem:()=>{}}));
const run=(e,actions)=>e.transact(actions);
test('navigation follows quest objectives, return actor and unlocked follow-up; selection survives saves',()=>{
 const e=create(),m=content.missions.find(m=>m.id==='mission:antipion:balance');
 e.setNavigationLocation({id:'test-place',name:'Test place',x:10,z:20});assert.equal(e.navigationGoal().id,'test-place');
 assert.throws(()=>e.setNavigationLocation({id:'bad',name:'Invalid',x:NaN,z:20}));assert.equal(e.navigationGoal().id,'test-place');
 run(e,[{op:'accept',id:m.id}]);assert.equal(e.save.data.navMissionId,m.id);
 assert.equal(e.save.data.navLocation,null);
 assert.equal(e.navigationGoal().targetId,m.objectives[0].targetIds[0]);
 solve(e,m.objectives[0].targetIds[0]);assert.equal(e.navigationGoal().id,m.turnInActorId);
 const copy=create();copy.save.import(e.save.export());copy.initialize();assert.deepEqual(copy.navigationGoal(),e.navigationGoal());
 run(e,[{op:'turnIn',id:m.id}]);assert.notEqual(e.save.data.navMissionId,m.id);
 if(e.save.data.navMissionId)assert.ok(e.navigationGoal());
 const another=e.journal().find(m=>m.state==='available');e.setNavigationGoal(another.id);assert.equal(e.navigationGoal().id,another.giverActorId);
 assert.throws(()=>e.setNavigationGoal(m.id));
});
test('navigation icons stay inside map edges and retain their bearing',()=>{
 assert.deepEqual(mapGoalPosition(128,128,256),{x:128,y:128,edge:false,angle:0});
 const east=mapGoalPosition(2000,128,256);assert.equal(east.x,236);assert.equal(east.y,128);assert.ok(east.edge);
 const corner=mapGoalPosition(-100,-100,256);assert.equal(corner.x,20);assert.equal(corner.y,20);
});
test('intuition describes nearby characters and objects without activating or revealing them',()=>{
 const e=create(),before=e.save.export(),actor=content.actors[0],puzzle=content.puzzles[0];
 const targets=[{kind:'actor',targetId:actor.id},{kind:'container',targetId:content.containers[0].id},{kind:'shrine',targetId:content.shrines[0].id},{kind:'puzzle',targetId:puzzle.id,componentId:puzzle.componentIds[0]},{kind:'puzzle',targetId:puzzle.id,componentId:puzzle.id+':reset'},{kind:'evidence',targetId:'reading',fact:'A measured reading.'}];
 for(const target of targets){const info=e.intuition(target);assert.ok(info.name);assert.ok(info.summary);}
 assert.equal(e.intuition(targets[0]).name,actor.name);
 assert.equal(e.intuition(targets[1]).itemCount,content.containers[0].items.reduce((n,i)=>n+(i.quantity??1),0));
 assert.equal(e.intuition(targets.at(-1)).summary,'A measured reading.');
 assert.equal(e.intuition(null),null);assert.equal(e.intuition({kind:'unknown'}),null);
 assert.equal(e.save.export(),before);assert.equal(e.panel,null);
});
function solve(e,id){const p=e.maps.puzzles[id];for(const input of solvePuzzle(p).inputs)run(e,[{op:'puzzle',id,input}]);}
const worldData=JSON.parse(fs.readFileSync(new URL('../../json/frozen_world.json',import.meta.url)));
test('legacy evidence and fixed capital identities survive compilation',()=>{
 assert.equal(worldData.actors.length,319);assert.equal(worldData.actors.filter(a=>a.isPlayer).length,1);assert.ok(worldData.actors.filter(a=>!a.isPlayer).every(a=>a.ownedInfrastructure.length));assert.equal(worldData.objectInstances.length,4);assert.equal(new Set(worldData.objectInstances.map(i=>i.id)).size,4);assert.equal(worldData.scenario.state.intPlyd,true);
 assert.equal(content.shrines.length,173);assert.equal(content.cultures.length,6);for(const c of content.cultures){assert.equal(c.secondaryCapitalTownIds.length,4);for(const id of c.secondaryCapitalTownIds)assert.ok(content.settlements.some(t=>t.parentSecondaryCapitalTownId===id));}
 assert.equal(content.actors.find(a=>a.name==='Marn Even-Tally').legacy.numericId,'544');
 const owners=read('interactions/ownership.json');assert.equal(owners.length,208);assert.ok(owners.every(o=>content.actors.some(a=>a.id===o.actorId)));assert.equal(read('structures.json').filter(s=>s.kind==='SimpleDungeonPart'&&s.ownerMemberId).length,25);
});
test('all puzzles solve; reset recovers wrong configurations without losing completed effects',()=>{
 const e=create();for(const p of content.puzzles){let s=initialPuzzle(p);s=puzzleStep(p,s,p.componentIds[2]);assert.deepEqual(puzzleStep(p,s,'reset'),initialPuzzle(p));solve(e,p.id);assert.ok(e.save.data.puzzles[p.id].completed);const before=structuredClone(e.save.data.settlements);run(e,[{op:'puzzle',id:p.id,input:p.componentIds[0]}]);assert.deepEqual(e.save.data.settlements,before);}
 assert.equal(Object.keys(e.save.data.mazeGenerators).length,30);
});
test('a failed multi-action transaction leaves no partial state; tokens deduplicate',()=>{
 const e=create(),before=e.save.export();assert.throws(()=>run(e,[{op:'flag',id:'test',value:true},{op:'take',id:'missing'}]));assert.equal(e.save.export(),before);
 const token=e.save.data.lastTransaction+1; e.transact([{op:'shrine',id:content.shrines[0].id}],token);const saved=e.save.export();assert.equal(e.transact([{op:'flag',id:'test',value:true}],token).duplicate,true);assert.equal(e.save.export(),saved);assert.throws(()=>predicate({javascript:'alert(1)'},e.save.data,e));
});
test('inventory transfer, take-all rollback, migration and portable saves',()=>{
 const e=create(),c=content.containers[0];e.save.import(JSON.stringify({saveVersion:1,worldId:'seed0-web-v1',generatorVersion:'web-baked-v1',player:{x:800,y:41,z:907,realm:'surface'},openedContainers:{[c.id]:true},discoveredLocations:{}}));e.initialize();assert.equal(e.save.data.containers[c.id].legacySearched,true);assert.deepEqual(e.save.data.containers[c.id].takenItemIds,[]);assert.equal(e.save.data.inventory.order.length,4);
 run(e,[{op:'open',id:c.id}]);const before=e.save.export();assert.throws(()=>run(e,[{op:'take',id:c.id,itemIds:[c.items[0].id,'bad']} ]));assert.equal(e.save.export(),before);run(e,[{op:'take',id:c.id}]);run(e,[{op:'take',id:c.id}]);assert.equal(e.save.data.inventory.order.length,5);assert.equal(e.intuition({kind:'container',targetId:c.id}).itemCount,0);
 const copy=create();copy.save.import(e.save.export());copy.initialize();assert.deepEqual(copy.save.data,e.save.data);assert.throws(()=>validateSave({...e.save.data,puzzles:{bad:{values:[-1],cursor:0,observed:[],completed:false}}}));assert.throws(()=>validateSave(JSON.parse('{"__proto__":{"polluted":true}}')));
});
test('all missions can progress in dependency order; early world work backfills',()=>{
 const e=create();for(const s of content.shrines)run(e,[{op:'shrine',id:s.id}]);for(const p of content.puzzles)solve(e,p.id);
 const pending=new Set(content.missions.map(m=>m.id));let passes=0;while(pending.size){assert.ok(++passes<10,'mission dependency deadlock');let progress=0;for(const id of [...pending]){const m=e.maps.missions[id];if(e.missionState(id)!=='available')continue;run(e,[{op:'accept',id}]);for(const o of m.objectives)for(const target of o.targetIds){if(o.kind==='commitment')run(e,[{op:'commitment',id:target,value:'Tested promise'}]);if(o.kind==='evidence')run(e,[{op:'evidence',id:target}]);if(o.kind==='actor')run(e,[{op:'talk',id:target}]);}assert.equal(e.missionState(id),'ready-to-turn-in',id);run(e,[{op:'turnIn',id}]);assert.equal(e.missionState(id),'completed');assert.throws(()=>run(e,[{op:'accept',id}]));pending.delete(id);progress++;}assert.ok(progress);}
 for(const c of content.cultures)for(const id of [c.capitalTownId,...c.secondaryCapitalTownIds])assert.equal(e.save.data.settlements[id].balanceState,'integrated');
 assert.equal(e.save.data.shrineRoutes['route:wammigmig:awshowam'].state,'arrived');assert.ok(e.save.data.flags['letter:garrum']);
 const capital=content.cultures[0].capitalTownId;const powered=[...e.save.data.settlements[capital].poweredTargetIds];run(e,[{op:'settlement',id:capital}]);assert.equal(e.save.data.settlements[capital].balanceState,'integrated');assert.deepEqual(e.save.data.settlements[capital].poweredTargetIds,powered);
});
test('nearby selection is deterministic, respects floor/realm/LOS and wrap',()=>{
 const a={id:'a',targetId:'a',kind:'actor',position:[1,40,0],realm:'surface',range:3,priority:70},b={...a,id:'b',position:[0,40,1]};
 assert.equal(selectNearby([b,a],{x:0,y:40,z:0},'surface').id,'a');assert.equal(selectNearby([a,b],{x:0,y:40,z:0},'surface',{facing:[0,1]}).id,'b');assert.equal(selectNearby([a],{x:0,y:42,z:0},'surface'),null);assert.equal(selectNearby([a],{x:1599,y:40,z:0},'surface').id,'a');assert.equal(selectNearby([{...a,requiresLineOfSight:true}],{x:0,y:40,z:0},'surface',{lineOfSight:()=>false}),null);
});
test('opening mission controls are reachable from spawn using production collision and nearby selection',async()=>{
 const world=new FrozenWorld(worldData),stream=new BakedWorldStream(world,read('manifest.json'),base,{fetcher:async u=>new Response(fs.readFileSync(u))});stream.update(800,907);await stream.settled();
 const anchors=stream.chunks.flatMap(s=>s.data.interactions),targets=anchors.filter(a=>a.targetId.includes('wammigmig')||a.targetId==='shrine:shrine 19 22:782:903'||a.targetId===content.actors.find(a=>a.name==='Marn Even-Tally').id);
 // Grid BFS calls the actual movement contract. It does not teleport through walls.
 const start=[800.5,stream.floorAt(800.5,41,907.5),907.5],queue=[start],seen=new Set(['800:907']),reached=new Set();
 for(let i=0;i<queue.length;i++){const [x,y,z]=queue[i];const action=stream.nearby({x,y,z},'surface');if(action)reached.add(action.id);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,key=Math.floor(nx)+':'+Math.floor(nz);if(nx<774||nx>841||nz<890||nz>920||seen.has(key)||!stream.canMove(x,y,z,nx,nz))continue;const ny=stream.floorAt(nx,y,nz);seen.add(key);queue.push([nx,ny,nz]);}}
 for(const a of targets)assert.ok(reached.has(a.id),`${a.prompt} unreachable at ${a.position}`);stream.dispose();
});
test('every compiled actor, shrine and control can be selected on its streamed floor',async()=>{
 const world=new FrozenWorld(worldData),stream=new BakedWorldStream(world,read('manifest.json'),base,{fetcher:async u=>new Response(fs.readFileSync(u))});
 const chunkKeys=new Set(content.goals.filter(g=>g.kind!=='container').map(g=>Math.floor(g.position[0]/32)+':'+Math.floor(g.position[2]/32))),checked=new Set(),failures=[];
 for(const key of chunkKeys){const [cx,cz]=key.split(':').map(Number);stream.update(cx*32+16,cz*32+16);await stream.settled();for(const slot of stream.chunks)if(slot.ready)for(const a of slot.data.interactions){if(a.kind==='container'||checked.has(a.id))continue;checked.add(a.id);let found=false;for(const [dx,dz]of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1],[2,0],[-2,0],[0,2],[0,-2]]){const x=a.position[0]+dx,z=a.position[2]+dz,y=stream.floorAt(x,a.position[1],z,a.realm);if(!Number.isFinite(y))continue;const d=Math.hypot(dx,dz)||1;const target=stream.nearby({x,y,z},a.realm,1.8,{facing:[-dx/d,-dz/d]});if(target?.id===a.id){found=true;break;}}if(!found)failures.push({id:a.id,position:a.position});}}
 stream.dispose();assert.deepEqual(failures,[]);
});

test('loot from different containers stacks, counts toward predicates and survives export/import',()=>{
 const e=create(),containers=content.containers.filter(c=>c.items[0]?.typeId==='CopperCoil').slice(0,2);
 assert.equal(containers.length,2);
 for(const c of containers)run(e,[{op:'open',id:c.id},{op:'take',id:c.id}]);
 const coils=Object.values(e.save.data.inventory.items).filter(i=>i.typeId==='CopperCoil');
 assert.equal(coils.length,1);assert.equal(coils[0].quantity,2);assert.equal(coils[0].sourceIds.length,2);
 assert.equal(predicate({hasItem:['CopperCoil',2]},e.save.data,e),true);
 assert.equal(predicate({hasItem:['CopperCoil',3]},e.save.data,e),false);
 const before=e.save.export();
 const third=content.containers.find(c=>!containers.includes(c));
 assert.throws(()=>run(e,[{op:'open',id:third.id},{op:'take',id:third.id,itemIds:[third.items[0].id,'bad']} ]));
 assert.equal(e.save.export(),before);
 const copy=create();copy.save.import(before);copy.initialize();
 for(const c of containers)run(copy,[{op:'take',id:c.id}]);
 assert.equal(Object.values(copy.save.data.inventory.items).find(i=>i.typeId==='CopperCoil').quantity,2);
});

test('legacy instance saves migrate and source/count tampering is rejected',()=>{
 const e=create(),old=JSON.parse(e.save.export());
 old.inventory={items:Object.fromEntries(content.initialInventory.map(i=>[i.id,structuredClone(i)])),order:content.initialInventory.map(i=>i.id)};
 const containers=content.containers.slice(0,2);
 for(const c of containers){const item=c.items[0];old.inventory.items[item.id]=structuredClone(item);old.inventory.order.push(item.id);old.containers[c.id]={opened:true,takenItemIds:[item.id]};}
 e.save.import(JSON.stringify(old));e.initialize();
 const stack=Object.values(e.save.data.inventory.items).find(i=>i.typeId==='CopperCoil');
 assert.equal(stack.quantity,2);assert.equal(stack.sourceIds.length,2);
 const valid=e.save.export();e.save.import(valid);e.initialize();assert.equal(e.save.export(),valid);
 for(const mutate of [i=>i.quantity++,i=>i.sourceIds.push('unknown-source')]){
  const bad=JSON.parse(valid);mutate(bad.inventory.items[stack.id]);e.save.import(JSON.stringify(bad));
  assert.throws(()=>e.initialize(),/inventory/);
 }
});

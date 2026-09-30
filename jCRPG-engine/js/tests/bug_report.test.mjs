import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {InteractionRuntime} from '../interactions/runtime.js';
import {SaveDeltas} from '../world/save_deltas.js';
import {solvePuzzle} from '../interactions/puzzles.js';
import {caveArrivalYaw} from '../interactions/cave_navigation.js';
import {SceneRenderer} from '../render_engine.js';
const base=new URL('../../worlds/seed0/v2/',import.meta.url);
const read=file=>JSON.parse(fs.readFileSync(new URL(file,base)));
const content=Object.fromEntries(Object.entries(read('interactions/manifest.json').catalogs).map(([key,value])=>[key,read(value.url)]));
const create=()=>new InteractionRuntime(structuredClone(content),new SaveDeltas());
const finish=e=>{while(e.dialogue().canAdvance)e.advanceDialogue();return e.dialogue();};

test('local work acknowledges acceptance and changes a deliberate waypoint only on request',()=>{
 const e=create(),actor='actor:wammigmig:orro',mission='mission:orro:relay';
 e.interact({kind:'actor',targetId:actor});
 e.choose(finish(e).choices.findIndex(c=>c.next==='local-work'));
 e.choose(finish(e).choices.findIndex(c=>c.actions?.some(a=>a.op==='accept'&&a.id===mission)));
 assert.match(finish(e).text,/relay/);
 e.choose(e.dialogue().choices.findIndex(c=>c.text==='Until next time.'));assert.equal(e.panel,null);
 e.save.data.navMissionId=null;e.save.data.navLocation={id:'other',position:[0,40,0],name:'Other',realm:'surface'};
 e.interact({kind:'actor',targetId:actor});
 assert.equal(e.save.data.navMissionId,null);assert.equal(e.save.data.navLocation.id,'other');
 e.choose(finish(e).choices.findIndex(c=>c.next==='local-work'));
 e.choose(finish(e).choices.findIndex(c=>c.next==='hint:'+mission));
 assert.match(e.dialogue().text,/relay/);
 e.choose(finish(e).choices.findIndex(c=>c.trackMissionId===mission));
 assert.equal(e.save.data.navMissionId,mission);assert.equal(e.save.data.navLocation,null);
 assert.equal(e.navigationGoal().targetId,'evidence:orro:relay');
});

test('capital puzzle waypoint follows readings, values and pulses then returns to the giver',()=>{
 const e=create(),mission='mission:antipion:balance',p=e.maps.puzzles['puzzle:antipion:capital'];
 e.transact([{op:'accept',id:mission}]);
 for(const input of solvePuzzle(p).inputs){
  const goal=e.navigationGoal();assert.ok(goal.id.endsWith(':'+input),`${goal.id} should guide to ${input}`);
  e.transact([{op:'puzzle',id:p.id,input}]);
 }
 assert.equal(e.missionState(mission),'ready-to-turn-in');assert.equal(e.navigationGoal().id,e.maps.missions[mission].turnInActorId);
});

test('cave arrivals use the open passage axis and reverse it on exit',()=>{
 const portal={to:[10,42,10]},stream={canMove:(x,y,z,nx,nz,realm)=>realm==='cave'&&nx>=10&&nx<=14&&nz===10};
 assert.equal(caveArrivalYaw(stream,portal,true),Math.PI/2);
 assert.equal(caveArrivalYaw(stream,portal,false),-Math.PI/2);
 assert.equal(caveArrivalYaw(stream,{...portal,entryYaw:.7},true),.7);
});

test('camera cuts before a delayed dialogue download finishes, with input paused',async()=>{
 let resolve;const events=[];const r=Object.create(SceneRenderer.prototype);
 Object.assign(r,{_inputEnabled:true,nearbyInteraction:()=>({kind:'actor',targetId:'npc'}),cancelInput(){},setInputEnabled(value){events.push(['input',value]);},beginConversation(actor){events.push(['camera',actor.id]);},gameState:{interactions:{maps:{actors:{npc:{id:'npc'}}}},interact:()=>new Promise(r=>{resolve=r;})},onInteractionPanel(){events.push(['dialogue']);},worldView:{sync(){}},_syncCamera(){},requestRender(){}});
 const pending=r.interact();assert.deepEqual(events,[['input',false],['camera','npc']]);
 resolve('Hello');await pending;assert.deepEqual(events.at(-1),['dialogue']);
});

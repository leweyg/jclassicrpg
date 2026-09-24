import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {InteractionRuntime} from '../interactions/runtime.js';
import {SaveDeltas} from '../world/save_deltas.js';
import {validateContent} from '../interactions/format.js';
import {MAIN_IDS} from '../../../scripts/main_story.mjs';
const base=new URL('../../worlds/seed0/v2/',import.meta.url);
const read=file=>JSON.parse(fs.readFileSync(new URL(file,base)));
const content=Object.fromEntries(Object.entries(read('interactions/manifest.json').catalogs).map(([k,v])=>[k,read(v.url)]));
const create=()=>new InteractionRuntime(content,new SaveDeltas());
const act=(e,...actions)=>e.transact(actions);
const reload=e=>{const save=new SaveDeltas();save.import(e.save.export());return new InteractionRuntime(content,save);};
function road(e){act(e,{op:'talk',id:'actor:wammigmig:orro'},{op:'shrine',id:'shrine:shrine 19 22:782:903'});act(e,{op:'turnIn',id:MAIN_IDS[0]});}
test('automatic chapters, unique cave item, fitting and report survive every transition',()=>{
 let e=create();assert.equal(e.missionState(MAIN_IDS[0]),'active');assert.equal(e.navigationGoal().targetId,'actor:wammigmig:orro');
 road(e);e=reload(e);assert.equal(e.currentStoryChapter().missionId,MAIN_IDS[1]);
 act(e,{op:'talk',id:'actor:wammigmig:pella'});assert.equal(e.navigationGoal().id,'cave:760:920:0');
 const surface=content.containers.find(c=>c.items[0].typeId==='CopperCoil');act(e,{op:'open',id:surface.id},{op:'take',id:surface.id});
 assert.throws(()=>act(e,{op:'fit',id:'fitting:wammigmig:listening-coil'}));
 e.save.data.player={x:786,y:20,z:928,realm:'cave'};assert.equal(e.navigationGoal().realm,'cave');
 const id='container:concordance:listening-coil';act(e,{op:'open',id},{op:'take',id});e=reload(e);assert.equal(e.navigationGoal().targetId,'fitting:wammigmig:listening-coil');
 const token=e.save.data.lastTransaction+1;const action={op:'fit',id:'fitting:wammigmig:listening-coil'};e.transact([action],token);assert.ok(e.transact([action],token).duplicate);e=reload(e);
 assert.equal(e.missionState(MAIN_IDS[1]),'ready-to-turn-in');act(e,{op:'turnIn',id:MAIN_IDS[1]});e=reload(e);
 const puzzle=e.maps.puzzles['puzzle:boarman:regional:1'];act(e,{op:'talk',id:'actor:boarman:regional:1'});for(const input of [...puzzle.componentIds].reverse())act(e,{op:'puzzle',id:puzzle.id,input});
 assert.equal(e.missionState(MAIN_IDS[2]),'ready-to-turn-in');act(e,{op:'turnIn',id:MAIN_IDS[2]});e=reload(e);assert.equal(e.currentStoryChapter(),null);assert.equal(e.mainNavigationGoal(),null);assert.ok(e.save.data.flags['story:concordance:opening:milestone']);
});
test('manual side navigation survives main progress and returns on completion',()=>{
 const e=create(),id='mission:orro:relay';act(e,{op:'accept',id});e.setNavigationGoal(id);road(e);assert.equal(e.save.data.navMissionId,id);act(e,{op:'evidence',id:'evidence:orro:relay'});assert.equal(e.save.data.navMissionId,id);act(e,{op:'turnIn',id});assert.equal(e.save.data.navMissionId,MAIN_IDS[1]);
});
test('v1 migration preserves world progress but never mistakes surface salvage for the cave coil',()=>{
 const e=create();const old=JSON.parse(e.save.export());old.interactionContentVersion='interactions-v1';delete old.flags['opening-v1'];delete old.missions[MAIN_IDS[0]];old.missions['mission:wammigmig:fair-share']={state:'completed',objectiveSources:{}};old.shrines['shrine:shrine 19 22:782:903']={activated:true};old.navMissionId=null;e.save.import(JSON.stringify(old));e.initialize();assert.equal(e.missionState(MAIN_IDS[0]),'completed');assert.equal(e.missionState(MAIN_IDS[1]),'active');assert.equal(e.save.data.lastTransaction,old.lastTransaction);assert.equal(e.objectiveSources(e.maps.missions[MAIN_IDS[1]].objectives[1],e.save.data).length,0);assert.deepEqual(reload(e).save.data,e.save.data);
});
test('story validation rejects cycles, missing successors and optional prerequisites',()=>{
 for(const mutate of [c=>c.stories[0].chapters[2].nextChapterId=c.stories[0].chapters[0].id,c=>c.stories[0].chapters[0].nextChapterId='missing',c=>c.missions.find(m=>m.id===MAIN_IDS[1]).requires.push('mission:orro:relay')]){const c=structuredClone(content);mutate(c);assert.throws(()=>validateContent(c));}
});

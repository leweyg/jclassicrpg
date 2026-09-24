import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadInteractions} from '../interactions/runtime.js';
import {SaveDeltas} from '../world/save_deltas.js';

const base=new URL('../../worlds/seed0/v2/',import.meta.url);
test('generic residents use a shared usable greeting without requesting a dialogue file',async()=>{
 const requests=[];
 const engine=await loadInteractions(base,new SaveDeltas(),async url=>{
  requests.push(url.href);
  return new Response(fs.readFileSync(url));
 });
 const residents=engine.content.actors.filter(a=>a.role==='Local witness'&&!a.missionIds.length);
 assert.ok(residents.length>1);
 assert.deepEqual([...new Set(residents.map(a=>a.dialogueId))],['dialogue:default:resident']);
 const count=requests.length;
 for(const actor of residents.slice(0,2)){
  await engine.loadRecord('dialogues',actor.dialogueId);
  engine.interact({kind:'actor',targetId:actor.id});
  assert.match(engine.dialogue().text,/Drift/);
  assert.equal(engine.dialogue().choices[0].text,'Until next time.');
  engine.choose(0);
 }
 assert.equal(requests.length,count);
 const orro=engine.content.actors.find(a=>a.id==='actor:wammigmig:orro');
 await engine.loadRecord('dialogues',orro.dialogueId);
 assert.equal(requests.length,count+1,'authored dialogue still streams on demand');
 engine.interact({kind:'actor',targetId:orro.id});
 assert.match(engine.dialogue().text,/I am Orro/);
});

test('shared dialogue templates reproduce every instance and load each template once',async()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('interactions/manifest.json',base)));
 const authored=JSON.parse(fs.readFileSync(new URL('interactions/dialogues.json',base)));
 const references=Object.entries(manifest.records.dialogues).filter(([,d])=>d.template);
 assert.ok(references.length>=55,'witnesses and maze keepers should share templates');
 const requests=[];
 const engine=await loadInteractions(base,new SaveDeltas(),async url=>{requests.push(url.href);return new Response(fs.readFileSync(url));});
 const count=requests.length;
 for(const [id] of references){
  await engine.loadRecord('dialogues',id);
  assert.deepEqual(engine.maps.dialogues[id],authored.find(d=>d.id===id),'Instance bindings must preserve dialogue and quest IDs');
 }
 assert.equal(requests.length-count,new Set(references.map(([,d])=>d.template.url)).size);
 const maze=references.filter(([,d])=>d.parameters.missionId?.startsWith('mission:generator:'));
 assert.equal(maze.length,25);
 const first=engine.maps.dialogues[maze[0][0]],second=engine.maps.dialogues[maze[1][0]];
 first.nodes.greeting.text='A unique local edit';
 assert.notEqual(second.nodes.greeting.text,first.nodes.greeting.text,'Instances must not mutate their shared template');
});

test('authoring a unique conversation automatically separates it from the generic template',async()=>{
 const {dialogueTemplateGroups}=await import('../../../scripts/dialogue_templates.mjs');
 const content={actors:[],dialogues:['dialogue:test:a','dialogue:test:b','dialogue:test:c'].map(id=>({id,start:'greeting',nodes:{greeting:{text:'Shared greeting',choices:[]}}}))};
 assert.equal(dialogueTemplateGroups(content).length,1);
 content.dialogues[0].nodes.greeting.text='A newly authored greeting';
 const groups=dialogueTemplateGroups(content);
 assert.deepEqual(groups.map(g=>g.instances.length).sort(),[1,2]);
});

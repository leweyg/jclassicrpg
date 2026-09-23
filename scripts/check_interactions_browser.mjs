#!/usr/bin/env node
/** Isolated local Chrome CDP acceptance test. Uses the actual movement and UI
 * handlers; no mission progress is injected. Start a static host and headless Chrome. */
import fs from 'node:fs';
const port=process.env.JCRPG_CDP_PORT??'9228',origin=process.env.JCRPG_TEST_ORIGIN??'http://127.0.0.1:8789',out=process.argv[2]??'/tmp/jcrpg-interaction-evidence';
fs.mkdirSync(out,{recursive:true});
const target=(await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page');
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function loaded(){for(let i=0;i<160;i++){if(await evaluate('!!window.__sceneRenderer'))return;const s=await evaluate('document.getElementById("load-status")?.textContent');if(s?.startsWith('Failed'))throw Error(s);await delay(200);}throw Error('Boot timed out');}
await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:origin+'/play.html'});await loaded();
await evaluate(`(async()=>{const {emptySave}=await import('./jCRPG-engine/js/world/save_deltas.js');__gameState.saveDeltas.import(JSON.stringify(emptySave()));__gameState.interactions.initialize();await __gameState.teleport(800,907,41,'surface');__sceneRenderer._syncCamera();__sceneRenderer.requestRender();})()`);
async function screenshot(name){await delay(250);await evaluate('__sceneRenderer.requestRender()');await delay(100);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(out+'/'+name+'.png',Buffer.from(shot.data,'base64'));}
const helper=`window.walkToInteraction=async function(id){
 const state=__gameState,stream=state.exploration,p=state.party.position,anchors=stream.chunks.flatMap(c=>c.ready?c.data.interactions:[]),target=anchors.find(a=>a.id===id);
 if(!target)throw Error('Anchor not loaded: '+id);
 const sx=Math.floor(p.x)+.5,sz=Math.floor(p.z)+.5,sy=stream.floorAt(sx,p.y,sz,state.realm),queue=[[sx,sy,sz,-1]],seen=new Set([Math.floor(sx)+':'+Math.floor(sz)]);let found=-1;
 for(let i=0;i<queue.length;i++){const [x,y,z]=queue[i],dx=target.position[0]-x,dz=target.position[2]-z,mag=Math.hypot(dx,dz)||1;const action=stream.nearby({x,y,z},state.realm,1.8,{facing:[dx/mag,dz/mag],priority:a=>state.interactions.priority(a)});if(action?.id===id){found=i;break;}
 for(const [mx,mz]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+mx,nz=z+mz,key=Math.floor(nx)+':'+Math.floor(nz);if(seen.has(key)||Math.abs(nx-sx)>65||Math.abs(nz-sz)>65||!stream.canMove(x,y,z,nx,nz,state.realm))continue;seen.add(key);queue.push([nx,stream.floorAt(nx,y,nz,state.realm),nz,i]);}}
 if(found<0)throw Error('No walking route to '+target.prompt+' '+target.position);
 const path=[];for(let k=found;k>=0;k=queue[k][3])path.unshift(queue[k]);
 for(const [x,y,z]of path){state.moveParty(x-p.x,0);state.moveParty(0,z-p.z);if(Math.hypot(p.x-x,p.z-z)>.15)throw Error('Walking blocked before '+id);}
 __sceneRenderer._yaw=Math.atan2(-(target.position[0]-p.x),-(target.position[2]-p.z));__sceneRenderer._syncCamera();
 const action=state.nearbyInteraction([-Math.sin(__sceneRenderer._yaw),-Math.cos(__sceneRenderer._yaw)]);if(action?.id!==id)throw Error('Wrong selected target '+action?.id+' wanted '+id);
 __sceneRenderer.highlightInteraction(action);await __sceneRenderer.interact();return path.length;
};`;
await evaluate(helper);
const content=await evaluate('__gameState.interactions.content');
const actor=name=>content.actors.find(a=>a.name===name);
async function readCaptions(){await evaluate(`(()=>{let remaining=64;while(__gameState.interactions.panel?.kind==='dialogue'&&__gameState.interactions.dialogue().canAdvance){if(!remaining--)throw Error('Caption loop');const button=[...document.querySelectorAll('#interaction-body button')].find(b=>b.textContent==='Continue');if(!button)throw Error('Missing caption Continue');button.click();}})()`);}
async function clickText(text){await readCaptions();await evaluate(`(()=>{const b=[...document.querySelectorAll('#interaction-panel button')].find(b=>b.textContent===${JSON.stringify(text)});if(!b)throw Error('Missing UI choice: '+${JSON.stringify(text)});b.click();})()`);}
const walk=target=>evaluate(`walkToInteraction(${JSON.stringify(target)})`);
const close=()=>clickText('Close');
await screenshot('spawn');
await walk('interaction:shrine:shrine:shrine 19 22:782:903');
await walk('interaction:actor:'+actor('Marn Even-Tally').id);await screenshot('marn-dialogue');await clickText('Accept: A Fair Share of Light');await clickText('Until next time.');
for(const id of ['storage','hut','homes'])await walk('interaction:evidence:evidence:wammigmig:'+id);
const opening=content.puzzles.find(p=>p.id==='puzzle:wammigmig:distribution');for(const input of opening.solution.slice(0,6))await walk('interaction:puzzle:'+input);
// Save a partially configured circuit, reload, import through the real file UI,
// then continue using the remaining visible operations.
const partial=await evaluate('__gameState.saveDeltas.export()');fs.writeFileSync(out+'/partial-save.json',partial);
await send('Page.reload');await loaded();await evaluate(helper);
await send('DOM.enable');const doc=await send('DOM.getDocument');const inputNode=await send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'#world-import'});await send('DOM.setFileInputFiles',{nodeId:inputNode.nodeId,files:[out+'/partial-save.json']});await delay(400);
for(const input of opening.solution.slice(6))await walk('interaction:puzzle:'+input);
await walk('interaction:actor:'+actor('Marn Even-Tally').id);await clickText('Fairness must include households and the shared relay.');await clickText('Back');await clickText('Report: A Fair Share of Light');await clickText('Until next time.');
await evaluate('document.getElementById("world-journal").click()');await screenshot('opening-completed-journal');await close();
let saved=await evaluate('__gameState.saveDeltas.export()');
await send('Page.reload');await loaded();await evaluate(helper);
if(!await evaluate('__gameState.saveDeltas.data.missions["mission:wammigmig:fair-share"].state==="completed"'))throw Error('Reload lost mission');
await evaluate(`__gameState.saveDeltas.import(${JSON.stringify(saved)});__gameState.interactions.initialize();`);
// Exercise a real maze, walking all component paths from its keeper.
const mission=content.missions.find(m=>m.id.startsWith('mission:generator:')),keeper=content.actors.find(a=>a.id===mission.giverActorId);
await evaluate(`(async()=>{await __gameState.teleport(${keeper.position[0]},${keeper.position[2]},${keeper.position[1]},'surface');__sceneRenderer.worldView.sync();__sceneRenderer._syncCamera();__sceneRenderer.requestRender();})()`);
await walk('interaction:actor:'+keeper.id);await clickText('Accept: '+mission.title);
const maze=content.puzzles.find(p=>p.id===mission.objectives[0].targetIds[0]);for(const input of maze.solution)await walk('interaction:puzzle:'+input);
await screenshot('maze-generator-active');await walk('interaction:actor:'+keeper.id);await clickText('Report: '+mission.title);
await send('Page.reload');await loaded();
const report=await evaluate(`({mission:__gameState.saveDeltas.data.missions['mission:wammigmig:fair-share'],maze:__gameState.saveDeltas.data.missions[${JSON.stringify(mission.id)}],generators:__gameState.saveDeltas.data.mazeGenerators,shrines:__gameState.saveDeltas.data.shrines,slots:__gameState.exploration.chunks.length,cache:__gameState.exploration.cache.size,assetFailures:__sceneRenderer.worldView.bakedView.stats.assetFailures})`);
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await evaluate('document.getElementById("world-journal").click()');await screenshot('mobile-journal');
report.performance=await evaluate(`(async()=>{
 const {InteractionRuntime}=await import('./jCRPG-engine/js/interactions/runtime.js'),{SaveDeltas}=await import('./jCRPG-engine/js/world/save_deltas.js');
 const e=new InteractionRuntime(__gameState.interactions.content,new SaveDeltas()),samples=[];
 for(const shrine of e.content.shrines.slice(0,100)){const start=performance.now();e.transact([{op:'shrine',id:shrine.id}]);samples.push(performance.now()-start);}
 samples.sort((a,b)=>a-b);const t=performance.now();for(let i=0;i<1000;i++)__gameState.nearbyInteraction();
 return {environment:'Headless Chrome software WebGL; mobile viewport, not a physical mobile GPU',transactionMedianMs:samples[50],transactionP95Ms:samples[95],nearbyAverageMs:(performance.now()-t)/1000,instances:__sceneRenderer.worldView.bakedView.stats.instances,render:__sceneRenderer.renderer.info.render,memory:__sceneRenderer.renderer.info.memory};
})()`);
report.errors=errors;report.validation='Opening mission walked from spawn; real maze walked from keeper; dialogue/UI turn-in; reload and portable import.';
fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));ws.close();if(errors.length)process.exitCode=1;

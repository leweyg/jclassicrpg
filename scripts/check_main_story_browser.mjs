#!/usr/bin/env node
/** Isolated local Chrome CDP acceptance test. Uses the actual movement and UI
 * handlers; no mission progress is injected. Start a static host and headless Chrome. */
import fs from 'node:fs';
const port=process.env.JCRPG_CDP_PORT??'9229',origin=process.env.JCRPG_TEST_ORIGIN??'http://127.0.0.1:8789',out=process.argv[2]??'/tmp/jcrpg-interaction-evidence';
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
async function readCaptions(){await evaluate(`(()=>{let remaining=64;while(__gameState.interactions.panel?.kind==='dialogue'&&__gameState.interactions.dialogue().canAdvance){if(!remaining--)throw Error('Caption loop');const button=[...document.querySelectorAll('#interaction-body button')].find(b=>b.getAttribute('aria-label')==='Continue');if(!button)throw Error('Missing caption Continue');button.click();}})()`);}
async function clickText(text){await readCaptions();await evaluate(`(()=>{const b=[...document.querySelectorAll('#interaction-panel button')].find(b=>b.textContent===${JSON.stringify(text)});if(!b)throw Error('Missing UI choice: '+${JSON.stringify(text)});b.click();})()`);}
const walk=target=>evaluate(`walkToInteraction(${JSON.stringify(target)})`);
const close=()=>clickText('Close');

const assert=async(expression,message)=>{if(!await evaluate(expression))throw Error(message);};
const report={};
await assert("__gameState.interactions.currentStoryChapter().missionId==='mission:concordance:road'",'Missing automatic chapter');
await screenshot('story-spawn');
report.orro=await walk('interaction:actor:'+actor('Orro Coil-Tender').id);await close();
report.shrine=await walk('interaction:shrine:shrine:shrine 19 22:782:903');
report.marn=await walk('interaction:actor:'+actor('Marn Even-Tally').id);await clickText('Report: The road remembers');
await assert("__gameState.interactions.currentStoryChapter().missionId==='mission:concordance:current'",'Missing cave chapter');

await walk('interaction:actor:'+actor('Pella Sharekeeper').id);await close();
await screenshot('cave-destination');
await evaluate(`(async()=>{const s=__gameState,p=s.exploration.portalIndex.find(p=>p.id==='cave:760:920:0');await s.teleport(p.from[0],p.from[2],p.from[1],'surface');const action={kind:'portal',portal:p,side:'from'};await s.interact(action);})()`);
await assert("__gameState.realm==='cave'",'Portal did not enter cave');
await assert("__gameState.interactions.navigationGoal().realm==='cave'",'Cave item marker missing');
await screenshot('cave-entry');
report.coil=await walk('interaction:container:container:concordance:listening-coil');await clickText('Take Listening coil');await close();
await assert("__gameState.interactions.navigationGoal().targetId==='fitting:wammigmig:listening-coil'",'Missing fitting handoff');
await screenshot('cave-return');
await evaluate(`(async()=>{const s=__gameState,p=s.exploration.portalIndex.find(p=>p.id==='cave:760:920:0');await s.teleport(p.to[0],p.to[2],p.to[1],'cave');await s.interact({kind:'portal',portal:p,side:'to'});})()`);
await walk('interaction:fitting:fitting:wammigmig:listening-coil');
await walk('interaction:actor:'+actor('Pella Sharekeeper').id);await clickText('Report: A missing current');
await assert("__gameState.interactions.currentStoryChapter().missionId==='mission:concordance:branches'",'Missing branch chapter');
await evaluate(`(async()=>{const s=__gameState,a=s.interactions.maps.actors['actor:boarman:regional:1'];await s.teleport(a.position[0]+2,a.position[2],a.position[1],'surface');})()`);
await walk('interaction:actor:actor:boarman:regional:1');await close();
for(const component of content.puzzles.find(p=>p.id==='puzzle:boarman:regional:1').componentIds)await walk('interaction:puzzle:'+component);
await walk('interaction:actor:actor:boarman:regional:1');await clickText('Report: Every branch');
await assert('__gameState.interactions.currentStoryChapter()===null','Milestone not completed');
await evaluate(`(()=>{__gameState.saveDeltas.persist(__gameState.party.position,__gameState.realm);})()`);
await send('Page.reload');await delay(600);await loaded();
await assert('__gameState.interactions.currentStoryChapter()===null','Reload lost milestone');
await screenshot('story-milestone');
if(errors.length)throw Error(JSON.stringify(errors));
fs.writeFileSync(out+'/story-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));ws.close();

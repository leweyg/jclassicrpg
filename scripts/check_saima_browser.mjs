#!/usr/bin/env node
/** Isolated local Chrome CDP acceptance test. Uses the actual movement and UI
 * handlers; no mission progress is injected. Start a static host and headless Chrome. */
import fs from 'node:fs';
const port=process.env.JCRPG_CDP_PORT??'9231',origin=process.env.JCRPG_TEST_ORIGIN??'http://127.0.0.1:8789',out=process.argv[2]??'/tmp/saima-browser-evidence';
fs.mkdirSync(out,{recursive:true});
const target=(await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page');
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function loaded(){for(let i=0;i<160;i++){if(await evaluate('!!window.__sceneRenderer'))return;const s=await evaluate('document.getElementById("load-status")?.textContent');if(s?.startsWith('Failed'))throw Error(s);await delay(200);}throw Error('Boot timed out');}
await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});const startUrl=origin+'/play.html?review='+Date.now();await send('Page.navigate',{url:startUrl});for(let i=0;i<160;i++){if(await evaluate(`location.href===${JSON.stringify(startUrl)}&&!!window.__sceneRenderer`))break;await delay(200);}await loaded();
await evaluate(`(async()=>{const {emptySave}=await import('./jCRPG-engine/js/world/save_deltas.js');__gameState.saveDeltas.import(JSON.stringify(emptySave()));__gameState.interactions.initialize();await __gameState.teleport(800,907,41,'surface');__sceneRenderer._syncCamera();__sceneRenderer.requestRender();})()`);
async function screenshot(name){await delay(250);await evaluate('__sceneRenderer.requestRender()');await delay(100);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(out+'/'+name+'.png',Buffer.from(shot.data,'base64'));}
const helper=`window.walkToInteraction=async function(id){
 document.querySelector('#interaction-panel[open]')?.dispatchEvent(new Event('cancel',{cancelable:true}));
 await new Promise(resolve=>setTimeout(resolve,30));
 const state=__gameState,stream=state.exploration,p=state.party.position,anchors=stream.chunks.flatMap(c=>c.ready?c.data.interactions:[]),target=anchors.find(a=>a.id===id);
 if(!target)throw Error('Anchor not loaded: '+id);
 const sx=Math.floor(p.x)+.5,sz=Math.floor(p.z)+.5,sy=stream.floorAt(sx,p.y,sz,state.realm),queue=[[sx,sy,sz,-1]],seen=new Set([Math.floor(sx)+':'+Math.floor(sz)]);let found=-1;
 for(let i=0;i<queue.length;i++){const [x,y,z]=queue[i],dx=target.position[0]-x,dz=target.position[2]-z,mag=Math.hypot(dx,dz)||1;const action=stream.nearby({x,y,z},state.realm,1.8,{facing:[dx/mag,dz/mag],priority:a=>state.interactions.priority(a)});if(action?.id===id){found=i;break;}
 for(const [mx,mz]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+mx,nz=z+mz,key=Math.floor(nx)+':'+Math.floor(nz);if(seen.has(key)||Math.abs(nx-sx)>65||Math.abs(nz-sz)>65||!stream.canMove(x,y,z,nx,nz,state.realm))continue;seen.add(key);queue.push([nx,stream.floorAt(nx,y,nz,state.realm),nz,i]);}}
 if(found<0)throw Error('No walking route to '+target.prompt+' '+target.position);
 const path=[];for(let k=found;k>=0;k=queue[k][3])path.unshift(queue[k]);
 for(const [x,y,z]of path){state.moveParty(x-p.x,0);state.moveParty(0,z-p.z);if(Math.hypot(p.x-x,p.z-z)>.15)throw Error('Walking blocked before '+id);}
 __sceneRenderer._yaw=Math.atan2(target.position[0]-p.x,target.position[2]-p.z);__sceneRenderer._syncCamera();__sceneRenderer._applyLook();
 const action=state.nearbyInteraction([Math.sin(__sceneRenderer._yaw),Math.cos(__sceneRenderer._yaw)]);if(action?.id!==id)throw Error('Wrong selected target '+action?.id+' wanted '+id);
 __sceneRenderer.highlightInteraction(action);await __sceneRenderer.interact();if(target.kind==='actor'&&state.interactions.panel?.actorId!==target.targetId)throw Error('Actor interaction did not open: '+target.targetId);return path.length;
};`;
await evaluate(helper);
const content=await evaluate('__gameState.interactions.content');
const report={};
const check=async(expression,label)=>{if(!await evaluate(expression))throw Error(label);report[label]=true;};
const walk=async id=>{const length=await evaluate(`walkToInteraction(${JSON.stringify(id)})`);return length;};
const close=async()=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await delay(50);};
async function readCaptions(){await evaluate(`(()=>{let remaining=64;while(__gameState.interactions.panel?.kind==='dialogue'&&__gameState.interactions.dialogue().canAdvance){if(!remaining--)throw Error('Caption loop');document.querySelector('#interaction-body [aria-label="Continue"]').click();}})()`);}
async function choose(text){if(text!=='Continue')await readCaptions();await evaluate(`(()=>{const buttons=[...document.querySelectorAll('#interaction-panel button')],button=buttons.find(b=>b.textContent===${JSON.stringify(text)});if(!button)throw Error('Missing choice '+${JSON.stringify(text)}+' among '+buttons.map(b=>b.textContent));button.click();})()`);await delay(80);}
async function chooseAction(op,id){await readCaptions();const label=await evaluate(`__gameState.interactions.dialogue().choices.find(c=>c.actions?.some(a=>a.op===${JSON.stringify(op)}&&a.id===${JSON.stringify(id)}))?.text`);if(!label)throw Error('Missing '+op+' '+id);await choose(label);}
async function near(position,realm='surface'){await close();await evaluate(`(async()=>{await __gameState.teleport(${position[0]},${position[2]},${position[1]},${JSON.stringify(realm)});__sceneRenderer.worldView.sync();__sceneRenderer._syncCamera();__sceneRenderer.requestRender();})()`);await delay(250);}
async function talk(id,travel=false){const actor=content.actors.find(a=>a.id===id);if(travel)await near([actor.position[0]+1,actor.position[1],actor.position[2]],actor.realm);await walk('interaction:actor:'+id);}
async function solve(id){const p=content.puzzles.find(p=>p.id===id);for(const input of p.solution)await walk('interaction:puzzle:'+input);}
const missionState=(id,state)=>`__gameState.interactions.missionState(${JSON.stringify(id)})===${JSON.stringify(state)}`;
await talk('legacy-actor:BoarmanTribe#381:544');
await check(`!__gameState.interactions.dialogue().text.includes('light answers again')`,'Marn does not claim an unrepaired light is fixed');
await talk('actor:wammigmig:orro');await close();
await walk('interaction:shrine:shrine:shrine 19 22:782:903');
await talk('legacy-actor:BoarmanTribe#381:544');await choose('The road light answered');await close();
await talk('actor:wammigmig:pella');await close();
const portalTrip=async(id,side)=>{await close();await evaluate(`(async()=>{const s=__gameState,p=s.exploration.portalIndex.find(p=>p.id===${JSON.stringify(id)}),side=${JSON.stringify(side)},at=p[side];await s.teleport(at[0],at[2],at[1],side==='from'?'surface':'cave');await s.interact({kind:'portal',portal:p,side});__sceneRenderer.worldView.sync();__sceneRenderer._syncCamera();__sceneRenderer.requestRender();})()`);await delay(200);};
await portalTrip('cave:760:920:0','from');
await walk('interaction:container:container:concordance:listening-coil');await choose('Take Listening coil');
await portalTrip('cave:760:920:0','to');
await walk('interaction:fitting:fitting:wammigmig:listening-coil');
await talk('actor:wammigmig:pella');await choose('The returning pulse holds');await close();
await talk('actor:boarman:regional:1',true);await close();await solve('puzzle:boarman:regional:1');
await talk('actor:boarman:regional:1');await choose('Carry our three readings forward');await close();
await check(missionState('mission:concordance:meaning','active'),'Talla unlocks Saima chapter');
const saima='actor:antipion:principal:0';
await talk(saima,true);fs.writeFileSync(out+'/saima-arrival-save.json',await evaluate('__gameState.saveDeltas.export()'));await screenshot('saima-arrival');
await choose('I’ll read the conductors');await close();
await solve('puzzle:antipion:capital');await talk(saima);await choose('The local readings hold');await choose('Continue');
await choose('Record the local result');await choose('Continue');
await check(missionState('mission:concordance:order','active'),'Saima commissions regional accounts');await close();
const final=content.puzzles.find(p=>p.id==='puzzle:antipion:final-sequence');
await walk('interaction:puzzle:'+final.componentIds[0]);
await check(`!__gameState.saveDeltas.data.puzzles[${JSON.stringify(final.id)}]`,'Final device locked in scene');
// Each region uses the real dialogue choices and physical controls; long trips use the game's travel API.
for(const [i,layer]of ['body','speech','mind','wisdom'].entries()){
 console.log('Checking region:',layer);
 const id='mission:antipion:'+layer,keeper='actor:antipion:regional:'+i,witness='actor:antipion:witness:'+i;
 await talk(keeper,true);await chooseAction('accept',id);await close();
 const reading=content.goals.find(g=>g.targetId==='evidence:antipion:regional:'+i);
 await near(reading.position);await walk('interaction:evidence:'+reading.targetId);
 await talk(witness);await chooseAction('flag','witness-heard:'+witness);await close();
 if(layer==='wisdom'){
  const container=content.containers.find(c=>c.id==='container:antipion:wisdom:listener');
  await portalTrip(container.portalId,'from');
  await check(`__gameState.realm==='cave'`,'Listener cave entrance works');
  await walk('interaction:container:'+container.id);await choose('Take Naturally wound listening element');
  const waypoint=await evaluate(`(async()=>{const {navigationWaypoint}=await import('./jCRPG-engine/js/interactions/cave_navigation.js');return navigationWaypoint(__gameState);})()`);
  if(!waypoint?.caveExit)throw Error('Missing listener cave exit waypoint');report['Listener cave exit marked']=true;
  await screenshot('listener-cave-exit');await portalTrip(container.portalId,'to');
  await talk(keeper,true);await close();await walk('interaction:fitting:fitting:antipion:wisdom:listener');
  await check(`!Object.values(__gameState.saveDeltas.data.inventory.items).some(i=>i.typeId==='NaturallyWoundListener')`,'Listener fitting consumes unique element');
 }else{await talk(keeper,true);await close();await solve('puzzle:antipion:regional:'+i);}
 await talk(keeper);await chooseAction('commitment','commitment:'+id);await chooseAction('turnIn',id);await close();
 await check(missionState(id,'completed'),layer+' report submitted');
 if(i===0){await evaluate(`__gameState.saveDeltas.persist(__gameState.party.position,__gameState.realm)`);await send('Page.reload');await delay(300);await loaded();await evaluate(helper);await check(missionState(id,'completed'),'Partial regional save reloads');}
}
await evaluate(`__gameState.saveDeltas.persist(__gameState.party.position,__gameState.realm)`);await send('Page.reload');await delay(300);await loaded();await evaluate(helper);
await check(`__gameState.interactions.maps.puzzles[${JSON.stringify(final.id)}].unlockWhen.completedMissionIds.every(id=>__gameState.interactions.missionState(id)==='completed')`,'Just-unlocked save reloads');
await talk(saima,true);await choose('I’ll prepare the four measures');await close();
await talk('actor:antipion:principal:2',true);await choose('Ground, Word, Pattern, Welcome');
await walk('interaction:puzzle:'+final.componentIds[0]);await walk('interaction:puzzle:'+final.componentIds[3]);
await check(`__gameState.saveDeltas.data.puzzles[${JSON.stringify(final.id)}].cursor===0`,'Wrong order resets final attempt');
await solve(final.id);await talk(saima);await choose('Keep the record open');await choose('Continue');await choose('Record our shared practice');await choose('Continue');
await check(missionState('mission:concordance:order','completed'),'Final Saima chapter completes');
await screenshot('saima-final-account');
for(const [name,width,height]of [['mobile',390,844],['landscape',844,390]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await delay(200);
 await readCaptions();
 await check(`(()=>{const d=document.getElementById('interaction-panel'),b=[...d.querySelectorAll('button')].find(b=>b.textContent==='Until next time');if(!b)return false;b.scrollIntoView({block:'nearest'});const r=b.getBoundingClientRect();return d.open&&r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight;})()`,'Reachable farewell on '+name);
 await screenshot('saima-'+name);
}
await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});await delay(200);
await check(`__sceneRenderer.worldView.bakedView.stats.assetFailures.length===0`,'No failed scene assets');
if(errors.length)throw Error(JSON.stringify(errors));
fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));ws.close();

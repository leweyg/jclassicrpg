#!/usr/bin/env node
/** Repeatable local Chrome/Chromium CDP smoke test. Start a fresh headless profile
 * with --remote-debugging-port=9224 and serve the repo on 8765 first. */
import fs from 'node:fs';import path from 'node:path';
const target=(await (await fetch('http://127.0.0.1:9224/json/list')).json()).find(t=>t.type==='page');
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);});
function send(method,params={}){return new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
await send('Runtime.enable');await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'http://127.0.0.1:8765/play.html'});
await new Promise(r=>setTimeout(r,500));
for(let i=0;i<120;i++){if(await evaluate('!!window.__sceneRenderer'))break;const status=await evaluate('document.getElementById("load-status")?.textContent');if(status?.startsWith('Failed'))throw Error(status);await new Promise(r=>setTimeout(r,250));}
if(!await evaluate('!!window.__sceneRenderer'))throw Error('Game boot timed out');
const out=process.argv[2]??'/tmp/jcrpg-browser-evidence';fs.mkdirSync(out,{recursive:true});
const report={errors,samples:[]};
async function sample(name,setup){
 if(setup)await evaluate(setup);await new Promise(r=>setTimeout(r,1200));await evaluate('__sceneRenderer.requestRender()');await new Promise(r=>setTimeout(r,100));
 report.samples.push({name,...await evaluate(`({position:{...__gameState.party.position},realm:__gameState.realm,ready:__gameState.exploration.chunks.filter(c=>c.ready).length,cache:__gameState.exploration.cache.size,stats:__gameState.exploration.stats,render:__sceneRenderer.renderer.info.render,memory:__sceneRenderer.renderer.info.memory,assetFailures:__sceneRenderer.worldView.bakedView.stats.assetFailures})`)});
 const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(shot.data,'base64'));
}
await sample('spawn', '(async()=>{await __sceneRenderer.teleportTo(800,907);__sceneRenderer._yaw=Math.PI;})()');
await evaluate('(async()=>{window.testStructures=await (await fetch("jCRPG-engine/worlds/seed0/v1/structures.json")).json();})()');
await sample('town',`(async()=>{const h=testStructures.find(s=>s.kind==='House');window.testHouse=h;await __sceneRenderer.teleportTo(h.origin[0]+7,h.origin[2]+5);__sceneRenderer._yaw=-2;__sceneRenderer._pitch=-.08;})()`);
await sample('house-interior',`(async()=>{const h=testHouse;await __gameState.teleport(h.origin[0]+2,h.origin[2]+1.5,h.origin[1]);__sceneRenderer._syncCamera();__sceneRenderer._yaw=-Math.PI/2;__sceneRenderer.requestRender();})()`);
await sample('dungeon',`(async()=>{const h=testStructures.find(s=>s.kind==='SimpleDungeonPart');await __gameState.teleport(h.origin[0]+10.5,h.origin[2]+5.5,h.origin[1]);__sceneRenderer.worldView.sync();__sceneRenderer._syncCamera();__sceneRenderer._yaw=Math.PI/2;__sceneRenderer._pitch=-.1;__sceneRenderer.requestRender();})()`);
await sample('cave',`(async()=>{const p=__gameState.exploration.portalIndex.find(p=>p.kind==='cave');await __gameState.teleport(p.to[0],p.to[2],p.to[1],'cave');__sceneRenderer.worldView.sync();__sceneRenderer._syncCamera();__sceneRenderer._yaw=0;__sceneRenderer.requestRender();})()`);
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await sample('mobile-cave');
report.performance = await evaluate(`(async()=>{
 const r=__sceneRenderer, samples=[];
 for(let i=0;i<20;i++){await new Promise(resolve=>requestAnimationFrame(resolve));const t=performance.now();r.renderer.render(r.scene,r.camera);samples.push(performance.now()-t);}
 let bufferBytes=0,instanceBytes=0;const geometries=new Set(),textures=new Set();
 r.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.instanceMatrix)instanceBytes+=o.instanceMatrix.array.byteLength;for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m?.map)textures.add(m.map);});
 for(const g of geometries){for(const a of Object.values(g.attributes))bufferBytes+=a.array.byteLength;if(g.index)bufferBytes+=g.index.array.byteLength;}
 let textureBytes=0;for(const t of textures)textureBytes+=(t.image?.width??0)*(t.image?.height??0)*4*4/3;
 return {environment:'Chrome headless software renderer; mobile viewport emulation, not physical mobile GPU',cpuRenderSubmitMs:samples,geometryBufferBytes:bufferBytes,instanceBufferBytes:instanceBytes,textureBytesEstimate:Math.round(textureBytes),gpuFrameTime:'not measured',cacheEntries:__gameState.exploration.cache.size};
})()`);
await evaluate('__sceneRenderer.stop()');fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));ws.close();
if(errors.length)process.exitCode=1;

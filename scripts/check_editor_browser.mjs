#!/usr/bin/env node
/** Verify unchanged generated JSON in a public-assets-only local editor copy.
 * See docs/procedural-review.md. Never serve unrelated repository directories. */
import fs from 'node:fs';
const target=(await (await fetch('http://127.0.0.1:9224/json/list')).json()).find(t=>t.type==='page'),ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)(m.result);pending.delete(m.id);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);});
const send=(method,params={})=>new Promise(resolve=>{const n=++id;pending.set(n,resolve);ws.send(JSON.stringify({id:n,method,params}));});
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
const report=[];
for(const file of ['fixture.scene.json','calibration.scene.json','chunks/x004_z044.scene.json','regions/r000_008.scene.json']){
 await send('Page.navigate',{url:'http://127.0.0.1:8766/editor/?file_path='+encodeURIComponent('/world/'+file)});await new Promise(r=>setTimeout(r,1000));
 for(let i=0;i<80;i++){if(await evaluate('!!window.editor?.scene?.children?.some(c=>c.name)'))break;await new Promise(r=>setTimeout(r,250));}
 await new Promise(r=>setTimeout(r,1500));
 const state=await evaluate(`(()=>{let meshes=0,gameData=0;window.editor?.scene.traverse(o=>{if(o.isMesh)meshes++;if(o.userData.jcrpg)gameData++;});return {meshes,gameData,sceneChildren:window.editor?.scene.children.map(o=>o.name)};})()`);
 report.push({file,...state});if(!state.meshes||!state.gameData)throw Error('Editor did not import generated scene: '+file);
 const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/jcrpg-browser-evidence/editor-'+file.replaceAll('/','_')+'.png',Buffer.from(shot.data,'base64'));
}
console.log(JSON.stringify({report,errors},null,2));fs.writeFileSync('/tmp/jcrpg-browser-evidence/editor-report.json',JSON.stringify({report,errors},null,2));ws.close();if(errors.length)process.exitCode=1;

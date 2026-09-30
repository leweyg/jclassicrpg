#!/usr/bin/env node
// Uses an isolated Chrome CDP profile and local static server; resets that profile’s game save.
import fs from 'node:fs';
const target=(await(await fetch(`http://127.0.0.1:${process.env.JCRPG_CDP_PORT??'9231'}/json/list`)).json()).find(t=>t.type==='page'&&true);
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const origin=process.env.JCRPG_TEST_ORIGIN??'http://127.0.0.1:8789';
const out=process.argv[2]??'/tmp/grid-issues-evidence';fs.mkdirSync(out,{recursive:true});
const report={},errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);});
async function check(expression,label){const result=await evaluate(expression);if(!result)throw Error(label);report[label]=true;console.log('PASS',label);}
async function size(width,height){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<900});await delay(250);}
async function go(page,ready){const url=origin+'/'+page+(page.includes('?')?'&':'?')+'review='+Date.now();const expected=new URL(url);expected.searchParams.delete('new');await send('Page.navigate',{url});for(let i=0;i<160;i++){if(await evaluate(`location.href===${JSON.stringify(expected.href)}&&(${ready})`))return;const status=await evaluate(`document.querySelector('#load-status')?.textContent`);if(status?.startsWith('Failed'))throw Error(status);await delay(200);}throw Error('Page did not load: '+page);}
async function shot(name){await delay(300);const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(out+'/'+name+'.png',Buffer.from(r.data,'base64'));}
const closeStory=()=>evaluate(`document.querySelector('#interaction-panel[open]')?.dispatchEvent(new Event('cancel',{cancelable:true}))`);
await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Runtime.enable');await send('Page.enable');await size(390,844);
await go('index.html',`document.querySelectorAll('#opening-story p').length===3&&document.querySelector('#atlas-status').textContent.includes('locations enabled')`);
await check(`document.querySelector('header p a').textContent==='Lewey Geselowitz'&&document.querySelector('#summary a').textContent==='Begin anew'&&document.querySelector('#summary a[href="#story-walkthrough"]')&&document.querySelector('#walkthrough-title').textContent==='Main story outline'`,'Homepage attribution and story links');
await check(`document.querySelector('#slice-summary').textContent.includes('279 total characters')`,'Catalog-backed slice counts');
await check(`document.querySelector('.map-toolbar').getBoundingClientRect().top>=document.querySelector('#atlas').getBoundingClientRect().bottom&&document.documentElement.scrollWidth<=innerWidth`,'Mobile homepage toolbar below map without overflow');
await go('play.html?new=1',`!!window.__worldMap&&document.querySelector('#world-interact').textContent==='Read Story'`);
await check(`!document.querySelector('#world-interact').hidden&&!document.querySelector('#hud-profession')`,'New game offers Read Story and omits profession');
await evaluate(`document.querySelector('#world-interact').click()`);await delay(100);
await check(`document.querySelector('#interaction-panel').open&&document.querySelector('#interaction-panel').scrollTop===0&&document.querySelectorAll('#interaction-body p').length===3`,'Read Story opens shared paragraphs');await shot('opening-story-phone');await closeStory();
await go('play.html',`!!window.__worldMap`);await delay(300);
await check(`__gameState.saveDeltas.data.flags['opening-story-pending']===false&&document.querySelector('#world-interact').textContent!=='Read Story'`,'Read Story dismissal survives reload');
await go('play.html?new=1',`!!window.__worldMap&&document.querySelector('#world-interact').textContent==='Read Story'`);
await evaluate(`(async()=>{const a=__gameState.interactions.maps.actors['actor:wammigmig:orro'];await __gameState.teleport(a.position[0]+1.5,a.position[2],a.position[1],'surface');__sceneRenderer._yaw=-Math.PI/2;__sceneRenderer.worldView.sync();__sceneRenderer._syncCamera();__sceneRenderer._applyLook();__sceneRenderer.requestRender();})()`);await delay(400);
await check(`__sceneRenderer.nearbyInteraction()?.kind==='actor'&&__gameState.saveDeltas.data.flags['opening-story-pending']===false&&!document.querySelector('#world-interact').textContent.startsWith('Interact with')`,'Nearby actor replaces story offer with their name');
await evaluate(`__worldMap.open()`);await delay(200);
await check(`document.querySelectorAll('#map-journal-entries button').length===1&&!document.querySelector('#map-detail')&&!document.querySelector('#map-mission-note')&&!document.querySelector('#map-place-dialog')`,'Map has compact journal and no descriptive overlays');
// Exercise canvas hit testing against a real projected marker.
await evaluate(`(()=>{const m=__worldMap,marker=m.markers.find(x=>x.kind==='settlement'&&m._visible(x));m.viewport.zoom=4;m.viewport.x=marker.x;m.viewport.z=marker.z;m.viewport.constrain();m._drawFull();const p=m.viewport.project(marker.x,marker.z),r=m.full.getBoundingClientRect();m.full.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+p.x*r.width,clientY:r.top+p.y*r.height}));})()`);await delay(500);
await check(`!document.querySelector('#map-place-details').hidden&&document.querySelector('#map-place-title').textContent.length>0`,'Clicking map marker opens inline details');
// Accept an existing side quest through the runtime to exercise the second journal row.
await evaluate(`__gameState.interactions.transact([{op:'accept',id:'mission:wammigmig:fair-share'}]);__worldMap.update(true)`);
await check(`document.querySelectorAll('#map-journal-entries button').length===2`,'Tracked side quest and next story quest shown separately');
await evaluate(`document.querySelectorAll('#map-journal-entries button')[1].click()`);await delay(500);
await check(`!document.querySelector('#map-place-detail').textContent.includes('undefined')`,'Mission details support the lightweight catalog');
await check(`__worldMap.viewport.zoom>=4&&__worldMap.selectedMarker.missionId==='mission:concordance:road'&&__gameState.saveDeltas.data.navMissionId==='mission:wammigmig:fair-share'`,'Mission focus zooms without changing the waypoint');
for(const [name,w,h]of [['phone',390,844],['landscape',844,390],['desktop',1280,900]]){
 await size(w,h);await evaluate(`document.querySelectorAll('#map-journal-entries button')[1].click()`);await delay(500);
 await check(`(()=>{const a=document.querySelector('#map-place-travel').getBoundingClientRect(),b=document.querySelector('#map-place-nav').getBoundingClientRect();return a.top>=0&&a.bottom<=innerHeight&&b.right<=innerWidth&&Math.abs(a.top-b.top)<2})()`,'Travel and Waypoint visible in one row: '+name);
 await shot('map-'+name);
}
await evaluate(`document.querySelector('#map-place-nav').click()`);await delay(150);
await check(`__gameState.saveDeltas.data.navMissionId==='mission:concordance:road'&&document.querySelector('#map-place-status').textContent.startsWith('Waypoint set:')`,'Waypoint button updates tracked mission');
const targetPosition=await evaluate(`({x:__worldMap.selectedMarker.x,z:__worldMap.selectedMarker.z})`);
await evaluate(`document.querySelector('#map-place-travel').click()`);
for(let i=0;i<80;i++){if(await evaluate(`!__worldMap.dialog.open&&__sceneRenderer._inputEnabled&&Math.hypot(__gameState.party.position.x-${targetPosition.x},__gameState.party.position.z-${targetPosition.z})<.2`))break;await delay(100);}
await check(`!__worldMap.dialog.open&&Math.hypot(__gameState.party.position.x-${targetPosition.x},__gameState.party.position.z-${targetPosition.z})<.2`,'Travel button moves to the selected destination');
await check(`(()=>{const v=__worldMap.viewport,p=__gameState.party.position,c=v.project(p.x,p.z);return v.project(p.x-10,p.z).x>c.x&&v.project(p.x,p.z+10).y<c.y})()`,'Large map east-right and north-up match compass');
await check(`__sceneRenderer.worldView.bakedView.stats.assetFailures.length===0`,'No failed scene assets');
if(errors.length)throw Error(JSON.stringify(errors));report['No browser runtime exceptions']=true;
fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');ws.close();

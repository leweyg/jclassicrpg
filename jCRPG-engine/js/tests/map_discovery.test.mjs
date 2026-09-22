import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {knownLocation,rememberLocations,discoverVisited,revealReadDialogue,cameraMapOffset} from '../map_discovery.js';
import {SaveDeltas} from '../world/save_deltas.js';
import {InteractionUI} from '../interactions/ui.js';
import {InteractionRuntime} from '../interactions/runtime.js';
import {WorldMap} from '../world_map.js';
import {FrozenWorld} from '../frozen_world.js';
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
const markers=[{id:'start',kind:'start',name:'Start',x:0,z:0},{id:'capital',kind:'settlement',capital:true,name:'Capital',x:500,z:500},{id:'town',kind:'settlement',name:'Wammigmig',aliases:['Migtrabu'],x:30,y:40,z:30},{id:'cave',kind:'cave',name:'Secret cave',x:32,y:42,z:30,realm:'cave'}];

test('default map reveals only start and capitals, with explicit developer override',()=>{
 const save=new SaveDeltas();assert.deepEqual(markers.filter(m=>knownLocation(m,save.data)).map(m=>m.id),['start','capital']);
 assert.ok(markers.every(m=>knownLocation(m,save.data,true)));
 assert.equal(knownLocation({...markers[2],objective:true},save.data),true);
});
test('visiting reveals places persistently, respecting realms, floors and world wrap',()=>{
 const store=storage(),save=new SaveDeltas(store);
 assert.equal(discoverVisited(save,markers,{x:29,y:40,z:30},'surface'),true);
 assert.equal(knownLocation(markers[2],save.data),true);assert.equal(knownLocation(markers[3],save.data),false);
 assert.equal(discoverVisited(save,markers,{x:29,y:40,z:30},'surface'),false);
 save.persist({x:29,y:40,z:30},'surface');assert.equal(knownLocation(markers[2],new SaveDeltas(store).data),true);
 const seam={id:'seam',x:1,y:40,z:30,kind:'shrine'};assert.equal(discoverVisited(save,[seam],{x:1599,y:40,z:30},'surface'),true);
 assert.equal(discoverVisited(save,[{...seam,id:'upper',y:48}],{x:1,y:40,z:30},'surface'),false);
});
test('only rendered dialogue and visible choices reveal place names, aliases and named actors',()=>{
 const save=new SaveDeltas();
 assert.equal(revealReadDialogue(save,markers,{text:'Wammigmigbumig is far away.',choices:[]}),false);
 assert.equal(revealReadDialogue(save,markers,{text:'Travel to Migtrabu.',choices:[]}),true);
 const fresh=new SaveDeltas();
 assert.equal(revealReadDialogue(fresh,markers,{text:'Ask Marn Even-Tally.',choices:[]},[{name:'Marn Even-Tally',townId:'town'}]),true);
 assert.equal(knownLocation(markers[3],fresh.data),false);
 assert.equal(revealReadDialogue(fresh,markers,{text:'Welcome.',choices:[{text:'Where is the Secret cave?'}]}),true);
 const copy=new SaveDeltas();copy.import(fresh.export());assert.equal(knownLocation(markers[3],copy.data),true);
});
test('dialogue UI reveals the displayed passage, not unread nodes',()=>{
 const save=new SaveDeltas(storage());let shown='Welcome.',renders=0;
 const engine={panel:{kind:'dialogue'},content:{actors:[],dialogues:[{nodes:{unread:{text:'Secret cave'}}}]},dialogue:()=>({actor:{name:'Guide',role:'Guide'},knowledge:'testimony',text:shown,choices:[]})};
 const ui=Object.create(InteractionUI.prototype);Object.assign(ui,{state:{interactions:engine,saveDeltas:save,mapMarkers:markers,party:{position:{x:0,y:40,z:0}},realm:'surface'},renderer:{requestRender(){renders++;}},open(){},text(){},button(){},focus(){}});
 ui.show();assert.equal(knownLocation(markers[3],save.data),false);
 shown='I found the Secret cave.';ui.show();assert.equal(knownLocation(markers[3],save.data),true);assert.equal(renders,1);
});
test('mission targets remain known after they leave the active objective list',()=>{
 const save=new SaveDeltas();const target={id:'goal:test',kind:'puzzle',name:'Read the stone',x:10,z:10,revealOnly:true};
 assert.equal(knownLocation(target,save.data),false);rememberLocations(save,[target.id]);assert.equal(knownLocation(target,save.data),true);
 const reloaded=new SaveDeltas();reloaded.import(save.export());assert.equal(knownLocation(target,reloaded.data),true);
});
test('camera-relative minimap places forward at top and rotates north around the edge',()=>{
 for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
  const forward=cameraMapOffset(Math.sin(yaw)*20,Math.cos(yaw)*20,yaw);assert.ok(Math.abs(forward.x)<1e-10);assert.ok(Math.abs(forward.y+20)<1e-10);
 }
 const north=cameraMapOffset(0,1,Math.PI/2);assert.ok(Math.abs(north.x+1)<1e-10);assert.ok(Math.abs(north.y)<1e-10);
 const wrapped=cameraMapOffset(2,0,Math.PI/2);assert.ok(Math.abs(wrapped.y+2)<1e-10);
});
test('minimap rotates terrain, keeps player upright and hides undiscovered markers',()=>{
 const calls=[],ctx=new Proxy({}, {get:(o,k)=>o[k]??((...a)=>calls.push([k,...a])),set:(o,k,v)=>(o[k]=v,true)});
 const map=Object.create(WorldMap.prototype);Object.assign(map,{mini:{width:256,getContext:()=>ctx},renderer:{_yaw:Math.PI/2},state:{party:{position:{x:0,y:40,z:0}},saveDeltas:new SaveDeltas()},world:{sizeX:1600,sizeZ:1600},markers:[{id:'hidden',kind:'settlement',x:10,z:10}],enabled:new Set(['settlement']),_background(){calls.push(['terrain']);},_marker(){calls.push(['marker']);},_player(...args){calls.push(['player',args[4]]);}});
 map._drawMini();assert.ok(calls.some(c=>c[0]==='rotate'&&c[1]===-Math.PI/2));assert.ok(calls.some(c=>c[0]==='player'&&c[1]===0));assert.ok(!calls.some(c=>c[0]==='marker'));
 const north=calls.find(c=>c[0]==='fillText'&&c[1]==='N');assert.equal(north[2],16);assert.ok(Math.abs(north[3]-128)<1e-10);
});
test('developer controls are in a closed-by-default disclosure near the map heading',()=>{
 const html=fs.readFileSync(new URL('../../../play.html',import.meta.url),'utf8');
 assert.match(html,/<details id="map-dev">/);assert.ok(html.indexOf('id="map-title"')<html.indexOf('id="map-dev"'));
 assert.match(html,/<details id="map-dev">[\s\S]*?id="map-show-all"[\s\S]*?id="map-filters"[\s\S]*?<\/details>/);
});

test('compiled mission and dialogue locations reveal through the real map and survive import',()=>{
 const root=new URL('../../worlds/seed0/v2/',import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,root)));
 const manifest=read('interactions/manifest.json'),content=Object.fromEntries(Object.entries(manifest.catalogs).map(([key,desc])=>[key,read(desc.url)]));
 const worldData=JSON.parse(fs.readFileSync(new URL('../../json/frozen_world.json',import.meta.url)));
 const oldDocument=globalThis.document,oldWindow=globalThis.window;
 const element=()=>({style:{},addEventListener(){},append(){},querySelector:()=>element(),width:256});
 const elements=new Map();globalThis.document={createElement:element,getElementById:id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);}};globalThis.window={addEventListener(){}};
 class QuietMap extends WorldMap{_buildAtlas(){} _drawMini(){} _drawFull(){} _renderList(){}}
 try{
  const save=new SaveDeltas(storage()),engine=new InteractionRuntime(content,save);
  // Avoid any incidental visits while inspecting defaults.
  const state={interactions:engine,saveDeltas:save,party:{position:{x:0,y:79,z:0}},realm:'surface',exploration:{world:new FrozenWorld(worldData)}};
  const map=new QuietMap(state,{_yaw:0});map.update();
  const initial=map.markers.filter(m=>map._visible(m));assert.equal(initial.length,31);assert.equal(initial.filter(m=>m.capital).length,30);
  const mission=content.missions.find(m=>m.id==='mission:wammigmig:fair-share');
  engine.transact([{op:'accept',id:mission.id}]);map.update();
  const targets=engine.markers();assert.ok(targets.length>1);for(const target of targets)assert.ok(map.markers.some(m=>m.id===target.id&&map._visible(m)),target.id);
  // The map does not need the active objective flag after the destination is learned.
  for(const target of targets)assert.equal(knownLocation({...target,objective:false},save.data),true);
  const town=map.baseMarkers.find(m=>m.id==='town:populationBoarmanTribe#381');assert.ok(town.aliases.includes('Migtrabu'));
  assert.equal(revealReadDialogue(save,map.baseMarkers,{text:'Travel to Migtrabu.',choices:[]},content.actors),true);map.update();assert.equal(map._visible(town),true);
  const exported=save.export();const clean=new SaveDeltas();save.import(clean.export());map.update();assert.equal(map._visible(town),false);
  save.import(exported);map.update();assert.equal(map._visible(town),true);
 }finally{globalThis.document=oldDocument;globalThis.window=oldWindow;}
});

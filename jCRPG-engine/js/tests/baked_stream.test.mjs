import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {FrozenWorld} from '../frozen_world.js';import {BakedWorldStream} from '../world/baked_stream.js';import {GameState} from '../game_state.js';
import {FORMAT_VERSION,GENERATOR_VERSION,WORLD_ID,scene,chunkKey,CELL as C} from '../world/format.js';
const data=JSON.parse(fs.readFileSync(new URL('../../json/frozen_world.json',import.meta.url))),world=new FrozenWorld(data),base=new URL('../../worlds/seed0/v1/',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',base)));
const read=async url=>{try{return new Response(fs.readFileSync(url));}catch{return new Response('',{status:404});}};
function fixture(){const m={formatVersion:FORMAT_VERSION,generatorVersion:GENERATOR_VERSION,worldId:WORLD_ID,sourceSha256:world.sourceSha256,chunks:{}},texts=new Map();for(let z=0;z<50;z++)for(let x=0;x<50;x++){const key=chunkKey(x,z),s=scene(key,[],{key,generatorVersion:GENERATOR_VERSION,terrain:{heights:Array(289).fill(40),types:Array(289).fill(0),climates:Array(289).fill(0),vegetation:[]},collision:{structures:[],cells:[]},portals:[],objects:[]}),text=JSON.stringify(s);m.chunks[key]={url:key+'.json',byteLength:text.length,sha256:createHash('sha256').update(text).digest('hex')};texts.set(key,text);}return {m,texts};}
const f=fixture();
const fake=async url=>new Response(f.texts.get(decodeURIComponent(new URL(url).pathname.split('/').pop().replace('.json',''))));
test('baked data is usable from a plain static file host and matches manifest hashes',async()=>{
 const stream=new BakedWorldStream(world,manifest,base,{fetcher:read});stream.update(800,907);await stream.settled();assert.equal(stream.chunks.filter(c=>c.ready).length,25);assert.ok(Number.isFinite(stream.heightAt(800,907)));assert.equal(stream.stats.failures,0);stream.dispose();
});
test('1000 chunk moves retain 25 slots, reuse buffers, wrap content and bound cache',async()=>{
 const s=new BakedWorldStream(world,f.m,'https://fixture/world/',{fetcher:fake}),slots=[...s.chunks],buffers=s.chunks.map(c=>c.heights);for(let i=0;i<1000;i++){s.update((i%50)*32,Math.floor(i/50)*32);await s.settled();assert.equal(s.chunks.filter(c=>c.ready).length,25);assert.ok(s.cache.size<=50);assert.ok(s.jobs.size<=25);}
 for(let i=0;i<25;i++){assert.equal(slots[i],s.chunks[i]);assert.equal(buffers[i],s.chunks[i].heights);}s.update(0,0);await s.settled();assert.ok(s.getChunk(1599,0));assert.equal(s.heightAt(1599,0),40);s.dispose();
});
test('late completion after a teleport cannot commit stale data',async()=>{
 const pending=[];const s=new BakedWorldStream(world,f.m,'https://fixture/world/',{fetcher:url=>new Promise(resolve=>pending.push({url,resolve}))});s.update(10,10);assert.equal(pending.length,4);s.update(800,800);
 for(const p of pending.splice(0)){p.resolve(await fake(p.url));}await new Promise(r=>setTimeout(r,10));
 // Finish all destination jobs; old requests deliberately ignored AbortSignal.
 while(s.active||s.jobs.size){for(const p of pending.splice(0))p.resolve(await fake(p.url));await new Promise(r=>setTimeout(r,1));}
 assert.ok(s.stats.stale>=4);for(const c of s.chunks){assert.equal(c.data.key,chunkKey(c.x,c.z));assert.ok(c.x>=23&&c.x<=27);}s.dispose();
});
test('missing collision fails closed and retry recovers',async()=>{
 let fail=true;const s=new BakedWorldStream(world,f.m,'https://fixture/world/',{fetcher:url=>fail?Promise.resolve(new Response('',{status:404})):fake(url)});s.update(100,100);await s.settled();assert.ok(!s.canMove(100,40,100,100.1,100));assert.equal(s.chunks.filter(c=>c.ready).length,0);fail=false;s.retry();await s.settled();assert.equal(s.chunks.filter(c=>c.ready).length,25);s.dispose();
});
test('a baked house doorway admits traversal and its adjacent wall rejects it',async()=>{
 const structs=JSON.parse(fs.readFileSync(new URL('structures.json',base))),h=structs.find(s=>s.kind==='House'),[x,y,z]=h.origin,s=new BakedWorldStream(world,manifest,base,{fetcher:read});s.update(x,z);await s.settled();
 assert.equal(s.canMove(x+3.9,y,z+1.5,x+4.1,z+1.5),true);
 assert.equal(s.canMove(x+3.9,y,z+2.5,x+4.1,z+2.5),false);
 assert.equal(s.canMove(x+4.1,y,z+2.5,x+3.9,z+2.5),false);
 const state=new GameState();state.exploration=s;state.realm='surface';Object.assign(state.party.position,{x:x+3.5,y,z:z+2.5});state.moveParty(2,0);assert.ok(state.party.position.x<x+4);s.dispose();
});
test('cave portal destination has floor and absent cave cells are impassable',async()=>{
 const portals=JSON.parse(fs.readFileSync(new URL('portals.json',base))),p=portals.find(p=>p.kind==='cave'),s=new BakedWorldStream(world,manifest,base,{fetcher:read});s.update(p.to[0],p.to[2]);await s.settled();const cell=s.cellAt(p.to[0],p.to[1],p.to[2],'cave');assert.ok(cell.flags&C.FLOOR);assert.equal(s.floorAt(...[p.to[0],p.to[1],p.to[2],'cave']),42);assert.ok(s.nearby({x:p.to[0],y:42,z:p.to[2]},'cave'));s.dispose();
});

test('overlapping teleports only commit the latest destination',async()=>{
 const s=new BakedWorldStream(world,f.m,'https://fixture/world/',{fetcher:fake}),state=new GameState();state.exploration=s;state.realm='surface';
 const first=state.teleport(100,100),last=state.teleport(1200,1200);await Promise.all([first,last]);assert.deepEqual(state.party.position,{x:1200,y:40,z:1200});assert.equal(state._teleporting,false);s.dispose();
});

test('one-chunk movement fetches exactly five new chunks and repeat visits hit bounded cache',async()=>{
 const s=new BakedWorldStream(world,f.m,'https://fixture/world/',{fetcher:fake});s.update(800,800);await s.settled();assert.equal(s.stats.fetches,25);s.update(832,800);await s.settled();assert.equal(s.stats.fetches,30);s.update(800,800);await s.settled();assert.equal(s.stats.fetches,30);assert.ok(s.stats.cacheHits>=5);s.dispose();
});

test('multi-floor stairs have distinct up/down landings and retain the correct floor',async()=>{
 const structs=JSON.parse(fs.readFileSync(new URL('structures.json',base))),h=structs.find(s=>s.kind==='House'&&s.size[1]===3),[x,y,z]=h.origin,s=new BakedWorldStream(world,manifest,base,{fetcher:read});s.update(x,z);await s.settled();
 const portals=s.chunks.flatMap(c=>c.data.portals).filter(p=>p.structureId===h.id&&p.kind==='stairs');assert.equal(portals.length,2);
 const state=new GameState();state.exploration=s;state.realm='surface';
 await state.teleport(...[portals[0].to[0],portals[0].to[2],portals[0].to[1]]);assert.equal(state.party.position.y,y+1);
 const next=s.nearby({x:portals[1].from[0],y:y+1,z:portals[1].from[2]});assert.equal(next.portal.id,portals[1].id);assert.equal(next.side,'from');
 await state.teleport(portals[1].to[0],portals[1].to[2],portals[1].to[1]);assert.equal(state.party.position.y,y+2);s.dispose();
});

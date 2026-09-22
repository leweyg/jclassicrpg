import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {FrozenWorld} from '../frozen_world.js';
import {BakedWorldStream} from '../world/baked_stream.js';
import {compose,multiply} from '../world/transforms.js';
const base=new URL('../../worlds/seed0/v2/',import.meta.url);
const read=file=>JSON.parse(fs.readFileSync(new URL(file,base)));

test('all wooden houses reference one model and retain individual transforms and state IDs',async()=>{
 const houses=read('structures.json').filter(s=>s.kind==='WoodenHouse'),manifest=read('manifest.json');
 const prefab=read('assets/wooden-house.scene.json');
 assert.equal(prefab.children.length,65);
 assert.ok(prefab.children.every(n=>!n.userData.jcrpg.structureId));
 const groups=new Map();
 for(const house of houses){const key=`${Math.floor(house.origin[0]/32)}:${Math.floor(house.origin[2]/32)}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(house);}
 const world=new FrozenWorld(JSON.parse(fs.readFileSync(new URL('../../json/frozen_world.json',import.meta.url))));
 const stream=new BakedWorldStream(world,manifest,base,{fetcher:async url=>new Response(fs.readFileSync(url))});
 try{
  for(const [key,local]of groups){
   const doc=read(manifest.chunks[key].url);
   stream.update(...[local[0].origin[0],local[0].origin[2]]);await stream.settled();
   const chunk=stream.getChunk(local[0].origin[0],local[0].origin[2]);assert.ok(chunk);
   for(const house of local){
    const placements=doc.children.filter(n=>n.userData?.jcrpg?.structureId===house.id);
    assert.equal(placements.length,1);const placement=placements[0];
    assert.equal(placement.source,'../assets/wooden-house.scene.json');
    const nodes=[...chunk.data.instances.values()].flatMap(g=>g.nodes.filter(n=>n.stateTargetId===house.id).map(n=>({node:n,group:g})));
    assert.equal(nodes.length,65);
    for(const child of prefab.children){
     const expected=multiply(compose(placement),compose(child));
     const match=nodes.find(({node,group})=>group.source.endsWith('/'+child.source.slice(2))&&node.matrix.every((v,i)=>Math.abs(v-expected[i])<1e-8));
     assert.ok(match,house.id+': '+child.name);
     assert.equal(match.group.roof,!!child.userData.jcrpg.roof);
     assert.equal(match.group.ceiling,!!child.userData.jcrpg.ceiling);
    }
   }
  }
 }finally{stream.dispose();}
});

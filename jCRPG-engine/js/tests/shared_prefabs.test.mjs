import test from 'node:test';
import assert from 'node:assert/strict';
import {extractSharedPrefabs} from '../../../scripts/shared_prefabs.mjs';
const make=(id,x,{variant=0,objectId=null}={})=>({spec:{id,kind:'House',origin:[x,40,0],size:[4,2,4]},nodes:[
 ...[0,1].map(i=>({name:'roof',source:'../assets/roof.obj',position:[x+i+.5,41,.5],rotation:[0,0,0],userData:{jcrpg:{structureId:id,roof:true,realm:'surface'}}})),
 {name:'chest',source:'../assets/chest.obj',position:[x+1,40+variant,1],userData:{jcrpg:{structureId:id,objectId,realm:'surface'}}},
]});
test('shares identical roofs while preserving different bodies and object identities',()=>{
 const a=make('a',0,{objectId:'chest-a'}),b=make('b',4,{objectId:'chest-b',variant:1});
 const chunks=[{x:0,z:0,nodes:[...a.nodes,...b.nodes]}];
 const {prefabs,report}=extractSharedPrefabs(chunks,[a.spec,b.spec]);
 assert.equal(prefabs.size,1);assert.equal(report[0].part,'roof');assert.equal(report[0].placements,2);
 assert.deepEqual(chunks[0].nodes.filter(n=>n.name==='chest'),[a.nodes[2],b.nodes[2]]);
 assert.deepEqual([...prefabs.values()][0].children.map(n=>n.userData.jcrpg),[{roof:true,realm:'surface'},{roof:true,realm:'surface'}]);
 assert.deepEqual(chunks[0].nodes.filter(n=>n.source.endsWith('.json')).map(n=>n.userData.jcrpg.structureId),['a','b']);
});
test('does not merge almost-equivalent geometry or single-use assemblies',()=>{
 const a=make('a',0),b=make('b',4);b.nodes[0].position[1]+=1e-7;
 const chunks=[{x:0,z:0,nodes:[...a.nodes,...b.nodes]}],before=structuredClone(chunks);
 assert.equal(extractSharedPrefabs(chunks,[a.spec,b.spec]).prefabs.size,0);
 assert.deepEqual(chunks,before);
});
test('leaves chunk-crossing structures inline',()=>{
 const a=make('a',30),b=make('b',62);
 const chunks=[{x:0,z:0,nodes:a.nodes},{x:1,z:0,nodes:b.nodes.map(n=>({...n,position:[n.position[0]-32,...n.position.slice(1)]}))}];
 assert.equal(extractSharedPrefabs(chunks,[a.spec,b.spec]).prefabs.size,0);
});

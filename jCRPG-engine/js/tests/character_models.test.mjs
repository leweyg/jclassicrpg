import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../threejs/three.module.js';
import {modelForActor, bakeCharacterModel, applyIdlePose} from '../character_models.js';
import {BakedView} from '../world/baked_view.js';
const data=JSON.parse(fs.readFileSync(new URL('../../json/characters.json',import.meta.url)));
const root=new URL('../../../',import.meta.url);
const proxy=()=>new THREE.Group().add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial()));
const node=actorId=>({actorId,matrix:new THREE.Matrix4().makeTranslation(3,40,4).toArray()});
function fixture(loadCharacter=async()=>proxy()){
 const chunk={ready:true,revision:1,x:25,z:28,data:{instances:new Map([['proxy',{source:'https://fixture/actor.obj',realm:'surface',nodes:[node('actor:wammigmig:pella'),node('actor:wammigmig:orro'),node('ordinary-resident')]}]])}};
 const view=new BakedView(new THREE.Scene(),{chunks:[chunk]},()=>{}, {loadCharacters:async()=>data,loadCharacter});
 view.asset=async()=>proxy();return {view,chunk,slot:view.slots[0]};
}
test('all ten assignments resolve to supplied GLBs and unknown actors retain their default',()=>{
 assert.equal(Object.keys(data.actorModels).length,10);
 for(const [actorId,id] of Object.entries(data.actorModels)){
  const definition=modelForActor(data,actorId);assert.equal(definition.id,id);
  const bytes=fs.readFileSync(new URL(definition.source,root));assert.equal(bytes.readUInt32LE(0),0x46546c67);
 }
 assert.equal(modelForActor(data,'unknown'),null);
});
test('posed meshes retain nested transforms, scale, textures and deformed vertices',()=>{
 const scene=new THREE.Group(),geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(Array(12).fill(0),4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute([1,0,0,0,1,0,0,0,1,0,0,0],4));
 const texture=new THREE.Texture(),material=new THREE.MeshBasicMaterial({map:texture});
 const mesh=new THREE.SkinnedMesh(geometry,material),bone=new THREE.Bone();mesh.add(bone);scene.add(mesh);mesh.bind(new THREE.Skeleton([bone]));bone.position.y=2;scene.position.x=3;
 const model=bakeCharacterModel({scene,animations:[]},{scale:[2,2,2]});
 const baked=model.children[0];assert.equal(baked.isSkinnedMesh,undefined);
 assert.deepEqual(Array.from(baked.geometry.attributes.position.array).slice(0,3),[3,4,0]);
 assert.equal(baked.material.map,texture);assert.equal(baked.geometry.attributes.skinIndex,undefined);
});
test('Idle lowers both arms in world space',()=>{
 const scene=new THREE.Group();for(const name of ['upperarm.l','upperarm.r']){const bone=new THREE.Bone();bone.name=THREE.PropertyBinding.sanitizeNodeName(name);scene.add(bone);}
 applyIdlePose(scene);
 for(const [name,x]of [['upperarm.l',1],['upperarm.r',-1]])assert.ok(new THREE.Vector3(x,0,0).applyQuaternion(scene.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name)).quaternion).y<-.8);
});
test('named actors replace only their proxies, share cached models, and obey realm visibility',async()=>{
 let loads=0;const {view,chunk,slot}=fixture(async()=>{loads++;return proxy();});
 await view.prepare(slot,chunk,++slot.ticket);assert.equal(slot.batches.size,3);assert.equal(loads,2);
 assert.ok([...slot.batches.keys()].some(key=>key.includes('keykit:mage')));
 await view.prepare(slot,chunk,++slot.ticket);assert.equal(loads,2);
 view.setRealm('cave');assert.ok([...slot.batches.values()].every(b=>!b.mesh.visible));
 view.setRealm('surface');assert.ok([...slot.batches.values()].every(b=>b.mesh.visible));view.dispose();
});
test('failed character loads preserve the existing proxy and report the failure',async()=>{
 const {view,chunk,slot}=fixture(async()=>{throw Error('missing GLB');});
 await view.prepare(slot,chunk,++slot.ticket);assert.equal(slot.batches.size,3);assert.equal(view.stats.assetFailures.length,2);view.dispose();
});
test('late character downloads cannot populate a recycled chunk slot',async()=>{
 const pending=[];const {view,chunk,slot}=fixture(()=>new Promise(resolve=>pending.push(resolve)));
 const work=view.prepare(slot,chunk,++slot.ticket);await new Promise(resolve=>setImmediate(resolve));
 chunk.revision++;for(const resolve of pending)resolve(proxy());await work;assert.equal(slot.batches.size,0);view.dispose();
});

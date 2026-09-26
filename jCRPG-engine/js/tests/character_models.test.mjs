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
test('all ten assignments resolve to supplied GLBs and unknown actors use the shared default',()=>{
 assert.equal(Object.keys(data.actorModels).length,10);
 for(const [actorId,id] of Object.entries(data.actorModels)){
  const definition=modelForActor(data,actorId);assert.equal(definition.id,id);
  assert.deepEqual(definition.scale,[data.modelScale*data.modelSideScale,data.modelScale,data.modelScale*data.modelSideScale]);
  const bytes=fs.readFileSync(new URL(definition.source,root));assert.equal(bytes.readUInt32LE(0),0x46546c67);
  const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  const meshNames=new Set(gltf.nodes.filter(node=>node.mesh!==undefined).map(node=>node.name));
  for(const variant of definition.variants)for(const name of variant.hiddenMeshes)assert.ok(meshNames.has(name),name);
 }
 assert.equal(modelForActor(data,'unknown').id,data.defaultModel);
 assert.equal(modelForActor(data,null),null);
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
 await view.prepare(slot,chunk,++slot.ticket);assert.equal(slot.batches.size,3);assert.equal(loads,3);
 assert.ok([...slot.batches.keys()].some(key=>key.includes('keykit:mage')));
 await view.prepare(slot,chunk,++slot.ticket);assert.equal(loads,3);
 view.setRealm('cave');assert.ok([...slot.batches.values()].every(b=>!b.mesh.visible));
 view.setRealm('surface');assert.ok([...slot.batches.values()].every(b=>b.mesh.visible));view.dispose();
});
test('failed character loads preserve the existing proxy and report the failure',async()=>{
 const {view,chunk,slot}=fixture(async()=>{throw Error('missing GLB');});
 await view.prepare(slot,chunk,++slot.ticket);assert.equal(slot.batches.size,3);assert.equal(view.stats.assetFailures.length,3);view.dispose();
});
test('late character downloads cannot populate a recycled chunk slot',async()=>{
 const pending=[];const {view,chunk,slot}=fixture(()=>new Promise(resolve=>pending.push(resolve)));
 const work=view.prepare(slot,chunk,++slot.ticket);await new Promise(resolve=>setImmediate(resolve));
 chunk.revision++;for(const resolve of pending)resolve(proxy());await work;assert.equal(slot.batches.size,0);view.dispose();
});

test('every world actor resolves by culture, with stable variants and named overrides',()=>{
 const actors=JSON.parse(fs.readFileSync(new URL('../../worlds/seed0/v2/interactions/actors.json',import.meta.url)));
 const variants=new Set();
 for(const actor of actors){
  assert.ok(data.cultureModels[actor.cultureId],actor.cultureId);
  const model=modelForActor(data,actor.id,actor);
  assert.equal(model.id,data.actorModels[actor.id]??data.cultureModels[actor.cultureId]);
  assert.equal(model.variant.id,actor.missionIds?.length?'uncovered':'standard',actor.id);
  assert.deepEqual(model,modelForActor(JSON.parse(JSON.stringify(data)),actor.id,actor));
  variants.add(model.id+':'+model.variant.id);
 }
 assert.equal(variants.size,6);
});

test('concurrent chunks and accessory variants share one model load, geometry and material',async()=>{
 let resolveModel,loads=0;
 const {view,chunk,slot}=fixture(()=>{loads++;return new Promise(resolve=>{resolveModel=resolve;});});
 const ids=['actor:wammigmig:pella','resident:mission-giver'];
 view.stream.interactionCatalog={actors:Object.fromEntries(ids.map((id,index)=>[id,{cultureId:'boarman',missionIds:index?['mission:example']:[]}]))};
 chunk.data.instances.values().next().value.nodes=ids.map(node);
 const second={...chunk,x:26},secondSlot={revision:-1,ticket:0,group:new THREE.Group(),batches:new Map()};view.slots.push(secondSlot);
 const firstWork=view.prepare(slot,chunk,++slot.ticket),secondWork=view.prepare(secondSlot,second,++secondSlot.ticket);
 await new Promise(resolve=>setImmediate(resolve));assert.equal(loads,1);
 const model=proxy();model.children[0].name='Barbarian_Body';
 const hat=new THREE.Mesh(new THREE.BoxGeometry(),model.children[0].material);hat.name='Barbarian_BearHat';model.add(hat);resolveModel(model);
 await Promise.all([firstWork,secondWork]);
 for(const s of [slot,secondSlot]){
  assert.equal(s.batches.size,3); // Two bodies, one hat; the uncovered variant has no hat.
  const bodies=[...s.batches.values()].filter(b=>b.mesh.geometry===model.children[0].geometry);
  assert.equal(bodies.length,2);assert.ok(bodies.every(b=>b.mesh.material===model.children[0].material));
 }
 const original=[...slot.batches.values()].map(b=>b.mesh);
 await view.prepare(slot,chunk,++slot.ticket);assert.equal(loads,1);
 assert.deepEqual([...slot.batches.values()].map(b=>b.mesh),original);
 view.dispose();
});

test('only the speaking NPC turns; cached meshes and world records stay unchanged',async()=>{
 const {view,chunk,slot}=fixture();await view.prepare(slot,chunk,++slot.ticket);
 const originals=JSON.stringify([...chunk.data.instances.values()]);
 const actorId='actor:wammigmig:pella';view.faceActor(actorId,new THREE.Vector3(-1,0,0));
 const matrix=new THREE.Matrix4();
 for(const batch of slot.batches.values()){
  batch.mesh.getMatrixAt(0,matrix);
  const forward=new THREE.Vector3(0,0,1).transformDirection(matrix);
  assert.ok(forward.distanceTo(new THREE.Vector3(batch.nodes[0].actorId===actorId?1:0,0,batch.nodes[0].actorId===actorId?0:1))<1e-6);
 }
 await view.prepare(slot,chunk,++slot.ticket); // A late chunk/model refresh retains the cut-in facing.
 const speaker=[...slot.batches.values()].find(b=>b.nodes[0].actorId===actorId);
 speaker.mesh.getMatrixAt(0,matrix);assert.ok(new THREE.Vector3(0,0,1).transformDirection(matrix).x>.99);
 view.faceActor(null);
 for(const batch of slot.batches.values()){batch.mesh.getMatrixAt(0,matrix);assert.deepEqual(matrix.toArray(),batch.nodes[0].matrix);}
 assert.equal(JSON.stringify([...chunk.data.instances.values()]),originals);view.dispose();
});

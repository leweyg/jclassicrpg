import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../threejs/three.module.js';
import {ShrineParticles} from '../world/shrine_particles.js';
function fixture(options){
 const scene=new THREE.Scene(),effect=new ShrineParticles(scene,options),camera=new THREE.PerspectiveCamera(62,1,.1,500);
 camera.position.set(0,2,8);camera.lookAt(0,2,0);
 const catalog={shrines:{a:{position:[0,0,0]},b:{position:[100,0,0]}}},save={deltaRevision:0,shrines:{},shrineRoutes:{}},player={x:0,y:0,z:8};
 const update=(turn=0,realm='surface')=>effect.update(catalog,save,player,camera,turn,realm);
 return {scene,effect,camera,catalog,save,player,update};
}
test('turn-only motion, static far markers, no redundant buffer updates, and depth ordering after rotation',()=>{
 const f=fixture();f.update();const a=f.effect.geometry.attributes.position,version=a.version,initial=a.array.slice();
 const far=f.effect.particles.filter(p=>p.position.x>90).map(p=>p.position.toArray());
 f.update();assert.equal(a.version,version);assert.deepEqual(a.array,initial);
 f.update(1);assert.notDeepEqual(a.array,initial);assert.deepEqual(f.effect.particles.filter(p=>p.position.x>90).map(p=>p.position.toArray()),far);
 f.camera.position.set(4,3,-6);f.camera.lookAt(0,2,0);f.update(1);
 const depths=f.effect.sorted.map(p=>p.depth);assert.deepEqual(depths,[...depths].sort((a,b)=>a-b));
 assert.equal(f.effect.material.depthTest,false);assert.equal(f.effect.material.depthWrite,false);assert.equal(f.effect.material.fog,false);
 f.effect.dispose();assert.equal(f.scene.children.length,0);
});
test('activation brightens coils and remote route trail, caves hide them, and positions wrap',()=>{
 const f=fixture();f.update();const near=f.effect.sorted.find(p=>p.position.x<1).alpha,far=f.effect.sorted.find(p=>p.position.x>90).alpha;
 f.save.shrines.a={activated:true};f.save.deltaRevision++;f.update();
 assert.ok(f.effect.sorted.find(p=>p.position.x<1).alpha>near*3);assert.ok(f.effect.sorted.find(p=>p.position.x>90).alpha>far);
 f.update(0,'cave');assert.equal(f.effect.mesh.visible,false);
 f.catalog.shrines.a.position[0]=1599;f.save.deltaRevision++;f.update();assert.equal(f.effect.mesh.visible,true);assert.ok(f.effect.sorted.some(p=>p.position.x<-.5));f.effect.dispose();
});
test('bounded batch and zero direction yield finite point quads',()=>{
 const f=fixture({maxShrines:1,direction:[0,0,0]});f.update();
 assert.ok(f.effect.geometry.drawRange.count<=112*2*6);assert.ok(f.effect.geometry.attributes.position.array.every(Number.isFinite));f.effect.dispose();
});

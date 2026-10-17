import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../threejs/three.module.js';
import {ShrineParticles} from '../world/shrine_particles.js';
function fixture(options){
 const scene=new THREE.Scene(),effect=new ShrineParticles(scene,options),camera=new THREE.PerspectiveCamera(62,1,.1,500);
 camera.position.set(0,2,8);camera.lookAt(0,2,0);
 const catalog={shrines:{a:{position:[0,0,0]},b:{position:[100,0,0]}}},save={deltaRevision:0,shrines:{},shrineRoutes:{}},player={x:0,y:0,z:8};
 const update=(seconds=0,realm='surface')=>effect.update(catalog,save,player,camera,seconds,realm);
 return {scene,effect,camera,catalog,save,player,update};
}
test('active-time motion, static far markers, no redundant buffer updates, and depth ordering after rotation',()=>{
 const f=fixture();f.update();const a=f.effect.geometry.attributes.position,version=a.version,initial=a.array.slice();
 const far=f.effect.particles.filter(p=>p.position.x>90).map(p=>p.position.toArray());
 f.update();assert.equal(a.version,version);assert.deepEqual(a.array,initial);
 f.update(.25);assert.notDeepEqual(a.array,initial);assert.deepEqual(f.effect.particles.filter(p=>p.position.x>90).map(p=>p.position.toArray()),far);
 f.camera.position.set(4,3,-6);f.camera.lookAt(0,2,0);f.update(.25);
 const depths=f.effect.sorted.map(p=>p.depth);assert.deepEqual(depths,[...depths].sort((a,b)=>a-b));
 assert.equal(f.effect.material.depthTest,false);assert.equal(f.effect.material.depthWrite,false);assert.equal(f.effect.material.fog,false);
 f.effect.dispose();assert.equal(f.scene.children.length,0);
});
test('activation brightens coils and remote route trail, caves hide them, and positions wrap',()=>{
 const f=fixture();f.update();const near=f.effect.sorted.find(p=>p.position.x<1).alpha,far=f.effect.sorted.find(p=>p.position.x>90).alpha;
 f.save.shrines.a={activated:true};f.save.deltaRevision++;f.update();
 assert.ok(f.effect.sorted.find(p=>p.position.x<1).alpha>near*1.8);assert.ok(f.effect.sorted.find(p=>p.position.x>90).alpha>far);
 f.update(0,'cave');assert.equal(f.effect.mesh.visible,false);
 f.catalog.shrines.a.position[0]=1599;f.save.deltaRevision++;f.update();assert.equal(f.effect.mesh.visible,true);assert.ok(f.effect.sorted.some(p=>p.position.x<-.5));f.effect.dispose();
});
test('bounded batch and zero direction yield finite point quads',()=>{
 const f=fixture({maxShrines:1,direction:[0,0,0]});f.update();
 assert.ok(f.effect.geometry.drawRange.count<=(112+160)*2*6);assert.ok(f.effect.geometry.attributes.position.array.every(Number.isFinite));f.effect.dispose();
});
test('coil fits above the table and below the chimney, rotating clockwise only with active time',()=>{
 const f=fixture();f.catalog.shrines={a:{position:[0,0,0]}};f.update();
 const positions=f.effect.geometry.attributes.position;
 for(let i=0;i<f.effect.sorted.length*4;i++)if(f.effect.sorted[Math.floor(i/4)].layer===0)assert.ok(positions.getY(i)>.463&&positions.getY(i)<1.056);
 const first=f.effect.particles[0],before=first.position.clone(),center=f.effect.options.offset;
 f.update(.25);
 const after=first.position.clone();
 // Viewed down +Y, +X -> +Z is clockwise (negative Three.js Y rotation).
 assert.ok((before.x-center[0])*(after.z-center[2])-(before.z-center[2])*(after.x-center[0])>0);
 f.player.z=25;f.update(.25);assert.deepEqual(first.position,after,'approach changes fade, not rotation phase');
 f.effect.dispose();
});

test('default rotation completes one clockwise revolution in eight active seconds',()=>{
 const f=fixture();f.update();const start=f.effect.particles[0].position.clone();
 f.update(2);const quarter=f.effect.particles[0].position;
 assert.ok(Math.abs(quarter.x)<1e-10&&quarter.z>0);
 f.update(8);assert.ok(f.effect.particles[0].position.distanceTo(start)<1e-10);
 f.effect.dispose();
});

test('outer beacon reaches below ground and above roof, with finer tangent-aligned streaks',()=>{
 const f=fixture();f.catalog.shrines={a:{position:[0,0,0]}};f.update();
 const beacon=f.effect.sorted.filter(p=>p.layer===1);
 assert.ok(Math.min(...beacon.map(p=>p.position.y))<0);
 assert.ok(Math.max(...beacon.map(p=>p.position.y))>2);
 assert.ok(beacon.every(p=>p.width<f.effect.options.width));
 const p=f.effect.particles[30],next=f.effect.particles[31];
 const tangent=next.position.clone().sub(p.position).normalize();
 assert.ok(p.direction.dot(tangent)>.99,'streak follows the sampled curve');
 const index=f.effect.sorted.indexOf(p),positions=f.effect.geometry.attributes.position;
 const edge=new THREE.Vector3().fromBufferAttribute(positions,index*4+3).sub(new THREE.Vector3().fromBufferAttribute(positions,index*4));
 const projected=f.effect.right.clone().multiplyScalar(p.direction.dot(f.effect.right)).addScaledVector(f.effect.up,p.direction.dot(f.effect.up));
 assert.ok(edge.normalize().dot(projected.normalize())>.9999,'quad long axis follows projected tangent');
 f.effect.dispose();
});

test('dormant shrines are readable nearby; activated destinations dominate guidance from a lit shrine',()=>{
 const f=fixture();f.player.z=2;
 f.catalog.shrines.c={position:[-100,0,0]};f.save.shrines.b={activated:true};
 const peak=predicate=>Math.max(...f.effect.sorted.filter(predicate).map(p=>p.alpha));
 f.update();
 assert.ok(peak(p=>Math.abs(p.position.x)<1&&p.layer===1)>.45,'dormant outer coil is visible at the hut');
 const baseline=peak(p=>p.position.x>90);
 f.save.shrines.a={activated:true};f.save.deltaRevision++;f.update();
 const active=peak(p=>p.position.x>90),dormant=peak(p=>p.position.x< -90);
 assert.ok(active>baseline*2.5);assert.ok(active>dormant*6);
 assert.ok(dormant>.1&&dormant<.15,'unactivated locations remain faint guidance');
 f.player.z=20;f.update();assert.ok(peak(p=>p.position.x>90)<active/2,'guidance fades when leaving the shrine');
 f.effect.dispose();
});
test('distant outer streaks retain a thin visible screen-space width',()=>{
 const f=fixture();f.catalog.shrines={a:{position:[0,0,-200]}};f.update();
 const index=f.effect.sorted.findIndex(p=>p.layer===1),p=f.effect.sorted[index],a=f.effect.geometry.attributes.position;
 const width=new THREE.Vector3().fromBufferAttribute(a,index*4+1).distanceTo(new THREE.Vector3().fromBufferAttribute(a,index*4));
 const pixels=width*f.camera.projectionMatrix.elements[5]*800/(2*-p.depth);
 assert.ok(pixels>=1.49&&pixels<1.6);
 f.effect.dispose();
});

import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../threejs/three.module.js';
import {frameConversation} from '../conversation_camera.js';
import {SceneRenderer} from '../render_engine.js';

test('conversation framing keeps the head above dialogue on desktop and mobile',()=>{
 const bounds=new THREE.Box3(new THREE.Vector3(-.3,40,-.15),new THREE.Vector3(.3,41.1,.15));
 for(const aspect of [1280/800,390/844,844/390]){
  const camera=new THREE.PerspectiveCamera(62,aspect,.1,500);frameConversation(camera,bounds);
  const head=new THREE.Vector3(0,41,0).project(camera);
  assert.ok(head.y>0.12&&head.y<1);assert.ok(Math.abs(head.x)<.001);
  for(const x of [-.3,.3])assert.ok(Math.abs(new THREE.Vector3(x,40.7,0).project(camera).x)<1);
  assert.equal(camera.fov,32);
 }
});
test('conversation cuts restore exploration position and lens without moving the player',()=>{
 const renderer=Object.create(SceneRenderer.prototype),camera=new THREE.PerspectiveCamera(62,1.5,.1,500);
 camera.position.set(12,40.72,20);let requests=0;
 Object.assign(renderer,{camera,_yaw:1,_pitch:-.08,_lookTarget:new THREE.Vector3(),requestRender(){requests++;}});
 renderer.beginConversation({id:'first'});renderer.beginConversation({id:'second'});
 frameConversation(camera,new THREE.Box3(new THREE.Vector3(0,40,0),new THREE.Vector3(.6,41,.4)));
 renderer.endConversation();assert.deepEqual(camera.position.toArray(),[12,40.72,20]);assert.equal(camera.fov,62);assert.equal(camera.near,.1);assert.equal(renderer._conversation,null);
 assert.equal(requests,3);renderer.endConversation();assert.equal(requests,3);
});

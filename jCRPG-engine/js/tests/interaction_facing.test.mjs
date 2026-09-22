import test from 'node:test';
import assert from 'node:assert/strict';
import {selectNearby} from '../interactions/nearby.js';
import {SceneRenderer} from '../render_engine.js';
import * as THREE from '../threejs/three.module.js';
const position={x:0,y:0,z:0};
const anchor=(id,p,priority=40,extra={})=>({id,position:p,realm:'surface',range:3,priority,...extra});
test('camera alignment outranks priority and proximity, using normalized direction',()=>{
 const ahead=anchor('ahead',[0,0,2]),side=anchor('side',[.5,0,.5],100),behind=anchor('behind',[0,0,-1],200);
 assert.equal(selectNearby([behind,side,ahead],position,'surface',{facing:[0,0,1]}).id,'ahead');
 assert.equal(selectNearby([ahead,side,behind],position,'surface',{facing:[0,0,-1]}).id,'behind');
 const farSide=anchor('far-side',[1,0,2],100);
 assert.equal(selectNearby([farSide,ahead],position,'surface',{facing:[0,0,10]}).id,'ahead');
});
test('camera height and pitch affect alignment without changing floor/range/visibility eligibility',()=>{
 const elevated=anchor('elevated',[0,.7,1]),ground=anchor('ground',[0,0,1],100);
 const options={facing:[0,-1,1],viewPosition:{x:0,y:1.7,z:0}};
 assert.equal(selectNearby([ground,elevated],position,'surface',options).id,'elevated');
 const invalid=[anchor('far',[0,0,5],300),anchor('floor',[0,2,1],300),anchor('realm',[0,.7,1],300,{realm:'cave'}),anchor('blocked',[0,.7,1],300,{requiresLineOfSight:true})];
 assert.equal(selectNearby([...invalid,elevated],position,'surface',{...options,lineOfSight:()=>false}).id,'elevated');
});
test('camera selection uses the actual Three.js forward direction',()=>{
 const renderer=Object.create(SceneRenderer.prototype);
 renderer.camera=new THREE.PerspectiveCamera();renderer.camera.position.set(0,1.7,0);
 renderer._interactionForward=new THREE.Vector3();renderer._interactionFacing=[0,0,0];
 const north=anchor('north',[0,0,-2]),south=anchor('south',[0,0,2],100);
 renderer.gameState={nearbyInteraction:(facing,viewPosition)=>selectNearby([north,south],position,'surface',{facing,viewPosition})};
 renderer.camera.lookAt(0,0,-2);assert.equal(renderer.nearbyInteraction().id,'north');
 renderer.camera.lookAt(0,0,2);assert.equal(renderer.nearbyInteraction().id,'south');
});
test('alignment uses wrapped world distances and retains deterministic tie-breakers',()=>{
 const across=anchor('across',[1,0,0]),behind=anchor('behind',[1598,0,0],100);
 assert.equal(selectNearby([behind,across],{x:1599,y:0,z:0},'surface',{facing:[1,0,0]}).id,'across');
 const a=anchor('a',[0,0,1]),b=anchor('b',[0,0,1]);
 assert.equal(selectNearby([b,a],position,'surface',{facing:[0,1]}).id,'a');
 assert.equal(selectNearby([a,{...b,priority:100}],position,'surface').id,'b');
});

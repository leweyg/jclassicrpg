import test from 'node:test';
import assert from 'node:assert/strict';
import {compassModel} from '../compass.js';
const p={x:800,y:40,z:800};
const model=(yaw=0,position=null)=>compassModel(yaw,p,position?{name:'Target',position}:null,1600,1600);
test('90-degree strip has 30-degree ticks and cardinal directions follow turning',()=>{
 assert.deepEqual(model().ticks.map(t=>t.label),['N','','']);
 assert.equal(model().ticks.length,3);
 for(const [yaw,label] of [[0,'N'],[-Math.PI/2,'E'],[Math.PI,'S'],[Math.PI/2,'W']])assert.ok(model(yaw).ticks.some(t=>t.label===label&&Math.abs(t.offset)<1e-10));
});
test('waypoint matches camera right, clamps behind-camera bearings, and crosses north smoothly',()=>{
 assert.equal(model(0,[800,40,820]).waypoint.offset,0);
 assert.equal(model(0,[780,40,800]).waypoint.offset,1);
 assert.equal(model(0,[820,40,800]).waypoint.offset,-1);
 assert.equal(model(0,[780,40,780]).waypoint.edge,true);
 assert.ok(model(.01,[800,40,820]).waypoint.offset>0);
 assert.ok(model(-.01,[800,40,820]).waypoint.offset<0);
 assert.equal(model().waypoint,null);
});
test('wrapped world targets take the short bearing and targets at the player center',()=>{
 const m=compassModel(0,{x:1599,z:800},{name:'Wrapped',position:[1,40,800]},1600,1600);
 assert.equal(m.waypoint.offset,-1);
 assert.equal(model(0,[800,40,800]).waypoint.offset,0);
});

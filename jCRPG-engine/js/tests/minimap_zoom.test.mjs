import test from 'node:test';
import assert from 'node:assert/strict';
import {goalMapRadius,easeMapRadius,MINIMAP_ZOOM_DEFAULTS as defaults} from '../minimap_zoom.js';
const radius=(distance,options=defaults,realm='surface')=>goalMapRadius({x:0,z:0},{position:[distance,0,0],realm},realm,1600,1600,options);
test('nearby goals stay on the old visibility-ring screen radius until four steps away',()=>{
 assert.equal(radius(100),116);
 for(const distance of [58,30,12,4])assert.equal(distance/radius(distance),0.5);
 for(const distance of [3,1,0])assert.equal(radius(distance),8);
 assert.equal(radius(30,{...defaults,goalFraction:0.75}),40);
 assert.equal(radius(0,{...defaults,stopDistance:6}),12);
});
test('goal zoom respects caves, world seams, absent goals and the disable switch',()=>{
 assert.equal(radius(100,defaults,'cave'),116/3);
 assert.equal(radius(10,defaults,'cave'),20);
 assert.equal(radius(1596),8);
 assert.equal(radius(2,{...defaults,enabled:false}),116);
 assert.equal(goalMapRadius({x:0,z:0},null,'surface',1600,1600),116);
 assert.equal(goalMapRadius({x:0,z:0},{position:[1,0,0],realm:'cave'},'surface',1600,1600),116);
});
test('zoom smoothing is frame-rate independent, converges and supports instant changes',()=>{
 const full=easeMapRadius(116,8,0.2,0.18),half=easeMapRadius(easeMapRadius(116,8,0.1,0.18),8,0.1,0.18);
 assert.ok(Math.abs(full-half)<1e-10);
 assert.equal(easeMapRadius(116,8,0,0),8);
 assert.equal(easeMapRadius(undefined,8,0,0.18),8);
 assert.equal(easeMapRadius(116,8,10,0.18),8);
});

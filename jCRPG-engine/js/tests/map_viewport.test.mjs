import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../threejs/three.module.js';
import {MapViewport,bindMapGestures} from '../map_viewport.js';
import {MINIMAP_RADIUS} from '../map_model.js';
import {cameraMapOffset} from '../map_discovery.js';
import {WorldMap} from '../world_map.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} vs ${b}`);
test('minimap matches camera right/forward and turns clockwise on a left turn',()=>{
 for(const yaw of [0,.4,Math.PI/2,Math.PI,Math.PI*1.8]){
  const camera=new THREE.PerspectiveCamera();camera.lookAt(Math.sin(yaw),0,Math.cos(yaw));camera.updateMatrixWorld();
  const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),forward=camera.getWorldDirection(new THREE.Vector3());
  const r=cameraMapOffset(right.x,right.z,yaw),f=cameraMapOffset(forward.x,forward.z,yaw);
  near(r.x,1);near(r.y,0);near(f.x,0);near(f.y,-1);
 }
 const initial=cameraMapOffset(0,-10,Math.PI),left=cameraMapOffset(0,-10,Math.PI+.3);
 near(initial.x,0);assert.ok(left.x>0&&left.y<0,'old forward landmark moves clockwise to the right');
});
test('zoom limits, cursor anchor, pan bounds and reopening reset',()=>{
 const v=new MapViewport(1600,1600);near(v.zoom,1);near(v.project(0,1600).x,0);
 const anchor=v.worldAt(.6,.4);v.zoomAt(2,.6,.4);near(v.worldAt(.6,.4).x,anchor.x);near(v.worldAt(.6,.4).z,anchor.z);
 v.zoomAt(1e6);near(v.span,MINIMAP_RADIUS*2);
 v.pan(100,-100);near(v.x,v.span/2);near(v.z,v.span/2);
 v.zoomAt(1e-10);near(v.zoom,.5);near(v.project(0,1600).x,.25);near(v.project(1600,0).x,.75);
 v.reset();near(v.zoom,1);near(v.x,800);near(v.z,800);
 let resets=0;const map={dialog:{open:false,showModal(){this.open=true;}},renderer:{setInputEnabled(){}},viewport:v,mapGestures:{reset(){resets++;}},detail:{},update(){},_renderList(){}};
 v.zoomAt(3);WorldMap.prototype.open.call(map);near(v.zoom,1);assert.equal(resets,1);
});
function gestures(){
 const handlers=new Map(),v=new MapViewport(1600,1600);let draws=0;
 const canvas={clientHeight:400,getBoundingClientRect:()=>({left:0,top:0,width:400,height:400}),setPointerCapture(){},addEventListener:(name,fn)=>handlers.set(name,fn)};
 const control=bindMapGestures(canvas,v,()=>draws++);
 const emit=(type,data={})=>{let prevented=false;handlers.get(type)({type,button:0,pointerId:1,clientX:200,clientY:200,preventDefault(){prevented=true;},...data});return prevented;};
 return {v,control,emit,draws:()=>draws};
}
test('touch pinch and pan redraw without triggering marker clicks',()=>{
 const g=gestures();g.emit('pointerdown',{clientX:150});g.emit('pointerdown',{pointerId:2,clientX:250});
 g.emit('pointermove',{pointerId:2,clientX:350});near(g.v.zoom,2);assert.ok(g.draws()>0);assert.equal(g.control.suppressClick(),true);
 g.emit('pointerup');g.emit('pointerup',{pointerId:2});assert.equal(g.control.suppressClick(),true);
 g.emit('pointerdown');g.emit('pointerup');g.emit('lostpointercapture');assert.equal(g.control.suppressClick(),false,'normal taps still work');
 g.emit('pointerdown');g.emit('pointermove',{clientX:220});g.emit('pointerup');assert.equal(g.control.suppressClick(),true);
});
test('wheel/trackpad zoom is bounded and gestures can be reset',()=>{
 const g=gestures();assert.equal(g.emit('wheel',{deltaY:-100,deltaMode:0,ctrlKey:true}),true);assert.ok(g.v.zoom>1);
 for(let i=0;i<20;i++)g.emit('wheel',{deltaY:10000,deltaMode:0});near(g.v.zoom,.5);
 g.control.reset();assert.equal(g.control.suppressClick(),false);
 g.emit('gesturestart',{scale:1});g.emit('gesturechange',{scale:2});near(g.v.zoom,1);g.emit('gestureend',{scale:2});assert.equal(g.control.suppressClick(),true);
});
test('marker hit testing uses the zoomed and panned projection',()=>{
 const v=new MapViewport(1600,1600);v.zoomAt(3);v.pan(.1,.1);
 const target={id:'target',x:750,z:900};const at=v.project(target.x,target.z);
 const map={viewport:v,full:{width:800,getBoundingClientRect:()=>({left:20,top:30,width:400,height:400})},markers:[target],_visible:()=>true};
 assert.equal(WorldMap.prototype._hit.call(map,{clientX:20+at.x*400,clientY:30+at.y*400}),target);
});

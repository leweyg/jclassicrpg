import {MINIMAP_RADIUS} from './map_model.js';

export class MapViewport {
 constructor(width,height){this.width=width;this.height=height;this.minZoom=.5;this.maxZoom=width/(MINIMAP_RADIUS*2);this.reset();}
 reset(){this.zoom=1;this.x=this.width/2;this.z=this.height/2;}
 get span(){return this.width/this.zoom;}
 constrain(){const half=this.span/2;this.x=half>=this.width/2?this.width/2:Math.max(half,Math.min(this.width-half,this.x));this.z=half>=this.height/2?this.height/2:Math.max(half,Math.min(this.height-half,this.z));}
 worldAt(u,v){return {x:this.x+(u-.5)*this.span,z:this.z-(v-.5)*this.span};}
 project(x,z){return {x:.5+(x-this.x)/this.span,y:.5-(z-this.z)/this.span};}
 zoomAt(factor,u=.5,v=.5){const anchor=this.worldAt(u,v);this.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.zoom*factor));this.x=anchor.x-(u-.5)*this.span;this.z=anchor.z+(v-.5)*this.span;this.constrain();}
 pan(du,dv){this.x-=du*this.span;this.z+=dv*this.span;this.constrain();}
}

/** Pointer pinch/drag and wheel zoom, with gesture clicks suppressed. */
export function bindMapGestures(canvas,viewport,draw){
 const pointers=new Map();let moved=false,blockClick=false,wheelUntil=0;
 const point=e=>({x:e.clientX,y:e.clientY});
 const pair=()=>{const [a,b]=[...pointers.values()];return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,distance:Math.hypot(a.x-b.x,a.y-b.y)};};
 const local=p=>{const r=canvas.getBoundingClientRect();return {u:Number.isFinite(p.x)?(p.x-r.left)/r.width:.5,v:Number.isFinite(p.y)?(p.y-r.top)/r.height:.5};};
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;if(!pointers.size){moved=false;blockClick=false;}pointers.set(e.pointerId,{...point(e),startX:e.clientX,startY:e.clientY});canvas.setPointerCapture(e.pointerId);if(pointers.size>1){moved=true;blockClick=true;}});
 canvas.addEventListener('pointermove',e=>{
  const old=pointers.get(e.pointerId);if(!old)return;
  const before=pointers.size===2?pair():null;pointers.set(e.pointerId,{...old,...point(e)});
  if(Math.hypot(e.clientX-old.startX,e.clientY-old.startY)>5)moved=true;
  if(!moved)return;e.preventDefault();blockClick=true;
  const r=canvas.getBoundingClientRect();
  if(before){const after=pair(),at=local(before);if(before.distance>0)viewport.zoomAt(after.distance/before.distance,at.u,at.v);viewport.pan((after.x-before.x)/r.width,(after.y-before.y)/r.height);}
  else viewport.pan((e.clientX-old.x)/r.width,(e.clientY-old.y)/r.height);
  draw();
 });
 const end=e=>{if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);if(e.type!=='pointerup')blockClick=true;};
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,end);
 canvas.addEventListener('wheel',e=>{e.preventDefault();const at=local(point(e)),delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1);viewport.zoomAt(Math.exp(Math.max(-1,Math.min(1,-delta*.003))),at.u,at.v);wheelUntil=performance.now()+250;draw();},{passive:false});
 // Safari trackpad pinch events; Chromium trackpads deliver ctrl+wheel instead.
 let gestureScale=1;
 canvas.addEventListener('gesturestart',e=>{e.preventDefault();gestureScale=e.scale||1;blockClick=true;},{passive:false});
 canvas.addEventListener('gesturechange',e=>{e.preventDefault();const at=local(point(e));viewport.zoomAt(e.scale/gestureScale,at.u,at.v);gestureScale=e.scale;draw();},{passive:false});
 canvas.addEventListener('gestureend',e=>{e.preventDefault();wheelUntil=performance.now()+250;},{passive:false});
 return {suppressClick:()=>blockClick||pointers.size>0||performance.now()<wheelUntil,reset:()=>{pointers.clear();moved=false;blockClick=false;wheelUntil=0;}};
}

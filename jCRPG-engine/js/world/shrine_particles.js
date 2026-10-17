import * as THREE from '../threejs/three.module.js';

export const SHRINE_PARTICLE_DEFAULTS = Object.freeze({
 // Shrine OBJ: table top y=.463, chimney underside y=1.056.
 loops: 3.5, height: .48, radius: .409088 * .61, baseHeight: .52,
 offset: [0, 0, 0],
 nearDistance: 30, farDistance: 380,
 activatedNetworkBoost: 1.5, primaryFadeDistance: 28, guidanceStartDistance: 8, guidanceFullDistance: 4,
 dormantNearOpacity: .48, activeNearOpacity: .95,
 dormantFarOpacity: .18, activeFarOpacity: .32,
 dormantGuidanceOpacity: .3, activeGuidanceOpacity: .9, beaconMinPixels: 4, maxShrines: 24, samples: 112,
 // null follows each helix tangent; a vector overrides it, zero gives points.
 direction: null, streakLength: .018, width: .014, rotationHz: .125,
 beacon: Object.freeze({height: 6, baseHeight: -1.5, radius: .7, loops: 3.5, samples: 160, width: .028, streakLength: .04, farScale: 6, farScaleDistance: 120}),
});
const smooth = (a,b,x) => {const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const wrapDelta = x => THREE.MathUtils.euclideanModulo(x+800,1600)-800;

/** One bounded transparent batch. No timers, RAF callbacks, lights or bloom passes.
 * Particle phase depends ONLY on the supplied active-update time in seconds. View changes rebuild billboards
 * and sort their centers in camera space, including across different shrines.
 */
export class ShrineParticles {
 constructor(scene, options={}) {
  this.options={...SHRINE_PARTICLE_DEFAULTS,...options,beacon:{...SHRINE_PARTICLE_DEFAULTS.beacon,...options.beacon}};
  const capacity=this.options.maxShrines*(this.options.samples+this.options.beacon.samples)*2;
  this.geometry=new THREE.BufferGeometry();
  for(const [name,size] of [['position',3],['color',4],['uv',2]])this.geometry.setAttribute(name,new THREE.BufferAttribute(new Float32Array(capacity*4*size),size).setUsage(THREE.DynamicDrawUsage));
  const indices=[];for(let i=0;i<capacity;i++){const v=i*4;indices.push(v,v+1,v+2,v,v+2,v+3);}this.geometry.setIndex(indices);this.geometry.setDrawRange(0,0);
  const size=32,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,r=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2));data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(255*Math.pow(Math.max(0,1-r),2));}
  this.texture=new THREE.DataTexture(data,size,size);this.texture.magFilter=THREE.LinearFilter;this.texture.minFilter=THREE.LinearFilter;this.texture.needsUpdate=true;
  this.material=new THREE.MeshBasicMaterial({map:this.texture,vertexColors:true,transparent:true,depthTest:false,depthWrite:false,fog:false,toneMapped:false,side:THREE.DoubleSide});
  this.mesh=new THREE.Mesh(this.geometry,this.material);this.mesh.name='shrine-helix-particles';this.mesh.frustumCulled=false;this.mesh.renderOrder=20;scene.add(this.mesh);this.scene=scene;
  this.particles=Array.from({length:capacity},()=>({position:new THREE.Vector3(),direction:new THREE.Vector3(),layer:0,dormancy:0,width:0,streakLength:0,depth:0,alpha:0,strand:0,scale:1}));
  this.sorted=[];this.view=new THREE.Vector3();this.right=new THREE.Vector3();this.up=new THREE.Vector3();
 }
 update(catalog,save,player,camera,timeSeconds=0,realm='surface',viewportHeight=800) {
  this.mesh.visible=realm==='surface';if(!this.mesh.visible)return;
  camera.updateMatrixWorld();
  const key=[...camera.matrixWorld.elements,player.x,player.y,player.z,timeSeconds,viewportHeight,save?.deltaRevision??0,JSON.stringify(this.options)].join(',');
  if(this.key===key&&this.catalog===catalog&&this.save===save)return;
  this.key=key;this.catalog=catalog;this.save=save;
  const o=this.options,frontier=new Set(Object.values(save?.shrineRoutes??{}).flatMap(r=>r.litFrontierShrineIds??[]));
  const candidates=Object.entries(catalog?.shrines??{}).map(([id,s])=>{
   const dx=wrapDelta(s.position[0]-player.x),dz=wrapDelta(s.position[2]-player.z);
   return {id,x:player.x+dx,y:s.position[1],z:player.z+dz,d:Math.hypot(dx,dz),active:!!save?.shrines?.[id]?.activated};
  }).filter(s=>s.d<o.farDistance).sort((a,b)=>a.d-b.d);
  const primary=candidates[0];
  // Any nearby shrine can serve as a lookout. Keep the nearest landmark
  // visible on approach, then reveal the network only in the last few steps.
  const guidance=1-smooth(o.guidanceFullDistance,o.guidanceStartDistance,primary?.d??Infinity);
  const networkBoost=THREE.MathUtils.lerp(1,o.activatedNetworkBoost,primary?.active ? guidance : 0);
  const resonance=1-smooth(3,12,candidates.find(s=>s.active)?.d??Infinity);
  // Spend the bounded batch on landmarks in the current view first, rather
  // than letting nearby shrines behind the player crowd them out.
  const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  const sphere=new THREE.Sphere();
  for(const s of candidates){
   const scale=THREE.MathUtils.lerp(1,o.beacon.farScale,smooth(o.nearDistance,o.beacon.farScaleDistance,s.d));
   const height=o.beacon.height*scale;
   sphere.center.set(s.x+o.offset[0],s.y+o.offset[1]+o.beacon.baseHeight+height/2,s.z+o.offset[2]);
   sphere.radius=Math.hypot(height/2,o.beacon.radius*scale*(s===primary ? 1 : networkBoost));
   s.inView=frustum.intersectsSphere(sphere);
  }
  candidates.sort((a,b)=>Number(b.inView)-Number(a.inView)||a.d-b.d);
  this.sorted.length=0;let count=0;
  for(const s of candidates.slice(0,o.maxShrines)) {
   const near=1-smooth(o.nearDistance*.65,o.nearDistance,s.d);
   const fade=1-smooth(o.farDistance*.65,o.farDistance,s.d);
   // Standing at a lit shrine reveals the activated network prominently,
   // while dormant destinations remain subtle hints (even route frontiers).
   const distant=s.active
    ? THREE.MathUtils.lerp(o.activeFarOpacity,o.activeGuidanceOpacity,resonance)
    : THREE.MathUtils.lerp(o.dormantFarOpacity,o.dormantGuidanceOpacity,resonance)+(frontier.has(s.id) ? .035 : 0);
   const reveal=s===primary ? 1-smooth(o.guidanceFullDistance,o.primaryFadeDistance,s.d) : guidance;
   const alpha=reveal*fade*THREE.MathUtils.lerp(distant,s.active ? o.activeNearOpacity : o.dormantNearOpacity,near);
   // Distant coils use a sparse, rotating silhouette. The transition fades detail
   // instead of replacing scene objects or loading the shrine's chunk.
   for(let layer=0;layer<2;layer++) {
    const shape=layer ? o.beacon : o;
    // Grow only the landmark coil with distance; keep the altar-sized coil
    // and the beacon's underground base anchored to their actual shrine.
    const landmarkScale=layer ? THREE.MathUtils.lerp(1,shape.farScale,smooth(o.nearDistance,shape.farScaleDistance,s.d)) : 1;
    const boost=layer&&s!==primary ? networkBoost : 1;
    const height=shape.height*landmarkScale,coilRadius=shape.radius*landmarkScale*boost;
    for(let strand=0;strand<2;strand++)for(let i=0;i<shape.samples;i++) {
     const sparse=i%(layer ? 2 : 8)===0;if(!sparse&&near===0)continue;
     // +angle moves +X toward +Z: clockwise when viewed from above (+Y).
     const phase=(timeSeconds*o.rotationHz%1)*Math.PI*2;
     const t=i/(shape.samples-1),angle=t*Math.PI*2*shape.loops+strand*Math.PI+phase;
     const radius=coilRadius*(.72+.28*Math.sin(t*Math.PI));
     const p=this.particles[count++];p.position.set(s.x+o.offset[0]+Math.cos(angle)*radius,s.y+o.offset[1]+shape.baseHeight+t*height,s.z+o.offset[2]+Math.sin(angle)*radius);
     // Exact derivative of the tapered helix, projected into the camera below.
     const dr=coilRadius*.28*Math.PI*Math.cos(t*Math.PI),da=Math.PI*2*shape.loops;
     if(o.direction===null)p.direction.set(dr*Math.cos(angle)-radius*da*Math.sin(angle),height,dr*Math.sin(angle)+radius*da*Math.cos(angle)).normalize();
     else p.direction.fromArray(o.direction);
     p.depth=this.view.copy(p.position).applyMatrix4(camera.matrixWorldInverse).z;
     // Symmetric height envelope: transparent tips, full alpha at the middle.
     const heightAlpha=Math.sqrt(Math.max(0,1-Math.abs(2*t-1)));
     p.alpha=Math.min(1,alpha*boost)*(sparse?1:near)*heightAlpha;
     p.strand=strand;p.layer=layer;p.dormancy=s.active ? 0 : 1;p.width=shape.width;p.streakLength=shape.streakLength;
     p.scale=1+(1-near)*Math.min(layer ? 12 : 3,s.d/(layer ? 30 : 100));this.sorted.push(p);
    }
   }
  }
  this.sorted.sort((a,b)=>a.depth-b.depth);
  this.right.setFromMatrixColumn(camera.matrixWorld,0);this.up.setFromMatrixColumn(camera.matrixWorld,1);
  const along=new THREE.Vector3(),across=new THREE.Vector3();
  const attrs=this.geometry.attributes,gold=new THREE.Color(0xffce73),blue=new THREE.Color(0x90e6ff),dormant=new THREE.Color(0xaaaaaa),tint=new THREE.Color();
  for(let i=0;i<count;i++) {
   const p=this.sorted[i],color=tint.copy(p.strand?blue:gold).lerp(dormant,p.dormancy);
   const dx=p.direction.dot(this.right),dy=p.direction.dot(this.up),length=Math.hypot(dx,dy);
   if(length>1e-6){
    along.copy(this.right).multiplyScalar(dx/length).addScaledVector(this.up,dy/length);
    across.copy(this.right).multiplyScalar(dy/length).addScaledVector(this.up,-dx/length);
   }else{along.copy(this.up);across.copy(this.right);}
   // Subpixel strands vanished against scenery. Give only the outer beacon
   // a thin screen-space floor, keeping its physical coil radius unchanged.
   const worldPerPixel=2*Math.max(0,-p.depth)/(camera.projectionMatrix.elements[5]*Math.max(1,viewportHeight));
   const halfWidth=p.layer===1 ? Math.max(p.width*p.scale,worldPerPixel*o.beaconMinPixels*.5) : p.width*p.scale;
   for(let corner=0;corner<4;corner++){
    const u=corner===1||corner===2?1:-1,v=corner>=2?1:-1,index=i*4+corner;
    this.view.copy(p.position).addScaledVector(across,u*halfWidth).addScaledVector(along,v*(halfWidth+p.streakLength*length*p.scale));
    attrs.position.setXYZ(index,this.view.x,this.view.y,this.view.z);attrs.color.setXYZW(index,color.r,color.g,color.b,p.alpha);attrs.uv.setXY(index,(u+1)/2,(v+1)/2);
   }
  }
  for(const attr of Object.values(attrs))attr.needsUpdate=true;
  this.geometry.setDrawRange(0,count*6);
 }
 dispose(){this.scene.remove(this.mesh);this.geometry.dispose();this.material.dispose();this.texture.dispose();}
}

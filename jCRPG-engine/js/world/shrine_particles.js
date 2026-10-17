import * as THREE from '../threejs/three.module.js';

export const SHRINE_PARTICLE_DEFAULTS = Object.freeze({
 loops: 3.5, height: 3.4, radius: .24, baseHeight: .35,
 nearDistance: 30, farDistance: 380, maxShrines: 24, samples: 112,
 // World-space streak direction; zero gives round alpha-textured points.
 direction: [0, 1, 0], streakLength: .10, width: .035, turnRotation: .19,
});
const smooth = (a,b,x) => {const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const wrapDelta = x => THREE.MathUtils.euclideanModulo(x+800,1600)-800;

/** One bounded transparent batch. No timers, RAF callbacks, lights or bloom passes.
 * Particle phase depends ONLY on simulation turn. View changes rebuild billboards
 * and sort their centers in camera space, including across different shrines.
 */
export class ShrineParticles {
 constructor(scene, options={}) {
  this.options={...SHRINE_PARTICLE_DEFAULTS,...options};
  const capacity=this.options.maxShrines*this.options.samples*2;
  this.geometry=new THREE.BufferGeometry();
  for(const [name,size] of [['position',3],['color',4],['uv',2]])this.geometry.setAttribute(name,new THREE.BufferAttribute(new Float32Array(capacity*4*size),size).setUsage(THREE.DynamicDrawUsage));
  const indices=[];for(let i=0;i<capacity;i++){const v=i*4;indices.push(v,v+1,v+2,v,v+2,v+3);}this.geometry.setIndex(indices);this.geometry.setDrawRange(0,0);
  const size=32,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,r=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2));data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(255*Math.pow(Math.max(0,1-r),2));}
  this.texture=new THREE.DataTexture(data,size,size);this.texture.magFilter=THREE.LinearFilter;this.texture.minFilter=THREE.LinearFilter;this.texture.needsUpdate=true;
  this.material=new THREE.MeshBasicMaterial({map:this.texture,vertexColors:true,transparent:true,depthTest:false,depthWrite:false,fog:false,toneMapped:false,side:THREE.DoubleSide});
  this.mesh=new THREE.Mesh(this.geometry,this.material);this.mesh.name='shrine-helix-particles';this.mesh.frustumCulled=false;this.mesh.renderOrder=20;scene.add(this.mesh);this.scene=scene;
  this.particles=Array.from({length:capacity},()=>({position:new THREE.Vector3(),depth:0,alpha:0,strand:0,scale:1}));
  this.sorted=[];this.view=new THREE.Vector3();this.right=new THREE.Vector3();this.up=new THREE.Vector3();this.direction=new THREE.Vector3();
 }
 update(catalog,save,player,camera,turn=0,realm='surface') {
  this.mesh.visible=realm==='surface';if(!this.mesh.visible)return;
  camera.updateMatrixWorld();
  const key=[...camera.matrixWorld.elements,player.x,player.y,player.z,turn,save?.deltaRevision??0,JSON.stringify(this.options)].join(',');
  if(this.key===key&&this.catalog===catalog&&this.save===save)return;
  this.key=key;this.catalog=catalog;this.save=save;
  const o=this.options,frontier=new Set(Object.values(save?.shrineRoutes??{}).flatMap(r=>r.litFrontierShrineIds??[]));
  const candidates=Object.entries(catalog?.shrines??{}).map(([id,s])=>{
   const dx=wrapDelta(s.position[0]-player.x),dz=wrapDelta(s.position[2]-player.z);
   return {id,x:player.x+dx,y:s.position[1],z:player.z+dz,d:Math.hypot(dx,dz),active:!!save?.shrines?.[id]?.activated};
  }).filter(s=>s.d<o.farDistance).sort((a,b)=>a.d-b.d);
  const resonance=1-smooth(3,12,candidates.find(s=>s.active)?.d??Infinity);
  this.sorted.length=0;let count=0;
  for(const s of candidates.slice(0,o.maxShrines)) {
   const near=1-smooth(o.nearDistance*.65,o.nearDistance,s.d);
   const fade=1-smooth(o.farDistance*.65,o.farDistance,s.d);
   const alpha=fade*((s.active ? .85 : .16)*near+(1-near)*(s.active ? .24 : .045)*(1+resonance*2+(frontier.has(s.id)?1:0)));
   // Distant coils are a fixed, sparse silhouette. The transition fades detail
   // instead of replacing scene objects or loading the shrine's chunk.
   for(let strand=0;strand<2;strand++)for(let i=0;i<o.samples;i++) {
    const sparse=i%8===0;if(!sparse&&near===0)continue;
    const t=i/(o.samples-1),angle=t*Math.PI*2*o.loops+strand*Math.PI+turn*o.turnRotation*near;
    const radius=o.radius*(.72+.28*Math.sin(t*Math.PI));
    const p=this.particles[count++];p.position.set(s.x+Math.cos(angle)*radius,s.y+o.baseHeight+t*o.height,s.z+Math.sin(angle)*radius);
    p.depth=this.view.copy(p.position).applyMatrix4(camera.matrixWorldInverse).z;
    p.alpha=alpha*(sparse?1:near)*(.65+.35*Math.sin(t*Math.PI));p.strand=strand;p.scale=1+(1-near)*Math.min(3,s.d/100);this.sorted.push(p);
   }
  }
  this.sorted.sort((a,b)=>a.depth-b.depth);
  this.right.setFromMatrixColumn(camera.matrixWorld,0);this.up.setFromMatrixColumn(camera.matrixWorld,1);
  this.direction.fromArray(o.direction);const dx=this.direction.dot(this.right),dy=this.direction.dot(this.up),length=Math.hypot(dx,dy);
  const along=length>1e-6?this.right.clone().multiplyScalar(dx/length).addScaledVector(this.up,dy/length):this.up.clone();
  const across=length>1e-6?this.right.clone().multiplyScalar(dy/length).addScaledVector(this.up,-dx/length):this.right.clone();
  const attrs=this.geometry.attributes,gold=new THREE.Color(0xffce73),blue=new THREE.Color(0x90e6ff);
  for(let i=0;i<count;i++) {
   const p=this.sorted[i],color=p.strand?blue:gold;
   for(let corner=0;corner<4;corner++){
    const u=corner===1||corner===2?1:-1,v=corner>=2?1:-1,index=i*4+corner;
    this.view.copy(p.position).addScaledVector(across,u*o.width*p.scale).addScaledVector(along,v*(o.width+o.streakLength*length)*p.scale);
    attrs.position.setXYZ(index,this.view.x,this.view.y,this.view.z);attrs.color.setXYZW(index,color.r,color.g,color.b,p.alpha);attrs.uv.setXY(index,(u+1)/2,(v+1)/2);
   }
  }
  for(const attr of Object.values(attrs))attr.needsUpdate=true;
  this.geometry.setDrawRange(0,count*6);
 }
 dispose(){this.scene.remove(this.mesh);this.geometry.dispose();this.material.dispose();this.texture.dispose();}
}

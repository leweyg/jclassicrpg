import * as THREE from '../threejs/three.module.js';
import {loadObjModel} from '../obj_mtl_loader.js';
/** Shared immutable source assets; only instance buffers belong to slots. */
export class BakedView {
 constructor(scene,stream,wake){this.scene=scene;this.stream=stream;this.wake=wake;this.assets=new Map();this.slots=stream.chunks.map(()=>({revision:-1,ticket:0,group:new THREE.Group(),batches:new Map()}));this.dummy=new THREE.Object3D();this.routeArrows=new Map();this.realm='surface';this.debug=false;this.stats={assetFailures:[],instances:0};
  this.fallbackGeometry=new THREE.BoxGeometry(1,1,.1);this.fallbackGeometry.translate(0,.5,0);this.fallbackMaterial=new THREE.MeshStandardMaterial({color:0x92795a,side:THREE.DoubleSide});for(const s of this.slots)scene.add(s.group);
 }
 async asset(source){if(!this.assets.has(source)){const url=new URL(source),at=url.href.lastIndexOf('/');this.assets.set(source,loadObjModel(url.href.slice(0,at),url.href.slice(at+1),{yUp:true}).catch(error=>{this.stats.assetFailures.push(`${source}: ${error.message}`);const g=new THREE.Group();g.add(new THREE.Mesh(this.fallbackGeometry,this.fallbackMaterial));return g;}));}return this.assets.get(source);}
 sync(){for(let i=0;i<this.slots.length;i++){const c=this.stream.chunks[i],s=this.slots[i];if(!c.ready||!c.data||s.revision===c.revision)continue;s.revision=c.revision;this.prepare(s,c,++s.ticket);}}
 async prepare(s,c,ticket){
  const revision=c.revision,data=c.data,groups=[...data.instances.entries()];
  const loaded=await Promise.all(groups.map(async([key,g])=>[key,g,await this.asset(g.source)]));
  if(s.ticket!==ticket||!c.ready||c.revision!==revision||c.data!==data)return;
  const used=new Set();
  for(const [key,g,model]of loaded){let part=0;model.traverse(child=>{if(!child.isMesh)return;const batchKey=key+'|'+part++;used.add(batchKey);let b=s.batches.get(batchKey);
    if(!b||b.capacity<g.nodes.length){if(b){s.group.remove(b.mesh);b.mesh.dispose();}const capacity=Math.max(16,2**Math.ceil(Math.log2(Math.max(1,g.nodes.length))));const mesh=new THREE.InstancedMesh(child.geometry,child.material,capacity);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.receiveShadow=true;mesh.castShadow=false;s.group.add(mesh);b={mesh,capacity,realm:g.realm,roof:g.roof,ceiling:g.ceiling};s.batches.set(batchKey,b);}
    let index=0;for(const n of g.nodes){this.dummy.matrix.fromArray(n.matrix);b.mesh.setMatrixAt(index++,this.dummy.matrix);}b.mesh.count=index;b.mesh.instanceMatrix.needsUpdate=true;b.mesh.computeBoundingSphere();b.mesh.visible=b.realm===this.realm;b.nodes=g.nodes;
  });}
  // Release slot-owned instance buffers; leave shared geometries and materials.
  for(const [key,b]of s.batches)if(!used.has(key)){s.group.remove(b.mesh);b.mesh.dispose();s.batches.delete(key);}
  s.group.position.set(c.x*32,0,c.z*32);this.appearanceDirty=true;this.wake?.();
 }
 setRealm(realm,save=null){if(!this.appearanceDirty&&this.realm===realm&&this.appearanceSave===save&&this.deltaRevision===(save?.deltaRevision??0))return;this.appearanceDirty=false;this.appearanceSave=save;this.deltaRevision=save?.deltaRevision??0;this.realm=realm;this.syncRouteArrows(save);this.stats.instances=0;for(const s of this.slots)for(const b of s.batches.values()){
   b.mesh.visible=b.realm===realm;if(b.mesh.visible)this.stats.instances+=b.mesh.count;
   // Instance color marks persistent looted containers without destroying assets.
   if(save&&b.nodes){for(let i=0;i<b.nodes.length;i++){
     const n=b.nodes[i],id=n.stateTargetId;
     let color=save.containers?.[n.objectId]?.looted?0x687269:save.openedContainers?.[n.objectId]?0xb4ac83:0xffffff;
     if(save.settlements?.[n.settlementId]?.balanceState==='integrated')color=0xb0ffcf;
     if(save.shrines?.[id]?.activated||save.puzzles?.[id]?.completed)color=0x73ffd2;
     else if(save.puzzles?.[id]?.observed?.includes(n.componentId))color=0xffce73;
     if(Object.values(save.settlements??{}).some(t=>t.poweredTargetIds?.includes(id)))color=0xb0ffcf;
     if(Object.values(save.shrineRoutes??{}).some(r=>r.litFrontierShrineIds?.includes(id)))color=0xffdf83;
     b.mesh.setColorAt(i,new THREE.Color(color));
    }if(b.mesh.instanceColor)b.mesh.instanceColor.needsUpdate=true;}

  }}
 syncRouteArrows(save){
  const maps=this.stream.interactionCatalog,used=new Set();if(maps&&this.realm==='surface')for(const [id,state]of Object.entries(save?.shrineRoutes??{})){
   const route=maps.routes[id],frontier=state.litFrontierShrineIds[0],at=route?.shrineIds.indexOf(frontier);if(!(at>0))continue;
   const from=maps.shrines[route.shrineIds[at-1]].position,to=maps.shrines[frontier].position;if(!this.stream.getChunk(from[0],from[2]))continue;
   let dx=to[0]-from[0],dz=to[2]-from[2];if(dx>800)dx-=1600;if(dx< -800)dx+=1600;if(dz>800)dz-=1600;if(dz< -800)dz+=1600;
   const direction=new THREE.Vector3(dx,0,dz).normalize();let arrow=this.routeArrows.get(id);if(!arrow){arrow=new THREE.ArrowHelper(direction,new THREE.Vector3(),5,0xffdf83,1,.55);this.scene.add(arrow);this.routeArrows.set(id,arrow);}arrow.position.set(from[0],from[1]+1.7,from[2]);arrow.setDirection(direction);arrow.visible=true;used.add(id);
  }
  for(const [id,arrow]of this.routeArrows)if(!used.has(id)){this.scene.remove(arrow);arrow.dispose();this.routeArrows.delete(id);}
 }
 dispose(){for(const arrow of this.routeArrows.values()){this.scene.remove(arrow);arrow.dispose();}this.routeArrows.clear();for(const s of this.slots){s.ticket++;this.scene.remove(s.group);for(const b of s.batches.values())b.mesh.dispose();}this.fallbackGeometry.dispose();this.fallbackMaterial.dispose();}
}

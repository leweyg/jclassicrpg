import {selectNearby} from '../interactions/nearby.js';
/** Bounded static-host streamer: 25 reusable slots, four fetches, revision guards.
 * No procedural imports. Missing/invalid collision always blocks traversal.
 */
import {identity,compose,multiply} from './transforms.js';
import {wrap} from '../frozen_world.js';
import {FORMAT_VERSION,GENERATOR_VERSION,WORLD_ID,chunkKey,validateScene,CELL as C,FACE,wallBit} from './format.js';
const slotIndex=(x,z)=>wrap(x,5)*5+wrap(z,5);
export class BakedWorldStream {
 constructor(world,manifest,baseURL,{fetcher=fetch,cacheLimit=50,cacheBytes=10*1024*1024,concurrency=4}={}){
  if(manifest.formatVersion!==FORMAT_VERSION||manifest.worldId!==WORLD_ID||manifest.generatorVersion!==GENERATOR_VERSION||manifest.sourceSha256!==world.sourceSha256)throw Error('Incompatible baked world manifest');
  this.world=world;this.manifest=manifest;this.baseURL=baseURL;this.fetcher=(...args)=>fetcher(...args);this.cacheLimit=cacheLimit;this.cacheBytes=cacheBytes;this.concurrency=concurrency;
  this.centerX=NaN;this.centerZ=NaN;this.chunks=Array.from({length:25},()=>({x:NaN,z:NaN,revision:0,ticket:0,ready:false,heights:new Float32Array(289),types:new Uint8Array(289),climates:new Uint8Array(289),vegetation:new Float32Array(384),plantCount:0,data:null}));
  this.cache=new Map();this.jobs=new Map();this.active=0;this.onChange=null;this.onError=null;this.disposed=false;this.stats={fetchedBytes:0,fetches:0,cacheHits:0,stale:0,failures:0};
 }
 update(x,z){
  const cx=Math.floor(x/32),cz=Math.floor(z/32);if(cx===this.centerX&&cz===this.centerZ)return false;this.centerX=cx;this.centerZ=cz;
  const desired=new Set();for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)desired.add(chunkKey(cx+dx,cz+dz));
  for(const [key,job]of this.jobs)if(!desired.has(key)){job.abort.abort();this.jobs.delete(key);}
  for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){
   const x=cx+dx,z=cz+dz,slot=this.chunks[slotIndex(x,z)],key=chunkKey(x,z);if(slot.x===x&&slot.z===z)continue;
   slot.x=x;slot.z=z;slot.ticket++;slot.ready=false;slot.error=null;
   if(this.cache.has(key)){this.stats.cacheHits++;const content=this.cache.get(key);this.cache.delete(key);this.cache.set(key,content);this._commit(slot,content,slot.ticket);}
   else if(!this.jobs.has(key))this.jobs.set(key,{key,priority:Math.max(Math.abs(dx),Math.abs(dz)),state:'queued',abort:new AbortController()});
  }this._pump();return true;
 }
 _commit(slot,data,ticket){if(slot.ticket!==ticket||chunkKey(slot.x,slot.z)!==data.key)return;slot.heights.set(data.terrain.heights);slot.types.set(data.terrain.types);slot.climates.set(data.terrain.climates);slot.vegetation.fill(0);slot.vegetation.set(data.terrain.vegetation);slot.plantCount=data.terrain.vegetation.length/6;slot.data=data;slot.ready=true;slot.revision++;this.onChange?.(slot);}
 _pump(){if(this.disposed)return;while(this.active<this.concurrency){const job=[...this.jobs.values()].filter(j=>j.state==='queued').sort((a,b)=>a.priority-b.priority)[0];if(!job)break;job.state='loading';this.active++;this._run(job).finally(()=>{this.active--;if(this.jobs.get(job.key)===job)this.jobs.delete(job.key);this._pump();});}}
 async _run(job){
  try{
   const desc=this.manifest.chunks[job.key];if(!desc)throw Error('Chunk absent from manifest');
   const response=await this.fetcher(new URL(desc.url,this.baseURL),{signal:job.abort.signal});if(!response.ok)throw Error(`HTTP ${response.status}`);
   const text=await response.text();this.stats.fetches++;this.stats.fetchedBytes+=new TextEncoder().encode(text).length;
   if(job.abort.signal.aborted||this.jobs.get(job.key)!==job){this.stats.stale++;return;}
   if(globalThis.crypto?.subtle){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)),hex=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');if(hex!==desc.sha256)throw Error('Content hash mismatch');}
   const doc=JSON.parse(text),d=validateScene(doc,job.key);
   if(d.generatorVersion!==GENERATOR_VERSION)throw Error('Generator version mismatch');
   if(d.terrain?.heights?.length!==289||!d.terrain.heights.every(Number.isFinite)||d.terrain.types?.length!==289||d.terrain.climates?.length!==289||!Array.isArray(d.terrain.vegetation)||d.terrain.vegetation.length>384||d.terrain.vegetation.length%6)throw Error('Invalid baked terrain');
   if(!Array.isArray(d.collision?.cells)||!Array.isArray(d.collision?.structures)||d.collision.cells.length>100000)throw Error('Invalid baked collision');
   const lookup=new Map();for(const row of d.collision.cells){if(row.length!==7||!row.every(Number.isFinite)||row[0]<0||row[0]>=32||row[2]<0||row[2]>=32||!d.collision.structures[row[4]])throw Error('Invalid semantic cell');const key=row[0]+32*row[2];if(!lookup.has(key))lookup.set(key,[]);lookup.get(key).push(row);}
   const instances=new Map();let nodeCount=0;
   const prefabs=new Map();
   const add=async(nodes,url,parent=identity(),depth=0)=>{if(depth>12)throw Error('Prefab depth limit exceeded');for(const node of nodes){if(++nodeCount>100000)throw Error('Scene node limit exceeded');if(node.userData?.jcrpg?.kind==='terrain')continue;
     const matrix=multiply(parent,compose(node));
     if(node.source){const source=new URL(node.source,url);const root=new URL('assets/',this.baseURL);if(source.origin!==root.origin||!source.pathname.startsWith(root.pathname))throw Error('Asset source outside world pack');
       if(source.pathname.endsWith('.json')){if(!prefabs.has(source.href)){if(prefabs.size>=32)throw Error('Prefab cache limit exceeded');const r=await this.fetcher(source,{signal:job.abort.signal});if(!r.ok)throw Error('Missing prefab');const p=await r.json();validateScene(p);prefabs.set(source.href,p);}await add(prefabs.get(source.href).children,source,matrix,depth+1);}
       else {const meta=node.userData?.jcrpg??{},key=source.href+'|'+(meta.realm??'surface')+'|'+(meta.roof?'roof':meta.ceiling?'ceiling':'body');if(!instances.has(key))instances.set(key,{source:source.href,realm:meta.realm??'surface',roof:!!meta.roof,ceiling:!!meta.ceiling,nodes:[]});instances.get(key).nodes.push({matrix,objectId:meta.objectId??null,stateTargetId:meta.stateTargetId??meta.structureId??null,actorId:meta.actorId??null,settlementId:meta.settlementId??null,componentId:meta.componentId??null});}
     }if(node.children)await add(node.children,url,matrix,depth+1);
   }};
   await add(doc.children,new URL(desc.url,this.baseURL));
   if(job.abort.signal.aborted||this.jobs.get(job.key)!==job){this.stats.stale++;return;}
   const content={key:job.key,terrain:{heights:Float32Array.from(d.terrain.heights),types:Uint8Array.from(d.terrain.types),climates:Uint8Array.from(d.terrain.climates),vegetation:Float32Array.from(d.terrain.vegetation)},collision:d.collision,lookup,instances,portals:d.portals??[],objects:d.objects??[],interactions:d.interactions??[],bytes:desc.byteLength};
   this.cache.set(job.key,content);for(const slot of this.chunks)if(chunkKey(slot.x,slot.z)===job.key)this._commit(slot,content,slot.ticket);
   this._evict();
  }catch(error){if(!job.abort.signal.aborted){this.stats.failures++;for(const slot of this.chunks)if(chunkKey(slot.x,slot.z)===job.key)slot.error=`${WORLD_ID} chunk ${job.key}: ${error.message}`;this.onError?.(error);}}
 }
 _evict(){let bytes=[...this.cache.values()].reduce((n,c)=>n+c.bytes,0);const pinned=new Set(this.chunks.map(c=>chunkKey(c.x,c.z)));for(const [key,c]of this.cache){if(this.cache.size<=this.cacheLimit&&bytes<=this.cacheBytes)break;if(pinned.has(key))continue;this.cache.delete(key);bytes-=c.bytes;}}
 retry(){for(const slot of this.chunks)if(!slot.ready&&!this.jobs.has(chunkKey(slot.x,slot.z))){const key=chunkKey(slot.x,slot.z);this.jobs.set(key,{key,priority:0,state:'queued',abort:new AbortController()});}this._pump();}
 async settled(){while(this.active||this.jobs.size)await new Promise(resolve=>setTimeout(resolve,5));}
 getChunk(x,z){const key=chunkKey(Math.floor(x/32),Math.floor(z/32));return this.chunks.find(s=>s.ready&&chunkKey(s.x,s.z)===key)??null;}
 heightAt(x,z){x=wrap(x,1600);z=wrap(z,1600);const s=this.getChunk(x,z);if(!s)return NaN;const lx=x-Math.floor(x/32)*32,lz=z-Math.floor(z/32)*32,gx=Math.floor(lx/2),gz=Math.floor(lz/2),u=lx/2-gx,v=lz/2-gz,i=gx+17*gz,h=s.heights;return u>=v?h[i]*(1-u)+h[i+1]*(u-v)+h[i+18]*v:h[i]*(1-v)+h[i+17]*(v-u)+h[i+18]*u;}
 cellAt(x,y,z,realm='surface'){
  x=wrap(x,1600);z=wrap(z,1600);const s=this.getChunk(x,z);if(!s)return null;const rows=s.data.lookup.get(Math.floor(x)%32+32*(Math.floor(z)%32));let best=null;
  for(const r of rows??[]){const structure=s.data.collision.structures[r[4]];if((structure.kind==='cave')!==(realm==='cave'))continue;if(y>=r[1]-.05&&y<r[1]+r[5]-.05)best={flags:r[3],floor:r[1],height:r[5],structure};}return best;
 }
 floorAt(x,y,z,realm='surface'){
  const cell=this.cellAt(x,y+.05,z,realm);if(cell&&(cell.flags&C.FLOOR))return cell.floor;
  return realm==='cave'?NaN:this.heightAt(x,z);
 }
 canMove(x,y,z,nx,nz,realm='surface'){
  const target=this.getChunk(wrap(nx,1600),wrap(nz,1600));if(!target)return false;
  const a=this.cellAt(x,y,z,realm),b=this.cellAt(nx,y,nz,realm);
  if(realm==='cave'&&(!a||!b))return false;if((a?.flags??0)&C.BLOCK||(b?.flags??0)&C.BLOCK)return false;
  const ax=Math.floor(x),az=Math.floor(z),bx=Math.floor(nx),bz=Math.floor(nz);if(ax!==bx&&az!==bz)return false;
  let face=-1;if(ax!==bx)face=nx>x?1:3;else if(az!==bz)face=nz>z?2:0;
  if(face>=0&&(((a?.flags??0)&wallBit(face))||((b?.flags??0)&wallBit((face+2)%4))))return false;
  return realm!=='cave'||!!b;
 }
 nearby(position,realm='surface',distance=1.8,options={}){
  const anchors=[];
  for(const slot of this.chunks)if(slot.ready){
   anchors.push(...slot.data.interactions);
   for(const p of slot.data.portals){if(p.kind==='door')continue;const sides=p.kind==='cave'?[realm==='cave'?'to':'from']:['from','to'];for(const side of sides)anchors.push({id:'portal:'+p.id+':'+side,kind:'portal',targetId:p.id,position:p[side],realm,range:distance,priority:40,portal:p,side,prompt:p.kind==='cave'?(realm==='cave'?'Leave cave':'Enter cave'):'Use stairs'});}
  }
  const lineOfSight=a=>{let x=position.x,z=position.z;let dx=a.position[0]-x,dz=a.position[2]-z;if(dx>800)dx-=1600;if(dx< -800)dx+=1600;if(dz>800)dz-=1600;if(dz< -800)dz+=1600;const steps=Math.ceil(Math.hypot(dx,dz)*5);for(let i=0;i<steps;i++){const nx=x+dx/steps,nz=z+dz/steps;if(!this.canMove(x,position.y,z,nx,z,realm)||!this.canMove(nx,position.y,z,nx,nz,realm))return false;x=nx;z=nz;}return true;};
  return selectNearby(anchors,position,realm,{...options,lineOfSight});
 }

 dispose(){this.disposed=true;for(const j of this.jobs.values())j.abort.abort();this.jobs.clear();this.cache.clear();}
}
export async function loadBakedStream(world,options={}){
 const base=new URL('../../worlds/seed0/v2/',import.meta.url),fetcher=options.fetcher??fetch,r=await fetcher(new URL('manifest.json',base));if(!r.ok)throw Error(`World manifest: HTTP ${r.status}. Run node scripts/compile_world.mjs.`);const manifest=await r.json();return new BakedWorldStream(world,manifest,base,{...options,fetcher});
}

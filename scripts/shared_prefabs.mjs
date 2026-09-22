import {createHash} from 'node:crypto';
import {scene,canonicalJSON} from '../jCRPG-engine/js/world/format.js';

/** Share exact local node lists, preserving all metadata except the inherited structure ID. */
export function extractSharedPrefabs(chunks, structures, limit=24) {
 const specs=new Map(structures.filter(s=>s.kind!=='WoodenHouse').map(s=>[s.id,s]));
 const prefabs=new Map(),report=[];
 for(const part of ['roof','model']) {
  const matches=new Map();
  for(const chunk of chunks){
   const groups=new Map();
   for(const node of chunk.nodes){
    const meta=node.userData?.jcrpg,id=meta?.structureId;
    if(!specs.has(id)||(part==='roof'&&!meta.roof))continue;
    if(!groups.has(id))groups.set(id,[]);groups.get(id).push(node);
   }
   for(const [id,nodes] of groups){
    if(nodes.length<2)continue;
    const spec=specs.get(id),origin=[spec.origin[0]-chunk.x*32,spec.origin[1],spec.origin[2]-chunk.z*32];
    // Keep chunk ownership intact; fragmented structures stay inline.
    if(origin[0]<0||origin[2]<0||origin[0]+spec.size[0]>32||origin[2]+spec.size[2]>32)continue;
    const children=nodes.map(node=>{
     const copy=structuredClone(node);
     copy.position=copy.position.map((n,i)=>n-origin[i]);
     copy.source='./'+copy.source.split('/').pop();
     delete copy.userData.jcrpg.structureId;
     return copy;
    });
    // No rounding, mesh substitution, scaling, or removal of object/state IDs.
    const signature=canonicalJSON(children);
    if(!matches.has(signature))matches.set(signature,{children,placements:[],kinds:new Set()});
    const match=matches.get(signature);match.kinds.add(spec.kind);match.placements.push({chunk,id,nodes,origin});
   }
  }
  const candidates=[...matches].filter(([,m])=>m.placements.length>1)
   .sort(([a,x],[b,y])=>(y.children.length-1)*(y.placements.length-1)-(x.children.length-1)*(x.placements.length-1)||a.localeCompare(b));
  for(const [signature,match] of candidates){
   if(prefabs.size>=limit)break;
   const name=`shared-${part}-${createHash('sha256').update(signature).digest('hex').slice(0,16)}.scene.json`;
   prefabs.set(name,scene(`Shared ${part}`,match.children,{kind:'prefab'}));
   for(const {chunk,id,nodes,origin} of match.placements){
    const originals=new Set(nodes);
    chunk.nodes=chunk.nodes.filter(n=>!originals.has(n));
    chunk.nodes.push({name:`Shared ${part}`,position:origin,source:'../assets/'+name,userData:{jcrpg:{structureId:id}}});
   }
   report.push({file:name,part,kinds:[...match.kinds].sort(),pieces:match.children.length,placements:match.placements.length});
  }
 }
 return {prefabs,report};
}

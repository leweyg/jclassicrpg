import {scene,canonicalJSON} from '../jCRPG-engine/js/world/format.js';

/** Replace identical wooden-house visuals with a shared scene reference. */
export function extractWoodenHousePrefab(chunks, structures) {
 const houses=new Map(structures.filter(s=>s.kind==='WoodenHouse').map(s=>[s.id,s]));
 let template=null,signature=null,count=0;
 for(const chunk of chunks){
  const groups=new Map();
  for(const node of chunk.nodes){const id=node.userData?.jcrpg?.structureId;if(houses.has(id)){if(!groups.has(id))groups.set(id,[]);groups.get(id).push(node);}}
  for(const [id,nodes] of groups){
   const house=houses.get(id),origin=[house.origin[0]-chunk.x*32,house.origin[1],house.origin[2]-chunk.z*32];
   if(origin[0]<0||origin[2]<0||origin[0]+house.size[0]>32||origin[2]+house.size[2]>32)throw Error('Wooden house crosses a chunk boundary: '+id);
   const children=nodes.map(node=>{
    const copy=structuredClone(node);
    copy.position=copy.position.map((n,i)=>Number((n-origin[i]).toFixed(8)));
    copy.source='./'+copy.source.split('/').pop();
    delete copy.userData.jcrpg.structureId;
    return copy;
   });
   const shape=canonicalJSON(children);
   if(signature!==null&&signature!==shape)throw Error('Wooden house needs a distinct prefab variant: '+id);
   signature=shape;template=children;count++;
   const originals=new Set(nodes);
   chunk.nodes=chunk.nodes.filter(node=>!originals.has(node));
   chunk.nodes.push({name:'Wooden house',position:origin,source:'../assets/wooden-house.scene.json',userData:{jcrpg:{structureId:id,realm:'surface'}}});
  }
 }
 if(count!==houses.size)throw Error('Missing wooden house visuals');
 return scene('Wooden house',template??[],{kind:'prefab'});
}

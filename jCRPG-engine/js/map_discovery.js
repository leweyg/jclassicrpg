import {wrappedDelta} from './map_model.js';
import {PLAY_DESTINATIONS} from './play_destinations.js';

const startingSettlements=new Set(Object.values(PLAY_DESTINATIONS).map(d=>d.settlementId).filter(Boolean));

export function knownLocation(marker,save,showAll=false){
 const d=save?.discoveredLocations??{};
 return showAll||marker.kind==='start'||startingSettlements.has(marker.id)||marker.objective||!!d[marker.id]||!!d['visited:'+marker.id]||!!d['heard:'+marker.id];
}
export function rememberLocations(save,ids,prefix=''){
 let changed=false;
 for(const id of ids)if(!save.data.discoveredLocations[prefix+id]){save.data.discoveredLocations[prefix+id]=true;changed=true;}
 if(changed)save.data.deltaRevision++;
 return changed;
}
export function discoverVisited(save,markers,position,realm,sizeX=1600,sizeZ=1600){
 const ids=markers.filter(m=>!m.revealOnly&&(m.realm??'surface')===realm&&Math.hypot(wrappedDelta(m.x,position.x,sizeX),wrappedDelta(m.z,position.z,sizeZ))<=(m.kind==='settlement'?18:8)&&(!Number.isFinite(m.y)||Math.abs(m.y-position.y)<3)).map(m=>m.id);
 return rememberLocations(save,ids,'visited:');
}
export function revealReadDialogue(save,markers,dialogue,actors=[]){
 // Only the rendered passage and its currently visible choices, never hidden nodes/actions.
 const text=[dialogue.actor?.name,dialogue.actor?.role,dialogue.text,...dialogue.choices.map(c=>c.text)].filter(Boolean).join(' ').toLowerCase();
 const mentioned=name=>{
  if(!name)return false;
  const escaped=name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`,'u').test(text);
 };
 const towns=new Set(actors.filter(a=>mentioned(a.name)).map(a=>a.townId));
 return rememberLocations(save,markers.filter(m=>[m.name,...(m.aliases??[])].some(mentioned)||towns.has(m.id)).map(m=>m.id),'heard:');
}
export function cameraMapOffset(dx,dz,yaw){
 // Use the actual camera basis: right = (-cos(yaw), sin(yaw)), forward = (sin(yaw), cos(yaw)).
 return {x:-dx*Math.cos(yaw)+dz*Math.sin(yaw),y:-dx*Math.sin(yaw)-dz*Math.cos(yaw)};
}

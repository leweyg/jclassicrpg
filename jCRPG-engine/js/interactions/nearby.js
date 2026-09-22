import {compareId} from './format.js';
export function selectNearby(anchors,position,realm,{facing=null,viewPosition=position,eligible=()=>true,lineOfSight=()=>true,priority=a=>a.priority}={}){
 const delta=(a,b)=>{let d=a-b;if(d>800)d-=1600;if(d< -800)d+=1600;return d;};
 const alignment=a=>{
  if(!facing)return 0;
  const dx=delta(a.position[0],viewPosition.x),dz=delta(a.position[2],viewPosition.z);
  // Play supplies the camera's full 3D forward vector; retain X/Z callers too.
  if(facing.length===3){const dy=a.position[1]-viewPosition.y;return (dx*facing[0]+dy*facing[1]+dz*facing[2])/((Math.hypot(dx,dy,dz)*Math.hypot(...facing))||1);}
  return (dx*facing[0]+dz*facing[1])/((Math.hypot(dx,dz)*Math.hypot(...facing))||1);
 };
 return anchors.filter(a=>a.realm===realm&&eligible(a)).map(a=>{const dx=delta(a.position[0],position.x),dz=delta(a.position[2],position.z),dy=a.position[1]-position.y,distance=Math.hypot(dx,dz);return {...a,priority:priority(a),label:a.prompt,distance,dy,alignment:alignment(a)};}).filter(a=>a.distance<=a.range&&Math.abs(a.dy)<1.1&&(!a.requiresLineOfSight||lineOfSight(a))).sort((a,b)=>b.alignment-a.alignment||b.priority-a.priority||a.distance-b.distance||compareId(a.id,b.id))[0]??null;
}

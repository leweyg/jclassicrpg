import {compareId} from './format.js';
export function selectNearby(anchors,position,realm,{facing=null,eligible=()=>true,lineOfSight=()=>true,priority=a=>a.priority}={}){
 const delta=(a,b)=>{let d=a-b;if(d>800)d-=1600;if(d< -800)d+=1600;return d;};
 return anchors.filter(a=>a.realm===realm&&eligible(a)).map(a=>{const dx=delta(a.position[0],position.x),dz=delta(a.position[2],position.z),dy=a.position[1]-position.y,distance=Math.hypot(dx,dz);return {...a,priority:priority(a),label:a.prompt,distance,dy,alignment:facing?(dx*facing[0]+dz*facing[1])/(distance||1):0};}).filter(a=>a.distance<=a.range&&Math.abs(a.dy)<1.1&&(!a.requiresLineOfSight||lineOfSight(a))).sort((a,b)=>b.priority-a.priority||b.alignment-a.alignment||a.distance-b.distance||compareId(a.id,b.id))[0]??null;
}

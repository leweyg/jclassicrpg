import {CELL as C,wallBit,FACE} from '../jCRPG-engine/js/world/format.js';
/** Static ground navigation proof. Uses baked faces and open door semantics;
 * elevations have no climb limit in the existing runtime. Upper floors are not
 * substituted for ground. Cave cells remain a separate portal-connected realm. */
export function validateInteractionNavigation(chunks,content){
 const side=1600,count=side*side,flags=new Uint16Array(count),levels=new Int16Array(count).fill(32767);
 for(const chunk of chunks)for(const r of chunk.cells){if(chunk.structures[r[4]].kind==='cave')continue;const i=chunk.x*32+r[0]+(chunk.z*32+r[2])*side;if(r[1]<levels[i]){levels[i]=r[1];flags[i]=r[3];}else if(r[1]===levels[i])flags[i]|=r[3];}
 const visited=new Uint8Array(count),queue=new Int32Array(count);let head=0,tail=1;queue[0]=800+907*side;visited[queue[0]]=1;
 while(head<tail){const i=queue[head++],x=i%side,z=Math.floor(i/side),f=flags[i];if(f&C.BLOCK)continue;for(let face=0;face<4;face++){const nx=(x+FACE[face][0]+side)%side,nz=(z+FACE[face][1]+side)%side,n=nx+nz*side;if(visited[n]||(flags[n]&C.BLOCK)||(f&wallBit(face))||(flags[n]&wallBit((face+2)%4)))continue;visited[n]=1;queue[tail++]=n;}}
 function reachable(position){const x=Math.floor(position[0]),z=Math.floor(position[2]);return !!visited[x+z*side];}
 const caveFlags=new Map();
 for(const chunk of chunks)for(const r of chunk.cells)if(chunk.structures[r[4]].kind==='cave')caveFlags.set(chunk.x*32+r[0]+(chunk.z*32+r[2])*side,r[3]);
 let caveAnchors=0;
 const caveTowns=content.settlements.filter(t=>t.realm==='cave');
 for(const town of caveTowns){const start=Math.floor(town.position[0])+Math.floor(town.position[2])*side,seen=new Set([start]),pending=[start];for(let k=0;k<pending.length;k++){const i=pending[k],x=i%side,z=Math.floor(i/side),f=caveFlags.get(i)??0;for(let face=0;face<4;face++){const n=x+FACE[face][0]+(z+FACE[face][1])*side,nf=caveFlags.get(n)??0;if(seen.has(n)||!(nf&C.FLOOR)||(nf&C.BLOCK)||(f&wallBit(face))||(nf&wallBit((face+2)%4)))continue;seen.add(n);pending.push(n);}}
  for(const goal of content.goals.filter(g=>g.realm==='cave'&&!g.portalId&&g.targetId!=='container:concordance:listening-coil')){const nearest=[...caveTowns].sort((a,b)=>Math.hypot(a.position[0]-goal.position[0],a.position[2]-goal.position[2])-Math.hypot(b.position[0]-goal.position[0],b.position[2]-goal.position[2]))[0];if(nearest!==town)continue;caveAnchors++;if(!seen.has(Math.floor(goal.position[0])+Math.floor(goal.position[2])*side))throw Error('Cave interaction disconnected from its settlement entrance: '+goal.id);}
 }
 const inaccessible=[];
 for(const a of chunks.flatMap(c=>c.interactions))if(a.realm==='surface'&&a.kind!=='container'&&!reachable(a.position))inaccessible.push({id:a.id,position:a.position});
 if(inaccessible.length)throw Error('Unreachable ground interaction anchors: '+JSON.stringify(inaccessible.slice(0,15)));
 for(const t of content.settlements){const anchors=content.actors.filter(a=>a.townId===t.id);t.roadReachable=t.realm==='cave'?reachable(t.entrancePosition):anchors.length?anchors.some(a=>reachable(a.position)):reachable(t.position);if(!t.roadReachable)throw Error('Settlement route is disconnected: '+t.id);}
 return {checkedCaveAnchors:caveAnchors,reachableGroundCells:tail,checkedSurfaceAnchors:chunks.flatMap(c=>c.interactions).filter(a=>a.realm==='surface'&&a.kind!=='container').length,method:'baked-ground-faces-from-spawn; caves use their saved component portals'};
}

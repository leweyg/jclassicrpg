import {CELL as C,FACE,wallBit} from '../jCRPG-engine/js/world/format.js';
/** Measure real baked ground faces and cave corridors, including both portal legs. */
export function storyTravel(chunks,content,placement){
 const flags={surface:new Map(),cave:new Map()},levels=new Map();
 for(const chunk of chunks)for(const r of chunk.cells){const realm=chunk.structures[r[4]].kind==='cave'?'cave':'surface',key=chunk.x*32+r[0]+(chunk.z*32+r[2])*1600;
  if(realm==='surface'){if(r[1]>(levels.get(key)??Infinity))continue;if(r[1]<(levels.get(key)??Infinity)){levels.set(key,r[1]);flags.surface.set(key,0);}}
  flags[realm].set(key,(flags[realm].get(key)??0)|r[3]);
 }
 const key=p=>Math.floor(p[0])+Math.floor(p[2])*1600;
 function distance(a,b,realm){const start=key(a),end=key(b),queue=[[start,0]],seen=new Set([start]),map=flags[realm];
  for(let i=0;i<queue.length;i++){const [n,d]=queue[i];if(n===end)return d;const f=map.get(n)??0,x=n%1600,z=Math.floor(n/1600);
   for(let face=0;face<4;face++){const nx=(x+FACE[face][0]+1600)%1600,nz=(z+FACE[face][1]+1600)%1600,next=nx+nz*1600,nf=map.get(next)??0;if(seen.has(next)||(nf&C.BLOCK)||(f&wallBit(face))||(nf&wallBit((face+2)%4))||(realm==='cave'&&!(nf&C.FLOOR)))continue;seen.add(next);queue.push([next,d+1]);}
  }throw Error('Unreachable story leg '+a+' to '+b);
 }
 const goal=id=>{const g=content.goals.find(g=>g.targetId===id);if(!g)throw Error('Missing story marker '+id);return {anchor:id,position:g.position,realm:g.realm};};
 const portal=placement.portal,entrance={anchor:portal.id,position:portal.from,realm:'surface'},inside={anchor:portal.id,position:portal.to,realm:'cave'};
 const stops=[{anchor:'spawn',position:[800,41,907],realm:'surface'},goal('actor:wammigmig:orro'),goal('shrine:shrine 19 22:782:903'),goal('legacy-actor:BoarmanTribe#381:544'),goal('actor:wammigmig:pella'),entrance,inside,goal(placement.itemId),inside,entrance,goal(placement.fittingId),goal('actor:wammigmig:pella'),goal('actor:boarman:regional:1'),...content.goals.filter(g=>g.targetId==='puzzle:boarman:regional:1'&&!g.id.endsWith(':reset')).map(g=>({anchor:g.id,position:g.position,realm:g.realm})),goal('actor:boarman:regional:1')];
 let cumulative=0;return stops.slice(1).map((end,i)=>{const start=stops[i],transition=start.realm!==end.realm,pathLength=transition?0:distance(start.position,end.position,start.realm);cumulative+=pathLength;const record={id:'opening-leg-'+(i+1),start,end,pathLength,portalTransition:transition?portal.id:null,estimatedSeconds:pathLength/4,cumulativeStepsSinceBeat:cumulative};if(content.actors.some(a=>a.id===end.anchor)||end.anchor===placement.itemId)cumulative=0;return record;});
}

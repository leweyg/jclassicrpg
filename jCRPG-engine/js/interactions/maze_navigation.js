import {CELL, FACE, wallBit} from '../world/format.js';
import {wrappedDelta} from '../map_model.js';

const cache = new WeakMap();

/** Resolve only loaded, connected maze floors; never replace the saved goal. */
export function mazeNavigation(state, goal) {
 const stream = state?.exploration, party = state?.party?.position;
 if (state?.realm !== 'surface' || !stream?.cellAt || !party) return null;
 const origin = stream.cellAt(party.x, party.y + .05, party.z, 'surface');
 if (origin?.structure?.kind !== 'SimpleDungeonPart') return null;
 const structure = origin.structure;
 const width = stream.world?.sizeX ?? 1600, depth = stream.world?.sizeZ ?? 1600;
 const wrap = (n, size) => ((n % size) + size) % size;
 const key = (x,z) => `${wrap(Math.floor(x),width)}:${wrap(Math.floor(z),depth)}`;
 const revision = (stream.chunks ?? []).map(c => `${c.x}:${c.z}:${c.ready}:${c.revision}`).join('|');
 const start = key(party.x,party.z);
 let region = cache.get(stream);
 if (!region || region.start !== start || region.revision !== revision || region.id !== structure.id || region.floor !== origin.floor) {
  const floor = (x,z) => {
   const cell = stream.cellAt(x+.5, origin.floor+.05, z+.5, 'surface');
   return cell?.structure?.id === structure.id && (cell.flags & CELL.FLOOR) && !(cell.flags & CELL.BLOCK) ? cell : null;
  };
  const distances = new Map([[start,0]]), queue = [[Math.floor(party.x),Math.floor(party.z)]];
  for (let i=0;i<queue.length;i++) {
   const [x,z] = queue[i], cell = floor(x,z);
   if (!cell) continue;
   for (let face=0;face<FACE.length;face++) {
    if (cell.flags & wallBit(face)) continue;
    const nx=wrap(x+FACE[face][0],width), nz=wrap(z+FACE[face][1],depth), nextKey=key(nx,nz);
    if (distances.has(nextKey)) continue;
    const next=floor(nx,nz);
    if (!next || (next.flags & wallBit((face+2)%4))) continue;
    distances.set(nextKey,distances.get(key(x,z))+1);queue.push([nx,nz]);
   }
  }
  const portals = stream.portalIndex ?? (stream.chunks ?? []).filter(c=>c.ready).flatMap(c=>c.data?.portals ?? []);
  const exits = [...new Map(portals.filter(p=>p.kind==='door' && p.structureId===structure.id).map(p=>[p.id,p])).values()]
   .filter(p=>distances.has(key(p.from[0],p.from[2])))
   .map(p=>({id:`maze-exit:${p.id}`,name:'Maze exit · return outside',kind:'dungeon',position:p.from,realm:'surface',mazeExit:true,localExit:true,interior:true}));
  region={start,revision,id:structure.id,floor:origin.floor,distances,exits}; cache.set(stream,region);
 }
 const local = goal?.realm === 'surface' && Math.abs(goal.position[1]-origin.floor)<1 && region.distances.has(key(goal.position[0],goal.position[2]));
 if (local) return {exits:region.exits,goal:{...goal,interior:true}};
 const score = exit => region.distances.get(key(exit.position[0],exit.position[2])) + (goal ? Math.hypot(wrappedDelta(goal.position[0],exit.position[0],width),wrappedDelta(goal.position[2],exit.position[2],depth)) : 0);
 const exit = region.exits.reduce((best,item)=>!best || score(item)<score(best)?item:best,null);
 return {exits:region.exits,goal:exit};
}

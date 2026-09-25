import {mazeNavigation} from './maze_navigation.js';
import {CELL, FACE, wallBit} from '../world/format.js';

const components = new WeakMap();

/** A temporary map waypoint; the saved quest/location selection stays intact. */
export function navigationWaypoint(state) {
 const goal = state?.interactions?.navigationGoal() ?? null;
 if (state?.realm !== 'cave') {
  const maze = mazeNavigation(state, goal);
  return maze ? maze.goal : goal;
 }
 const stream = state.exploration, party = state.party.position;
 if (!stream?.cellAt) return null;
 const width = stream.world?.sizeX ?? 1600, depth = stream.world?.sizeZ ?? 1600;
 const wrap = (n, size) => ((n % size) + size) % size;
 const key = (x, y, z) => `${wrap(Math.floor(x), width)}:${Math.floor(y)}:${wrap(Math.floor(z), depth)}`;
 const start = key(party.x, party.y, party.z);
 const revision = (stream.chunks ?? []).map(c => `${c.x}:${c.z}:${c.ready}:${c.revision}`).join('|');
 let component = components.get(stream);
 if (!component || component.revision !== revision || !component.cells.has(start)) {
  const cells = new Set(), queue = [[Math.floor(party.x), Math.floor(party.y), Math.floor(party.z)]];
  const floor = (x,y,z) => {
   const cell = stream.cellAt(wrap(x,width)+.5,y+.05,wrap(z,depth)+.5,'cave');
   return cell && (cell.flags & CELL.FLOOR) && !(cell.flags & CELL.BLOCK) ? cell : null;
  };
  if (floor(...queue[0])) cells.add(start);
  for (let i = 0; i < queue.length && cells.size; i++) {
   const [x,y,z] = queue[i], cell = floor(x,y,z);
   for (let face = 0; face < FACE.length; face++) {
    if (cell.flags & wallBit(face)) continue;
    const nx = wrap(x+FACE[face][0],width), nz = wrap(z+FACE[face][1],depth), nextKey = key(nx,y,nz);
    if (cells.has(nextKey)) continue;
    const next = floor(nx,y,nz);
    if (!next || (next.flags & wallBit((face+2)%4))) continue;
    cells.add(nextKey); queue.push([nx,y,nz]);
   }
  }
  component = {revision, cells};
  components.set(stream, component);
 }
 if (goal?.realm === 'cave' && component.cells.has(key(...goal.position))) return goal;
 const portals = stream.portalIndex ?? (stream.chunks ?? []).filter(c => c.ready).flatMap(c => c.data?.portals ?? []);
 const exit = portals.find(p => p.kind === 'cave' && component.cells.has(key(...p.to)));
 return exit ? {id: exit.id, name: 'Cave exit · return to surface', kind: 'cave', position: exit.to, realm: 'cave', caveExit: true} : null;
}

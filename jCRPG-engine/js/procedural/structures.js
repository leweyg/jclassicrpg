/** Render-independent semantic generators; derived from jCRPG (LGPL-3.0+).
 * web-baked-v1 normalizes Java's mirrored face labels to N=-Z/E=+X and
 * closes house corner leaks. These adaptations are versioned, not parity claims.
 */
import {CELL as C, FACE, wallBit, doorBit} from '../world/format.js';
import {buildMaze, solveMaze} from './maze.js';
import {javaMix} from '../frozen_world.js';
import {isGround} from './infrastructure.js';
export function volume(size){return {size,cells:new Uint16Array(size[0]*size[1]*size[2]),windows:new Uint8Array(size[0]*size[1]*size[2]),props:[],portals:[]};}
export const indexOf=(v,x,y,z)=>x+v.size[0]*(z+v.size[2]*y);
export function flagsAt(v,x,y,z){return x<0||y<0||z<0||x>=v.size[0]||y>=v.size[1]||z>=v.size[2]?0:v.cells[indexOf(v,x,y,z)];}
function set(v,x,y,z,flags){if(x<0||y<0||z<0||x>=v.size[0]||y>=v.size[1]||z>=v.size[2])throw Error('Semantic write outside volume');v.cells[indexOf(v,x,y,z)]=flags;}
export function buildHouse(spec){
  const [sx,sy,sz]=spec.size,roofed=spec.kind==='WoodenHouse',levels=Math.max(1,sy-(roofed?1:0));
  if(sx<4||sz<4||sy<1)throw Error(`${spec.id}: house below minimum dimensions`);
  const v=volume([sx,levels,sz]);v.roofHeight=levels;v.roofKind=spec.kind;
  for(let y=0;y<levels;y++)for(let z=0;z<sz;z++)for(let x=0;x<sx;x++){
    let flags=C.FLOOR|C.CEILING|C.INTERIOR,windows=0;
    for(let f=0;f<4;f++)if((f===0&&z===0)||(f===1&&x===sx-1)||(f===2&&z===sz-1)||(f===3&&x===0)){
      const offset=f%2?z:x,door=y===0&&((f===1&&z===1)||(['BrickHouse','SandIgloo','Igloo'].includes(spec.kind)&&f===3&&z===1));
      flags|=door?doorBit(f):wallBit(f);if(!door&&offset%3===2)windows|=1<<f;
    }
    if(y<levels-1&&x===(y%2?2:1)&&z===2)flags=(flags&~C.CEILING)|C.STAIRS;
    if(y>0&&x===((y-1)%2?2:1)&&z===2)flags&=~C.FLOOR;
    set(v,x,y,z,flags);v.windows[indexOf(v,x,y,z)]=windows;
  }
  v.portals.push({id:spec.id+':front',kind:'door',from:[sx+0.3,0,1.5],to:[sx-0.5,0,1.5]});
  if(levels>1)for(let y=0;y<levels-1;y++)v.portals.push({id:spec.id+':stairs:'+y,kind:'stairs',from:[(y%2?2:1)+0.5,y,2.5],to:[(y%2?2:1)+0.5,y+1,1.5]});
  v.props.push({kind:'bookcase',position:[1.5,0,0.2],rotation:0});
  return v;
}
export function buildDungeon(spec){
  const [sx,,sz]=spec.size,w=sx-8,d=sz-8;
  if(w<3||d<3)throw Error('Dungeon must reserve four-cell border');
  const maze=buildMaze(spec.origin.reduce((a,b)=>a+b,0)|0,w,d),v=volume([sx,3,sz]);v.maze=maze;
  const entrance=10;
  for(let z=0;z<sz;z++)for(let x=0;x<sx;x++){
    const edge=x===0||z===0||x===sx-1||z===sz-1;
    const inner=x>=4&&z>=4&&x<sx-4&&z<sz-4;
    const m=inner?maze.cells[x-4+w*(z-4)]:0;
    let flags=C.FLOOR|(edge?0:C.INTERIOR),faces=0,doors=0;
    if(inner){if(m&1)faces|=C.N;if(m&2)faces|=C.W;if(m&8)doors|=C.DN;if(m&16)doors|=C.DW;}
    else if(!edge){
      // Four-cell monumental shell. Outer colonnade, inner transition wall,
      // four fixed passages at offset 10; inner maze shares the same edges.
      if(x===3&&z!==entrance)faces|=C.E;
      if(x===sx-4&&z!==entrance)faces|=C.W;
      if(z===3&&x!==entrance)faces|=C.S;
      if(z===sz-4&&x!==entrance)faces|=C.N;
      if((x<4||x>=sx-4)&&z===entrance)faces|=C.N|C.S;
      if((z<4||z>=sz-4)&&x===entrance)faces|=C.E|C.W;
      if((x===1||x===sx-2||z===1||z===sz-2)&&((x+z)%2===0))v.props.push({kind:'pillar',position:[x+0.5,0,z+0.5],rotation:0});
    }
    set(v,x,0,z,flags|faces|doors);
    if(!edge){set(v,x,1,z,C.INTERIOR|faces|(doors?(doors>>4):0)|((m&4)?0:C.CEILING));if(!(m&4))set(v,x,2,z,C.FLOOR);}
  }
  for(const [from,to] of [[[10.5,0,0.5],[10.5,0,4.5]],[[10.5,0,sz-0.5],[10.5,0,sz-4.5]],[[0.5,0,10.5],[4.5,0,10.5]],[[sx-0.5,0,10.5],[sx-4.5,0,10.5]]])v.portals.push({id:spec.id+':entrance:'+v.portals.length,kind:'door',from,to});
  // Java storage selection; independently audit reachability before emission.
  let needed=Math.max(1,Math.trunc((sx+sz)/2)),attempt=0;const used=new Set();
  while(needed>0&&attempt<=1000){const x=javaMix(spec.origin[0]+spec.origin[1],sx+sz,needed+attempt)%w,z=javaMix(spec.origin[0]+spec.origin[1],sx+sz,needed+1+attempt)%d,key=x+w*z;
    if((maze.cells[key]&192)&&!used.has(key)){used.add(key);needed--;v.props.push({kind:'chest',position:[x+4.5,0,z+4.5],rotation:0,id:spec.id+':chest:'+key});}else attempt++;}
  if(solveMaze(maze).visited.length!==w*d)throw Error(`${spec.id}: disconnected maze`);
  return v;
}
export function buildStructure(spec){
  if(spec.kind==='SimpleDungeonPart')return buildDungeon(spec);
  if(!isGround(spec.kind))return buildHouse(spec);
  const [sx,,sz]=spec.size,v=volume([sx,1,sz]);v.cells.fill(C.FLOOR);
  if(spec.kind==='PavedStorageAreaGround')for(const [kind,x,z] of [['crate',1,1],['barrel',2,2],['basket',1,2]])v.props.push({kind,position:[x+0.5,0,z+0.5],rotation:0,id:spec.id+':'+kind});
  return v;
}
/** Symmetric face graph used for build validation and runtime collision. */
export function canCross(a,b,face){return !(a&C.BLOCK)&&!(b&C.BLOCK)&&!(a&wallBit(face))&&!(b&wallBit((face+2)%4));}
export function reachableVolume(v,start){
  const queue=[start],seen=new Set([start.join(':')]);
  for(let i=0;i<queue.length;i++){const [x,y,z]=queue[i],a=flagsAt(v,x,y,z);for(let f=0;f<4;f++){
    const nx=x+FACE[f][0],nz=z+FACE[f][1],b=flagsAt(v,nx,y,nz),key=[nx,y,nz].join(':');
    if(b&&(b&C.FLOOR)&&canCross(a,b,f)&&!seen.has(key)){seen.add(key);queue.push([nx,y,nz]);}
  }}return seen;
}

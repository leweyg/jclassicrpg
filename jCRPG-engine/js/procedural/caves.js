/** Coordinate-stable Cave occupancy. Terrain/entrance adapter is web-baked-v1.
 * Do not carve disconnected components: the original occupancy is not a maze.
 */
import {javaMix} from '../frozen_world.js';
import {CELL as C, FACE, wallBit} from '../world/format.js';
export function caveOccupancy(world,x,y,z){
  const c=world.layers.Cave,ry=y-c.worldGroundLevel;
  if(x<0||z<0||x>=world.sizeX||z>=world.sizeZ||ry<0||y>=c.worldHeight||ry>=c.maxLevels*c.levelSize||!c.cells[Math.floor(z/40)*40+Math.floor(x/40)])return 0;
  const height=Math.trunc(world.heightAt(x,z));
  if(height<=y+1)return 0;
  let per=javaMix(x,Math.trunc(ry/c.levelSize),z,world.seed)%100;
  if((z%40%c.ENTRANCE__DISTANCE===2||x%40%c.ENTRANCE__DISTANCE===2)&&ry===c.ENTRANCE__LEVEL)per+=20;
  if(per<c.density)return C.BLOCK|C.INTERIOR;
  const floor=ry%c.levelSize===0,ceiling=ry%c.levelSize===c.levelSize-1||ry===height-c.worldGroundLevel-1||ry===height-c.worldGroundLevel-2;
  return C.INTERIOR|(floor?C.FLOOR:0)|(ceiling?C.CEILING:0);
}
/** Bake only cells beneath the saved cave footprint; border walls close missing
 * neighbors. Entrances reference an existing open component, never carve it. */
export function bakeCaveBlock(world,bx,bz){
  const c=world.layers.Cave,y=c.worldGroundLevel,cells=[],open=new Map();
  for(let z=bz;z<bz+40;z++)for(let x=bx;x<bx+40;x++){
    const f=caveOccupancy(world,x,y,z);if((f&C.FLOOR)&&!(f&C.BLOCK))open.set(`${x}:${z}`,f);
  }
  for(const [key,base] of open){const [x,z]=key.split(':').map(Number);let flags=base|C.CEILING;
    for(let face=0;face<4;face++){const [dx,dz]=FACE[face],f=caveOccupancy(world,x+dx,y,z+dz);if(!(f&C.FLOOR)||(f&C.BLOCK))flags|=wallBit(face);}
    cells.push({x,y,z,flags,height:c.levelSize,kind:'cave'});
  }
  // Surface slope detection uses the existing web terrain, not Java cube kinds.
  const seen=new Set(),portals=[];
  for(const key of open.keys()){
    if(seen.has(key))continue;const component=[key];seen.add(key);
    for(let i=0;i<component.length;i++){const [x,z]=component[i].split(':').map(Number);for(const [dx,dz]of FACE){const n=`${x+dx}:${z+dz}`;if(open.has(n)&&!seen.has(n)){seen.add(n);component.push(n);}}}
    if(component.length<12)continue;
    let best=null,score=Infinity;
    for(const k of component){const [x,z]=k.split(':').map(Number);if(x%8!==2&&z%8!==2)continue;
      const h=world.heightAt(x,z);if(h<score){score=h;best=[x+0.5,y,z+0.5];}}
    if(best)portals.push({id:`cave:${bx}:${bz}:${portals.length}`,kind:'cave',from:[best[0],world.heightAt(best[0],best[2]),best[2]],to:best,componentSize:component.length});
  }
  return {cells,portals};
}

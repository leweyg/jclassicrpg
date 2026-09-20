/** Abstract/Grown/BigBlock/DefaultInfrastructure ports. LGPL-3.0-or-later. */
import {javaMix} from '../frozen_world.js';
import {GENERATOR_VERSION} from '../world/format.js';
export const isGround = type => /Ground$/.test(type);
export const minimumHeight = type => type==='WoodenHouse'?2:type==='SimpleDungeonPart'?3:1;
export const districtSeed = d => Number(BigInt.asIntN(32,BigInt(d.soilNumericId)+BigInt(d.blockStart[0]+d.blockStart[1])));
export function placementMasks(d, world) {
  const n=Math.trunc(d.blockSize/4),water=new Uint8Array(n*n),cave=new Uint8Array(n*n),c=world.layers.Cave;
  for(let bz=0;bz<n;bz++)for(let bx=0;bx<n;bx++)for(let z=0;z<4;z++)for(let x=0;x<4;x++){
    const wx=d.blockStart[0]+bx*4+x,wz=d.blockStart[1]+bz*4+z,i=bx+n*bz;
    if(world._oceanAt(wx,wz)||world._riverAt(wx,wz))water[i]=1;
    if(c.cells[Math.floor(wz/40)*40+Math.floor(wx/40)]&&world.heightAt(wx,wz)<=c.worldGroundLevel+c.sizeY)cave[i]=1;
  }return {water,cave};
}
function likely(r,types,x,z,n){
  const center=Math.trunc(n/2),dist=Math.trunc(Math.trunc((Math.abs(center-x)+Math.abs(center-z))/2)/center)*100;
  let best=1000,result=types[0];
  types.forEach((t,i)=>{r=javaMix(r,i,0)%100;const delta=Math.abs(r-50-dist);if(delta<best){best=delta;result=t;}});return result;
}
export function grownLayout(d,masks={}){
  const n=Math.trunc(d.blockSize/4),occupied=new Uint8Array(n*n),seed=districtSeed(d),list=[];
  let x=Math.trunc(n/2),z=x,fixed=0;
  const blocked=(bx,bz)=>occupied[bx+n*bz]||masks.water?.[bx+n*bz]; // Java Economic defaults to WaterChecker only.
  for(let j=0;j<Math.trunc(d.savedInhabitantNumber/6)+1;j++){
    const used=list.length,ground=used%2===0,types=ground?d.groundTypes:d.residenceTypes;
    let delta=0,r=0,found=false,type;
    while(true){r=javaMix((seed+j+delta++)|0,j+1,j+2)%100;
      let bx=x,bz=z;if(r<33)bx++;else if(r<66)bz++;else if(r<99)bx--;else bz--;
      bx=Math.abs(bx)%n;bz=Math.abs(bz)%n;type=likely(r,types,bx,bz,n);
      if(blocked(bx,bz)){if(delta>10)break;continue;}x=bx;z=bz;found=true;break;
    }
    if(!found){delta=0;while(true){x=(x+1)%n;z=(z+1)%n;type=likely(r,types,x,z,n);if(!blocked(x,z))break;if(++delta>10)break;}}
    if(delta>=11)break;
    const p={type,relOrigoX:x*4,relOrigoY:0,relOrigoZ:z*4,sizeX:4,sizeY:Math.trunc((used%5)/4)+1,sizeZ:4};
    if(!ground){p.sizeY=Math.max(p.sizeY,minimumHeight(type));const f=d.fixedInfrastructure[fixed++];if(f){for(const k of ['relOrigoX','relOrigoY','relOrigoZ','sizeX','sizeY','sizeZ'])if(f[k]!==-1)p[k]=f[k];if(f.type)p.type=f.type;p.ownerMemberId=f.ownerMemberId;}}
    list.push(p);
    for(let px=p.relOrigoX;px<p.relOrigoX+p.sizeX;px++)for(let pz=p.relOrigoZ;pz<p.relOrigoZ+p.sizeZ;pz++){
      if(px<0||pz<0||px>=d.blockSize||pz>=d.blockSize)throw Error(`${d.id}: fixed infrastructure exceeds allocation`);
      occupied[Math.trunc(px/4)+n*Math.trunc(pz/4)]=1;
    }
  }return list;
}
export function defaultLayout(d,masks={}){
  const n=d.blockSize/4,max=n*n,seed=districtSeed(d),order=new Int32Array(max).fill(-1);
  let left=max-1;while(left>=0){let r=(javaMix((seed+left)|0,left+1,left+2)%1000)%max;
    for(let sticky=5;sticky>=0&&left>=0;sticky--){let leap=false;while(order[r]!==-1){if(!leap&&sticky%2===0){r=(r+n-2)%max;leap=true;}else r=(r+1)%max;}order[r]=left--;}}
  const occupied=new Uint8Array(max),list=[{type:d.groundTypes[0],relOrigoX:0,relOrigoY:0,relOrigoZ:4*Math.trunc(n/2),sizeX:d.blockSize,sizeY:1,sizeZ:4}];
  for(let x=0;x<n;x++)occupied[x+n*Math.trunc(n/2)]=1;
  let cursor=0;for(let j=0;j<Math.trunc(d.savedInhabitantNumber/6)+1;j++){let count=-1;const old=cursor;do{const c=order[cursor];cursor=(cursor+1)%max;if(cursor===old)break;if(!occupied[c]&&!masks.water?.[c]){count=c;break;}}while(true);if(count<0)break;
    occupied[count]=1;list.push({type:d.residenceTypes[0],relOrigoX:4*(count%n),relOrigoY:0,relOrigoZ:4*Math.trunc(count/n),sizeX:4,sizeY:minimumHeight(d.residenceTypes[0]),sizeZ:4});}return list;
}
export function buildDistrict(d,world){
  const masks=placementMasks(d,world);
  const layout=d.kind==='DungeonDistrict'?[{type:'SimpleDungeonPart',relOrigoX:3,relOrigoY:3,relOrigoZ:3,sizeX:d.blockSize-3,sizeY:3,sizeZ:d.blockSize-3}]:grownLayout(d,masks);
  return layout.map((p,i)=>{
    const x=d.blockStart[0]+p.relOrigoX,z=d.blockStart[1]+p.relOrigoZ;let min=-1,max=-1;
    for(let xx=x;xx<=x+p.sizeX;xx++)for(let zz=z;zz<=z+p.sizeZ;zz++){const h=Math.trunc(world.heightAt(xx,zz));max=Math.max(max,h);if(min===-1||h<min)min=h;}
    const y=min+Math.trunc((max-min)/2);
    return {id:`${d.id}:structure:${i}`,districtId:d.id,townId:d.townId,kind:p.type,origin:[x,y,z],size:[p.sizeX,isGround(p.type)?max-y+2:p.sizeY,p.sizeZ],groundLevel:0,ownerMemberId:p.ownerMemberId??null,generationVersion:GENERATOR_VERSION};
  });
}

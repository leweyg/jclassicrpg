/** Port of MazeTool.java (LGPL-3.0-or-later). Array order is x + width*z.
 * Preserve the ground-type overwrite, float division, recursion order and doors.
 */
import {javaMix} from '../frozen_world.js';
export const MAZE = Object.freeze({H:1,V:2,OPEN:4,DH:8,DV:16,G1:32,G2:64,G3:128});
export function buildMaze(seed, width, depth, allClosed=false) {
  if (!Number.isInteger(width)||!Number.isInteger(depth)||width<0||depth<0||width>512||depth>512) throw Error('Invalid maze dimensions');
  const cells=new Uint8Array(width*depth);
  const maxLevel=Math.trunc(width/Math.exp(Math.fround(width/50)));
  function divide(level,x0,z0,x1,z1) {
    const sx=x1-x0, sz=z1-z0;
    if(sx<3||sz<3)return;
    const h1=javaMix(seed,x0+z0,sx+sz),h2=javaMix((seed+1)|0,x0+z0,sx+sz);
    const open=h1%3===1&&!allClosed, ground=sx>4||sz>4?64:32;
    for(let z=z0;z<z1;z++)for(let x=x0;x<x1;x++)cells[x+width*z]=(cells[x+width*z]&27)|ground|(open?4:0);
    const dx=Math.min(Math.max(2,h1%sx),sx-2),dz=Math.min(Math.max(2,h2%sz),sz-2);
    for(let z=z0;z<z1;z++)cells[x0+dx+width*z]|=2;
    for(let x=x0;x<x1;x++)cells[x+width*(z0+dz)]|=1;
    const cut=(x,z,h)=>{if(x<0||z<0||x>=width||z>=depth)throw Error('Legacy negative maze remainder');const i=x+width*z;cells[i]=(cells[i]&~(h?1:2))|(h?8:16);};
    if(h1%4!==2)cut(x0+h1%dx,z0+dz,true);
    if(h1%4!==3)cut(x0+dx+h1%(sx-dx),z0+dz,true);
    if(h1%4!==0)cut(x0+dx,z0+h2%dz,false);
    if(h1%4!==1)cut(x0+dx,z0+dz+h2%(sz-dz),false);
    if(level<maxLevel){divide(level+1,x0,z0,x0+dx,z0+dz);divide(level+1,x0+dx,z0,x1,z0+dz);divide(level+1,x0+dx,z0+dz,x1,z1);divide(level+1,x0,z0+dz,x0+dx,z1);}
  }
  divide(0,0,0,width,depth);return {width,depth,cells};
}
/** Division lines lie at the west/north boundary of each cell. */
export function mazeCanMove(maze,x,z,nx,nz){
  const {width:w,depth:d,cells:c}=maze;
  if(Math.abs(nx-x)+Math.abs(nz-z)!==1||Math.min(x,z,nx,nz)<0||x>=w||nx>=w||z>=d||nz>=d)return false;
  return nx!==x?!(c[Math.max(x,nx)+w*z]&2):!(c[x+w*Math.max(z,nz)]&1);
}
export function solveMaze(maze,start=[0,0],goal=null){
  const {width:w,depth:d}=maze, prev=new Int32Array(w*d).fill(-1), queue=[start[0]+w*start[1]];
  if(!w||!d||queue[0]<0||queue[0]>=w*d)return {visited:[],path:[]};
  prev[queue[0]]=queue[0];
  for(let i=0;i<queue.length;i++){const p=queue[i],x=p%w,z=Math.floor(p/w);for(const [dx,dz] of [[0,-1],[1,0],[0,1],[-1,0]]){
    const nx=x+dx,nz=z+dz,n=nx+w*nz;if(mazeCanMove(maze,x,z,nx,nz)&&prev[n]===-1){prev[n]=p;queue.push(n);}
  }}
  const path=[];if(goal){let n=goal[0]+w*goal[1];if(prev[n]>=0){while(prev[n]!==n){path.push([n%w,Math.floor(n/w)]);n=prev[n];}path.push(start);path.reverse();}}
  return {visited:queue,path};
}

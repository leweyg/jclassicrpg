import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {roofPiece} from '../../../scripts/roof_layout.mjs';
const vertices = Object.fromEntries(['roofEdge','roofCorner','roof'].map(name=>[name,
 fs.readFileSync(new URL(`../../worlds/seed0/v2/assets/${name}.obj`,import.meta.url),'utf8').split('\n').filter(l=>l.startsWith('v ')).map(l=>l.split(/\s+/).slice(1).map(Number))]));

test('actual roof meshes rise toward the interior on every edge and corner',()=>{
 for(const [width,depth] of [[4,4],[6,9]])for(let z=0;z<depth;z++)for(let x=0;x<width;x++){
  const p=roofPiece(x,z,width,depth),vs=vertices[p.asset];
  if(p.asset==='roof'){
   assert.ok(vs.every(v=>Math.abs(v[1]+p.heightOffset-0.55)<1e-6));continue;
  }
  const high=vs.filter(v=>v[1]>0.54),low=vs.filter(v=>v[1]<0.02);
  const center=points=>points.reduce((sum,v)=>[sum[0]+v[0]/points.length,sum[1]+v[2]/points.length],[0,0]);
  const h=center(high),l=center(low),dx=h[0]-l[0],dz=h[1]-l[1];
  const rx=Math.cos(p.rotation)*dx+Math.sin(p.rotation)*dz,rz=-Math.sin(p.rotation)*dx+Math.cos(p.rotation)*dz;
  if(x===0)assert.ok(rx>0.2,'west rises east');
  if(x===width-1)assert.ok(rx<-.2,'east rises west');
  if(z===0)assert.ok(rz>0.2,'north rises south');
  if(z===depth-1)assert.ok(rz<-.2,'south rises north');
 }
});

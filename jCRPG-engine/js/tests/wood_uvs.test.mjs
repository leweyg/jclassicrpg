import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../../../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const asset='jCRPG-engine/worlds/seed0/v2/assets/';
function obj(text){const vertices=[],uvs=[],faces=[];for(const line of text.split('\n')){const [kind,...rest]=line.trim().split(/\s+/);if(kind==='v')vertices.push(rest.map(Number));if(kind==='vt')uvs.push(rest.slice(0,2).map(Number));if(kind==='f')faces.push(rest.map(t=>t.split('/').slice(0,2).map(Number)));}return {vertices,uvs,faces};}
test('bookcase uses its authored wood texture and retains geometry and authored UVs',()=>{
 const source=obj(read('media/models/inside/furniture/bookcase.obj')),baked=obj(read(asset+'bookcase.obj'));
 assert.match(read('media/models/inside/furniture/bookcase.mtl'),/map_Kd wooden1.jpg/);
 assert.match(read(asset+'bookcase.mtl'),/map_Kd textures\/wooden1.png/);
 assert.equal(source.vertices.length,baked.vertices.length);assert.equal(source.faces.length,baked.faces.length);
 const bounds=[0,1,2].map(i=>[Math.min(...source.vertices.map(v=>v[i])),Math.max(...source.vertices.map(v=>v[i]))]);
 source.vertices.forEach((v,index)=>v.forEach((n,i)=>{
  const size=[.65,.8,.18][i],expected=(n-bounds[i][0])/(bounds[i][1]-bounds[i][0])*size-(i===1?0:size/2);
  assert.ok(Math.abs(expected-baked.vertices[index][i])<.000001);
 }));
 assert.deepEqual(baked.uvs.slice(0,source.uvs.length),source.uvs);
 let repaired=0;
 source.faces.forEach((face,index)=>{
  const result=baked.faces[index];assert.deepEqual(result.map(v=>v[0]),face.map(v=>v[0]));
  face.forEach(([vertex,uv],i)=>{assert.ok(Number.isInteger(result[i][1])&&baked.uvs[result[i][1]-1]);if(uv)assert.equal(result[i][1],uv);});
  if(face.some(v=>!v[1])){
   repaired++;const uv=result.map(v=>baked.uvs[v[1]-1]);
   const area=Math.abs(uv.reduce((s,p,i)=>{const q=uv[(i+1)%uv.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;
   assert.ok(area>1e-8,'new UVs must cover texture area');
  }
 });
 assert.equal(repaired,54);
});
test('procedural wood surfaces use a tiling texture rather than a packed atlas',()=>{
 for(const name of ['floor','door','stairs'])assert.match(read(asset+name+'.mtl'),/map_Kd textures\/wood1_d.png/);
 assert.match(read(asset+'chest.mtl'),/map_Kd textures\/Wood_Tex_General.png/);
 for(const texture of ['wooden1.png','wood1_d.png'])assert.ok(fs.readFileSync(new URL(asset+'textures/'+texture,root)).equals(fs.readFileSync(new URL('media/textures/models/low_png/'+texture,root))));
});

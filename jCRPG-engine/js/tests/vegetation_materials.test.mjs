import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {inflateSync} from 'node:zlib';
import * as THREE from '../threejs/three.module.js';
import {loadObjModel,parseObj} from '../obj_mtl_loader.js';
import {vegetationTexture} from '../vegetation_materials.js';
const root=new URL('../../../',import.meta.url);
const species=[['tree','pine_bb1.obj'],['tree','great_pine_bb1.obj'],['tree','palm_02.obj'],['tree','high_bb_1.obj'],['bush','Bush_01.obj'],['bush','bush1.obj'],['bush','bush2.obj']];
test('all vegetation loads existing textures with masked, depth-writing materials and correct atlas regions',async()=>{
 const fetch=globalThis.fetch,load=THREE.TextureLoader.prototype.load,requests=[];
 globalThis.fetch=async(input,options)=>{const url=new URL(input,root);requests.push(url.pathname);assert.ok(fs.existsSync(url),`Missing texture/model request: ${url}`);return new Response(options?.method==='HEAD'?'':fs.readFileSync(url));};
 THREE.TextureLoader.prototype.load=function(url,onLoad){assert.ok(fs.existsSync(new URL(url,root)));const texture=new THREE.Texture();texture.name=url;onLoad(texture);return texture;};
 try{
  for(const [dir,file]of species){
   const model=await loadObjModel(`media/models/${dir}`,file,{vegetation:true});
   const source=parseObj(fs.readFileSync(new URL(`media/models/${dir}/${file}`,root),'utf8'));
   for(const mesh of model.children){const m=mesh.material;
    assert.ok(m.map,`${file}: ${m.name} needs a texture`);assert.equal(m.transparent,false);assert.equal(m.blending,THREE.NoBlending);assert.equal(m.depthWrite,true);assert.equal(m.opacity,1);assert.equal(m.alphaTest,.5);
    const override=vegetationTexture(file,m.name);
    if(override){assert.ok(m.map.name.endsWith(override.texture));const original=source.groupsByMaterial.get(m.name).uvs,baked=mesh.geometry.attributes.uv.array;
     for(let i=0;i<baked.length;i++)assert.ok(Math.abs(baked[i]-(i%2?original[i]:(original[i]+override.column)/override.columns))<1e-6);
    }
   }
  }
  assert.ok(!requests.some(p=>p.endsWith('/pine_1.png')||p.endsWith('/low_png/bush_leave.png')));
  assert.ok(requests.some(p=>p.endsWith('/common/bush_leave.png')));
 }finally{globalThis.fetch=fetch;THREE.TextureLoader.prototype.load=load;}
});
// Decode shipped RGBA PNGs to prove alphaTest has real leaf silhouettes to mask.
function alphaRange(file){
 const b=fs.readFileSync(new URL(file,root));assert.equal(b[24],8);assert.equal(b[25],6);
 const width=b.readUInt32BE(16),height=b.readUInt32BE(20),parts=[];
 for(let i=8;i<b.length;){const len=b.readUInt32BE(i);if(b.toString('ascii',i+4,i+8)==='IDAT')parts.push(b.subarray(i+8,i+8+len));i+=len+12;}
 const raw=inflateSync(Buffer.concat(parts)),stride=width*4;let previous=new Uint8Array(stride),offset=0,min=255,max=0;
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<height;y++){const filter=raw[offset++],row=new Uint8Array(stride);
  for(let x=0;x<stride;x++){const left=x>=4?row[x-4]:0,up=previous[x],corner=x>=4?previous[x-4]:0;row[x]=raw[offset++]+[0,left,up,Math.floor((left+up)/2),paeth(left,up,corner)][filter];if(x%4===3){min=Math.min(min,row[x]);max=Math.max(max,row[x]);}}
  previous=row;
 }
 return {min,max};
}
test('every leaf texture contains alpha below and above the mask threshold',()=>{
 for(const file of ['low_png/continental_pine_atlas.png','low_png/continental_deciduous_atlas.png','low_png/high_2.png','low_png/Palm_Tex_Bake_01.png','common/bush_leave.png']){
  const {min,max}=alphaRange('media/textures/models/'+file);assert.ok(min<128&&max>=128,file);
 }
});

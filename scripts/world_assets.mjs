/** Build immutable Y-up, cell-calibrated shared OBJ assets and terrain GLBs. */
import fs from 'node:fs';
import path from 'node:path';
const catalog={
 wall:['media/models/external/House_01_wall.obj',[1,1,.1],'Wall_Tex_Bake_01.png'],
 window:['media/models/external/House_01_window.obj',[1,1,.1],'Window_Tex_Bake_03.png'],
 roofCorner:['media/models/external/House_01_roof_corner.obj',[1,.55,1],'RoofCorner_Tex_Bake_01.png'],
 roofEdge:['media/models/external/House_01_roof_straight.obj',[1,.55,1],'Roof_Tex_Bake_01.png'],
 mazeWall:['media/sides/maze_wall_thick.obj',[1,1,.12],'maze_stone_2.png'],
 caveWall:['media/models/ground/wall_cave.obj',[1,1,.16],'cave_wall.png'],
 pillar:['media/models/external/maze/NormalTest_Pillar_01.obj',[.22,2,.22],'maze_stone_2.png'],
 chest:['media/models/item/storage/chest.obj',[.55,.38,.4],'Wood_Tex_General.png'],
 barrel:['media/models/item/storage/barrel.obj',[.35,.5,.35],null],
 crate:['media/models/item/storage/crate.obj',[.4,.4,.4],null],
 basket:['media/models/item/storage/basket.obj',[.35,.3,.35],null],
 bookcase:['media/models/inside/furniture/bookcase.obj',[.65,.8,.18],'Wood_Tex_General.png'],
 caveEntrance:['media/models/ground/cave_entrance.obj',[2,1.8,1],'cave_ent.png'],
 shrine:['media/models/external/shrine/shrine1.obj',[3,2,3],null],
 brickWall:['media/models/external/House_01_wall.obj',[1,1,.1],'desertbrick1.png'],
 hutWall:['media/models/external/House_01_wall.obj',[1,1,.1],'hut.png'],
 iglooWall:['media/models/external/House_01_wall.obj',[1,1,.1],'igloo.png'],
 sandWall:['media/models/external/House_01_wall.obj',[1,1,.1],'sandigloo1.png'],
};
const colors={floor:[.57,.46,.32],stone:[.48,.47,.42],caveFloor:[.29,.29,.27],street:[.52,.49,.41],roof:[.36,.25,.15],door:[.42,.27,.13],stairs:[.49,.34,.19]};
export function bakeAssets(root,out){
 const dir=path.join(out,'assets');fs.mkdirSync(dir,{recursive:true});const report={};
 function write(name,vertices,faces,uv=[],texture=null,color=[.8,.8,.8]){
  const obj=[`mtllib ${name}.mtl`,`o ${name}`,...vertices.map(v=>'v '+v.map(n=>Number(n.toFixed(6))).join(' ')),...uv.map(v=>'vt '+v.join(' ')),`usemtl ${name}`,...faces.map(f=>'f '+f.join(' '))].join('\n')+'\n';
  fs.writeFileSync(path.join(dir,name+'.obj'),obj);
  let tex='';if(texture){const target=path.join(root,'media/textures/models/low_png',texture);if(fs.existsSync(target)){fs.mkdirSync(path.join(dir,'textures'),{recursive:true});fs.copyFileSync(target,path.join(dir,'textures',texture));tex='map_Kd textures/'+texture+'\n';}}
  fs.writeFileSync(path.join(dir,name+'.mtl'),`newmtl ${name}\nKd ${color.join(' ')}\nd 1\n${tex}`);
  report[name]={source:catalog[name]?.[0]??'procedural',bounds:[...Array.from({length:3},(_,i)=>Math.min(...vertices.map(v=>v[i]))),...Array.from({length:3},(_,i)=>Math.max(...vertices.map(v=>v[i])))],texture:texture??null,axis:'Y',anchor:'floor-center'};
 }
 for(const [name,[file,size,declaredTexture]] of Object.entries(catalog)){
  let texture=declaredTexture;
  if(!texture){const mtl=path.join(root,file.replace(/\.obj$/,'.mtl'));if(fs.existsSync(mtl)){const match=fs.readFileSync(mtl,'utf8').match(/map_Kd\s+(.+)/);if(match)texture=match[1].trim().split(/[\\/]/).pop().replace(/\.[^.]+$/,'.png');}}
  const text=fs.readFileSync(path.join(root,file),'utf8'),vs=[],uv=[],faces=[];
  for(const l of text.split(/\r?\n/)){if(l.startsWith('v '))vs.push(l.trim().split(/\s+/).slice(1).map(Number));else if(l.startsWith('vt '))uv.push(l.trim().split(/\s+/).slice(1,3).map(Number));else if(l.startsWith('f '))faces.push(l.trim().split(/\s+/).slice(1).map(t=>t.split('/').slice(0,2).join('/')));}
  const mins=[0,1,2].map(i=>Math.min(...vs.map(v=>v[i]))),maxs=[0,1,2].map(i=>Math.max(...vs.map(v=>v[i])));
  // Asset-specific raw pivots vary; retain Y-up faces, normalize a documented
  // bounding box once offline, never independently at runtime/editor import.
  const transformed=vs.map(v=>v.map((n,i)=>(n-mins[i])/(maxs[i]-mins[i]||1)*size[i]-(i===1?0:size[i]/2)));
  write(name,transformed,faces,uv,texture);
 }
 for(const name of ['floor','stone','street','caveFloor','roof'])write(name,[[-.5,0,-.5],[.5,0,-.5],[.5,0,.5],[-.5,0,.5]],[['1/1','4/4','3/3','2/2']],[[0,0],[1,0],[1,1],[0,1]],name==='floor'?'Wood_Tex_General.png':name==='roof'?'Roof_Tex_Bake_01.png':name==='caveFloor'?'cave_ground.png':name==='street'?'stone.png':'maze_stone_2.png',colors[name]);
 for(const [name,texture] of [['iglooRoof','igloo.png'],['sandRoof','sandigloo1.png'],['hutRoof','hut.png']]){
  const vs=[],uv=[],faces=[],rings=6,segments=16;
  for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
   const angle=i/segments*Math.PI*2,rad=name==='hutRoof'?1-j/rings:Math.cos(j/rings*Math.PI/2),height=name==='hutRoof'?j/rings:Math.sin(j/rings*Math.PI/2);
   vs.push([Math.cos(angle)*rad*2,height,Math.sin(angle)*rad*2]);uv.push([i/segments,j/rings]);
  }
  for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const a=1+i+(segments+1)*j,b=a+segments+1;faces.push([a,b,b+1,a+1].map(n=>n+'/'+n));}write(name,vs,faces,uv,texture);
 }
 function boxes(name,boxes,texture){const vs=[],faces=[];for(const [x,y,z,sx,sy,sz]of boxes){const start=vs.length;for(const [dx,dy,dz]of [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]])vs.push([x+dx*sx,y+dy*sy,z+dz*sz]);for(const f of [[1,4,3,2],[5,6,7,8],[1,2,6,5],[4,8,7,3],[1,5,8,4],[2,3,7,6]])faces.push(f.map((i,n)=>(i+start)+'/'+(n+1)));}write(name,vs,faces,[[0,0],[1,0],[1,1],[0,1]],texture,colors[name]);}
 boxes('door',[[-.5,0,-.07,.12,1,.14],[.38,0,-.07,.12,1,.14],[-.38,.85,-.07,.76,.15,.14]],'Wood_Tex_General.png');
 boxes('stairs',Array.from({length:6},(_,i)=>[-.5,0,-.5+i/6,1,(i+1)/6,1/6]),'Wood_Tex_General.png');
 fs.writeFileSync(path.join(dir,'catalog.json'),JSON.stringify(report,null,2)+'\n');return report;
}
export function terrainGLB(heights,types,holes=[]){
 const positions=[],colors=[],indices=[],side=17,omit=new Set(holes),palette=[[.61,.66,.47],[.42,.53,.32],[.57,.57,.52],[.22,.49,.67],[.67,.60,.46],[.75,.70,.56]];
 for(let z=0;z<side;z++)for(let x=0;x<side;x++){const i=x+side*z;positions.push(x*2,heights[i],z*2);colors.push(...(palette[types[i]]??palette[0]));}
 for(let z=0;z<16;z++)for(let x=0;x<16;x++){if(omit.has(x+16*z))continue;const a=x+17*z;indices.push(a,a+18,a+1,a,a+17,a+18);}
 const arrays=[new Float32Array(positions),new Float32Array(colors),new Uint16Array(indices)],views=[];let length=0;
 const chunks=arrays.map(a=>{const b=Buffer.from(a.buffer);views.push({buffer:0,byteOffset:length,byteLength:b.length});length+=Math.ceil(b.length/4)*4;return Buffer.concat([b,Buffer.alloc((4-b.length%4)%4)]);});
 const json={asset:{version:'2.0',generator:'jCRPG offline terrain'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{primitives:[{attributes:{POSITION:0,COLOR_0:1},indices:2,material:0}]}],materials:[{pbrMetallicRoughness:{metallicFactor:0,roughnessFactor:1},doubleSided:true}],buffers:[{byteLength:length}],bufferViews:views,accessors:[{bufferView:0,componentType:5126,count:289,type:'VEC3',min:[0,Math.min(...heights),0],max:[32,Math.max(...heights),32]},{bufferView:1,componentType:5126,count:289,type:'VEC3'},{bufferView:2,componentType:5123,count:indices.length,type:'SCALAR'}]};
 const raw=Buffer.from(JSON.stringify(json)),j=Buffer.concat([raw,Buffer.alloc((4-raw.length%4)%4,32)]),bin=Buffer.concat(chunks),header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(12+8+j.length+8+bin.length,8);jh.writeUInt32LE(j.length);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);return Buffer.concat([header,jh,j,bh,bin]);
}

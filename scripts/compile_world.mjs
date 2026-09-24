#!/usr/bin/env node
/** Offline seed-0 compiler. Run: node scripts/compile_world.mjs [--out PATH]
 * Generated files are immutable inputs to the browser; no generator is imported
 * by the baked runtime. Manifest is written last, after validation.
 */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';import {gzipSync,brotliCompressSync,constants} from 'node:zlib';
import {FrozenWorld} from '../jCRPG-engine/js/frozen_world.js';
import {WorldStream} from '../jCRPG-engine/js/world_stream.js';
import {buildDistrict,isGround} from '../jCRPG-engine/js/procedural/infrastructure.js';
import {buildStructure,indexOf} from '../jCRPG-engine/js/procedural/structures.js';
import {bakeCaveBlock} from '../jCRPG-engine/js/procedural/caves.js';
import {CELL as C,FACE,wallBit,doorBit,FORMAT_VERSION,GENERATOR_VERSION,WORLD_ID,scene,chunkKey,chunkFile,canonicalJSON,validateScene} from '../jCRPG-engine/js/world/format.js';
import {validateSchema} from './validate_schema.mjs';
import {dialogueTemplateGroups} from './dialogue_templates.mjs';
import {compileInteractions} from './compile_interactions.mjs';
import {INTERACTION_VERSION} from '../jCRPG-engine/js/interactions/format.js';
import {bakeAssets,terrainGLB} from './world_assets.mjs';
import {roofPiece} from './roof_layout.mjs';
import {extractWoodenHousePrefab} from './house_prefab.mjs';
import {extractSharedPrefabs} from './shared_prefabs.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=process.argv.indexOf('--out'),destination=arg>=0?path.resolve(process.argv[arg+1]):path.join(root,'jCRPG-engine/worlds/seed0/v2');
fs.mkdirSync(path.dirname(destination),{recursive:true});
const out=fs.mkdtempSync(path.join(path.dirname(destination),'.jcrpg-compile-'));
// Remove this build's staging copy on failure. Successful publication renames
// it away; recovery backups are deliberately retained if restoring one fails.
process.on('exit',()=>{fs.rmSync(out,{recursive:true,force:true});});
const data=JSON.parse(fs.readFileSync(path.join(root,'jCRPG-engine/json/frozen_world.json'))),world=new FrozenWorld(data);
const schema=JSON.parse(fs.readFileSync(path.join(root,'jCRPG-engine/js/world/scene.schema.json')));
const hash=b=>createHash('sha256').update(b).digest('hex');
const chunks=Array.from({length:2500},(_,i)=>({x:i%50,z:Math.floor(i/50),nodes:[],cells:[],structures:[],structureMap:new Map(),portals:[],objects:[]}));
const getChunk=(x,z)=>chunks[Math.floor(z/32)*50+Math.floor(x/32)];
const structures=[],portals=[],ids=new Set();
function emit(asset,x,y,z,rotation=0,scale=[1,1,1],extra={}){
 if(x<0||z<0||x>=1600||z>=1600)throw Error(`Visual outside world: ${x},${z}`);
 const c=getChunk(x,z);c.nodes.push({name:asset,position:[x-c.x*32,y,z-c.z*32],rotation:[0,rotation,0],scale,source:`../assets/${asset}.obj`,userData:{jcrpg:extra}});
}
function addCell(x,y,z,flags,s,height=1,windows=0){
 const c=getChunk(x,z);let si=c.structureMap.get(s.id);if(si===undefined){si=c.structures.length;c.structures.push(s);c.structureMap.set(s.id,si);}c.cells.push([x-c.x*32,y,z-c.z*32,flags,si,height,windows]);
}
function emitFaces(x,y,z,flags,windows,kind,height,extra){
 const cave=kind==='cave',maze=kind==='SimpleDungeonPart',ground=isGround(kind);
 if(flags&C.FLOOR)emit(cave?'caveFloor':maze?'stone':ground?'street':'floor',x+.5,y+.015,z+.5,0,[1,1,1],extra);
 if(flags&C.CEILING)emit(cave?'caveFloor':maze?'stone':'floor',x+.5,y+height,z+.5,0,[1,1,1],{...extra,ceiling:true});
 for(let f=0;f<4;f++)if(flags&(wallBit(f)|doorBit(f))){const door=!!(flags&doorBit(f)),asset=door?'door':cave?'caveWall':maze?'mazeWall':kind==='Hut'?'hutWall':kind==='Igloo'?'iglooWall':kind==='SandIgloo'?'sandWall':kind==='BrickHouse'?'brickWall':windows&(1<<f)?'window':'wall';const dx=FACE[f][0],dz=FACE[f][1];
   // Assign seam faces to their cell's chunk, not the next one. An epsilon
   // affects ownership only, never the visible transform or collision boundary.
   const px=x+.5+dx*.49999,pz=z+.5+dz*.49999;
   emit(asset,px,y,pz,f%2?Math.PI/2:0,[1,height,1],extra);
 }
 if(flags&C.STAIRS)emit('stairs',x+.5,y,z+.5,Math.PI,[1,1,1],extra);
}
console.log('Generating saved districts and semantic volumes…');
for(const d of data.districts){
 for(const s of buildDistrict(d,world)){
  if(ids.has(s.id))throw Error('Duplicate structure ID '+s.id);ids.add(s.id);structures.push(s);
  const v=buildStructure(s),[ox,oy,oz]=s.origin;
  for(let y=0;y<v.size[1];y++)for(let z=0;z<v.size[2];z++)for(let x=0;x<v.size[0];x++){
   const i=indexOf(v,x,y,z),flags=v.cells[i];if(!flags)continue;
   addCell(ox+x,oy+y,oz+z,flags,s,1,v.windows[i]);
   emitFaces(ox+x,oy+y,oz+z,flags,v.windows[i],s.kind,1,{structureId:s.id,realm:'surface'});
  }
  if(v.roofHeight&&['Hut','Igloo','SandIgloo'].includes(s.kind)){emit(s.kind==='Hut'?'hutRoof':s.kind==='Igloo'?'iglooRoof':'sandRoof',ox+s.size[0]/2,oy+v.roofHeight,oz+s.size[2]/2,0,[s.size[0]/4,1,s.size[2]/4],{structureId:s.id,roof:true,realm:'surface'});}
  else if(v.roofHeight){for(let z=0;z<s.size[2];z++)for(let x=0;x<s.size[0];x++){
    const roof=roofPiece(x,z,s.size[0],s.size[2]);
    emit(roof.asset,ox+x+.5,oy+v.roofHeight+roof.heightOffset,oz+z+.5,roof.rotation,[1,1,1],{structureId:s.id,roof:true,realm:'surface'});
  }}
  for(const p of v.props){const position=p.position.map((n,i)=>n+s.origin[i]);emit(p.kind,...position,p.rotation,[1,1,1],{structureId:s.id,objectId:p.id??null,realm:'surface'});
    if(p.id)getChunk(position[0],position[2]).objects.push({id:p.id,kind:p.kind,position});}
  for(const p of v.portals){const q={...p,structureId:s.id,from:p.from.map((n,i)=>n+s.origin[i]),to:p.to.map((n,i)=>n+s.origin[i]),realm:'surface'};portals.push(q);}
 }
}
for(const l of data.landmarks.filter(l=>l.kind==='RoadShrine')){
 const s={id:`shrine:${l.id}:${l.x}:${l.z}`,kind:'RoadShrine',origin:[l.x,l.y,l.z],size:[l.sizeX,l.sizeY,l.sizeZ],generationVersion:GENERATOR_VERSION};structures.push(s);
 for(let z=0;z<l.sizeZ;z++)for(let x=0;x<l.sizeX;x++){addCell(l.x+x,l.y,l.z+z,C.FLOOR,s);emit('stone',l.x+x+.5,l.y+.02,l.z+z+.5,0,[1,1,1],{structureId:s.id,realm:'surface'});}
 emit('shrine',l.x+l.sizeX/2,l.y,l.z+l.sizeZ/2,0,[1,1,1],{structureId:s.id,realm:'surface'});
}
console.log('Baking natural cave components and entrance links…');
let caveCells=0;
for(let bz=0;bz<40;bz++)for(let bx=0;bx<40;bx++)if(world.layers.Cave.cells[bx+bz*40]){
 const b=bakeCaveBlock(world,bx*40,bz*40),s={id:`cave:${bx}:${bz}`,kind:'cave',origin:[bx*40,42,bz*40],size:[40,2,40],generationVersion:GENERATOR_VERSION};
 for(const c of b.cells){caveCells++;addCell(c.x,c.y,c.z,c.flags,s,c.height);emitFaces(c.x,c.y,c.z,c.flags,0,'cave',c.height,{realm:'cave',structureId:s.id});}
 for(const p of b.portals){portals.push(p);emit('caveEntrance',p.from[0],p.from[1],p.from[2],0,[1,1,1],{realm:'surface',portalId:p.id});}
}
// Duplicate small portal metadata into both endpoint chunks, never visual nodes.
for(const p of portals){const keys=new Set();for(const pos of [p.from,p.to]){const c=getChunk(pos[0],pos[2]);if(!keys.has(c)){keys.add(c);c.portals.push(p);}}}
fs.mkdirSync(path.join(out,'chunks/meshes'),{recursive:true});fs.mkdirSync(path.join(out,'regions'),{recursive:true});
const assets=bakeAssets(root,out),files={},totals={raw:0,gzip:0,brotli:0},compression={params:{[constants.BROTLI_PARAM_QUALITY]:4}};
function write(file,value){if(file.endsWith('.scene.json'))validateSchema(value,schema);const bytes=Buffer.isBuffer(value)?value:Buffer.from(canonicalJSON(value));fs.writeFileSync(path.join(out,file),bytes);const desc={url:file,byteLength:bytes.length,sha256:hash(bytes),gzipBytes:gzipSync(bytes).length,brotliBytes:brotliCompressSync(bytes,compression).length};for(const [key,value]of Object.entries({raw:desc.byteLength,gzip:desc.gzipBytes,brotli:desc.brotliBytes}))totals[key]+=value;files[file]=desc;return desc;}
fs.mkdirSync(path.join(out,'interactions'),{recursive:true});
console.log('Compiling interactions, characters and cultural arcs…');
const interactions=compileInteractions({data,world,chunks,structures,portals,emit});
write('assets/wooden-house.scene.json',extractWoodenHousePrefab(chunks,structures));
const shared=extractSharedPrefabs(chunks,structures);
for(const [name,prefab] of shared.prefabs)write('assets/'+name,prefab);
write('shared-models.json',shared.report);
validateSchema(interactions.content,JSON.parse(fs.readFileSync(path.join(root,'jCRPG-engine/js/interactions/content.schema.json'))));
const catalogs={};
for(const [key,records] of Object.entries(interactions.content))catalogs[key]=write('interactions/'+key+'.json',records);
interactions.report.catalogBytes=Object.values(catalogs).reduce((s,d)=>({raw:s.raw+d.byteLength,gzip:s.gzip+d.gzipBytes,brotli:s.brotli+d.brotliBytes}),{raw:0,gzip:0,brotli:0});
// Runtime loads navigation contracts globally and prose only when opened.
const records={dialogues:{},missions:{}};
for(const record of interactions.content.missions)records.missions[record.id]=write('interactions/missions-'+Buffer.from(record.id).toString('base64url')+'.json',record);
for(const group of dialogueTemplateGroups(interactions.content)){
 if(group.instances.length===1){const {id}=group.instances[0];records.dialogues[id]=write('interactions/dialogues-'+Buffer.from(id).toString('base64url')+'.json',interactions.content.dialogues.find(d=>d.id===id));continue;}
 const template=write('interactions/generic-dialogue-'+hash(canonicalJSON(group.template)).slice(0,12)+'.json',group.template);
 for(const {id,parameters} of group.instances)records.dialogues[id]={template,parameters};
}

const runtimeCatalogs={...catalogs,
 dialogues:write('interactions/dialogue-index.json',interactions.content.dialogues.map(d=>d.id==='dialogue:default:resident'?d:({id:d.id,start:d.start,nodes:{[d.start]:{text:'Loading conversation…',choices:[]}}}))),
 missions:write('interactions/mission-index.json',interactions.content.missions.map(({summary,...m})=>m))};
const interactionManifest=write('interactions/manifest.json',{schemaVersion:2,contentVersion:INTERACTION_VERSION,catalogs,runtimeCatalogs,records});
write('actors.json',data.actors);write('scenario.json',data.scenario);write('interactions/ownership.json',interactions.ownership);
const stream=new WorldStream(world),sample=stream.chunks[0],allFloor=new Map();
for(const s of structures)for(let z=s.origin[2]-1;z<=s.origin[2]+s.size[2];z++)for(let x=s.origin[0]-1;x<=s.origin[0]+s.size[0];x++)allFloor.set(`${(x+1600)%1600}:${(z+1600)%1600}`,s.origin[1]);
console.log(`Writing 2,500 chunks (${structures.length} structures; ${caveCells} cave cells)…`);
const chunkDescriptors={};
for(const c of chunks){
 sample.x=c.x;sample.z=c.z;stream._fill(sample);
 for(let z=0;z<17;z++)for(let x=0;x<17;x++){const h=allFloor.get(`${(c.x*32+x*2)%1600}:${(c.z*32+z*2)%1600}`);if(h!==undefined)sample.heights[x+17*z]=h;}
 const vegetation=[];for(let i=0;i<sample.plantCount;i++){const p=Array.from(sample.vegetation.slice(i*6,i*6+6));if(!allFloor.has(`${Math.floor(c.x*32+p[0])}:${Math.floor(c.z*32+p[2])}`))vegetation.push(...p);}
 const file=chunkFile(c.x,c.z),terrainFile=`chunks/meshes/${file.replace('.scene.json','.glb')}`;
 write(terrainFile,terrainGLB(sample.heights,sample.types));
 const payload={key:chunkKey(c.x,c.z),chunk:[c.x,c.z],bounds:[c.x*32,0,c.z*32,c.x*32+32,80,c.z*32+32],generatorVersion:GENERATOR_VERSION,
  terrain:{heights:sample.heights,types:sample.types,climates:sample.climates,vegetation},
  collision:{encoding:'x-y-z-flags-structure-height-windows',structures:c.structures,cells:c.cells},
  interactions:c.interactions,navigation:{encoding:'symmetric-faces-v1'},portals:c.portals,objects:c.objects};
 const doc=scene('seed0_'+file,[{name:'terrain',source:'./meshes/'+path.basename(terrainFile),userData:{jcrpg:{kind:'terrain'}}},...c.nodes],payload);
 // Validate gameplay coordinates, dimensions, known sources before publishing.
 for(const row of c.cells)if(row[0]<0||row[0]>=32||row[2]<0||row[2]>=32||!c.structures[row[4]])throw Error('Invalid semantic fragment '+file);
 for(const n of c.nodes)if(n.source!=='../assets/wooden-house.scene.json'&&!shared.prefabs.has(path.basename(n.source))&&!assets[path.basename(n.source,'.obj')])throw Error('Unknown visual asset '+n.source);
 validateScene(doc);chunkDescriptors[payload.key]=write('chunks/'+file,doc);
}
for(let rz=0;rz<10;rz++)for(let rx=0;rx<10;rx++){
 const children=[];for(let z=0;z<5;z++)for(let x=0;x<5;x++)children.push({name:`chunk_${x}_${z}`,position:[x*32,0,z*32],source:'../chunks/'+chunkFile(rx*5+x,rz*5+z)});
 write(`regions/r${String(rx).padStart(3,'0')}_${String(rz).padStart(3,'0')}.scene.json`,scene(`region_${rx}_${rz}`,children,{region:[rx,rz]}));
}
write('calibration.scene.json',scene('Architecture asset calibration',Object.keys(assets).map((asset,i)=>({name:asset,position:[(i%6)*5,40,Math.floor(i/6)*5],source:`./assets/${asset}.obj`,userData:{jcrpg:{assetId:asset}}})),{kind:'calibration'}));
write('fixture.scene.json',scene('Format fixture',[{name:'floor',position:[.5,40,.5],source:'./assets/floor.obj'},{name:'door',position:[1,40,.5],rotation:[0,Math.PI/2,0],source:'./assets/door.obj'},{name:'stairs',position:[.5,40,1.5],source:'./assets/stairs.obj'}],{kind:'fixture',portals:[{id:'fixture:stairs',kind:'stairs',from:[.5,40,1.5],to:[1.5,41,1.5]}]}));
const mapTypes=new Uint8Array(400*400);for(let z=0;z<400;z++)for(let x=0;x<400;x++)mapTypes[x+400*z]=world.typeAt(x*4,z*4);
const indexes={interactions:interactionManifest,map:write('map.json',{side:400,step:4,types:mapTypes}),districts:write('district-index.json',data.districts),towns:write('towns.json',data.towns),structures:write('structures.json',structures),portals:write('portals.json',portals)};
const perLocation=(x,z)=>{let bytes=0;for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const d=chunkDescriptors[chunkKey(Math.floor(x/32)+dx,Math.floor(z/32)+dz)];bytes+=d.gzipBytes;}return bytes;};
const report={formatVersion:FORMAT_VERSION,interactions:interactions.report,generatorVersion:GENERATOR_VERSION,sourceSha256:data.xmlSha256,districts:data.districts.length,structures:structures.length,dungeons:structures.filter(s=>s.kind==='SimpleDungeonPart').length,caveCells,caveEntrances:portals.filter(p=>p.kind==='cave').length,chunks:2500,regions:100,bytes:totals,
 locationGzipBytes:{spawn:perLocation(data.spawn.x,data.spawn.z),town:perLocation(...data.districts.find(d=>d.kind==='SimpleDistrict').center),dungeon:perLocation(...data.districts.find(d=>d.kind==='DungeonDistrict').center),cave:perLocation(portals.find(p=>p.kind==='cave').from[0],portals.find(p=>p.kind==='cave').from[2])},
 validation:{semanticBounds:true,uniqueStructureIds:true,mazeConnectivity:true,knownAssets:true,javaParity:'24 hash vectors and 80 complete maze grids match unmodified Java; district/house/cave cube parity not yet certified',mobileGPU:'requires device profiling'},
 deviations:['Existing web terrain/water adapter; not exact Java surface parity.','Normalized house perimeter corners and face conventions.','Cave entrance links use web surface slopes; occupancy is not carved.','Cave floors use bounded two-cell presentation with closed boundary walls.','Roof pieces are calibrated to closed semantic ceilings.', 'Hut/igloo/brick variants use assembled semantic walls and distinct textured roofs; whole-building legacy mesh parity remains unverified.', ...interactions.report.deviations]};
write('validation-report.json',report);
const assetHashes=[];
function assetFiles(dir){for(const name of fs.readdirSync(dir).sort()){const file=path.join(dir,name);if(fs.statSync(file).isDirectory())assetFiles(file);else assetHashes.push([path.relative(out,file),hash(fs.readFileSync(file))]);}}
assetFiles(path.join(out,'assets'));
const assetVersion=hash(canonicalJSON(assetHashes));
write('manifest.json',{formatVersion:FORMAT_VERSION,worldId:WORLD_ID,generatorVersion:GENERATOR_VERSION,assetPackVersion:assetVersion,seed:0,sizeX:1600,sizeY:80,sizeZ:1600,chunkSize:32,wrapX:true,wrapZ:true,sourceSha256:data.xmlSha256,spawn:data.spawn,files:indexes,chunks:chunkDescriptors});
// Publish only a fully validated build. Never remove a hand-authored directory.
if(fs.existsSync(destination)){
 const old=path.join(destination,'manifest.json');
 if(!fs.existsSync(old)||JSON.parse(fs.readFileSync(old)).worldId!==WORLD_ID)throw Error('Refusing to replace an unrecognized output directory: '+destination);
 const backup=out+'-previous';fs.renameSync(destination,backup);
 try{fs.renameSync(out,destination);}catch(error){fs.renameSync(backup,destination);throw error;}
 fs.rmSync(backup,{recursive:true});
}else fs.renameSync(out,destination);
console.log(JSON.stringify(report,null,2));

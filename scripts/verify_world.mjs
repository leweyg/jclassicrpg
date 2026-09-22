#!/usr/bin/env node
/** Check all built scene references, semantic seams and byte reproducibility.
 * Pass a second build directory to compare every artifact byte-for-byte. */
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {validateScene} from '../jCRPG-engine/js/world/format.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dir=path.resolve(process.argv[2]??path.join(root,'jCRPG-engine/worlds/seed0/v2')),other=process.argv[3]&&path.resolve(process.argv[3]);
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));let scenes=0,references=0,cells=0,files=0;
function walk(folder){for(const name of fs.readdirSync(folder).sort()){const file=path.join(folder,name);if(fs.statSync(file).isDirectory()){walk(file);continue;}files++;const bytes=fs.readFileSync(file),relative=path.relative(dir,file);
 if(other&&!bytes.equals(fs.readFileSync(path.join(other,relative))))throw Error('Non-reproducible artifact: '+relative);
 if(name.endsWith('.scene.json')){const s=JSON.parse(bytes),d=validateScene(s);scenes++;const visit=nodes=>{for(const n of nodes){if(n.source){references++;const p=path.resolve(path.dirname(file),n.source);if(!fs.existsSync(p))throw Error('Missing source '+p);}if(n.children)visit(n.children);}};visit(s.children);
  if(d.collision){cells+=d.collision.cells.length;for(const row of d.collision.cells)if(row[0]<0||row[0]>=32||row[2]<0||row[2]>=32||!d.collision.structures[row[4]])throw Error('Invalid fragment in '+relative);}
  if(d.key){const desc=manifest.chunks[d.key];if(bytes.length!==desc.byteLength||createHash('sha256').update(bytes).digest('hex')!==desc.sha256)throw Error('Manifest mismatch '+relative);}
 }
}}
walk(dir);
// Match all four terrain seam edges, including the toroidal world seam.
for(let z=0;z<50;z++)for(let x=0;x<50;x++){
 const read=(x,z)=>JSON.parse(fs.readFileSync(path.join(dir,manifest.chunks[`${x%50}:${z%50}`].url))).userData.jcrpg.terrain.heights;
 const a=read(x,z),east=read(x+1,z),south=read(x,z+1);
 for(let i=0;i<17;i++){if(a[16+17*i]!==east[17*i])throw Error(`East terrain seam ${x}:${z}`);if(a[272+i]!==south[i])throw Error(`South terrain seam ${x}:${z}`);}
}
console.log(JSON.stringify({files,scenes,references,cells,terrainSeams:5000,byteReproducible:!!other},null,2));

import {validateAnchor} from '../interactions/format.js';
/** Single shared contract for the offline compiler and static runtime.
 * Coordinates are legacy world cells (one render unit); models use half the
 * original two-unit cube size. Bounds are half-open. Face order is N,E,S,W.
 */
export const FORMAT_VERSION = 2;
export const GENERATOR_VERSION = 'web-baked-v2';
export const WORLD_ID = 'seed0-web-v2';
export const CHUNK_SIZE = 32;
export const WORLD_SIZE = 1600;
export const FACE = Object.freeze([[0,-1],[1,0],[0,1],[-1,0]]);
export const CELL = Object.freeze({ FLOOR:1, CEILING:2, N:4, E:8, S:16, W:32,
  DN:64, DE:128, DS:256, DW:512, STAIRS:1024, INTERIOR:2048, BLOCK:4096 });
export const wallBit = face => 4 << face;
export const doorBit = face => 64 << face;
export const canonical = n => ((n % 50) + 50) % 50;
export const chunkKey = (x,z) => `${canonical(x)}:${canonical(z)}`;
export const chunkFile = (x,z) => `x${String(canonical(x)).padStart(3,'0')}_z${String(canonical(z)).padStart(3,'0')}.scene.json`;
export function scene(name, children = [], data = {}) {
  return { name, userData:{jcrpg:{schemaVersion:FORMAT_VERSION,worldId:WORLD_ID,...data}}, children,
    metadata:{version:0.2,type:'lewcid_object',camera:data.kind==='fixture'?{position:[4,43,6],rotation:[-.4,.5,0]}:data.region?{position:[80,160,220],rotation:[-.6,0,0]}:data.kind==='calibration'?{position:[12,56,36],rotation:[-.5,0,0]}:{position:[16,65,48],rotation:[-0.5,0,0]}} };
}
export function validateScene(s, expectedKey) {
  const d = s?.userData?.jcrpg;
  if (s?.metadata?.type !== 'lewcid_object' || s.metadata.version !== 0.2 ||
      d?.schemaVersion !== FORMAT_VERSION || d.worldId !== WORLD_ID || !Array.isArray(s.children)) throw Error('Unsupported world scene');
  if (expectedKey && d.key !== expectedKey) throw Error(`Chunk identity mismatch: ${d.key} / ${expectedKey}`);
  if (s.children.length > 100000) throw Error('Scene node limit exceeded');
  let count=0;
  function visit(nodes,depth=0){if(depth>12)throw Error('Scene depth limit exceeded');for (const n of nodes) {
    if(!n||typeof n!=='object'||++count>100000)throw Error('Invalid scene node');
    for(const k of Object.keys(n))if(!['name','position','rotation','rotation_degrees','scale','source','children','userData'].includes(k))throw Error('Unknown scene node field '+k);
    for (const key of ['position','rotation','rotation_degrees','scale']) if (n[key] &&
      (!Array.isArray(n[key]) || n[key].length!==3 || !n[key].every(Number.isFinite))) throw Error(`Invalid ${key}`);
    if (n.source && (typeof n.source!=='string' || !/\.(obj|json|glb)$/.test(n.source))) throw Error('Unsupported scene source');
    if(n.children){if(!Array.isArray(n.children))throw Error('Invalid children');visit(n.children,depth+1);}
  }}
  const seen=new Set();
  for(const a of d.interactions??[]){validateAnchor(a);if(seen.has(a.id))throw Error('Duplicate interaction anchor');seen.add(a.id);if(d.bounds&&(a.position[0]<d.bounds[0]||a.position[0]>=d.bounds[3]||a.position[2]<d.bounds[2]||a.position[2]>=d.bounds[5]))throw Error('Interaction outside chunk');}
  visit(s.children);
  return d;
}
export function canonicalJSON(value) {
  return JSON.stringify(value, (_, v) => ArrayBuffer.isView(v) ? Array.from(v) : v) + '\n';
}

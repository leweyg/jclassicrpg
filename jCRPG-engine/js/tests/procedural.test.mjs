import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {FrozenWorld,javaMix} from '../frozen_world.js';
import {buildMaze,solveMaze,mazeCanMove} from '../procedural/maze.js';
import {buildDistrict,grownLayout,defaultLayout,districtSeed} from '../procedural/infrastructure.js';
import {buildHouse,buildDungeon,flagsAt,canCross} from '../procedural/structures.js';
import {caveOccupancy,bakeCaveBlock} from '../procedural/caves.js';
import {CELL as C,scene,validateScene,canonicalJSON} from '../world/format.js';
import {SaveDeltas} from '../world/save_deltas.js';
const data=JSON.parse(fs.readFileSync(new URL('../../json/frozen_world.json',import.meta.url))),world=new FrozenWorld(data);
test('normalizer resolves all saved districts, templates, NPC ownership and exact longs',()=>{
 assert.equal(data.districts.length,208);assert.equal(data.districts.filter(d=>d.kind==='DungeonDistrict').length,25);
 assert.equal(new Set(data.districts.map(d=>d.id)).size,208);
 for(const d of data.districts){assert.equal(typeof d.soilNumericId,'string');assert.ok(d.residenceTypes.length&&d.groundTypes.length);assert.ok(d.fixedInfrastructure.every(p=>p.ownerMemberId));assert.equal(d.savedInhabitantNumber%6,0);assert.ok(data.towns.some(t=>t.id===d.townId&&t.districtIds.includes(d.id)));}
 const d=data.districts[0];assert.equal(districtSeed(d),Number(BigInt.asIntN(32,BigInt(d.soilNumericId)+800n)));
});
test('maze recursion preserves walls/doors, symmetric edges and connected interiors',()=>{
 for(const size of [0,1,2,3,4,5,12,29,64,128])for(const seed of [0,1,928,2147483647]){
  const m=buildMaze(seed,size,size);assert.deepEqual(m.cells,buildMaze(seed,size,size).cells);
  for(const b of m.cells){assert.ok(!((b&1)&&(b&8)));assert.ok(!((b&2)&&(b&16)));}
  if(size)assert.equal(solveMaze(m).visited.length,size*size,`${size}/${seed}`);
  for(let z=0;z<size;z++)for(let x=0;x<size;x++)assert.equal(mazeCanMove(m,x,z,x+1,z),mazeCanMove(m,x+1,z,x,z));
 }
 assert.throws(()=>buildMaze(1,-1,4));assert.throws(()=>buildMaze(1,513,4));
});
test('grown layouts use saved tier, exact seed, fixed overrides and rejected water blocks',()=>{
 for(const d of data.districts.filter(d=>d.kind==='SimpleDistrict')){
  const layout=grownLayout(d);assert.deepEqual(layout,grownLayout(d));const occupied=new Set();
  for(const s of layout){const key=s.relOrigoX+':'+s.relOrigoZ;assert.ok(!occupied.has(key));occupied.add(key);assert.ok(s.relOrigoX>=0&&s.relOrigoX+s.sizeX<=40);assert.ok(s.relOrigoZ>=0&&s.relOrigoZ+s.sizeZ<=40);}
  assert.deepEqual(grownLayout(d,{water:new Uint8Array(100).fill(1)}),[]);
 }
 const d=data.districts.find(d=>d.kind==='SimpleDistrict');assert.equal(defaultLayout(d)[0].sizeX,40);
});
test('all 25 saved dungeons have stable output and reachable storage',()=>{
 for(const d of data.districts.filter(d=>d.kind==='DungeonDistrict')){const [s]=buildDistrict(d,world),v=buildDungeon(s);
  assert.deepEqual(s.size,[37,3,37]);assert.equal(v.portals.length,4);
  const reachable=new Set(solveMaze(v.maze).visited);
  for(const p of v.props.filter(p=>p.kind==='chest'))assert.ok(reachable.has(Math.floor(p.position[0]-4)+29*Math.floor(p.position[2]-4)));
 }
});
test('house doors pass, windows block, corners close, stairs have landings',()=>{
 const v=buildHouse({id:'house',kind:'House',size:[4,3,4]});
 assert.ok(flagsAt(v,3,0,1)&C.DE);assert.ok(!(flagsAt(v,3,0,1)&C.E));assert.ok(flagsAt(v,3,0,2)&C.E);
 assert.ok(flagsAt(v,0,0,0)&C.N);assert.ok(flagsAt(v,0,0,0)&C.W);
 assert.ok(flagsAt(v,1,0,2)&C.STAIRS);assert.ok(!(flagsAt(v,1,1,2)&C.FLOOR));
 assert.ok(canCross(flagsAt(v,3,0,1),0,1));assert.ok(!canCross(flagsAt(v,3,0,2),0,1));
});
test('cave occupancy follows density polarity and baked portals use real open components',()=>{
 const at=data.layers.find(l=>l.kind==='Cave').cells.findIndex(Boolean),b=bakeCaveBlock(world,(at%40)*40,Math.floor(at/40)*40);
 for(const c of b.cells){assert.ok(caveOccupancy(world,c.x,c.y,c.z)&C.FLOOR);assert.ok(c.flags&C.CEILING);}
 for(const p of b.portals){assert.ok(p.componentSize>=12);assert.ok(b.cells.some(c=>c.x===Math.floor(p.to[0])&&c.z===Math.floor(p.to[2])));}
 assert.equal(caveOccupancy(world,0,100,0),0);
});
test('save deltas are version checked, portable and independent of generated chunks',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)},s=new SaveDeltas(storage);s.open('maze:chest:1');s.persist({x:5,y:42,z:9},'cave');
 const loaded=new SaveDeltas(storage);assert.equal(loaded.data.openedContainers['maze:chest:1'],true);assert.equal(loaded.data.player.realm,'cave');
 assert.throws(()=>loaded.import(JSON.stringify({...loaded.data,generatorVersion:'future'})));assert.ok(!loaded.export().includes('terrain'));
});
test('scene contract is canonical and rejects invalid transforms/world identity',()=>{
 const s=scene('fixture',[{name:'wall',source:'../assets/wall.obj',position:[0,40,0]}]);assert.ok(validateScene(s));assert.equal(canonicalJSON(s),canonicalJSON(JSON.parse(canonicalJSON(s))));s.children[0].position[0]=NaN;assert.throws(()=>validateScene(s));
});

test('Java golden vectors: exact signed hash values and every byte of 80 maze grids',()=>{
 const gold=JSON.parse(fs.readFileSync(new URL('./fixtures/java-goldens.json',import.meta.url)));
 for(const [a,b,c,seed,expected]of gold.hashes)assert.equal(javaMix(a,b,c,seed),expected,`${a},${b},${c}; world seed ${seed}`);
 for(const g of gold.mazes)assert.deepEqual(Buffer.from(buildMaze(g.seed,g.width,g.depth,g.allClosed).cells),Buffer.from(g.base64,'base64'),`Java maze ${g.seed}/${g.width}/${g.allClosed}`);
});

test('nested scene transforms match Three.js XYZ composition and degree precedence',async()=>{
 const {compose,multiply}=await import('../world/transforms.js');const THREE=await import('../threejs/three.module.js');
 const parent={position:[10,3,20],rotation:[.1,.2,.3],rotation_degrees:[0,90,0],scale:[2,2,2]},child={position:[2,1,0],rotation:[.2,.3,.4],scale:[1,2,1]};
 const a=new THREE.Object3D();a.position.fromArray(parent.position);a.rotation.set(0,Math.PI/2,0);a.scale.fromArray(parent.scale);a.updateMatrix();
 const b=new THREE.Object3D();b.position.fromArray(child.position);b.rotation.set(...child.rotation);b.scale.fromArray(child.scale);b.updateMatrix();
 const expected=a.matrix.clone().multiply(b.matrix).elements,actual=multiply(compose(parent),compose(child));actual.forEach((n,i)=>assert.ok(Math.abs(n-expected[i])<1e-10));
});

test('every dungeon shell entrance reaches every generated chest',async()=>{
 const {reachableVolume}=await import('../procedural/structures.js');
 for(const d of data.districts.filter(d=>d.kind==='DungeonDistrict')){
  const [s]=buildDistrict(d,world),v=buildDungeon(s),reachable=reachableVolume(v,[10,0,0]);
  assert.equal(reachable.size,37*37);
  for(const p of v.props.filter(p=>p.kind==='chest'))assert.ok(reachable.has([Math.floor(p.position[0]),0,Math.floor(p.position[2])].join(':')));
 }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../threejs/three.module.js';
import {sceneryModelSource,bakeShrineModel} from '../scenery_models.js';

test('conductors use candles and reset controls use bare shrines, with all dependencies present',()=>{
 const source=sceneryModelSource('https://game.test/worlds/seed0/v2/assets/conductor.obj');
 assert.ok(source.endsWith('/media/models/inside/shrine_light/shrine_candles.gltf'));
 const resetSource=sceneryModelSource('https://game.test/worlds/seed0/v2/assets/resetStone.obj');
 assert.ok(resetSource.endsWith('/media/models/inside/shrine_light/shrine.gltf'));
 for(const name of ['shrine','actor_boarman']){
  const original=`https://game.test/worlds/seed0/v2/assets/${name}.obj`;
  assert.equal(sceneryModelSource(original),original);
 }
 for(const modelSource of [source,resetSource]){
 const gltf=JSON.parse(fs.readFileSync(new URL(modelSource)));
 for(const dependency of [...gltf.buffers,...gltf.images]){
  const bytes=fs.readFileSync(new URL(dependency.uri,modelSource));
  assert.ok(bytes.length>0);
  if(dependency.byteLength)assert.equal(bytes.length,dependency.byteLength);
 }
 }
});

test('shrine geometry preserves nested transforms and material while fitting the old height',()=>{
 const root=new THREE.Group(),nested=new THREE.Group();root.add(nested);
 nested.position.set(4,2,-3);nested.rotation.y=.5;
 const material=new THREE.MeshStandardMaterial(),mesh=new THREE.Mesh(new THREE.BoxGeometry(2,4,2),material);
 mesh.position.y=2;nested.add(mesh);
 const model=bakeShrineModel(root),bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3());
 assert.ok(Math.abs(bounds.min.y)<1e-6);
 assert.ok(Math.abs(bounds.max.y-.75)<1e-6);
 assert.ok(Math.abs(center.x)<1e-6&&Math.abs(center.z)<1e-6);
 assert.equal(model.children[0].material,material);
 assert.ok(model.children[0].geometry.boundingSphere.radius>0);
});

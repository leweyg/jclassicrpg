import * as THREE from '../threejs/three.module.js';
import {chunkKey} from './format.js';

const COLORS = {exit: 0xffd77a, actor: 0x80cfff, puzzle: 0xdba0ff, evidence: 0x8dffbd};

/** Debug landmarks derived from loaded cave metadata, never collision geometry. */
export class CaveMarkers {
 constructor(scene) {
  this.group = new THREE.Group();
  this.group.name = 'Cave debug markers';
  this.group.visible = false;
  scene.add(this.group);
  this.markers = new Map();
  this.materials = Object.fromEntries(Object.entries(COLORS).map(([kind, color]) => [kind, new THREE.MeshBasicMaterial({color})]));
  this.ring = new THREE.TorusGeometry(.32, .025, 6, 24);
  this.arch = new THREE.TorusGeometry(.36, .045, 6, 20, Math.PI);
  this.post = new THREE.CylinderGeometry(.045, .045, .85, 6);
  this.beacon = new THREE.OctahedronGeometry(.10);
 }
 create(kind) {
  const group = new THREE.Group(), material = this.materials[kind];
  const ring = new THREE.Mesh(this.ring, material);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .06;
  group.add(ring);
  if (kind === 'exit') {
   // Crossed arches remain recognizable from either side of a narrow passage.
   for (const angle of [0, Math.PI / 2]) {
    const frame = new THREE.Group();
    const arch = new THREE.Mesh(this.arch, material);
    arch.position.y = .9;
    frame.add(arch);
    for (const x of [-.36, .36]) {
     const post = new THREE.Mesh(this.post, material);
     post.position.set(x, .475, 0);
     frame.add(post);
    }
    frame.rotation.y = angle;
    group.add(frame);
   }
  } else {
   const beacon = new THREE.Mesh(this.beacon, material);
   beacon.position.y = 1.45;
   group.add(beacon);
   ring.scale.setScalar(.5);
  }
  return group;
 }
 sync(chunks, realm) {
  this.group.visible = realm === 'cave';
  const used = new Set();
  const add = (chunk, id, kind, position, label) => {
   if (chunkKey(Math.floor(position[0] / 32), Math.floor(position[2] / 32)) !== chunk.data.key) return;
   const key = `${chunk.x}:${chunk.z}:${id}`;
   used.add(key);
   let marker = this.markers.get(key);
   if (!marker) {
    marker = this.create(kind);
    marker.name = label;
    marker.userData = {kind, targetId: id};
    this.group.add(marker);
    this.markers.set(key, marker);
   }
   // Render the local copy of wrapped chunks, just like baked mesh instances.
   marker.position.set(chunk.x * 32 + position[0] % 32, position[1], chunk.z * 32 + position[2] % 32);
  };
  if (realm === 'cave') for (const chunk of chunks) {
   if (!chunk.ready || !chunk.data) continue;
   for (const portal of chunk.data.portals ?? []) if (portal.kind === 'cave') add(chunk, portal.id, 'exit', portal.to, 'Cave exit');
   for (const anchor of chunk.data.interactions ?? []) if (anchor.realm === 'cave' && COLORS[anchor.kind]) add(chunk, anchor.id, anchor.kind, anchor.position, anchor.prompt);
  }
  for (const [key, marker] of this.markers) if (!used.has(key)) {
   this.group.remove(marker);
   this.markers.delete(key);
  }
 }
 dispose() {
  this.group.removeFromParent();
  this.group.clear();
  this.markers.clear();
  for (const geometry of [this.ring, this.arch, this.post, this.beacon]) geometry.dispose();
  for (const material of Object.values(this.materials)) material.dispose();
 }
}

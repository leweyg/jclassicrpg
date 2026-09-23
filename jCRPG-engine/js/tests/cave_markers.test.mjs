import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../threejs/three.module.js';
import {CaveMarkers} from '../world/cave_markers.js';

const portal = {id: 'exit', kind: 'cave', from: [33.5, 60, 4.5], to: [31.5, 42, 4.5]};
const chunk = (x, portals = [portal], interactions = []) => ({x, z: 0, ready: true, data: {key: `${x}:0`, portals, interactions}});

test('cave exit is placed at the underground endpoint and duplicated portal metadata produces only one arch', () => {
 const scene = new THREE.Scene(), markers = new CaveMarkers(scene);
 markers.sync([chunk(0), chunk(1)], 'cave');
 assert.equal(markers.markers.size, 1);
 const exit = [...markers.markers.values()][0];
 assert.deepEqual(exit.position.toArray(), portal.to);
 assert.equal(exit.userData.kind, 'exit');
 assert.equal(exit.children.length, 3);
 const bounds = new THREE.Box3().setFromObject(exit);
 assert.ok(bounds.min.y >= 42 && bounds.max.y < 44, 'arch fits within the two-unit cave height');
 exit.traverse(node => {if(node.isMesh) assert.equal(node.material.depthTest, true);});
 markers.dispose(); assert.equal(scene.children.length, 0);
});
test('markers reuse objects, clear unloaded chunks, and disappear on the surface', () => {
 const markers = new CaveMarkers(new THREE.Scene()), c = chunk(0);
 markers.sync([c], 'cave'); const first = [...markers.markers.values()][0];
 markers.sync([c], 'cave'); assert.equal([...markers.markers.values()][0], first);
 c.ready = false; markers.sync([c], 'cave'); assert.equal(markers.markers.size, 0);
 c.ready = true; markers.sync([c], 'cave'); markers.sync([c], 'surface');
 assert.equal(markers.group.visible, false); assert.equal(markers.markers.size, 0);
 markers.dispose();
});
test('only supported cave interactions receive beacons, and wrapped chunks use their local world copy', () => {
 const anchors = ['actor', 'puzzle', 'evidence', 'container'].map(kind => ({id: kind, kind, realm: 'cave', position: [3.5, 42, 4.5], prompt: kind}));
 anchors.push({id: 'surface', kind: 'actor', realm: 'surface', position: [3.5, 60, 4.5]});
 const markers = new CaveMarkers(new THREE.Scene()), c = chunk(0, [], anchors);
 c.x = 50;
 markers.sync([c], 'cave'); assert.equal(markers.markers.size, 3);
 for (const marker of markers.markers.values()) assert.deepEqual(marker.position.toArray(), [1603.5, 42, 4.5]);
 assert.equal(new Set([...markers.markers.values()].map(m => m.children[0].material.color.getHex())).size, 3);
 markers.dispose();
});

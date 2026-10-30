import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../threejs/three.module.js';
import {WaypointPillar} from '../world/waypoint_pillar.js';
import {SHRINE_PARTICLE_DEFAULTS} from '../world/shrine_particles.js';

function fixture(t) {
    const scene = new THREE.Scene(), pillar = new WaypointPillar(scene);
    t.after(()=>pillar.dispose());
    const camera = new THREE.PerspectiveCamera(62,1,.1,500);
    camera.position.set(0,2,0);camera.lookAt(0,2,-100);
    const player = {x:0,y:0,z:0};
    const goal = {id:'target',position:[0,0,-120],realm:'surface'};
    const update = (time=0,realm='surface')=>pillar.update(goal,player,camera,time,realm);
    const peak = ()=>Math.max(0,...pillar.sorted.map(p=>p.alpha));
    const height = ()=>Math.max(...pillar.sorted.map(p=>p.position.y))-Math.min(...pillar.sorted.map(p=>p.position.y));
    return {scene,pillar,camera,player,goal,update,peak,height};
}

test('next target is a bounded gold pillar without requiring a nearby shrine or loaded target chunk', t => {
    const f=fixture(t);f.goal.position[2]=-700;f.update();
    assert.equal(f.pillar.mesh.visible,true);
    assert.ok(f.peak()>.8);
    assert.ok(f.pillar.sorted.length<=SHRINE_PARTICLE_DEFAULTS.beacon.samples*2);
    assert.ok(f.pillar.sorted.every(p=>p.layer===1));
    const colors=f.pillar.geometry.attributes.color;
    const gold=new THREE.Color(0xffd75a);
    for(let i=0;i<f.pillar.sorted.length*4;i++) {
        assert.ok(Math.abs(colors.getX(i)-gold.r)<1e-6);
        assert.ok(Math.abs(colors.getY(i)-gold.g)<1e-6);
        assert.ok(Math.abs(colors.getZ(i)-gold.b)<1e-6);
    }
    assert.equal(f.pillar.material.depthTest,false);
    assert.equal(f.pillar.material.fog,false);
});

test('pillar shrinks with altar scale thresholds and fades out between eight and four metres', t => {
    const f=fixture(t);f.update();const distant=f.height();
    f.goal.position[2]=-30;f.update();assert.ok(distant>f.height()*5.9);
    f.goal.position[2]=-8;f.update();const full=f.peak();
    f.goal.position[2]=-6;f.update();assert.ok(Math.abs(f.peak()/full-.5)<1e-6);
    f.goal.position[2]=-4;f.update();assert.equal(f.pillar.geometry.drawRange.count,0);
    f.goal.position[2]=-2;f.update();assert.equal(f.pillar.geometry.drawRange.count,0);
});

test('target changes, missing goals, realms and wrapped coordinates update correctly', t => {
    const f=fixture(t);f.update();
    f.goal.position=[1590,0,0];f.update();
    const maxRadius=2*SHRINE_PARTICLE_DEFAULTS.beacon.radius*1.5;
    assert.ok(f.pillar.sorted.every(p=>Math.hypot(p.position.x+10,p.position.z)<=maxRadius+1e-10));
    f.update(0,'cave');assert.equal(f.pillar.mesh.visible,false);
    f.goal.realm='cave';f.update(0,'cave');assert.equal(f.pillar.mesh.visible,true);
    f.pillar.update(null,f.player,f.camera);assert.equal(f.pillar.mesh.visible,false);
    f.update(0,'cave');assert.equal(f.pillar.mesh.visible,true);
});

test('proximity sizing uses the shortest wrapped distance on both axes', t => {
    const f=fixture(t),shape=SHRINE_PARTICLE_DEFAULTS.beacon;
    const radius=(x,z)=>Math.max(...f.pillar.sorted.map(p=>Math.hypot(p.position.x-x,p.position.z-z)));
    f.goal.position=[-10,0,-10];f.update();
    const nearRadius=radius(-10,-10);
    assert.ok(Math.abs(nearRadius-2*shape.radius*1.5)<1e-10);
    f.goal.position=[1590,0,3190];f.update();
    assert.ok(Math.abs(radius(-10,-10)-nearRadius)<1e-10);
    f.goal.position=[800,0,800];f.update();
    assert.ok(Math.abs(radius(-800,-800)-2*shape.radius*shape.farScale*.9)<1e-10);
});

test('unchanged idle views do not rebuild buffers; disposal releases the overlay', t => {
    const f=fixture(t);f.update();const positions=f.pillar.geometry.attributes.position;
    const version=positions.version;f.update();assert.equal(positions.version,version);
    f.update(.25);assert.ok(positions.version>version);
    const disposed=[];
    for(const name of ['geometry','material','texture'])f.pillar[name].addEventListener('dispose',()=>disposed.push(name));
    f.pillar.dispose();assert.deepEqual(disposed,['geometry','material','texture']);
    assert.equal(f.scene.children.length,0);
});

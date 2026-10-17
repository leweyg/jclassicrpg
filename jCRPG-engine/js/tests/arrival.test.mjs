import test from 'node:test';
import assert from 'node:assert/strict';
import {actorArrival} from '../interactions/arrival.js';

function fixture(actors = [{id:'guide',kind:'actor',realm:'surface',position:[10,40,10]}]) {
    return {world:{sizeX:1600,sizeZ:1600}, chunks:[{ready:true,data:{interactions:actors}}],
        floorAt:()=>40, canMove:()=>true, nearby:(_p,_r,_range,options)=>actors.find(options.eligible)};
}

test('arrivals stand back and face the actor, searching another side when blocked', () => {
    const stream = fixture();
    stream.canMove = (_x,_y,_z,x,z)=>z>=10;
    const {position,camera} = actorArrival(stream,{x:10,y:40,z:10},'surface');
    assert.ok(Math.abs(Math.hypot(position.x-10,position.z-10)-0.4125)<1e-9);
    assert.ok(position.z>=10);
    assert.ok(Math.abs(Math.atan2(10-position.x,10-position.z)-camera.yaw)<1e-9);
});

test('non-character destinations and actors on other floors remain unchanged', () => {
    const destination = {x:10,y:45,z:10};
    assert.deepEqual(actorArrival(fixture(),destination,'surface'),{position:destination});
    assert.deepEqual(actorArrival(fixture(),destination,'cave'),{position:destination});
});

test('blocked or out-of-sight arrivals never fall back to inside the actor', () => {
    const stream = fixture();
    stream.nearby = ()=>null;
    assert.throws(()=>actorArrival(stream,{x:10,y:40,z:10},'surface'),/No clear space/);
});

test('arrival positions wrap at world boundaries and avoid neighboring actors', () => {
    const stream = fixture([
        {id:'guide',kind:'actor',realm:'surface',position:[0,40,0]},
        {id:'neighbor',kind:'actor',realm:'surface',position:[0,40,1598.35]},
    ]);
    const {position} = actorArrival(stream,{x:0,y:40,z:0},'surface');
    assert.ok(position.x>=0 && position.x<1600 && position.z>=0 && position.z<1600);
    const delta = (a,b)=>(a-b+2400)%1600-800;
    assert.ok(Math.hypot(delta(position.x,0),delta(position.z,1598.35))>=0.9);
});

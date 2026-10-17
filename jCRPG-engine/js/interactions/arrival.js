import {wrap} from '../frozen_world.js';

/** Find visible, walkable space beside an actor instead of landing inside them. */
export function actorArrival(stream, destination, realm, yaw = 0) {
    const delta = (a, b, size) => wrap(a - b + size / 2, size) - size / 2;
    const actors = stream.chunks.flatMap(slot => slot.ready ? slot.data.interactions.filter(a => a.kind === 'actor' && a.realm === realm) : []);
    const distance = (a, p) => Math.hypot(delta(a.position[0], p.x, stream.world.sizeX), delta(a.position[2], p.z, stream.world.sizeZ));
    const actor = actors.find(a => distance(a, destination) < 0.8 && Math.abs(a.position[1] - destination.y) < 1.1);
    if (!actor) return {position:destination};
    for (const radius of [0.4125, 0.35, 0.275]) {
        for (let step = 0; step < 16; step++) {
            const angle = yaw + step * Math.PI / 8;
            const x = wrap(actor.position[0] - Math.sin(angle) * radius, stream.world.sizeX);
            const z = wrap(actor.position[2] - Math.cos(angle) * radius, stream.world.sizeZ);
            const y = stream.floorAt(x, actor.position[1], z, realm);
            const position = {x,y,z};
            if (!Number.isFinite(y) || Math.abs(y - actor.position[1]) >= 1.1) continue;
            if (actors.some(a => distance(a, position) < (a.id === actor.id ? 0.225 : 0.9) && Math.abs(a.position[1] - y) < 1.1)) continue;
            // Check body clearance and the actual interaction line of sight/range.
            if (![[0,0],[0.18,0],[-0.18,0],[0,0.18],[0,-0.18]].every(([dx,dz]) => stream.canMove(x,y,z,x+dx,z+dz,realm))) continue;
            if (!stream.nearby(position, realm, 1.8, {eligible:a=>a.id===actor.id})) continue;
            return {position, camera:{yaw:Math.atan2(delta(actor.position[0],x,stream.world.sizeX),delta(actor.position[2],z,stream.world.sizeZ)),pitch:-0.08}};
        }
    }
    throw Error('No clear space beside this character. Choose a nearby map location.');
}

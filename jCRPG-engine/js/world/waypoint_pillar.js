import {ShrineParticles} from './shrine_particles.js';

/** A single gold landmark, independent of loaded chunks and shrine proximity. */
export class WaypointPillar extends ShrineParticles {
    constructor(scene) {
        super(scene, {waypoint:true, maxShrines:1, samples:0});
        this.mesh.name = 'waypoint-pillar';
        this.mesh.renderOrder = 21;
        this.waypointSave = {shrines:{target:{activated:true}}};
        // The waypoint is an overlay like the altar beams. Preserve its true
        // bearing and apparent size beyond the world's far clipping plane.
        this.material.onBeforeCompile = shader => {
            shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>',
                '#include <project_vertex>\nif (gl_Position.w > 0.0) gl_Position.z = min(gl_Position.z, gl_Position.w * 0.999);');
        };
        this.material.customProgramCacheKey = () => 'waypoint-pillar-far-plane';
    }

    update(goal, player, camera, timeSeconds=0, realm='surface', viewportHeight=800) {
        if (!goal?.position || (goal.realm ?? 'surface') !== realm) {
            this.mesh.visible = false;
            return;
        }
        const key = JSON.stringify([goal.id, goal.position, goal.realm]);
        if (this.goalKey !== key) {
            this.goalKey = key;
            this.waypointCatalog = {shrines:{target:{position:[...goal.position]}}};
        }
        // Realm filtering above also permits local cave waypoints and exits.
        super.update(this.waypointCatalog, this.waypointSave, player, camera, timeSeconds, 'surface', viewportHeight);
    }
}

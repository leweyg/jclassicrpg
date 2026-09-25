import {MINIMAP_RADIUS,wrappedDelta} from './map_model.js';

// Fraction is measured from the map center to its edge. 0.5 matches the
// original surface visibility ring. Stop distance is in world units (~steps).
export const MINIMAP_ZOOM_DEFAULTS=Object.freeze({enabled:true,goalFraction:0.5,stopDistance:4,responseSeconds:0.18});
export function goalMapRadius(position,goal,realm,width,depth,settings=MINIMAP_ZOOM_DEFAULTS){
 const base=MINIMAP_RADIUS/(realm==='cave'||goal?.interior?3:1);
 if(!settings.enabled||!goal||goal.realm!==realm)return base;
 const distance=Math.hypot(wrappedDelta(goal.position[0],position.x,width),wrappedDelta(goal.position[2],position.z,depth));
 const fraction=Math.max(0.2,Math.min(0.85,settings.goalFraction));
 return Math.min(base,Math.max(settings.stopDistance,distance)/fraction);
}
export function easeMapRadius(current,target,elapsed,seconds){
 if(!Number.isFinite(current)||seconds<=0)return target;
 const next=target+(current-target)*Math.exp(-Math.max(0,elapsed)/seconds);
 return Math.abs(next-target)<0.01?target:next;
}

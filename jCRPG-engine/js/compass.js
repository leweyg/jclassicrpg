import {wrappedDelta} from './map_model.js';
import {cameraMapOffset} from './map_discovery.js';

export const COMPASS_RANGE = Math.PI / 2;
export const COMPASS_TICK = Math.PI / 6;
const TAU = Math.PI * 2;
const wrapAngle = angle => ((angle + Math.PI) % TAU + TAU) % TAU - Math.PI;

export function compassModel(yaw, position, goal, width, depth) {
  // Match the minimap: north is +Z and camera-right at north is -X.
  const heading = ((-yaw % TAU) + TAU) % TAU;
  const ticks = [];
  for (let i = 0; i < 12; i++) {
    const angle = wrapAngle(i * COMPASS_TICK - heading);
    if (Math.abs(angle) <= COMPASS_RANGE / 2 + 1e-10) {
      ticks.push({offset: angle / (COMPASS_RANGE / 2), label: i % 3 === 0 ? ['N','E','S','W'][i / 3] : ''});
    }
  }
  let waypoint = null;
  if (goal) {
    const dx = wrappedDelta(goal.position[0], position.x, width);
    const dz = wrappedDelta(goal.position[2], position.z, depth);
    const at = cameraMapOffset(dx, dz, yaw);
    const angle = Math.hypot(dx,dz) < .01 ? 0 : Math.atan2(at.x, -at.y);
    waypoint = {offset: Math.max(-1, Math.min(1, angle / (COMPASS_RANGE / 2))), edge: Math.abs(angle) > COMPASS_RANGE / 2, name: goal.name};
  }
  return {heading, ticks, waypoint};
}

/** Event-driven HUD strip; drawn with the map, with no extra animation loop. */
export class Compass {
  constructor(canvas) { this.canvas = canvas; }
  draw(yaw, position, goal, width, depth) {
    const canvas = this.canvas;
    if (!canvas) return;
    const model = compassModel(yaw, position, goal, width, depth);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(w * ratio), pixelHeight = Math.round(h * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) { canvas.width = pixelWidth; canvas.height = pixelHeight; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio,0,0,ratio,0,0); ctx.clearRect(0,0,w,h);
    const margin = 16, center = w/2, half = center-margin, line = 32;
    ctx.strokeStyle = '#e9d6a0'; ctx.lineWidth = 1;
    ctx.beginPath();ctx.moveTo(margin,line);ctx.lineTo(w-margin,line);ctx.stroke();
    ctx.font = 'bold 13px system-ui';ctx.textAlign = 'center';ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff1c6';
    for (const tick of model.ticks) {
      const x = center + tick.offset*half;
      ctx.beginPath();ctx.moveTo(x,line-3);ctx.lineTo(x,line+(tick.label?9:5));ctx.stroke();
      if (tick.label) {
        ctx.save();ctx.strokeStyle='#201907';ctx.lineWidth=3;
        ctx.strokeText(tick.label,x,15);ctx.fillText(tick.label,x,15);ctx.restore();
      }
    }
    // Fixed center notch, with the moving gold waypoint above the scale.
    ctx.beginPath();ctx.moveTo(center-3,line-6);ctx.lineTo(center,line-2);ctx.lineTo(center+3,line-6);ctx.stroke();
    if (model.waypoint) {
      const marker=model.waypoint,x=center+marker.offset*half,y=15;
      ctx.save();ctx.translate(x,y);ctx.fillStyle='#ffd75a';ctx.strokeStyle='#201907';ctx.lineWidth=2;
      ctx.beginPath();
      if (marker.edge) {
        ctx.scale(marker.offset<0?-1:1,1);
        ctx.moveTo(9,0);ctx.lineTo(-6,-7);ctx.lineTo(-3,0);ctx.lineTo(-6,7);
      } else {ctx.moveTo(0,-9);ctx.lineTo(7,0);ctx.lineTo(0,9);ctx.lineTo(-7,0);}
      ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    }
    canvas.setAttribute('aria-label', `Compass: ${Math.round(model.heading*180/Math.PI)%360} degrees${goal ? '. Waypoint: '+goal.name+(model.waypoint.edge ? (model.waypoint.offset<0?' to the left':' to the right') : '') : ''}`);
  }
}

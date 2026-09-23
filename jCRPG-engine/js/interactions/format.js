import {validateDialogue} from './dialogue.js';
/** Data-only interaction contract, shared by compiler, solvers and browser. */
export const INTERACTION_VERSION = 'interactions-v1';
export const KINDS = ['actor','container','shrine','puzzle','portal','evidence'];
export const STATES = ['available','active','ready-to-turn-in','completed','failed','archived'];
export const compareId = (a,b) => a < b ? -1 : a > b ? 1 : 0;
export function index(records) {
 const result = Object.create(null);
 for (const record of records) { if (!record.id || Object.hasOwn(result,record.id)) throw Error('Duplicate or missing ID: '+record.id); result[record.id]=record; }
 return result;
}
export function validateAnchor(a) {
 if (!a || !KINDS.includes(a.kind) || typeof a.id!=='string' || typeof a.targetId!=='string' || !Array.isArray(a.position) || a.position.length!==3 || !a.position.every(Number.isFinite) || !['surface','cave'].includes(a.realm) || !(a.range>0&&a.range<=8) || !Number.isFinite(a.priority)) throw Error('Invalid interaction anchor');
 return a;
}
export function validateContent(c) {
 const maps={};
 for(const key of ['actors','dialogues','missions','puzzles','shrines','containers','itemTypes','settlements','cultures','routes','goals']) maps[key]=index(c[key]??[]);
 const ref=(group,id)=>{if(!Object.hasOwn(maps[group],id))throw Error(`Missing ${group}: ${id}`);};
 for(const a of c.actors){ref('dialogues',a.dialogueId);for(const id of a.missionIds)ref('missions',id);}
 for(const m of c.missions){ref('actors',m.giverActorId);ref('actors',m.turnInActorId);for(const id of m.requires??[])ref('missions',id);for(const o of m.objectives){if(!['shrine','puzzle','evidence','commitment','actor','mission'].includes(o.kind))throw Error('Unknown objective kind');const group={shrine:'shrines',puzzle:'puzzles',actor:'actors',mission:'missions'}[o.kind];if(group)for(const id of o.targetIds)ref(group,id);}}
 const visiting=new Set(),done=new Set();function visit(id){if(visiting.has(id))throw Error('Mission dependency cycle');if(done.has(id))return;visiting.add(id);for(const dep of maps.missions[id].requires??[])visit(dep);visiting.delete(id);done.add(id);}for(const m of c.missions)visit(m.id);
 for(const d of c.dialogues)validateDialogue(d);
 for(const s of c.shrines)for(const n of s.neighbors){ref('shrines',n.id);if(!(n.cost>0))throw Error('Invalid shrine edge');}
 for(const r of c.routes){ref('settlements',r.destinationTownId);for(const id of r.shrineIds)ref('shrines',id);}
 const items=new Set();for(const item of [...c.initialInventory,...c.containers.flatMap(x=>x.items)]){ref('itemTypes',item.typeId);if(items.has(item.id))throw Error('Duplicate item instance');items.add(item.id);}
 return maps;
}

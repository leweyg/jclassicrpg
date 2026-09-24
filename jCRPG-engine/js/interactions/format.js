import {validateDialogue} from './dialogue.js';
/** Data-only interaction contract, shared by compiler, solvers and browser. */
export const INTERACTION_VERSION = 'interactions-v2';
export const KINDS = ['actor','container','shrine','puzzle','portal','evidence','fitting'];
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
 for(const key of ['actors','dialogues','missions','puzzles','shrines','containers','itemTypes','settlements','cultures','routes','goals','stories','fittings']) maps[key]=index(c[key]??[]);
 const ref=(group,id)=>{if(!Object.hasOwn(maps[group],id))throw Error(`Missing ${group}: ${id}`);};
 for(const a of c.actors){ref('dialogues',a.dialogueId);for(const id of a.missionIds)ref('missions',id);}
 for(const m of c.missions){ref('actors',m.giverActorId);ref('actors',m.turnInActorId);for(const id of m.requires??[])ref('missions',id);for(const o of m.objectives){if(!['shrine','puzzle','evidence','commitment','actor','mission','item','fitting'].includes(o.kind))throw Error('Unknown objective kind');const group={shrine:'shrines',puzzle:'puzzles',actor:'actors',mission:'missions'}[o.kind];if(group)for(const id of o.targetIds)ref(group,id);}}
 for(const m of c.missions){
  if(c.stories?.length&&!['main','side','mini'].includes(m.kind))throw Error('Invalid mission taxonomy');
  for(const id of [...(m.followUpMissionIds??[]),...(m.returnToMainMissionId?[m.returnToMainMissionId]:[])])ref('missions',id);
  if(m.kind==='main'){ref('stories',m.storyId);if(m.requires.some(id=>maps.missions[id].kind!=='main'))throw Error('Optional mission blocks main story');if(m.startMode!=='automatic')throw Error('Main chapters must start automatically');}
 }
 for(const story of c.stories??[]){
  const chapters=index(story.chapters),seen=new Set();let id=story.chapterIds[0],planned=false;
  while(id){if(seen.has(id))throw Error('Story cycle');const chapter=chapters[id];if(!chapter)throw Error('Missing chapter');seen.add(id);
   if(chapter.status==='planned')planned=true;
   else {if(planned)throw Error('Unreachable chapter start');ref('missions',chapter.missionId);const m=maps.missions[chapter.missionId];if(m.storyId!==story.id||m.chapterId!==id||chapter.exit?.completedMissionId!==m.id)throw Error('Invalid chapter mission');const previous=story.chapterIds[seen.size-2];if(previous&&(!m.requires.includes(chapters[previous].missionId)||chapter.entry?.completedChapterId!==previous))throw Error('Invalid chapter entry');}
   id=chapter.nextChapterId;
  }
  if(seen.size!==story.chapterIds.length||seen.size!==story.chapters.length||story.chapterIds.some(id=>!seen.has(id)))throw Error('Unreachable story chapter');
 }
 const visiting=new Set(),done=new Set();function visit(id){if(visiting.has(id))throw Error('Mission dependency cycle');if(done.has(id))return;visiting.add(id);for(const dep of maps.missions[id].requires??[])visit(dep);visiting.delete(id);done.add(id);}for(const m of c.missions)visit(m.id);
 for(const d of c.dialogues)validateDialogue(d);
 for(const s of c.shrines)for(const n of s.neighbors){ref('shrines',n.id);if(!(n.cost>0))throw Error('Invalid shrine edge');}
 for(const r of c.routes){ref('settlements',r.destinationTownId);for(const id of r.shrineIds)ref('shrines',id);}
 const items=new Set();for(const item of [...c.initialInventory,...c.containers.flatMap(x=>x.items)]){ref('itemTypes',item.typeId);if(items.has(item.id))throw Error('Duplicate item instance');items.add(item.id);}
 for(const m of c.missions)for(const o of m.objectives){if(o.kind==='item')for(const id of o.targetIds)if(!items.has(id))throw Error('Missing objective item');if(o.kind==='fitting')for(const id of o.targetIds)ref('fittings',id);}
 for(const f of c.fittings??[]){if(!items.has(f.itemId))throw Error('Missing fitting item');ref('missions',f.missionId);}
 return maps;
}

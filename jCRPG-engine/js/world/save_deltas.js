import {emptyInventory,normalizeInventory} from '../interactions/inventory.js';
import {WORLD_ID,GENERATOR_VERSION} from './format.js';
import {INTERACTION_VERSION,STATES} from '../interactions/format.js';
const KEY='jcrpg:'+WORLD_ID+':save', OLD_KEY='jcrpg:seed0-web-v1:save';
// Clear the legacy fallback too, so a new game cannot restore an older save.
export function resetStoredSave(storage){storage.removeItem(OLD_KEY);storage.removeItem(KEY);}
const dictionaries=['openedContainers','discoveredLocations','containers','shrines','puzzles','missions','actors','flags','evidence','commitments','settlements','mazeGenerators','shrineRoutes'];
export function emptySave(){return {saveVersion:2,worldId:WORLD_ID,generatorVersion:GENERATOR_VERSION,interactionContentVersion:INTERACTION_VERSION,player:null,inventory:emptyInventory(),...Object.fromEntries(dictionaries.map(k=>[k,{}])),lastTransaction:0,deltaRevision:0};}
function cleanJSON(value,depth=0){
 if(depth>24)throw Error('Save nesting limit exceeded');
 if(typeof value==='number'&&!Number.isFinite(value))throw Error('Invalid save number');
 if(typeof value==='string'&&value.length>12000)throw Error('Save string too long');
 if(value&&typeof value==='object')for(const [key,v]of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(key))throw Error('Unsafe save key');cleanJSON(v,depth+1);}
}
export function validateSave(input){
 cleanJSON(input);let data=structuredClone(input);
 if(data?.saveVersion===1){
  if(data.worldId!=='seed0-web-v1'||data.generatorVersion!=='web-baked-v1')throw Error('Unsupported legacy save');
  const old=data;data=emptySave();data.player=old.player;data.discoveredLocations=old.discoveredLocations;data.openedContainers=old.openedContainers;
  for(const [id,value]of Object.entries(old.openedContainers??{})){if(value!==true)throw Error('Invalid legacy container');data.containers[id]={inspected:true,legacySearched:true,takenItemIds:[]};}
 }
 if(data?.saveVersion!==2||data.worldId!==WORLD_ID||data.generatorVersion!==GENERATOR_VERSION||data.interactionContentVersion!==INTERACTION_VERSION)throw Error('Save belongs to a different compiled world');
 if(data.player&&(!['surface','cave'].includes(data.player.realm)||!['x','y','z'].every(k=>Number.isFinite(data.player[k]))||data.player.x<0||data.player.x>=1600||data.player.z<0||data.player.z>=1600||data.player.y<0||data.player.y>80))throw Error('Invalid saved position');
 for(const field of dictionaries)if(!data[field]||Array.isArray(data[field])||typeof data[field]!=='object')throw Error('Invalid save dictionary: '+field);
 for(const field of ['openedContainers','discoveredLocations','evidence'])if(Object.values(data[field]).some(v=>v!==true))throw Error('Invalid discovery state');
 if(!Number.isSafeInteger(data.lastTransaction)||data.lastTransaction<0)throw Error('Invalid transaction number');
 if(data.navMissionId!=null&&typeof data.navMissionId!=='string')throw Error('Invalid navigation quest');
 if(data.navLocation!=null){const g=data.navLocation;if(typeof g.id!=='string'||typeof g.name!=='string'||!['surface','cave'].includes(g.realm)||!Array.isArray(g.position)||g.position.length!==3||!g.position.every(Number.isFinite)||g.position[0]<0||g.position[0]>=1600||g.position[2]<0||g.position[2]>=1600)throw Error('Invalid navigation location');}
 data.inventory=normalizeInventory(data.inventory);
 for(const c of Object.values(data.containers))if(!Array.isArray(c.takenItemIds)||new Set(c.takenItemIds).size!==c.takenItemIds.length)throw Error('Invalid container state');
 for(const s of Object.values(data.shrines))if(s.activated!==true)throw Error('Invalid shrine state');
 for(const m of Object.values(data.missions))if(!STATES.includes(m.state))throw Error('Invalid mission state');
 for(const p of Object.values(data.puzzles))if(!Array.isArray(p.values)||p.values.some(n=>!Number.isInteger(n)||n<0||n>100)||!Array.isArray(p.observed)||!Number.isInteger(p.cursor)||p.cursor<0||typeof p.completed!=='boolean')throw Error('Invalid puzzle state');
 return data;
}
export class SaveDeltas{
 constructor(storage=null){this.storage=storage;this.data=emptySave();this.error=null;try{const raw=storage?.getItem(KEY)??storage?.getItem(OLD_KEY);if(raw)this.data=validateSave(JSON.parse(raw));}catch(e){this.error=e.message;}}
 persist(position,realm){this.data.player={...position,realm};try{if(!this.storage)throw Error('Local saving is unavailable; export a save to retain progress.');this.storage.setItem(KEY,JSON.stringify(this.data));this.error=null;}catch(e){this.error=e.message;}return !this.error;}
 open(id){this.data.openedContainers[id]=true;this.data.deltaRevision++;}
 export(){return JSON.stringify(this.data,null,2);}
 import(text){if(text.length>8000000)throw Error('Save too large');const value=validateSave(JSON.parse(text));this.data=value;return value;}
}

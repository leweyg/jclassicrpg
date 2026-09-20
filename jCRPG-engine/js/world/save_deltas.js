import {WORLD_ID,GENERATOR_VERSION} from './format.js';
const KEY='jcrpg:'+WORLD_ID+':save';
export function emptySave(){return {saveVersion:1,worldId:WORLD_ID,generatorVersion:GENERATOR_VERSION,player:null,openedContainers:{},discoveredLocations:{}};}
export function validateSave(data){
 if(data?.saveVersion!==1||data.worldId!==WORLD_ID||data.generatorVersion!==GENERATOR_VERSION)throw Error('Save belongs to a different compiled world');
 if(data.player&&(!['surface','cave'].includes(data.player.realm)||!['x','y','z'].every(k=>Number.isFinite(data.player[k]))||data.player.x<0||data.player.x>=1600||data.player.z<0||data.player.z>=1600||data.player.y<0||data.player.y>80))throw Error('Invalid saved position');
 for(const field of ['openedContainers','discoveredLocations'])if(!data[field]||Array.isArray(data[field])||typeof data[field]!=='object'||Object.values(data[field]).some(v=>v!==true))throw Error('Invalid save deltas');
 return data;
}
export class SaveDeltas{
 constructor(storage=null){this.storage=storage;this.data=emptySave();this.error=null;try{const raw=storage?.getItem(KEY);if(raw)this.data=validateSave(JSON.parse(raw));}catch(e){this.error=e.message;}}
 persist(position,realm){this.data.player={...position,realm};try{if(!this.storage)throw Error('Local saving is unavailable; export a save to retain progress.');this.storage.setItem(KEY,JSON.stringify(this.data));this.error=null;}catch(e){this.error=e.message;}return !this.error;}
 open(id){this.data.openedContainers[id]=true;this.data.deltaRevision=(this.data.deltaRevision??0)+1;}
 export(){return JSON.stringify(this.data,null,2);}
 import(text){const value=validateSave(JSON.parse(text));this.data=value;return value;}
}

import {dialogueStart,dialogueView,validateDialogue} from './dialogue.js';
import {grantInventoryItem,inventoryCount,itemQuantity,stackSignature} from './inventory.js';
import {validateContent,INTERACTION_VERSION} from './format.js';
import {initialPuzzle,puzzleStep,puzzleHint} from './puzzles.js';
import {validateSave} from '../world/save_deltas.js';
import {questGoal,advanceNavigation} from './navigation.js';

export function predicate(p,s,engine,depth=0){
 if(depth>12)throw Error('Predicate depth limit');
 if(p===undefined)return true;
 if(!p||typeof p!=='object'||Object.keys(p).length!==1)throw Error('Invalid predicate');
 const [op,v]=Object.entries(p)[0],next=q=>predicate(q,s,engine,depth+1);
 switch(op){
 case 'all':case 'any':if(!Array.isArray(v)||v.length>64)throw Error('Invalid predicate list');return op==='all'?v.every(next):v.some(next);
 case 'not':return !next(v);
 case 'flag':return s.flags[v[0]]===v[1];
 case 'missionState':return engine.missionState(v[0],s)===v[1];
 case 'shrine':return !!s.shrines[v]?.activated;
 case 'puzzle':return !!s.puzzles[v]?.completed;
 case 'evidence':return !!s.evidence[v];
 case 'commitment':return s.commitments[v[0]]===v[1];
 case 'hasItem':return inventoryCount(s.inventory,v[0])>=v[1];
 default:throw Error('Unknown predicate '+op);
 }
}
export class InteractionRuntime {
 constructor(content,save){this.content=content;this.maps=validateContent(content);this.save=save;this.panel=null;this.initialize();}
 initialize(){const s=validateSave(this.save.data);this.migrateStory(s);this.validateState(s);if(!s.flags.initialInventory){for(const item of this.content.initialInventory)this.grant(s,item);s.flags.initialInventory=true;}this.refresh(s);this.save.data=s;if(!s.navMissionId&&!s.navLocation)s.navMissionId=this.currentStoryChapter()?.missionId??null;}
 migrateStory(s){
 for(const migration of this.content.storyMigrations??[]){if(s.flags[migration.id])continue;
  if(s.missions[migration.legacyMissionId]?.state==='completed')for(const id of migration.completedMissionIds)s.missions[id]??={state:'completed',objectiveSources:{}};
  s.flags[migration.id]=true;
 }
 }
 currentStoryChapter(s=this.save.data){const story=this.content.stories?.[0];return story?.chapters.find(c=>c.missionId&&s.missions[c.missionId]?.state!=='completed')??null;}
 mainNavigationGoal(){return questGoal(this,this.currentStoryChapter()?.missionId);}
 continueMainStory(){const id=this.currentStoryChapter()?.missionId;if(id)this.setNavigationGoal(id);}
 validateState(s){
 if(s.navMissionId!=null&&!Object.hasOwn(this.maps.missions,s.navMissionId))throw Error('Unknown navigation quest');
 const check=(field,group)=>{for(const id of Object.keys(s[field]))if(!Object.hasOwn(this.maps[group],id))throw Error('Unknown saved '+field+': '+id);};
 for(const [f,g]of [['puzzles','puzzles'],['shrines','shrines'],['containers','containers'],['missions','missions'],['shrineRoutes','routes']])check(f,g);
 for(const [id,p]of Object.entries(s.puzzles)){const def=this.maps.puzzles[id];if(p.values.length!==def.demands.length||p.values.some(n=>n>def.capacity)||p.cursor>def.sequence.length||p.observed.some(x=>!def.componentIds.includes(x)))throw Error('Invalid puzzle state for '+id);}
 const concrete=new Map([...this.content.initialInventory,...this.content.containers.flatMap(c=>c.items)].map(i=>[i.id,i]));
 for (const item of Object.values(s.inventory.items)) {
  let quantity = 0;
  for (const id of item.sourceIds) {
   const source = concrete.get(id);
   if (!source || source.typeId !== item.typeId) throw Error('Unknown inventory instance');
   if (stackSignature(source) !== stackSignature(item)) throw Error('Incompatible inventory stack');
   quantity += itemQuantity(source);
  }
  if (!Number.isSafeInteger(quantity) || item.quantity !== quantity) throw Error('Invalid inventory stack quantity');
 }
 for(const [id,c]of Object.entries(s.containers))if(c.takenItemIds.some(x=>!this.maps.containers[id].items.some(i=>i.id===x)))throw Error('Unknown taken item');
 }
 grant(s,item){grantInventoryItem(s.inventory,item);}
 missionState(id,s=this.save.data){const m=this.maps.missions[id];if(!m)throw Error('Unknown mission '+id);return s.missions[id]?.state??((m.requires??[]).every(dep=>s.missions[dep]?.state==='completed')?'available':'locked');}
 objectiveSources(o,s){
 return o.targetIds.filter(id=>({shrine:()=>s.shrines[id]?.activated,puzzle:()=>s.puzzles[id]?.completed,evidence:()=>s.evidence[id],commitment:()=>s.commitments[id]!==undefined,actor:()=>s.actors[id]?.talked,mission:()=>s.missions[id]?.state==='completed',item:()=>Object.values(s.inventory.items).some(item=>item.sourceIds.includes(id)),fitting:()=>s.flags[id]===true})[o.kind]());
 }
 refresh(s){
 for(const m of this.content.missions)if(m.startMode==='automatic'&&this.missionState(m.id,s)==='available')s.missions[m.id]={state:'active',objectiveSources:{}};

 for(const m of this.content.missions){const state=s.missions[m.id];if(!state||!['active','ready-to-turn-in'].includes(state.state))continue;state.objectiveSources=Object.fromEntries(m.objectives.map(o=>[o.id,this.objectiveSources(o,s)]));state.state=m.objectives.every(o=>state.objectiveSources[o.id].length>=(o.required??o.targetIds.length))?'ready-to-turn-in':'active';}
 for(const [id,route]of Object.entries(s.shrineRoutes)){const def=this.maps.routes[id];route.activatedShrineIds=def.shrineIds.filter(id=>s.shrines[id]?.activated);const first=def.shrineIds.findIndex(id=>!s.shrines[id]?.activated);route.litFrontierShrineIds=first<0?[]:[def.shrineIds[first]];route.state=first<0?'arrived':'active';}
 }
 transact(actions,token=this.save.data.lastTransaction+1){
 if(!Number.isSafeInteger(token)||token<1)throw Error('Invalid interaction token');
 if(token<=this.save.data.lastTransaction)return {duplicate:true,message:'Already recorded.'};
 if(token!==this.save.data.lastTransaction+1)throw Error('Out-of-order interaction');
 if(!Array.isArray(actions)||actions.length>64)throw Error('Invalid action list');
 const draft=structuredClone(this.save.data),messages=[];
 for(const action of actions)this.apply(draft,action,messages);
 this.refresh(draft);advanceNavigation(this,this.save.data,draft);draft.lastTransaction=token;draft.deltaRevision=(draft.deltaRevision??0)+1;
 const completedMissions=this.content.missions.filter(m=>draft.missions[m.id]?.state==='completed'&&this.save.data.missions[m.id]?.state!=='completed').map(m=>({id:m.id,title:m.title}));
 validateSave(draft);this.validateState(draft);this.save.data=draft;
 return {message:messages.join(' '),transactionId:token,completedMissions};
 }
 apply(s,a,messages){
 if(!a||typeof a.op!=='string')throw Error('Invalid action');
 const get=(group,id)=>{const value=this.maps[group][id];if(!value)throw Error('Unknown '+group+': '+id);return value;};
 switch(a.op){
 case 'fit':{const f=get('fittings',a.id);if(s.flags[f.id])break;if(!['active','ready-to-turn-in'].includes(this.missionState(f.missionId,s)))throw Error('The fitting is not ready');if(!Object.values(s.inventory.items).some(item=>item.sourceIds.includes(f.itemId)))throw Error('Bring the listening coil from the southern cave first.');s.flags[f.id]=true;messages.push('The coil settles into the socket. The road relay answers.');break;}
 case 'text':messages.push(a.text);break;
 case 'flag':if(['__proto__','constructor','prototype'].includes(a.id))throw Error('Invalid flag');s.flags[a.id]=a.value;break;
 case 'evidence':s.evidence[a.id]=true;messages.push(a.text??'Observation recorded as fact.');break;
 case 'commitment':s.commitments[a.id]=a.value;messages.push('Commitment recorded: '+a.value);break;
 case 'talk':get('actors',a.id);s.actors[a.id]={...s.actors[a.id],talked:true};break;
 case 'accept':{const def=get('missions',a.id);if(this.missionState(a.id,s)!=='available')throw Error('Mission is not available');if(Object.values(s.missions).filter(m=>m.state==='active').length>=40)throw Error('Finish an active mission first');s.missions[a.id]={state:'active',objectiveSources:{}};messages.push('Accepted: '+def.title);break;}
 case 'turnIn':{const def=get('missions',a.id);this.refresh(s);if(this.missionState(a.id,s)!=='ready-to-turn-in')throw Error('Objectives are not yet complete');s.missions[a.id].state='completed';for(const effect of def.onComplete??[])this.apply(s,effect,messages);messages.push('Completed: '+def.title);break;}
 case 'shrine':get('shrines',a.id);if(!s.shrines[a.id]){s.shrines[a.id]={activated:true,turn:s.lastTransaction+1};s.discoveredLocations[a.id]=true;messages.push('The relay answers. Breathe, then follow the light.');}else messages.push('The relay is awake. Its pulse repeats the observable pattern.');break;
 case 'route':{const def=get('routes',a.id);s.shrineRoutes[a.id]??={state:'active',destinationTownId:def.destinationTownId,activatedShrineIds:[],litFrontierShrineIds:[]};messages.push('Route lit toward '+def.destinationName+'.');break;}
 case 'settlement':{get('settlements',a.id);const old=s.settlements[a.id];s.settlements[a.id]={balanceState:old?.balanceState==='integrated'?'integrated':a.state??'stable',poweredTargetIds:a.targets??old?.poweredTargetIds??[]};break;}
 case 'generator':s.mazeGenerators[a.id]={state:'active',rationalState:'valid',resonanceState:'valid'};break;
 case 'puzzle':{const p=get('puzzles',a.id),old=s.puzzles[a.id];s.puzzles[a.id]=puzzleStep(p,old,a.input);messages.push(puzzleHint(p,s.puzzles[a.id]));if(!old?.completed&&s.puzzles[a.id].completed)for(const effect of p.onComplete??[])this.apply(s,effect,messages);break;}
 case 'open':get('containers',a.id);s.containers[a.id]??={takenItemIds:[]};Object.assign(s.containers[a.id],{inspected:true,opened:true});s.openedContainers[a.id]=true;break;
 case 'take':{const c=get('containers',a.id),state=s.containers[a.id];if(!state?.opened)throw Error('Open the container first');const ids=a.itemIds??c.items.map(i=>i.id);if(new Set(ids).size!==ids.length)throw Error('Duplicate transfer');for(const id of ids){const item=c.items.find(i=>i.id===id);if(!item)throw Error('Unknown container item');if(state.takenItemIds.includes(id))continue;this.grant(s,item);state.takenItemIds.push(id);}state.looted=state.takenItemIds.length===c.items.length;messages.push('Items transferred to the party inventory.');break;}
 default:throw Error('Unknown action '+a.op);
 }
 }
 priority(anchor){if(anchor.kind!=='actor')return anchor.priority;const actor=this.maps.actors[anchor.targetId];if(actor.missionIds.some(id=>this.missionState(id)==='ready-to-turn-in'))return 100;return actor.missionIds.some(id=>this.missionState(id)==='available')?80:70;}
 intuition(anchor){
  if(!anchor)return null;
  if(anchor.kind==='actor'){
   const actor=this.maps.actors[anchor.targetId];if(!actor)return null;
   const culture=this.maps.cultures[actor.cultureId],town=this.maps.settlements[actor.townId];
   return {name:actor.name,summary:actor.description??`${actor.name} is a ${actor.role}${town?' in '+town.name:''}.${culture?' Culture: '+culture.displayName+'.':''}`,character:true};
  }
  if(anchor.kind==='container'){
   const c=this.maps.containers[anchor.targetId];if(!c)return null;
   const saved=this.save.data.containers[c.id];
   const taken = new Set(saved?.takenItemIds ?? []);
   const itemCount = c.items.reduce((count, item) => count + (taken.has(item.id) ? 0 : itemQuantity(item)), 0);
   return {name:c.name,itemCount,summary:c.description??(itemCount===0?'An empty container. Its contents have been collected.':'A container that can be opened to inspect its contents.')};
  }
  if(anchor.kind==='shrine'){
   const s=this.maps.shrines[anchor.targetId];if(!s)return null;
   return {name:s.name??'Relay shrine',summary:s.description??s.cue??(this.save.data.shrines[s.id]?.activated?'This relay is awake. Its pulse repeats the observable pattern.':'A dormant relay shrine. Attuning it awakens its signal.')};
  }
  if(anchor.kind==='puzzle'){
   const p=this.maps.puzzles[anchor.targetId];if(!p)return null;
   const index=p.componentIds.indexOf(anchor.componentId);
   return {name:index<0?'Circuit reset stone':p.labels[index],summary:index<0?'A reset stone for this circuit. Interact to reset its conductors.':p.description??p.fact};
  }
  const summary=anchor.description??anchor.fact;
  return summary?{name:anchor.name??anchor.prompt??'Observation',summary}:null;
 }
 describe(anchor){
  if(!anchor)return null;
  if(anchor.kind==='puzzle'&&this.maps.puzzles[anchor.targetId].mechanic==='all')return {...anchor,label:'Toggle '+this.maps.puzzles[anchor.targetId].labels[this.maps.puzzles[anchor.targetId].componentIds.indexOf(anchor.componentId)]};
  if(anchor.kind==='puzzle'){const p=this.maps.puzzles[anchor.targetId],s=this.save.data.puzzles[p.id]??initialPuzzle(p),i=p.componentIds.indexOf(anchor.componentId);if(i>=0){const verb=s.completed?'Stable':!s.observed.includes(anchor.componentId)?'Inspect':p.family==='resonance'||s.values.every((n,j)=>n===p.demands[j])?'Pulse':'Set';return {...anchor,label:`${verb} ${p.labels[i]} · ${s.values[i]}/${p.demands[i]}`};}}
  if(anchor.kind==='actor'){const actor=this.maps.actors[anchor.targetId],ready=actor.missionIds.find(id=>this.missionState(id)==='ready-to-turn-in');if(ready)return {...anchor,label:'Report to '+actor.name};}
  if(anchor.kind==='shrine'&&this.save.data.shrines[anchor.targetId])return {...anchor,label:'Rest / recall relay pattern'};
  return anchor;
 }
 interact(anchor,token){
 if(anchor.kind==='actor'){
  const returning=!!this.save.data.actors[anchor.targetId]?.talked;
  this.transact([{op:'talk',id:anchor.targetId}],token);
  this.panel={kind:'dialogue',actorId:anchor.targetId,nodeId:dialogueStart(this.maps.dialogues[this.maps.actors[anchor.targetId].dialogueId],condition=>predicate(condition,this.save.data,this)),captionIndex:0,returnedToGreeting:returning};
  if(returning)this.panel.captionIndex=this.dialogue().captionCount-1;
  return this.dialogue();
 }
 if(anchor.kind==='container'){const result=this.transact([{op:'open',id:anchor.targetId}],token);this.panel={kind:'container',id:anchor.targetId};return result;}
 if(['shrine','puzzle','fitting','evidence'].includes(anchor.kind)){
  const id=anchor.targetId,s=this.save.data;
  const wasComplete=anchor.kind==='shrine'?s.shrines[id]?.activated:anchor.kind==='puzzle'?s.puzzles[id]?.completed:anchor.kind==='fitting'?s.flags[id]:s.evidence[id];
  const action=anchor.kind==='fitting'?{op:'fit',id}:anchor.kind==='puzzle'?{op:'puzzle',id,input:anchor.input??anchor.componentId}:anchor.kind==='evidence'?{op:'evidence',id,text:anchor.fact}:{op:'shrine',id};
  const result=this.transact([action],token);
  if(anchor.kind==='shrine')result.message+=' '+(this.maps.shrines[id].cue??'');
  const completed=anchor.kind!=='puzzle'||this.save.data.puzzles[id]?.completed;
  if(!result.duplicate&&!wasComplete&&completed&&result.message){
   const titles={fitting:'Item used',shrine:'Relay activated',puzzle:'Task completed',evidence:'Observation recorded'};
   this.panel={kind:'result',title:result.completedMissions?.length?'Mission completed':titles[anchor.kind],message:result.message};
  }
  return result;
 }
 throw Error('Unsupported interaction');
 }
 dialogue() {
  return dialogueView(this, condition => predicate(condition, this.save.data, this));
 }
 advanceDialogue() {
  const current = this.dialogue();
  if (!current.canAdvance) return current;
  this.panel.captionIndex = current.captionIndex + 1;
  return this.dialogue();
 }
 choose(index, token) {
  const dialogue = this.dialogue();
  if (dialogue.canAdvance) throw Error('Finish reading before choosing a response');
  const choice = dialogue.choices[index];
  if (!choice) throw Error('Choice no longer available');
  const result = this.transact(choice.actions ?? [], token);
  if (result.duplicate) return result;
  if (choice.next) {
   const definition = this.maps.dialogues[dialogue.actor.dialogueId];
   if (choice.next === definition.start) this.panel.returnedToGreeting = true;
   this.panel.nodeId = choice.next === definition.start
    ? dialogueStart(definition, condition => predicate(condition, this.save.data, this))
    : choice.next;
   this.panel.captionIndex = 0;
   if (choice.next === definition.start) {
    this.panel.captionIndex = this.dialogue().captionCount - 1;
   }
  } else {
   this.panel = null;
  }
  return result;
 }
 navigationGoal(){return this.save.data.navLocation??questGoal(this,this.save.data.navMissionId);}
 setNavigationGoal(id){if(!questGoal(this,id))throw Error('This quest has no remaining destination.');this.save.data.navMissionId=id;this.save.data.navLocation=null;this.save.data.deltaRevision++;}
 setNavigationLocation(marker){const goal={id:marker.id,name:marker.name,position:[marker.x,marker.y??0,marker.z],realm:marker.realm??'surface'};validateSave({...this.save.data,navLocation:goal});this.save.data.navLocation=goal;this.save.data.navMissionId=null;this.save.data.deltaRevision++;}
 journal(){return this.content.missions.map(m=>({...m,state:this.missionState(m.id),progress:m.objectives.map(o=>({...o,count:this.objectiveSources(o,this.save.data).length}))})).filter(m=>m.state!=='locked');}
 markers(){
 const result=[],add=(id,name,kind,position,realm='surface')=>{if(position)result.push({id,name,kind,x:position[0],y:position[1],z:position[2],realm,implemented:true});};
 for(const [goal,main] of [[this.navigationGoal(),false],[this.mainNavigationGoal(),true]])if(goal)add(goal.id,goal.name,main?'main-story':'mission',goal.position,goal.realm);
 for(const route of Object.values(this.save.data.shrineRoutes)){for(const id of [...route.activatedShrineIds,...route.litFrontierShrineIds]){const shrine=this.maps.shrines[id];add('route:'+id,this.save.data.shrines[id]?'Awake relay':'Next relay','mission',shrine.position);}const dest=this.maps.settlements[route.destinationTownId];add('route:'+dest.id,dest.name,'mission',dest.position,dest.realm);}
 return [...new Map(result.map(m=>[m.id,m])).values()];
 }
}
export async function loadInteractions(base,save,fetcher=fetch){
 const read=async (url,desc=null)=>{const target=new URL(url,base),root=new URL('interactions/',base);if(target.origin!==root.origin||!target.pathname.startsWith(root.pathname))throw Error('Catalog outside world pack');const r=await fetcher(target);if(!r.ok)throw Error('Interaction content unavailable: '+url);const text=await r.text(),bytes=new TextEncoder().encode(text);if(desc&&bytes.length!==desc.byteLength)throw Error('Interaction content length mismatch');if(desc&&globalThis.crypto?.subtle){const digest=await crypto.subtle.digest('SHA-256',bytes),hash=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');if(hash!==desc.sha256)throw Error('Interaction content hash mismatch');}return JSON.parse(text);};
 const manifest=await read('interactions/manifest.json');if(manifest.contentVersion!==INTERACTION_VERSION)throw Error('Unsupported interaction content');
 const c={};await Promise.all(Object.entries(manifest.runtimeCatalogs??manifest.catalogs).map(async([key,desc])=>{c[key]=await read(desc.url,desc);}));const engine=new InteractionRuntime(c,save),pending=new Map(),templates=new Map();
 engine.loadRecord=async(group,id)=>{const desc=manifest.records?.[group]?.[id];if(!desc)return;if(!pending.has(id))pending.set(id,(async()=>{let record;
 if(desc.template){
  const template=desc.template;
  if(!templates.has(template.url))templates.set(template.url,read(template.url,template).catch(error=>{templates.delete(template.url);throw error;}));
  const substitute=value=>{if(typeof value==='string')return value.replace(/\{\{(\w+)\}\}/g,(_,key)=>{if(!Object.hasOwn(desc.parameters??{},key))throw Error('Missing dialogue parameter '+key);return desc.parameters[key];});if(Array.isArray(value))return value.map(substitute);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[substitute(k),substitute(v)]));return value;};
  record=substitute(await templates.get(template.url));
 }else record=await read(desc.url,desc);
 if(record.id!==id)throw Error('Record identity mismatch');if(group==='dialogues')validateDialogue(record);Object.assign(engine.maps[group][id],record);})().catch(error=>{pending.delete(id);throw error;}));await pending.get(id);};
 return engine;
}

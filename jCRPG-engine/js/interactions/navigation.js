/** Resolve the next unfinished step without changing quest state. */
export function questGoal(engine,id,seen=new Set()) {
 const m=engine.maps.missions[id],s=engine.save.data;
 if(!m||seen.has(id))return null;
 seen.add(id);
 const state=engine.missionState(id);
 if(['completed','failed','archived','locked'].includes(state))return null;
 const actorGoal=(actorId,label)=>{const a=engine.maps.actors[actorId];return a?{id:a.id,name:label+' '+a.name,position:a.position,realm:a.realm}:null;};
 if(state==='available')return actorGoal(m.giverActorId,'Speak to');
 if(state==='ready-to-turn-in')return actorGoal(m.turnInActorId,'Return to');
 for(const o of m.objectives){
  const done=engine.objectiveSources(o,s);
  if(done.length>=(o.required??o.targetIds.length))continue;
  for(const target of o.targetIds.filter(t=>!done.includes(t))){
   if(o.kind==='mission'){const next=questGoal(engine,target,seen);if(next)return next;}
   const goal=engine.content.goals.find(g=>g.targetId===target);
   if(goal)return {...goal,name:o.text};
  }
  return actorGoal(m.turnInActorId,o.text+' — speak to');
 }
 return actorGoal(m.turnInActorId,'Return to');
}

export function advanceNavigation(engine,before,after){
 const missions=engine.content.missions;
 const changedTo=state=>missions.find(m=>before.missions[m.id]?.state!==state&&after.missions[m.id]?.state===state);
 const accepted=missions.find(m=>!before.missions[m.id]&&['active','ready-to-turn-in'].includes(after.missions[m.id]?.state));
 const ready=changedTo('ready-to-turn-in'),completed=changedTo('completed');
 if(accepted||ready)after.navMissionId=(accepted??ready).id;
 else if(completed){
  const next=missions.find(m=>(m.requires??[]).includes(completed.id)&&!(after.missions[m.id])&&(m.requires??[]).every(id=>after.missions[id]?.state==='completed'))
   ??missions.find(m=>['ready-to-turn-in','active'].includes(after.missions[m.id]?.state));
  after.navMissionId=next?.id??null;
 }
}

/** Keep an offscreen goal on the map edge, preserving its bearing. */
export function mapGoalPosition(x,y,size,padding=20){
 const half=size/2,dx=x-half,dy=y-half;
 const factor=Math.min(1,(half-padding)/Math.max(Math.abs(dx),Math.abs(dy),1));
 return {x:half+dx*factor,y:half+dy*factor,edge:factor<1,angle:Math.atan2(dy,dx)};
}

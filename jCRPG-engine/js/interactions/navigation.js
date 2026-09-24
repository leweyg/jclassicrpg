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
   if(goal){if(goal.realm==='cave'&&goal.entrancePosition&&s.player?.realm!=='cave')return {...goal,id:goal.portalId,position:goal.entrancePosition,realm:'surface',name:'Enter the southern cave'};return {...goal,name:o.text};}
  }
  return actorGoal(m.turnInActorId,o.text+' — speak to');
 }
 return actorGoal(m.turnInActorId,'Return to');
}

export function advanceNavigation(engine,before,after){
 const accepted=engine.content.missions.find(m=>m.startMode!=='automatic'&&!before.missions[m.id]&&after.missions[m.id]);
 if(accepted){after.navMissionId=accepted.id;after.navLocation=null;return;}
 const selected=before.navMissionId;
 if(selected&&!['completed','failed','archived'].includes(after.missions[selected]?.state))return;
 if(before.navLocation)return;
 const newlyAccepted=engine.content.missions.find(m=>m.startMode!=='automatic'&&!before.missions[m.id]&&after.missions[m.id]);
 const main=engine.currentStoryChapter(after)?.missionId;
 after.navMissionId=newlyAccepted?.id??main??null;
 after.navLocation=null;
}

/** Keep an offscreen goal on the map edge, preserving its bearing. */
export function mapGoalPosition(x,y,size,padding=20){
 const half=size/2,dx=x-half,dy=y-half;
 const factor=Math.min(1,(half-padding)/Math.max(Math.abs(dx),Math.abs(dy),1));
 return {x:half+dx*factor,y:half+dy*factor,edge:factor<1,angle:Math.atan2(dy,dx)};
}

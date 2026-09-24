/** Stable authored save contracts. Later chapters have no playable mission yet. */
export const STORY_ID='story:concordance:opening';
export const MAIN_IDS=['mission:concordance:road','mission:concordance:current','mission:concordance:branches'];
export function authorMainStory({content,portals,reachable,anchor,safeNear,mission,objective,route,solvePuzzle}) {
 const actor=id=>content.actors.find(a=>a.id===id),marn=actor('legacy-actor:BoarmanTribe#381:544'),pella=actor('actor:wammigmig:pella'),orro=actor('actor:wammigmig:orro'),talla=actor('actor:boarman:regional:1');
 const titles=['The road remembers','A missing current','Every branch','What the numbers mean','An order worth keeping'];
 content.stories=[{id:STORY_ID,version:1,title:'The Concordance journey',premise:'A repair at Wammigmig reveals a broken current leading toward Migbushoprahshotra / the Measured Oasis.',chapterIds:titles.map((_,i)=>'chapter:concordance:'+ (i+1)),chapters:titles.map((title,i)=>({id:'chapter:concordance:'+(i+1),title,missionId:MAIN_IDS[i]??null,status:i<3?'playable':'planned',entry:i?{completedChapterId:'chapter:concordance:'+i}:{newGame:true},exit:i<3?{completedMissionId:MAIN_IDS[i]}:null,nextChapterId:i<4?'chapter:concordance:'+(i+2):null})),nextChapterFallback:'The next chapter at the Measured Oasis is not yet playable.'}];
 const portal=portals.find(p=>p.id==='cave:760:920:0');if(!portal)throw Error('Opening cave missing');
 const cells=reachable({origin:portal.to.map(Math.floor),size:[1,1,1]},'cave',portal.to.map(Math.floor));
 const position=cells[Math.min(cells.length-1,24)],containerId='container:concordance:listening-coil',itemId='item:concordance:listening-coil',fittingId='fitting:wammigmig:listening-coil';
 content.itemTypes.push({id:'ListeningCoil',name:'Listening coil',usable:false,note:'Fit this unique component beside Pella.'});
 content.containers.push({id:containerId,name:'Listening-coil chest',position,realm:'cave',portalId:portal.id,items:[{id:itemId,typeId:'ListeningCoil',quantity:1}],lock:null,trap:null});
 anchor('container',containerId,position,{realm:'cave',asset:'chest',prompt:'Open listening-coil chest'});
 content.goals.push({id:'goal:'+itemId,kind:'container',targetId:itemId,position,realm:'cave',entrancePosition:portal.from,portalId:portal.id,name:'Listening coil'});
 const fittingPosition=safeNear([pella.position[0]+3,pella.position[1],pella.position[2]]);
 anchor('fitting',fittingId,fittingPosition,{asset:'conductor',prompt:'Fit listening coil',itemId,missionId:MAIN_IDS[1]});
 content.fittings=[{id:fittingId,itemId,missionId:MAIN_IDS[1]}];
 const main=(i,giver,objectives,summary,extras={})=>{const m=mission(MAIN_IDS[i],titles[i],summary,giver,objectives,{requires:i?[MAIN_IDS[i-1]]:[],...extras});Object.assign(m,{kind:'main',storyId:STORY_ID,chapterId:content.stories[0].chapterIds[i],startMode:'automatic',followUpMissionIds:MAIN_IDS[i+1]?[MAIN_IDS[i+1]]:[],reward:{},turnInRule:'report'});return m;};
 main(0,marn,[objective('orro','actor',[orro.id],'Talk to Orro beside the roadside shrine.'),objective('awaken','shrine',['shrine:shrine 19 22:782:903'],'Wake the roadside shrine.')],'Listen to Orro, wake one light, then confirm its pulse with Marn in Wammigmig.');
 const regional=content.settlements.find(t=>t.id===talla.townId),road=route('route:concordance:regional','shrine:shrine 19 22:782:903',regional);
 main(1,pella,[objective('pella','actor',[pella.id],'Ask Pella about the missing current.'),objective('coil','item',[itemId],'Retrieve the listening coil in the southern cave.'),objective('fit','fitting',[fittingId],'Fit the coil beside Pella.')],'Pella needs a listening coil from the southern cave. Follow the cave marker, take the coil, return through an exit and fit it beside her.',{onComplete:[{op:'route',id:road.id}]});
 talla.name='Talla Three-Wicks';
 const puzzle=content.puzzles.find(p=>p.id==='puzzle:boarman:regional:1');Object.assign(puzzle,{mechanic:'all',fact:'Exchange, Homes and Labyrinth share one supply. Wake each branch; no ordering is required.'});puzzle.solution=solvePuzzle(puzzle).inputs;
 main(2,talla,[objective('talla','actor',[talla.id],'Meet Talla Three-Wicks.'),objective('branches','puzzle',[puzzle.id],'Wake Exchange, Homes and Labyrinth.')],'Meet Talla in Wamwammigtraawsho, wake all three branches and report what the shared current reveals.',{onComplete:[{op:'flag',id:'story:concordance:opening:milestone',value:true},{op:'text',text:'Talla records your account for Saima at Migbushoprahshotra / the Measured Oasis. The next chapter is not yet playable.'}]});
 const relayReading='evidence:orro:relay';anchor('evidence',relayReading,safeNear([790,40,906]),{asset:'conductor',prompt:'Inspect Orro’s relay',fact:'The repaired relay returns a steady pulse.'});
 const mini=mission('mission:orro:relay','A steady pulse','Check the small relay beside Orro, then tell him whether its pulse holds.',orro,[objective('reading','evidence',[relayReading],'Inspect the relay beside Orro.')],{onComplete:[{op:'text',text:'Orro smiles. Carry that steady pulse back to the main journey.'}]});mini.kind='mini';
 for(const m of content.missions){m.kind??='side';m.startMode??='offer';m.reward??={};m.turnInRule??='report';if(m.kind!=='main')m.returnToMainMissionId=MAIN_IDS[0];}
 const legacy=content.missions.find(m=>m.id==='mission:wammigmig:fair-share');legacy.summary='Optional: compare Marn’s three readings, balance the local circuit and record an obligation. Return to the main journey when ready.';
 for(const [a,text] of [[orro,'I am Orro. I keep this little relay alive, when it lets me. Touch the shrine beside me. Then tell Marn in Wammigmig that its pulse has returned.'],[marn,'The road light answers again. Pella has been waiting for that pulse: ask her about the missing coil in the southern cave. My household readings can wait until you want to investigate them.'],[pella,'Our lamps falter when the current cannot listen back. There is a listening coil in a chest inside the cave south of here. Bring it through the exit and fit it in the socket beside me. Then we can reach Talla in Wamwammigtraawsho.'],[talla,'I am Talla Three-Wicks. Exchange, Homes and Labyrinth share this supply. Wake all three branches beside me, in any order, and bring me your account.']]){
  const d=content.dialogues.find(d=>d.id===a.dialogueId);const choices=d.nodes.greeting.choices.filter(c=>!c.actions?.some(x=>x.op==='accept'&&MAIN_IDS.includes(x.id)));
  d.entries=[];d.nodes.greeting={text,knowledge:'testimony',choices};
  const mainId=a===marn?MAIN_IDS[0]:a===pella?MAIN_IDS[1]:a===talla?MAIN_IDS[2]:null;
  if(mainId){d.entries=[{when:{missionState:[mainId,'completed']},nodeId:'story-complete'}];d.nodes['story-complete']={text:a===marn?'The road light is confirmed. Pella will show you where the missing current begins.':a===pella?'The socket holds. Follow the road marker to Talla Three-Wicks in Wamwammigtraawsho.':'All three branches answer. Our account belongs with Saima at Migbushoprahshotra, the Measured Oasis. That next chapter is still to come.',choices,knowledge:'testimony'};}

 }
 content.shrines.find(s=>s.id==='shrine:shrine 19 22:782:903').cue='The road light holds. Marn in Wammigmig can confirm its pulse.';
 content.storyMigrations=[{id:'opening-v1',legacyMissionId:'mission:wammigmig:fair-share',completedMissionIds:[MAIN_IDS[0]],excludedItemTypes:['CopperCoil']}];
 return {portal,cells,containerId,itemId,fittingId};
}

/** Stable authored save contracts, including the Measured Oasis continuation. */
export const STORY_ID='story:concordance:opening';
export const MAIN_IDS=['mission:concordance:road','mission:concordance:current','mission:concordance:branches','mission:concordance:meaning','mission:concordance:order'];
export function authorMainStory({content,portals,reachable,anchor,safeNear,mission,objective,route,solvePuzzle}) {
 const actor=id=>content.actors.find(a=>a.id===id),marn=actor('legacy-actor:BoarmanTribe#381:544'),pella=actor('actor:wammigmig:pella'),orro=actor('actor:wammigmig:orro'),talla=actor('actor:boarman:regional:1');
 const titles=['The road remembers','A missing current','Every branch','What the numbers mean','An order worth keeping'];
 content.stories=[{id:STORY_ID,version:1,title:'The Concordance journey',premise:'A repair at Wammigmig reveals a broken current leading toward Migbushoprahshotra / the Measured Oasis.',chapterIds:titles.map((_,i)=>'chapter:concordance:'+ (i+1)),chapters:titles.map((title,i)=>({id:'chapter:concordance:'+(i+1),title,missionId:MAIN_IDS[i]??null,status:'playable',entry:i?{completedChapterId:'chapter:concordance:'+i}:{newGame:true},exit:{completedMissionId:MAIN_IDS[i]},nextChapterId:i<4?'chapter:concordance:'+(i+2):null})),nextChapterFallback:'The Concordance journey is complete. Other local journeys remain open.'}];
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
 main(2,talla,[objective('talla','actor',[talla.id],'Meet Talla Three-Wicks.'),objective('branches','puzzle',[puzzle.id],'Wake Exchange, Homes and Labyrinth.')],'Meet Talla in Wamwammigtraawsho, wake all three branches and report what the shared current reveals.',{onComplete:[{op:'flag',id:'story:concordance:opening:milestone',value:true},{op:'text',text:'Talla records your account for Saima at Migbushoprahshotra / the Measured Oasis. Bring her the three branch readings and ask what the numbers leave out.'}]});
 const saima=actor('actor:antipion:principal:0');
 const balanceId='mission:antipion:balance',regionalIds=['body','speech','mind','wisdom'].map(layer=>'mission:antipion:'+layer),synthesisId='mission:antipion:bliss';
 main(3,saima,[objective('saima','actor',[saima.id],'Bring Talla’s account to Saima at the Measured Oasis.'),objective('balance','mission',[balanceId],'Help Saima restore the local balance and report the readings.')],'Bring Talla’s account to Saima of Nine Measures at Migbushoprahshotra / the Measured Oasis. Accept her local-balance task, compare the three conductors and report what the tables miss.',{onComplete:[{op:'text',text:'Saima keeps Talla’s account beside your local readings. Four regional keepers can now test whether those numbers hold beyond the oasis. Speak to each keeper, complete their work, then return to Saima.'}]});
 main(4,saima,[...regionalIds.map((id,i)=>objective('region-'+i,'mission',[id],content.missions.find(m=>m.id===id).title+' — complete the regional keeper’s work.')),objective('synthesis','mission',[synthesisId],'Return to Saima and complete The Unquantized Remainder.')],'Follow the four regional keepers’ tasks: An Independent Reading, Careful Naming, A Failed Prediction and Hospitality to the Unknown. Compare evidence, listen to witnesses, record commitments and restore each circuit. Return to Saima to renew the shared practice and give your final account.',{onComplete:[{op:'flag',id:'story:concordance:complete',value:true},{op:'text',text:'Saima binds your account to Talla’s: the road, the missing current, the three branches and the four regional readings. The Concordance journey is complete. The record remains open to new evidence, and other local journeys await.'}]});
 // Reuse stable task IDs so previously completed oasis work counts immediately.
 for(const id of [balanceId,...regionalIds,synthesisId])content.missions.find(m=>m.id===id).returnToMainMissionId=id===balanceId?MAIN_IDS[3]:MAIN_IDS[4];
 const sd=content.dialogues.find(d=>d.id===saima.dialogueId),choices=sd.nodes.greeting.choices.filter(c=>!c.actions?.some(a=>a.op==='accept'&&MAIN_IDS.includes(a.id)));
 sd.nodes.greeting.captions=[
  'I am Saima of Nine Measures. Talla counts the branches that carry the current; I keep the tables that describe it. At Migbushoprahshotra, the Measured Oasis, we must ask what those tables leave out.',
  'Our instruments sometimes reject a pulse because it does not fit a prediction. That is a reason to repeat the reading, not to erase it. Help me compare the three local conductors. Read each once before changing its setting.',
  'Begin with The Unquantized Remainder: A Local Balance. Bring me the results, and we will ask the regional keepers to test them against their own witnesses.'
 ];
 sd.nodes.greeting.choices=choices;
 sd.entries=[
  {when:{missionState:[MAIN_IDS[4],'completed']},nodeId:'journey-complete'},
  {when:{missionState:[MAIN_IDS[4],'ready-to-turn-in']},nodeId:'final-account'},
  {when:{missionState:[MAIN_IDS[3],'completed']},nodeId:'regional-account'},
  {when:{missionState:[balanceId,'completed']},nodeId:'local-account'}
 ];
 for(const [id,text] of Object.entries({
  'local-account':'The local readings hold, including the pulse our table failed to predict. Report what the numbers mean, and take that question to the four regional keepers.',
  'regional-account':'Seek An Independent Reading, Careful Naming, A Failed Prediction and Hospitality to the Unknown. Each keeper needs evidence, a witness, a testable promise and a working circuit. I can light their routes. When all four accounts are ready, return for The Unquantized Remainder and renew our shared practice.',
  'final-account':'You have brought the four regional accounts home and renewed our shared practice. Give me your final report: an order worth keeping must leave room for what we have not yet understood.',
  'journey-complete':'From Orro’s roadside light to these regional accounts, you have made the current answerable to the people it reaches. Our journey is complete; our measurements and obligations still need care.'
 }))sd.nodes[id]={text,knowledge:'testimony',choices};
 const relayReading='evidence:orro:relay';anchor('evidence',relayReading,safeNear([790,40,906]),{asset:'conductor',prompt:'Inspect Orro’s relay',fact:'The repaired relay returns a steady pulse.'});
 const mini=mission('mission:orro:relay','A steady pulse','Check the small relay beside Orro, then tell him whether its pulse holds.',orro,[objective('reading','evidence',[relayReading],'Inspect the relay beside Orro.')],{onComplete:[{op:'text',text:'Orro smiles. Carry that steady pulse back to the main journey.'}]});mini.kind='mini';
 for(const m of content.missions){m.kind??='side';m.startMode??='offer';m.reward??={};m.turnInRule??='report';if(m.kind!=='main')m.returnToMainMissionId??=MAIN_IDS[0];}
 const legacy=content.missions.find(m=>m.id==='mission:wammigmig:fair-share');legacy.summary='Optional: compare Marn’s three readings, balance the local circuit and record an obligation. Return to the main journey when ready.';
 const opening=new Map([
  [orro,[
   'I am Orro. We call this roadside light a shrine, but it is also a relay: it passes the grid’s current from one stretch of road to the next. You can see its light, and I can measure its pulse. My grandmother taught me to listen before I touched it.',
   'Some say the pause between pulses is the shrine taking a breath. I cannot measure a breath in copper; I can measure whether the pause repeats. The old name reminds me to pay attention, even when my instrument has no name for what I hear.',
   'Touch the shrine once, then tell Marn in Wammigmig whether the road light answers. He is keeping a record of who depends on it.'
  ]],
  [marn,[
   'The road light answers again. Thank you for checking with Orro. I am Marn, and I keep an account: a written record of the supplies we have, the current the lamps use, and the households asking for it.',
   'The traders taught my father to measure every crate before he promised it away. That habit kept our stores through a hard winter. It also made it easy for me to give a number to a crate and forget to ask who was carrying it home.',
   'Pella keeps the household readings I missed. Ask her about the missing listening coil in the southern cave. My other readings can wait while you help her.'
  ]],
  [pella,[
   'I am Pella. The lamps here dim when our relay cannot answer the current sent along the road. A relay is a place where that current passes between branches; ours has a socket for a listening coil, a small wound piece that lets us check its returning pulse.',
   'My mother called that answer a promise. Orro would call it a repeatable reading. I keep both words: I can test whether the pulse returns, and I can ask whom the light reaches when it does.',
   'There is one listening coil in a chest inside the cave south of here. Bring it back through an exit and fit it beside me. Then we can follow the lit road to Talla in Wamwammigtraawsho.'
  ]],
  [talla,[
   'I am Talla Three-Wicks. Exchange, Homes and Labyrinth are three branches of this supply: separate paths from one relay. My aunt counted the lamps from her window and knew which houses were still awake after supper.',
   'I count the current now. A conductor is a piece you touch to let one branch carry it. We can check that each branch lights up; my aunt would still ask whose window remains dark.',
   'Wake all three branches beside me, in any order, and bring me your account: tell me what you saw, not only what the instruments said.'
  ]]
 ]);
 for(const [a,captions] of opening){
  const d=content.dialogues.find(d=>d.id===a.dialogueId);const choices=d.nodes.greeting.choices.filter(c=>!c.actions?.some(x=>x.op==='accept'&&MAIN_IDS.includes(x.id)));
  d.entries=[];d.nodes.greeting={captions,knowledge:'testimony',choices};
  const mainId=a===marn?MAIN_IDS[0]:a===pella?MAIN_IDS[1]:a===talla?MAIN_IDS[2]:null;
  if(mainId){d.entries=[{when:{missionState:[mainId,'completed']},nodeId:'story-complete'}];d.nodes['story-complete']={text:a===marn?'The road light is confirmed. Pella will show you where the missing current begins.':a===pella?'The socket holds. Follow the road marker to Talla Three-Wicks in Wamwammigtraawsho.':'All three branches answer. Take our account to Saima at Migbushoprahshotra, the Measured Oasis. She needs an independent reading before she trusts the tables.',choices,knowledge:'testimony'};}

 }
 content.shrines.find(s=>s.id==='shrine:shrine 19 22:782:903').cue='The road light holds. Marn in Wammigmig can confirm its pulse.';
 content.storyMigrations=[{id:'opening-v1',legacyMissionId:'mission:wammigmig:fair-share',completedMissionIds:[MAIN_IDS[0]],excludedItemTypes:['CopperCoil']}];
 return {portal,cells,containerId,itemId,fittingId};
}

/** The opening teaches observation, a physical repair, then a shared account for Saima. */
export function authorConcordanceDialogue(content) {
 const ids=['mission:concordance:road','mission:concordance:current','mission:concordance:branches'];
 const actor=id=>content.actors.find(a=>a.id===id);
 const orro=actor('actor:wammigmig:orro'),marn=actor('legacy-actor:BoarmanTribe#381:544'),pella=actor('actor:wammigmig:pella'),talla=actor('actor:boarman:regional:1');
 const state=(id,status)=>({missionState:[id,status]});
 const close={text:'Until next time.'};
 const node=(captions,choices,extra={})=>({...(Array.isArray(captions)?{captions}:{text:captions}),knowledge:'testimony',choices:[...choices,close],...extra});
 const define=(a,nodes,entries)=>{
  const d=content.dialogues.find(d=>d.id===a.dialogueId);
  // Keep optional local work accessible, while main reports get their own voice.
  const optional=d.nodes.greeting.choices.filter(c=>c.actions?.some(x=>['accept','turnIn','commitment'].includes(x.op)&&!ids.includes(x.id))||c.next?.startsWith('hint:mission:'));
  for(const choice of optional){if(choice.text.startsWith('Accept: '))choice.text='About your other work: '+choice.text.slice(8);else if(choice.text.startsWith('Report: '))choice.text='I have your local account: '+choice.text.slice(8);else if(choice.text.startsWith('Review: '))choice.text='Review my local task';}
  nodes['local-work']=node('We can keep that local task alongside the journey. Which part do you want to discuss?',optional);
  for(const n of Object.values(nodes))if(n!==nodes['local-work'])n.choices.splice(-1,0,{text:'Is there other work here?',next:'local-work'});
  for(const id of a.missionIds.filter(id=>!ids.includes(id))){const m=content.missions.find(m=>m.id===id);nodes['hint:'+id]=node(m.summary,[{text:'Show me the local task',trackMissionId:id},{text:'Back',next:'greeting'}],{reviewMissionId:id});}
  Object.assign(d,{authoredStates:true,entries,nodes:{...d.nodes,...nodes}});
 };
 const report=(id,text)=>({text,when:state(id,'ready-to-turn-in'),actions:[{op:'turnIn',id}],next:'greeting'});
 const track=(id,text)=>({text,trackMissionId:id});
 define(orro,{
  greeting:node([
   'I am Orro. This roadside shrine is also a relay: it passes the Grid’s current from one stretch of road to the next. Its light has gone quiet. My grandmother taught me to listen before I touched it.',
   'She called the pause between pulses a breath. I can test whether that pause repeats; I cannot tell you whether copper breathes. Her word reminds me to pay attention before I decide what I heard.',
   'Touch the shrine once. If it answers, tell Marn in Wammigmig what you saw. He keeps the account of the households depending on this road.'
  ],[track(ids[0],'I’ll wake the road light')],{repeatText:'One touch wakes the roadside shrine. Take its answer to Marn in Wammigmig.'}),
  answered:node(['The light holds. That is one thing we can check together. What it promises to the houses along the road is a question Marn must help us answer.','Tell him you saw the relay wake. He will know whom to ask about the current that still fails to return.'],[{text:'I’ll take him that observation',navigateActorId:marn.id}]),
  onward:node('Pella can test the returning current. Carry what she finds to Talla; let each person add something the last could not see.',[{text:'Continue the shared account',continueMain:true}]),
 },[{when:state(ids[0],'completed'),nodeId:'onward'},{when:{shrine:'shrine:shrine 19 22:782:903'},nodeId:'answered'}]);
 define(marn,{
  greeting:node(['I am Marn. I keep an account of the supplies here, the lamps they serve, and the people waiting for them. The road light has been unreliable; a neat ledger will not make it answer.','Orro is beside the shrine west of town. Ask him what can be tested, wake that light, and bring me what you actually saw. We can begin with one honest observation.'],[track(ids[0],'I’ll check the light with Orro')],{repeatText:'Orro and the roadside shrine are the first check. I will keep the account open until you return.'}),
  pending:node('The road reading is not complete yet.',[track(ids[0],'Show me the unfinished step')],{reviewMissionId:ids[0]}),
  ready:node(['You saw the shrine answer after speaking to Orro. Thank you. I can enter a working road light in the account; I cannot yet promise that the current reaches every home.','Pella keeps the household readings I missed. She says our returning current needs a listening coil. Let us confirm your road reading, then hear her.'],[report(ids[0],'The road light answered')]),
  'story-complete':node(['The road reading is recorded. Pella has the next question: why does the returning current still fail at our homes?','Ask her about the listening coil. My other accounts can wait; this one begins with someone who has lived with the failing lamps.'],[{text:'Let me hear Pella',navigateActorId:pella.id},{text:'Continue the journey',continueMain:true}],{repeatText:'The road light is in the record. Pella can show you what still fails to return.'}),
 },[{when:state(ids[0],'completed'),nodeId:'story-complete'},{when:state(ids[0],'ready-to-turn-in'),nodeId:'ready'},{when:{all:[state(ids[0],'active'),{shrine:'shrine:shrine 19 22:782:903'}]},nodeId:'pending'}]);
 define(pella,{
  greeting:node(['Marn has a road reading. I need to check what comes back. I am Pella; when the household lamps dim, I hear about it before it reaches his ledger.','Our relay has a socket for a listening coil, a small wound piece that lets us measure the returning pulse. My mother called that answer a promise. I keep her word beside the reading, so I remember whom the light serves.','One coil is in a chest inside the cave south of here. Bring it out through a marked exit and fit it in the socket beside me. Then we can test the answer together.'],[track(ids[1],'I’ll bring back the coil')],{repeatText:'The southern cave holds the coil. Its marked exit brings you back to my socket.'}),
  pending:node('Let us finish the returning-current test.',[track(ids[1],'Show me the next step')],{reviewMissionId:ids[1]}),
  ready:node(['The coil is seated, and the relay answers. I have checked it twice. That does not tell us how every household fares, but it gives us a current we can follow.','Talla Three-Wicks keeps three branches at Wamwammigtraawsho: Exchange, Homes and Labyrinth. Tell her we restored the return, and ask whether all three branches can hold light together.'],[report(ids[1],'The returning pulse holds')]),
  'story-complete':node(['I have recorded the fitted coil and the pulse we repeated. Talla can now test who shares that current.','Her three branches need no secret order. Wake each one and let her hear what you observed.'],[{text:'I’ll bring your reading to Talla',navigateActorId:talla.id},{text:'Continue the journey',continueMain:true}],{repeatText:'The coil holds. Bring our returning-current reading to Talla Three-Wicks.'}),
  'not-yet':node('The lamps need care, but first ask Orro and Marn to check the roadside light. We should know what arrives before we measure what returns.',[{text:'Take me to Orro',navigateActorId:orro.id}]),
 },[{when:state(ids[1],'completed'),nodeId:'story-complete'},{when:state(ids[1],'ready-to-turn-in'),nodeId:'ready'},{when:state(ids[1],'locked'),nodeId:'not-yet'},{when:{flag:['dialogue-seen:dialogue:'+pella.id+':greeting',true]},nodeId:'pending'}]);
 define(talla,{
  greeting:node(['Pella sent a current we can check. I am Talla Three-Wicks. Exchange, Homes and Labyrinth are three paths from the same supply. A bright road is little comfort if one of those paths remains dark.','My aunt counted the lamps from her window and knew which houses were awake after supper. I measure current now; her question about the windows stays with me.','Wake the three conductors beside me in any order. Then tell me whether all three branches hold. We will carry that observation forward without pretending it answers every question.'],[track(ids[2],'I’ll wake all three branches')],{repeatText:'Wake Exchange, Homes and Labyrinth in any order. Tell me whether their light holds together.'}),
  pending:node('There is still a branch to check.',[track(ids[2],'Show me the remaining branch')],{reviewMissionId:ids[2]}),
  ready:node(['All three branches hold. Orro’s road light, Pella’s returning pulse, and this shared supply now belong in the same account.','Saima of Nine Measures keeps the public tables at Migbushoprahshotra, the Measured Oasis. A pulse there falls outside her prediction. She will want readings, not a traveler’s grand theory.','Bring her these three branches and tell her how you checked them. If her test disagrees with us, bring the disagreement too.'],[report(ids[2],'Carry our three readings forward')]),
  'story-complete':node(['I have put your account beside Pella’s. Saima knows it comes from me. The Measured Oasis is your next stop.','She may doubt what a few repaired relays can prove about a whole network. That is a fair question. Let her see the work, and listen to what the tables missed.'],[{text:'I’ll bring the account to Saima',navigateActorId:'actor:antipion:principal:0'},{text:'Continue the journey',continueMain:true}],{repeatText:'Saima is waiting at the Measured Oasis. Bring the three readings, and leave room for her questions.'}),
  'not-yet':node('I can test these three branches when Pella has restored the returning current. Help her with the listening coil first; then we will know what supply we share.',[{text:'Take me to Pella',navigateActorId:pella.id}]),
 },[{when:state(ids[2],'completed'),nodeId:'story-complete'},{when:state(ids[2],'ready-to-turn-in'),nodeId:'ready'},{when:state(ids[2],'locked'),nodeId:'not-yet'},{when:{flag:['dialogue-seen:dialogue:'+talla.id+':greeting',true]},nodeId:'pending'}]);
}

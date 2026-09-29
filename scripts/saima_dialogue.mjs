import {SAIMA_REGIONS} from './mission_templates.mjs';
import {solvePuzzle} from '../jCRPG-engine/js/interactions/puzzles.js';

// Authored captions from the Measured Oasis brief. Runtime loads each speaker separately.
const captions={
  "saimaGreeting": [
    "Talla sent you with three branches awake. I am Saima. I keep the Nine Measures, the public account of what the Grid carries and where it goes. People in this oasis plan their work by it.",
    "You have done them a service, but I do not yet know you well enough to amend that account on your word. Last season a lovely pattern drew current away from a house where someone was ill. The instruments were correct about the current; our judgment about its use was not.",
    "A pulse here has been excluded because it falls outside our prediction. Read the three conductors before changing them, then help Varo test what the table missed. If the result holds, I will take your account seriously beyond this courtyard."
  ],
  "saimaHint": [
    "Varo keeps the three conductors beside this shelter. He will show you the recorded loads; read each one before you set it.",
    "Come back after the local current holds. I want the outlying pulse beside the readings that did repeat."
  ],
  "localAccount": [
    "I asked Varo to run it again. The steady loads are where we expected. The fourth pulse is also there, and we cannot explain it by wishing it away.",
    "You brought me a result narrower than a grand theory, and therefore useful. I owe you that much. But I will not change a rule for four towns because one courtyard agrees with us.",
    "Each town has a keeper and a witness beyond our usual circle. Bring their accounts back separately. If they disagree, bring the disagreement too."
  ],
  "regionalAccount": [
    "The roads are lit for the four keepers. Iva asks what happened in the ground; Mira asks what we can honestly say; Varis tests a failed prediction; Tavi asks whose voice a decision has room to hear.",
    "You have brought back {completedCount} of four accounts. {nextKeeperName} still needs your help at {nextTownName}. I will read the others while you travel; you need not return after each one.",
    "If a witness unsettles our numbers, let that unease travel home with the measurement. We are capable of holding both until we know more."
  ],
  "fourAccounts": [
    "You came back with four accounts and none of them is a copy of mine. I believed you might choose the readings that made our first answer look clever. Instead you brought the awkward ones too.",
    "I have begun to look forward to your return. Please do not tell Varo I said that before I asked him to check the totals.",
    "Iva’s ground, Mira’s words, Varis’s tested thought, Tavi’s open decision: Nemi calls that a way of attending. We can give it a public form without pretending it predicts every future pulse.",
    "There is a sequence device here beside the measures. Nemi will name the order; Varo will verify its starting condition. When all four accounts have been reported, I will trust you to set it."
  ],
  "finalHint": [
    "Nemi names the order Ground, Word, Pattern, Welcome. Varo says all four measures are ready to answer. The sequence device is beside this shelter.",
    "A wrong pulse only restarts its order. The four reports stay in the record. When the device holds, come back so we can choose what the public account will promise."
  ],
  "finalAccount": [
    "The four measures answered in the order we named. Varo has checked that the signal repeats; Nemi has recorded why that order helps her listen. Those are different statements, and both may stay.",
    "I can amend the public account to include a named remainder: a place for a witnessed pulse we cannot yet explain. It will not be counted as supply, and it will not be erased from consideration.",
    "I began by asking you to prove yourself. You kept returning with other people’s words intact. I trust that care more than a perfect recitation. Shall we keep this record open together?"
  ],
  "journeyComplete": [
    "The roadside light, Pella’s coil, Talla’s three branches, and these four accounts now have a place in the same public record. The current reaches farther; the obligation reaches with it.",
    "I did not expect to be glad to see a traveler arrive with another correction. You have made me glad. If we have learned anything, it is to leave the next page unfilled until someone can bring us what we missed.",
    "Rest here if you wish. Other towns have their own ways of making a shared light answerable. I would like to hear what they teach you."
  ],
  "varo": [
    "Saima asks for a second pair of eyes whenever a result will affect the public table. Mine are slow eyes, which is useful when everyone else is excited.",
    "Read Measured, Repeated, and Remainder before touching the conductors. The first reading tells us what the instrument claims. We can then ask whether the claim survives the same test twice.",
    "I am not trying to keep wonder out of the room. I am trying to make sure a family can tell whether the light promised to them is actually coming."
  ],
  "nemi": [
    "Varo hears the pulse when it repeats. I hear the long space before it. Sometimes that space makes me notice where I should ask him to measure.",
    "Once I thought the wind was answering me. It was the upper channel cooling at dusk. I was disappointed, then delighted; the wind had led me to a real question.",
    "Saima is right to ask for evidence from the towns. A symbol that never risks being wrong becomes a way of refusing to listen."
  ],
  "iva": [
    "You came from Saima? Then perhaps she will finally believe my spring. I have measured it each thaw since my brother taught me how to keep the marker level.",
    "This year the water warmed before the ice above it broke. The capital's table called that sensor drift. Perhaps it is drift. But Ketu saw the first tracks and wrote down the hour and the weather beside mine.",
    "Read the spring marker at Trashoprah, hear Ketu, then touch the single measuring relay here. It is one check, not an incantation. I want our conditions carried with the number."
  ],
  "ketu": [
    "I crossed above Trashoprah before sunrise. The snow held my weight; by the spring it had begun to soften. I could tell by the edge of a track I made on my way in.",
    "Iva's marker had risen. I wrote the time and the ice condition because neither of us had expected warmth so soon.",
    "I do not know what warmed it. Tell Saima what we saw together, and tell her what we still cannot say."
  ],
  "mira": [
    "Seli arrived here with three families after dark. I entered their arrival in the town record. Then I wrote that a change in the Grid had driven them down from the pass.",
    "She had said they were afraid of the sound under the ice. I turned her fear into my explanation, and people repeated it as a measured cause. She has every right to be angry with me.",
    "I have made three lamps so I cannot do it again unnoticed: what we observed, what a person reported, and what we inferred. Will you help me light all three without asking one to impersonate another?"
  ],
  "seli": [
    "The children heard something below the ice. I heard it too. We came down the pass because I would rather be embarrassed in a warm room than brave on a breaking path.",
    "Mira wrote that the Grid drove us out. I did not say that. I said what I heard and what we chose.",
    "She came to apologize. I would like her record to be as careful as her apology."
  ],
  "varis": [
    "I predicted the pulse here for nine seasons. The model was simple enough that other keepers could check it, and I took pride in that. This season it missed.",
    "I have been tempted to call Aro's warning lucky. He noticed a change in the wind and thaw before my instrument registered it. Luck is possible. So is a condition my model left out.",
    "Read the outlying marker, hear him for yourself, and choose only the branches whose measured values reach the new load. The total will stay visible as you work. I want to put the failed prediction beside the revision."
  ],
  "aro": [
    "The morning wind came up the slope while the lower snow was melting. It usually turns the other way by then. I thought the pulse would arrive late.",
    "I told Varis before we saw the instrument. I was right about the delay, but I cannot promise I know why. The mountain has made a fool of me often enough.",
    "If he finds a quantity that explains it, tell me. I would rather learn than win an argument."
  ],
  "tavi": [
    "We have families waiting for the lamps. Naru says the rock gives warning before a surge; our damaged listener says nothing. I can hear him fairly, but I cannot tell the town to spend a winter's reserve on my courtesy alone.",
    "The old listening element is in a chest within the nearby cave. When the socket failed, no one wanted to go below to replace it. I waited too long for a perfect answer.",
    "Speak to Naru, read the local marker, bring back the element, and fit it here. Then I can make a decision with a test in hand and a witness at the table."
  ],
  "naru": [
    "The stone carries a low sound before the line brightens. My grandmother heard it with her cheek against the wall. I hear it through my feet now.",
    "I do not know whether the stone warns us or simply answers the same change a moment earlier. I have told Tavi where to listen and when.",
    "If the new element hears nothing, I will help look for another cause. I would like the lamps on as much as anyone."
  ]
};

export function authorSaima({content,chunks,portals,reachable,safeNear,anchor,objective}) {
 const actor=id=>content.actors.find(a=>a.id===id),mission=id=>content.missions.find(m=>m.id===id),puzzle=id=>content.puzzles.find(p=>p.id===id);
 const saima=actor('actor:antipion:principal:0'),varo=actor('actor:antipion:principal:1'),nemi=actor('actor:antipion:principal:2');
 const balance='mission:antipion:balance',meaning='mission:concordance:meaning',order='mission:concordance:order',bliss='mission:antipion:bliss';
 const regionalIds=SAIMA_REGIONS.map(r=>'mission:antipion:'+r.layer),allReports={all:regionalIds.map(id=>({missionState:[id,'completed']}))};
 const state=(id,value)=>({missionState:[id,value]}),all=(...conditions)=>({all:conditions});
 const close={text:'Maybe later'},back={text:'Back',next:'greeting'};
 const accept=(id,text)=>({text,when:state(id,'available'),actions:[{op:'accept',id}]}),report=(id,text)=>({text,when:state(id,'ready-to-turn-in'),actions:[{op:'turnIn',id}],next:'greeting'});
 const node=(text,choices=[close],extra={})=>({...(Array.isArray(text)?{captions:text}:{text}),knowledge:'testimony',choices,...extra});
 const setDialogue=(a,nodes,entries=[])=>Object.assign(content.dialogues.find(d=>d.id===a.dialogueId),{authoredStates:true,start:'greeting',nodes,entries});
 const updateAnchors=(target,fn)=>{for(const c of chunks)for(const a of c.interactions)if(a.targetId===target)fn(a);};
 const rename=(a,name)=>{a.name=name;updateAnchors(a.id,a=>a.prompt='Talk to '+name);};
 const configure=(p,values)=>{Object.assign(p,values,{stateVersion:2});p.solution=solvePuzzle(p).inputs;updateAnchors(p.id,a=>{const i=p.componentIds.indexOf(a.componentId);if(i>=0)a.prompt=(p.mechanic==='subset'?'Toggle ':p.mechanic==='all'?'Awaken ':'Inspect ')+p.labels[i];});};
 const local=puzzle('puzzle:antipion:capital');
 configure(local,{family:'rational',sequence:[],fact:'Measured needs 1 unit, Repeated needs 2, Remainder needs 3. Inspect each channel, then set its measured load. No pulse order is required.',successText:'The three measured loads hold. Varo repeats the reading; Nemi’s unexpected pulse remains beside it. Return to Saima.'});
 mission(balance).summary='Read the three channels with Varo, match their measured loads (1, 2, 3), and bring Saima the local result. This test has no sequence.';
 mission(balance).objectives[0].text='Inspect Measured, Repeated and Remainder; set their loads to 1, 2 and 3.';
 const facts=[
  'The spring marker rose before the surface ice broke. Ketu recorded the same morning’s tracks, time and thaw conditions. The cause remains unknown.',
  'Three families arrived before the predicted hour. The arrival is observed; Seli’s account is testimony; the cause of the sound under the ice remains an inference.',
  'The old model predicted five units on schedule. The delayed measured pulse carries six. Stone carries 2, Reed 3, Wind 4; test a subset against six.',
  'The local marker records a surge after Naru’s reported low sound. The damaged listening socket has not yet measured the interval.',
 ];
 const promises=['I’ll record conditions with each reading','I’ll mark observation, testimony, and inference separately','I’ll publish the failed prediction with the revision','We’ll decide with evidence and revisit the result'];
 const accepts=['I’ll check the spring','I’ll keep the three accounts visible','I’ll test the revised load','I’ll bring back the listener'];
 const reports=['I’ll carry both','I’ll bring her the correction','Both belong in the record','I’ll tell her how you decided'];
 const returns=[
  ['It held. I did not need Saima to call me right; I needed her to see what we actually measured.','Will you take her the thaw as well as the number?'],
  ['Seli read the new entry. She did not forgive the first one simply because we fixed it, but she said this one sounds like her.','Will you bring Saima the corrected record?'],
  ['I wanted to tuck the old prediction out of sight. Aro asked to see both, and he was kinder to me than I had been to his warning.','Will you take Saima the sum and the error?'],
  ['The test does not settle every question Naru asked, but it gives us a warning we can act on. The families will have light tonight.','I will review the interval after the next surge. Will you tell Saima that the decision is provisional?'],
 ];
 const repeats=['My brother would be pleased you left the weather on the page.','I still ask Seli whether I have written what she meant.','I have begun to value a model that can be corrected in public.','The lamps are on. Naru and I still compare notes.'];
 const witnessRepeats=['The track and the marker belong to the same morning. Please keep the morning with them.','We arrived before the schedule said we would. Why the ice sounded that way is still a question.','Keep the direction of the wind in the account; we can test it next thaw.','I can take you to the place I heard it. The instrument should be allowed to disagree with me.'];
 const witnessResponses=['I’ll keep both observations','I’ll carry your words as you said them','I’ll compare your observation with the readings','I’ll test the socket'];
 const partials=['Iva kept the thaw beside the temperature. I had been comparing the numbers without the winter that made them.','Mira left room for Seli’s account without printing its cause as a finding. Her restraint made the record stronger.','Varis brought back the failed prediction with his revised sum. I am glad he chose to show both.','Tavi did not ask Naru to become an instrument. She repaired an instrument so that Naru’s observation could be checked.'];
 for(const [i,r] of SAIMA_REGIONS.entries()){
  const keeper=actor('actor:antipion:regional:'+i),witness=actor('actor:antipion:witness:'+i),m=mission(regionalIds[i]),p=puzzle('puzzle:antipion:regional:'+i),reading='evidence:antipion:regional:'+i;
  rename(keeper,r.keeper);rename(witness,r.witness);
  updateAnchors(reading,a=>{a.fact=facts[i];a.prompt=['Read spring marker','Read arrival marker','Read revised load','Read surge marker'][i];});
  for(const g of content.goals.filter(g=>g.targetId===reading))g.fact=facts[i];
  const condition=all({evidence:reading},{flag:['witness-heard:'+witness.id,true]});
  // Witness captions must be heard; merely opening a conversation is not the testimony.
  m.objectives.find(o=>o.id==='witness').text='Hear '+witness.name+' at '+content.settlements.find(t=>t.id===witness.townId).name+'.';
  m.objectives.find(o=>o.id==='promise').text='Return to '+keeper.name+' and record the testable promise.';
  m.summary=[
   'Read the spring marker at Trashoprah, hear Ketu’s thaw conditions, awaken Iva’s one measuring relay and record the conditions with the number.',
   'Read the arrival marker, hear Seli’s account, and light Observed, Reported and Interpreted in any order. Return the corrected record to Mira.',
   'Read the revised load and hear Aro. Toggle Stone (2), Reed (3) and Wind (4) to total 6, then publish the old prediction beside the revision.',
   'Read the surge marker and hear Naru. Retrieve the naturally wound listening element from a marked nearby cave, fit it at Tavi’s socket, and record a provisional decision.',
  ][i];
  if(i===0){
   const removed=new Set(p.componentIds.slice(1));
   for(const c of chunks){c.interactions=c.interactions.filter(a=>!removed.has(a.componentId));c.nodes=c.nodes.filter(n=>!removed.has(n.userData?.jcrpg?.componentId));}
   content.goals=content.goals.filter(g=>![...removed].some(id=>g.id.endsWith(':'+id)));
   configure(p,{mechanic:'all',componentIds:p.componentIds.slice(0,1),labels:['Measuring relay'],demands:[1],capacity:1,sequence:[],unlockWhen:{evidenceIds:[reading],talkedActorIds:[witness.id]},fact:'One measuring relay. Spring reading: observed with thaw conditions. Awaken once after comparing the reading and Ketu’s account.',successText:'The relay answers once and holds. Iva’s temperature and Ketu’s conditions remain paired in the public record.'});
   m.objectives.find(o=>o.id==='circuit').text='Awaken Iva’s single measuring relay after comparing the spring and Ketu’s conditions.';
  }
  if(i===1){configure(p,{mechanic:'all',labels:['Observed','Reported','Interpreted'],demands:[1,1,1],capacity:3,sequence:[],fact:'Goal: all three categories visible. Order: any. Observation records the arrival; testimony preserves Seli’s words; interpretation marks the cause as unconfirmed.',successText:'Three lamps hold distinct light. No category has to borrow another’s certainty.'});m.objectives.find(o=>o.id==='circuit').text='Light Observed, Reported and Interpreted in any order.';}
  if(i===2){configure(p,{mechanic:'subset',labels:['Stone','Reed','Wind'],demands:[2,3,4],capacity:9,target:6,sequence:[],fact:facts[i],successText:'The chosen branches carry six units. The old prediction of five remains recorded beside this new measurement.'});m.objectives.find(o=>o.id==='circuit').text='Choose branches totaling 6: Stone 2, Reed 3, Wind 4. Extra branches can be toggled off.';}
  // Perform the physical test before asking the keeper for a commitment.
  m.objectives=[...m.objectives.filter(o=>o.id!=='promise'),m.objectives.find(o=>o.id==='promise')];
  const readyCondition=i===3?{flag:['fitting:antipion:wisdom:listener',true]}:{puzzle:p.id};
  const commitment={text:promises[i],when:all(state(m.id,'active'),condition,readyCondition),actions:[{op:'commitment',id:'commitment:'+m.id,value:promises[i]}],next:'greeting'};
  const extra=[
   {label:'What did your brother teach you?',text:'Write down the morning too. Numbers without weather are lonely things.'},
   {label:'Can I speak to Seli?',text:'She can tell you what she heard, what she chose, and what the record changed.'},
   {label:'What did the old model predict?',text:'Five units, arriving on schedule. The measured pulse was late and carried six. Stone gives two, Reed three, Wind four. Keep only the branches that reach six.'},
   {label:'Why trust Naru?',text:'Because he has described where and when the sound arrives, and he welcomes a check. Trusting his honesty does not require me to declare his explanation correct.'},
  ][i];
  setDialogue(keeper,{
   greeting:node(captions[r.speaker],[accept(m.id,accepts[i]),{text:extra.label,next:'context'},close],{repeatText:'Will you help me test this account?'}),
   context:node(extra.text,[...(i===1?[{text:'Let me hear Seli’s account',navigateActorId:witness.id}]:[]),back,close]),
   ['hint:'+m.id]:node('Intuition will show the next unfinished step.',[commitment,{text:'Guide me to the next step',trackMissionId:m.id},close],{reviewMissionId:m.id,readyText:'The test holds. Let us record what we can promise.'}),
   ready:node(returns[i],[report(m.id,reports[i]),close]),
   completed:node(repeats[i],[{text:'Continue Saima’s account',continueMain:true},{text:'Until next time'}]),
   locked:node('Saima is comparing the local readings first. Bring her that result; then we can test its reach here.',[{text:'Take me to Saima',navigateActorId:saima.id},close]),
  },[{when:state(m.id,'completed'),nodeId:'completed'},{when:state(m.id,'ready-to-turn-in'),nodeId:'ready'},{when:state(m.id,'active'),nodeId:'hint:'+m.id},{when:state(m.id,'locked'),nodeId:'locked'}]);
  setDialogue(witness,{
   greeting:node(captions[r.visitor],[{text:witnessResponses[i],actions:[{op:'flag',id:'witness-heard:'+witness.id,value:true}]},{text:'Until next time'}],{repeatText:witnessRepeats[i]}),
   completed:node(['I heard the relay answer after the test. '+repeats[i]], [{text:'Until next time'}]),
  },[{when:state(m.id,'completed'),nodeId:'completed'}]);
 }
 // A short retrieval in the nearest real cave, proven connected to its portal.
 const tavi=actor('actor:antipion:regional:3'),wisdom=mission(regionalIds[3]);
 const candidates=portals.filter(p=>p.kind==='cave'&&p.id!=='cave:760:920:0').sort((a,b)=>Math.hypot(a.from[0]-tavi.position[0],a.from[2]-tavi.position[2])-Math.hypot(b.from[0]-tavi.position[0],b.from[2]-tavi.position[2]));
 const portal=candidates[0];if(!portal)throw Error('No cave for the wisdom listener');
 const cells=reachable({origin:portal.to.map(Math.floor),size:[1,1,1]},'cave',portal.to.map(Math.floor));
 if(cells.length<12)throw Error('Wisdom cave is too small');
 const position=cells[Math.min(cells.length-1,18)],containerId='container:antipion:wisdom:listener',itemId='item:antipion:wisdom:listener',fittingId='fitting:antipion:wisdom:listener';
 content.itemTypes.push({id:'NaturallyWoundListener',name:'Naturally wound listening element',usable:false,note:'Fit this element to Tavi’s socket in Trashobu.'});
 content.containers.push({id:containerId,name:'Old listener chest',position,realm:'cave',portalId:portal.id,items:[{id:itemId,typeId:'NaturallyWoundListener',quantity:1}],lock:null,trap:null,acquisitionText:'You take the naturally wound listening element. The socket in Trashobu is marked.'});
 anchor('container',containerId,position,{realm:'cave',asset:'chest',prompt:'Open old listener chest'});
 const caveGoal={entrancePosition:portal.from,portalId:portal.id,entranceName:'Enter the listener cave near Trashobu'};
 Object.assign(content.goals.find(g=>g.targetId===containerId),caveGoal);
 content.goals.push({id:'goal:'+itemId,kind:'container',targetId:itemId,position,realm:'cave',name:'Naturally wound listening element',...caveGoal});
 const fittingPosition=safeNear([tavi.position[0]-4,tavi.position[1],tavi.position[2]]);
 anchor('fitting',fittingId,fittingPosition,{asset:'conductor',prompt:'Fit listening element',itemId,missionId:wisdom.id});
 content.fittings.push({id:fittingId,itemId,missionId:wisdom.id,consume:true,missingText:'Bring the naturally wound listening element from the marked cave first.',successText:'A low pulse reaches the socket before the surge. Tavi records the interval; Naru’s earlier observation can now be repeated.',onComplete:[{op:'settlement',id:tavi.townId}]});
 wisdom.objectives=[...wisdom.objectives.filter(o=>!['circuit','promise'].includes(o.id)),objective('listener','item',[itemId],'Retrieve the listening element from the marked chest in the nearby cave.'),objective('fit-listener','fitting',[fittingId],'Return through a marked exit and fit the listening element beside Tavi.'),wisdom.objectives.find(o=>o.id==='promise')];
 // The historical wisdom circuit remains an optional repair, with its save ID intact.
 const finalId='puzzle:antipion:final-sequence',labels=['Ground','Word','Pattern','Welcome'],components=labels.map(l=>finalId+':'+l.toLowerCase());
 const final={id:finalId,townId:saima.townId,mechanic:'sequence',family:'resonance',demands:[1,1,1,1],capacity:4,labels,componentIds:components,sequence:[...components],resettable:true,wrongInput:'reset',unlockWhen:{completedMissionIds:regionalIds},clueActorId:nemi.id,clueFlag:'saima:final-order-heard',fact:'Four reported accounts, one returning current.',successText:'Four distinct pulses settle into one returning current. The capital relay and its linked lights answer. Speak to Saima about what this result should mean.',onComplete:[{op:'flag',id:'saima:final-signal',value:true}],sourceKind:'web-authored-generated'};
 const nearbyShrine=[...content.shrines].sort((a,b)=>Math.hypot(a.position[0]-saima.position[0],a.position[2]-saima.position[2])-Math.hypot(b.position[0]-saima.position[0],b.position[2]-saima.position[2]))[0];
 final.onComplete.push({op:'shrine',id:nearbyShrine.id});
 for(const [i,componentId]of components.entries()){
  const p=safeNear([saima.position[0]+i*3,saima.position[1],saima.position[2]-6]);
  anchor('puzzle',finalId,p,{componentId,prompt:'Pulse '+labels[i],asset:'conductor',settlementId:saima.townId});if(!i)final.position=p;
 }
 anchor('puzzle',finalId,safeNear([saima.position[0]-3,saima.position[1],saima.position[2]-6]),{componentId:finalId+':reset',input:'reset',prompt:'Reset four measures',asset:'resetStone'});
 content.goals.push({id:'goal:'+finalId,kind:'puzzle',targetId:finalId,position:final.position,realm:'surface',name:'Four measures'});
 final.solution=solvePuzzle(final).inputs;content.puzzles.push(final);
 mission(bliss).objectives.unshift(objective('four-measures','puzzle',[finalId],'Hear Nemi’s order, then pulse Ground → Word → Pattern → Welcome.'));
 mission(bliss).summary='After all four regional reports, hear Nemi’s named order, pulse the four measures and decide with Saima what the public record will promise.';
 // A completed old synthesis cannot bypass the new device in an unfinished chapter.
 mission(order).objectives.splice(4,0,objective('four-measures','puzzle',[finalId],'Test the four measures after all four regional reports.'));
 mission(order).regionalMissionIds=regionalIds;
 mission(order).summary='Bring Saima four independent reports: Iva’s spring reading, Mira’s public categories, Varis’s revised sum and Tavi’s repaired listener. Each keeper must receive your report. Then hear Nemi’s order and perform the four-measure test at the Measured Oasis.';
 for(const [i,id]of regionalIds.entries())mission(order).objectives[i].text=SAIMA_REGIONS[i].keeper+' — '+mission(id).title+' (report to the keeper).';
 const regionalChoices=regionalIds.map((id,i)=>({text:'Guide me to '+content.settlements.find(t=>t.id===actor('actor:antipion:regional:'+i).townId).name,when:{not:state(id,'completed')},trackMissionId:id,actions:[{op:'route',id:'route:antipion:'+i}]}));
 const doneLocal=report(balance,'The local readings hold'),recordLocal=report(meaning,'Record the local result');
 const commitFinal={text:'Keep the record open',when:all(state(bliss,'active'),{puzzle:finalId}),actions:[{op:'commitment',id:'commitment:antipion:breath',value:'Keep observation, testimony and open questions distinct; repeat the account when new evidence arrives.'},{op:'turnIn',id:bliss}],next:'greeting'};
 const sd=setDialogue(saima,{
  greeting:node(captions.saimaGreeting,[accept(balance,'I’ll read the conductors'),{text:'Why did the table reject the pulse?',next:'saima:table'},close],{repeatText:'Varo has the three measured loads. Will you test them before we speak for the towns?'}),
  ['hint:'+balance]:node(captions.saimaHint,[{text:'Guide me to the next reading',trackMissionId:balance},close],{reviewMissionId:balance}),
  'local-ready':node(['Varo has repeated your test. The three loads hold; the pulse we excluded is still there.','Tell me what you observed, and we will keep it beside the prediction.'],[doneLocal,close]),
  'local-account':node(captions.localAccount,[recordLocal,{text:'Why four towns?',next:'saima:four-towns'},close],{repeatText:'Four independent accounts will tell us whether this result can travel. Shall I record the local test?'}),
  'regional-account':node(captions.regionalAccount,[...regionalChoices,{text:'What have you heard from the others?',next:'saima:partial'},{text:'I’ll return with the remaining accounts'}],{repeatText:'You have brought back {completedCount} of four accounts. {nextKeeperName} still needs your help at {nextTownName}.'}),
  'saima:partial':node('I am waiting for the first keeper’s report. Bring the conditions home with the number.',[{text:'Back to the regional work',next:'regional-account'},close],{reportCaptions:partials.map((text,i)=>({text,when:state(regionalIds[i],'completed')}))}),
  'four-accounts':node(captions.fourAccounts,[accept(bliss,'I’ll prepare the four measures'),{text:'I want to hear Nemi first',navigateActorId:nemi.id},close],{repeatText:'I am glad you brought the awkward readings too. Nemi can name the order; Varo has checked the starting conditions.'}),
  ['hint:'+bliss]:node(captions.finalHint,[{text:'Let me hear Nemi’s order',navigateActorId:nemi.id},{text:'Guide me to the four measures',trackMissionId:bliss},close]),
  'historical-synthesis':node('Your earlier shared practice remains in the record. This new four-measure device is a separate test; Nemi will name its order.',[{text:'Let me hear Nemi’s order',navigateActorId:nemi.id},{text:'Continue the final test',trackMissionId:order},close]),
  'final-account':node(captions.finalAccount,[commitFinal,report(bliss,'Keep the record open'),{text:'What does the remainder change?',next:'saima:remainder'},{text:'I need a moment'}]),
  'chapter-report':node('The four accounts and the returning signal now stand together. Shall we enter the shared practice in the public record?', [report(order,'Record our shared practice'),close]),
  'journey-complete':node(captions.journeyComplete,[{text:'Tell me how the record changed',next:'saima:remainder'},{text:'Until next time'}],{repeatText:'You have made me glad to see another correction arrive. The next page is still open.'}),
  'saima:table':node('The table keeps a range from readings we could repeat. This pulse arrived outside it. We may have measured badly, or the world may have changed; calling it false before we check would make the range a law it never earned.',[back,close]),
  'saima:four-towns':node('A shared current crosses four regions before it returns here. A correction that works only in the capital is another way of making the capital comfortable at someone else’s cost.',[back,close]),
  'saima:remainder':node('Anyone may ask us to repeat a reading, and anyone may point to what our account failed to see. We will mark the claim, its witness, and what would test it; we will not sell uncertainty as power we can spend.',[back,close]),
 },[
  {when:state(order,'completed'),nodeId:'journey-complete'},
  {when:state(order,'ready-to-turn-in'),nodeId:'chapter-report'},
  {when:state(meaning,'ready-to-turn-in'),nodeId:'local-account'},
  {when:all({puzzle:finalId},{any:[state(bliss,'active'),state(bliss,'ready-to-turn-in')]}),nodeId:'final-account'},
  {when:all(allReports,state(bliss,'completed')),nodeId:'historical-synthesis'},
  {when:all(allReports,state(bliss,'active')),nodeId:'hint:'+bliss},
  {when:allReports,nodeId:'four-accounts'},
  {when:state(meaning,'completed'),nodeId:'regional-account'},
  {when:state(balance,'completed'),nodeId:'local-account'},
  {when:state(balance,'ready-to-turn-in'),nodeId:'local-ready'},
  {when:state(balance,'active'),nodeId:'hint:'+balance},
 ]);
 sd.regionalMissionIds=regionalIds;
 setDialogue(varo,{
  greeting:node(captions.varo,[{text:'Show me the recorded loads',next:'loads'},{text:'How do you record an unknown?',next:'unknown'},{text:'I’ll test them',trackMissionId:balance,when:{not:state(balance,'completed')}},close],{repeatText:'Read each conductor before changing it. A household should be able to check the light we promise.'}),
  loads:node(local.fact,[back,close],{puzzleHintId:local.id,knowledge:'fact'}),
  unknown:node('A claim gets a witness and conditions before it gets a cause. A second reading can disagree with the first.',[back,close]),
  'four-accounts':node('I checked each account against its own conditions. Their differences survived the check. The final device is ready; Nemi may name an order, and I will tell you whether it truly repeats.',[{text:'Let me hear Nemi',navigateActorId:nemi.id},close]),
  completed:node('The named order repeats. I have entered that result separately from the meaning Nemi gives it.',[{text:'Until next time'}]),
 },[{when:{puzzle:finalId},nodeId:'completed'},{when:allReports,nodeId:'four-accounts'}]);
 const hearOrder={text:'Ground, Word, Pattern, Welcome',actions:[{op:'flag',id:final.clueFlag,value:true}],continueMain:true};
 setDialogue(nemi,{
  greeting:node(captions.nemi,[{text:'What do you sense here?',next:'sensed'},close],{repeatText:'My impression can tell Varo where to measure. It cannot tell him what the result must be.'}),
  sensed:node('I notice a long space before the pulse. It may be a cooling channel again. Until we compare the towns, it is an observation to check, not an order to perform.',[back,close]),
  'four-accounts':node(['Iva brought us ground. Mira brought a word we can answer for. Varis brought a pattern he let fail. Tavi made room for the next person.','The four marks on the device are Ground, Word, Pattern, Welcome. Touch them in that order. It is a reminder of how we reached a judgment, not a hidden law of the Grid.','If the signal disagrees, we will keep the disagreement. We can begin again without undoing what anyone told us.'],[hearOrder,{text:'I’ll return to Saima',navigateActorId:saima.id},close],{repeatText:'Ground, Word, Pattern, Welcome. The order repeats our account, not a law of the world.'}),
  completed:node('The circuit repeated the named order. That tests an action, not every meaning I hear in it. I am glad the unknown still has a place.',[{text:'I’ll return to Saima',navigateActorId:saima.id},{text:'Until next time'}]),
 },[{when:{puzzle:finalId},nodeId:'completed'},{when:allReports,nodeId:'four-accounts'}]);
 return {portalId:portal.id,reachableCells:cells.length,containerId,itemId,fittingId};
}

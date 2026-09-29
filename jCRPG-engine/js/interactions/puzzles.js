/** Small enumerable machine: exact branch quantities followed by observable resonance. */
export function initialPuzzle(p) {return {values:p.demands.map(()=>0),observed:[],cursor:0,completed:false,...(p.stateVersion?{version:p.stateVersion}:{})};}
export function puzzleStep(p,old,input) {
 const s=structuredClone(old??initialPuzzle(p));
 if(s.completed)return s;
 if(input==='reset')return initialPuzzle(p);
 const i=p.componentIds.indexOf(input);if(i<0)throw Error('Unknown puzzle component');
 if(p.mechanic==='all'){if(!s.observed.includes(input))s.observed.push(input);s.values[i]=s.values[i]?0:p.demands[i];s.completed=s.values.every((v,j)=>v===p.demands[j]);return s;}
 if(p.mechanic==='subset'){s.values[i]=s.values[i]?0:p.demands[i];s.observed=p.componentIds.filter((id,j)=>s.values[j]);s.completed=s.values.reduce((a,b)=>a+b,0)===p.target;return s;}
 if(p.mechanic==='sequence'){s.cursor=input===p.sequence[s.cursor]?s.cursor+1:0;s.observed=p.sequence.slice(0,s.cursor);s.values=p.componentIds.map(id=>s.observed.includes(id)?1:0);s.completed=s.cursor===p.sequence.length;return s;}
 if(!s.observed.includes(input)){s.observed.push(input);return s;}
 const rational=p.family==='resonance'||s.values.every((n,j)=>n===p.demands[j]);
 if(!rational){s.values[i]=(s.values[i]+1)%(p.capacity+1);s.cursor=0;}
 else if(p.family==='rational')s.completed=true;
 else {s.cursor=input===p.sequence[s.cursor]?s.cursor+1:input===p.sequence[0]?1:0;s.completed=s.cursor===p.sequence.length;}
 if(p.family==='rational'&&s.values.every((n,j)=>n===p.demands[j]))s.completed=true;
 return s;
}
export function puzzleHint(p,s=initialPuzzle(p)) {
 if(p.mechanic==='subset')return `${p.fact} ${p.labels.map((label,i)=>`${label} ${p.demands[i]} [${s.values[i]?'on':'off'}]`).join(' · ')}. Current total ${s.values.reduce((a,b)=>a+b,0)}; observed goal ${p.target}. Toggle a branch to include or remove its value.`;
 if(p.mechanic==='sequence')return `The four regional accounts are present. Current order: ${p.sequence.map(id=>p.labels[p.componentIds.indexOf(id)]).join(' → ')}. Progress: ${s.cursor}/${p.sequence.length}. Touch a named measure to pulse it; a different next measure resets this attempt only.`;
 if(p.mechanic==='all')return p.fact+' '+p.labels.map((label,i)=>label+': '+(s.values[i]?'awake':'off')).join(' · ');
 const readings=p.componentIds.map((id,i)=>`${p.labels[i]}: ${s.values[i]} / demand ${p.demands[i]}`).join(' · ');
 const sequence=p.sequence.map(id=>p.labels[p.componentIds.indexOf(id)]).join(' → ');
 return `${p.fact} Capacity ${p.capacity}. ${readings}. ${p.family==='rational'?'Match the measured demands.':`Resonance cue: ${sequence}. Once quantities match, pulse that order; a wrong pulse restarts the sequence.`} ${s.completed?'Stable current.':`Resonance ${s.cursor}/${p.sequence.length}.`}`;
}
export function solvePuzzle(p) {
 // Construct a witness and replay it through the production machine. Every wrong
 // configuration can reset; no puzzle in this release closes a navigation edge.
 let s=initialPuzzle(p);const inputs=[];const step=id=>{inputs.push(id);s=puzzleStep(p,s,id);};
 if(p.mechanic==='subset'){const chosen=subsetSolution(p);if(!chosen)throw Error('Unsolvable subset '+p.id);for(const id of chosen)step(id);return {inputs,states:inputs.length+1};}
 if(p.mechanic==='sequence'){for(const id of p.sequence)step(id);if(!s.completed)throw Error('Unsolvable sequence '+p.id);return {inputs,states:inputs.length+1};}
 for(const id of p.componentIds)step(id);
 if(p.mechanic==='all')return {inputs,states:inputs.length+1};
 if(p.family!=='resonance')for(let i=0;i<p.demands.length;i++)for(let n=0;n<p.demands[i];n++)step(p.componentIds[i]);
 if(p.family!=='rational')for(const id of p.sequence)step(id);
 if(!s.completed)throw Error('Unsolvable puzzle '+p.id);
 return {inputs,states:inputs.length+1};
}

/** Bounded enumeration: at most eight branches, no hidden allocation phase. */
export function subsetSolution(p) {
 for(let mask=1;mask<(1<<p.componentIds.length);mask++){
  const ids=p.componentIds.filter((_,i)=>mask&(1<<i));
  if(p.demands.reduce((sum,n,i)=>sum+((mask&(1<<i))?n:0),0)===p.target)return ids;
 }
 return null;
}
export function puzzleAvailability(p,s) {
 const gate=p.unlockWhen??{},ids=gate.completedMissionIds??[];
 const missing=ids.filter(id=>s.missions[id]?.state!=='completed');
 if(missing.length)return {available:false,label:'Four regional accounts needed',message:`The four measures are still. ${ids.length-missing.length}/${ids.length} regional accounts have been reported to their keepers. Return with the others before Saima can convene the final test.`};
 if((gate.evidenceIds??[]).some(id=>!s.evidence[id])||(gate.talkedActorIds??[]).some(id=>!s.actors[id]?.talked))return {available:false,label:'Compare the reading and witness first',message:'Read the spring marker and hear Ketu’s conditions before awakening the measuring relay.'};
 return {available:true};
}

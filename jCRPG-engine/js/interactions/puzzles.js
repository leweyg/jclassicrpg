/** Small enumerable machine: exact branch quantities followed by observable resonance. */
export function initialPuzzle(p) {return {values:p.demands.map(()=>0),observed:[],cursor:0,completed:false};}
export function puzzleStep(p,old,input) {
 const s=structuredClone(old??initialPuzzle(p));
 if(s.completed)return s;
 if(input==='reset')return initialPuzzle(p);
 const i=p.componentIds.indexOf(input);if(i<0)throw Error('Unknown puzzle component');
 if(p.mechanic==='all'){if(!s.observed.includes(input))s.observed.push(input);s.values[i]=s.values[i]?0:p.demands[i];s.completed=s.values.every((v,j)=>v===p.demands[j]);return s;}
 if(!s.observed.includes(input)){s.observed.push(input);return s;}
 const rational=p.family==='resonance'||s.values.every((n,j)=>n===p.demands[j]);
 if(!rational){s.values[i]=(s.values[i]+1)%(p.capacity+1);s.cursor=0;}
 else if(p.family==='rational')s.completed=true;
 else {s.cursor=input===p.sequence[s.cursor]?s.cursor+1:input===p.sequence[0]?1:0;s.completed=s.cursor===p.sequence.length;}
 if(p.family==='rational'&&s.values.every((n,j)=>n===p.demands[j]))s.completed=true;
 return s;
}
export function puzzleHint(p,s=initialPuzzle(p)) {
 if(p.mechanic==='all')return p.fact+' '+p.labels.map((label,i)=>label+': '+(s.values[i]?'awake':'off')).join(' · ');
 const readings=p.componentIds.map((id,i)=>`${p.labels[i]}: ${s.values[i]} / demand ${p.demands[i]}`).join(' · ');
 const sequence=p.sequence.map(id=>p.labels[p.componentIds.indexOf(id)]).join(' → ');
 return `${p.fact} Capacity ${p.capacity}. ${readings}. ${p.family==='rational'?'Match the measured demands.':`Resonance cue: ${sequence}. Once quantities match, pulse that order; a wrong pulse restarts the sequence.`} ${s.completed?'Stable current.':`Resonance ${s.cursor}/${p.sequence.length}.`}`;
}
export function solvePuzzle(p) {
 // Construct a witness and replay it through the production machine. Every wrong
 // configuration can reset; no puzzle in this release closes a navigation edge.
 let s=initialPuzzle(p);const inputs=[];const step=id=>{inputs.push(id);s=puzzleStep(p,s,id);};
 for(const id of p.componentIds)step(id);
 if(p.mechanic==='all')return {inputs,states:inputs.length+1};
 if(p.family!=='resonance')for(let i=0;i<p.demands.length;i++)for(let n=0;n<p.demands[i];n++)step(p.componentIds[i]);
 if(p.family!=='rational')for(const id of p.sequence)step(id);
 if(!s.completed)throw Error('Unsolvable puzzle '+p.id);
 return {inputs,states:inputs.length+1};
}

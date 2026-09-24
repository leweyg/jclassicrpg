/** Separate repeatable dialogue structure from stable instance/mission IDs. */
export function dialogueTemplateGroups(content) {
 const groups=new Map();
 for(const dialogue of content.dialogues){
  if(dialogue.id==='dialogue:default:resident')continue;
  const actor=content.actors.find(a=>a.dialogueId===dialogue.id);
  const parameters={dialogueId:dialogue.id};
  if(actor?.missionIds.length===1)parameters.missionId=actor.missionIds[0];
  let text=JSON.stringify(dialogue);
  for(const [key,value] of Object.entries(parameters))text=text.replaceAll(value,'{{'+key+'}}');
  const group=groups.get(text)??{template:JSON.parse(text),instances:[]};
  group.instances.push({id:dialogue.id,parameters});groups.set(text,group);
 }
 return [...groups.values()];
}

/** Accessible bounded panels; world movement pauses while a panel owns focus. */
export class InteractionUI {
 constructor(state,renderer,log){
  this.state=state;this.renderer=renderer;this.log=log;this.returnFocus=null;
  this.dialog=document.createElement('dialog');this.dialog.id='interaction-panel';this.dialog.setAttribute('aria-labelledby','interaction-title');
  this.dialog.innerHTML='<header><h2 id="interaction-title"></h2><button type="button" aria-label="Close interaction">Close</button></header><div id="interaction-body"></div>';
  document.body.append(this.dialog);this.body=this.dialog.querySelector('#interaction-body');this.title=this.dialog.querySelector('h2');
  this.dialog.querySelector('header button').onclick=()=>this.close();this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();});
  this.dialog.addEventListener('keydown',e=>{if(e.repeat)return;if(e.key.toLowerCase()==='e'){e.preventDefault();(this.dialog.contains(document.activeElement)&&document.activeElement.tagName==='BUTTON'?document.activeElement:this.body.querySelector('button'))?.click();}if(['ArrowDown','ArrowUp','w','s'].includes(e.key)){e.preventDefault();const buttons=[...this.body.querySelectorAll('button')],index=buttons.indexOf(document.activeElement),direction=['ArrowUp','w'].includes(e.key)?-1:1;buttons[(index+direction+buttons.length)%buttons.length]?.focus();}});
 }
 text(tag,value,parent=this.body){const el=document.createElement(tag);el.textContent=value;parent.append(el);return el;}
 button(label,action,parent=this.body){const b=this.text('button',label,parent);b.type='button';b.onclick=()=>{try{action();}catch(error){this.log(error.message);}};return b;}
 open(title){this.title.textContent=title;this.body.replaceChildren();if(!this.dialog.open){this.returnFocus=document.activeElement;this.renderer.setInputEnabled(false);this.dialog.showModal();}}
 focus(){(this.body.querySelector('button')??this.dialog.querySelector('button')).focus();}
 close(){this.state.interactions.panel=null;this.dialog.close();this.renderer.setInputEnabled(true);this.returnFocus?.focus();this.renderer.requestRender();}
 commit(actions){const result=this.state.interactions.transact(actions);this.state.saveDeltas.persist(this.state.party.position,this.state.realm);this.log(result.message);this.renderer.requestRender();return result;}
 show(){const engine=this.state.interactions,panel=engine.panel;if(!panel){if(this.dialog.open)this.close();return;}
  if(panel.kind==='dialogue'){const d=engine.dialogue();this.open(d.actor.name);this.text('small',d.actor.role+' · '+d.knowledge);this.text('p',d.text);for(let i=0;i<d.choices.length;i++)this.button(d.choices[i].text,()=>{const r=engine.choose(i);this.state.saveDeltas.persist(this.state.party.position,this.state.realm);if(r.message)this.log(r.message);this.show();this.renderer.requestRender();});}
  else {const c=engine.maps.containers[panel.id],taken=this.state.saveDeltas.data.containers[c.id]?.takenItemIds??[];this.open(c.name);const items=c.items.filter(i=>!taken.includes(i.id));if(!items.length)this.text('p','This container is empty. Its contents are in your party inventory.');for(const i of items)this.button('Take '+engine.maps.itemTypes[i.typeId].name,()=>{this.commit([{op:'take',id:c.id,itemIds:[i.id]}]);this.show();});if(items.length)this.button('Take All',()=>{this.commit([{op:'take',id:c.id}]);this.show();});this.button('Continue exploring',()=>this.close());}
  this.focus();
 }
 openJournal(){this.open('Concordance journal');const engine=this.state.interactions,s=this.state.saveDeltas.data;
  this.text('p','Movement and Interact are enough. Inspect a conductor once to read it, then cycle its quantity. After all quantities match, repeat the displayed resonance order. Reset stones let you begin again.');
  for(const category of ['available','active','ready-to-turn-in','completed','failed','archived']){const entries=engine.journal().filter(m=>m.state===category&&(category!=='available'||s.actors[m.giverActorId]?.talked||m.id==='mission:wammigmig:fair-share'));if(!entries.length)continue;this.text('h3',category.replaceAll('-',' '));for(const m of entries){const article=document.createElement('article');this.body.append(article);this.text('h4',m.title,article);this.text('p',m.summary,article);const giver=engine.maps.actors[m.giverActorId];this.text('small',`${m.layer} · ${giver.name} · ${Math.floor(giver.position[0])}, ${Math.floor(giver.position[2])} · ${giver.realm}`,article);for(const o of m.progress)this.text('p',`${o.count}/${o.required} — ${o.text}`,article);}}
  if(Object.keys(s.evidence).length){this.text('h3','Observed facts');for(const id of Object.keys(s.evidence))this.text('p',engine.content.goals.find(g=>g.targetId===id)?.fact??id.replaceAll(':',' · '));}
  if(Object.keys(s.commitments).length){this.text('h3','Your commitments');for(const text of Object.values(s.commitments))this.text('p',text);}
  for(const route of Object.values(s.shrineRoutes)){const town=engine.maps.settlements[route.destinationTownId];this.text('h3','Route to '+town.name);this.text('p',route.litFrontierShrineIds.length?'Next relay: '+route.litFrontierShrineIds.map(id=>engine.maps.shrines[id].position.filter((_,i)=>i!==1).join(', ')).join('; '):'The relay chain is awake. Continue to '+town.name+'.');}
  this.button('Continue exploring',()=>this.close());this.dialog.querySelector('header button').focus();this.dialog.scrollTop=0;
 }
 openInventory(){this.open('Party inventory');const engine=this.state.interactions,inv=this.state.saveDeltas.data.inventory;for(const id of inv.order){const item=inv.items[id],type=engine.maps.itemTypes[item.typeId];this.text('h4',type.name);this.text('p',type.note);}this.button('Continue exploring',()=>this.close());this.focus();}
}

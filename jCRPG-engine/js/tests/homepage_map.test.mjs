import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PLAY_DESTINATIONS} from '../play_destinations.js';

// Exercise the generated list and its actual selection callbacks, not HTML literals.
class Element {
 constructor(){this.children=[];this.events={};this.width=1000;this.height=1000;this.style={};}
 append(...items){this.children.push(...items);}
 replaceChildren(...items){this.children=items;}
 addEventListener(type,fn){this.events[type]=fn;}
 getContext(){return new Proxy({},{get:(_,key)=>key==='createImageData'?((w,h)=>({data:new Uint8ClampedArray(w*h*4)})):(()=>{})});}
 getBoundingClientRect(){return {left:0,top:0,width:1000,height:1000};}
}
test('homepage selections expose every curated travel stop and matching editor chunk',async()=>{
 const previous={document:globalThis.document,window:globalThis.window,fetch:globalThis.fetch};
 const elements=new Map(),element=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
 globalThis.document={getElementById:element,createElement:()=>new Element(),createDocumentFragment:()=>new Element()};
 globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(url,'utf8'))});
 globalThis.window={location:{hostname:'localhost'}};
 try{
  await import('../homepage_map.js');
  for(let i=0;i<100&&!element('atlas-status').textContent;i++)await new Promise(r=>setTimeout(r,10));
  assert.match(element('atlas-status').textContent,/locations enabled/);
  for(const [id,stop]of Object.entries(PLAY_DESTINATIONS)){
   const button=element('atlas-list').children[0].children.find(b=>b.textContent.includes(stop.name));
   assert.ok(button,'Homepage lists '+stop.name);
   for(const hostname of ['localhost','127.0.0.1','leweyg.github.io']){
    window.location.hostname=hostname;button.events.click();
    const [travel,editor]=element('atlas-detail').children[2].children;
    assert.equal(new URL(travel.href,'http://localhost/').searchParams.get('location'),id);
    const local=hostname!=='leweyg.github.io',url=new URL(editor.href);
    assert.equal(editor.textContent,'3D Editor');assert.equal(url.origin,local?'http://localhost:5678':'https://leweyg.github.io');
    const chunk=`x${String(Math.floor(stop.position[0]/32)).padStart(3,'0')}_z${String(Math.floor(stop.position[2]/32)).padStart(3,'0')}.scene.json`;
    assert.equal(url.searchParams.get('file_path'),`${local?'../../':'../../../'}jclassicrpg/jCRPG-engine/worlds/seed0/v1/chunks/${chunk}`);
   }
  }
 }finally{Object.assign(globalThis,previous);}
});

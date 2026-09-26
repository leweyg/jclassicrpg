/** Shared visual definitions; actors refer to these IDs, not to model filenames. */
export const CHARACTER_MODELS = Object.freeze([
 {id:'keykit:barbarian',source:'media/models/humanoid/human/keykitv1/Barbarian.glb',asset:'characters/Barbarian.glb',scale:[1,1,1],pose:'Idle'},
 {id:'keykit:mage',source:'media/models/humanoid/human/keykitv1/Mage.glb',asset:'characters/Mage.glb',scale:[1,1,1],pose:'Idle'},
 {id:'keykit:knight',source:'media/models/humanoid/human/keykitv1/Knight.glb',asset:'characters/Knight.glb',scale:[1,1,1],pose:'Idle'},
]);
const named=new Map([
 ['legacy-actor:BoarmanTribe#381:544','keykit:barbarian'],
 ['actor:wammigmig:pella','keykit:barbarian'],
 ['actor:wammigmig:orro','keykit:mage'],
 ['actor:boarman:regional:1','keykit:barbarian'],
 ['actor:antipion:principal:0','keykit:mage'],
 ['actor:antipion:principal:1','keykit:mage'],
 ['actor:antipion:principal:2','keykit:mage'],
 ['actor:human:principal:0','keykit:knight'],
 ['actor:human:principal:1','keykit:knight'],
 ['actor:human:principal:2','keykit:knight'],
]);
export function modelForActor(id){return CHARACTER_MODELS.find(m=>m.id===named.get(id))??null;}

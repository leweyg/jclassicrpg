import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {OpeningStoryOffer, sliceSummary} from '../opening_story.js';
import {SceneRenderer} from '../render_engine.js';
const read = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));

test('new-game story offer survives a save and stays dismissed after reading or a nearby interaction', () => {
 const flags = {};
 assert.equal(new OpeningStoryOffer(flags).available(), false, 'existing saves do not receive a new offer');
 const offer = new OpeningStoryOffer(flags, true);
 assert.equal(offer.available(), true);
 const resumed = new OpeningStoryOffer(JSON.parse(JSON.stringify(flags)));
 assert.equal(resumed.available(), true);
 assert.equal(resumed.dismiss(), true);
 assert.equal(resumed.dismiss(), false);
 assert.equal(new OpeningStoryOffer(resumed.flags).available(), false);
});
test('empty interaction opens story without invoking world interaction and releases its guard', async () => {
 let opened = 0;
 const renderer = Object.assign(Object.create(SceneRenderer.prototype), {_inputEnabled:true, nearbyInteraction:()=>null, cancelInput(){}, onEmptyInteraction(){opened++;return true;}});
 await renderer.interact();
 assert.equal(opened,1);assert.equal(renderer._interacting,false);
});
test('shared opening has three paragraphs and published counts match the live catalogs', () => {
 const story=read('../../json/opening_story.json');assert.equal(story.paragraphs.length,3);
 assert.ok(story.paragraphs.every(p=>p.length>100&&!p.includes('<')));
 const missions=read('../../worlds/seed0/v2/interactions/missions.json');
 const actors=read('../../worlds/seed0/v2/interactions/actors.json');
 const starter=read('../../json/starter_party.json');
 const summary=sliceSummary(missions,actors,starter.party);
 const html=fs.readFileSync(new URL('../../../index.html',import.meta.url),'utf8');
 assert.ok(html.includes(summary));
 assert.match(summary,/5 story quests, 62 side quests, and 279 total characters/);
});

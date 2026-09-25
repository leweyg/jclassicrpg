import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadStoryPreview} from '../story_preview.js';
const base = new URL('../../worlds/seed0/v2/', import.meta.url);
const fetcher = async url => new Response(fs.readFileSync(url));
test('homepage preview follows generated chapter order, mission summaries, and opening lore', async () => {
 const [story] = await loadStoryPreview(base, fetcher);
 assert.deepEqual(story.chapters.map(c=>c.id), story.chapterIds);
 assert.equal(story.chapters.filter(c=>c.status==='playable').length,3);
 assert.equal(story.chapters.filter(c=>!c.mission).length,2);
 assert.equal(story.chapters[0].mission.title,story.chapters[0].title);
 assert.ok(story.chapters[0].mission.summary.includes('Orro'));
 const cast = new Map(story.chapters.flatMap(c=>c.cast).map(a=>[a.id,a]));
 assert.equal(cast.size,4);
 for(const actor of cast.values()) assert.equal(actor.captions.length,3);
 assert.match(cast.get('actor:wammigmig:orro').captions[0],/grandmother/);
});
test('changed generated story text is reflected without editing homepage markup', async()=>{
 const [story]=await loadStoryPreview(base,async url=>{
  const data=JSON.parse(fs.readFileSync(url));
  if(url.pathname.endsWith('/stories.json')) {data[0].title='Updated story';data[0].chapters[0].title='Updated chapter';}
  if(url.pathname.endsWith('/missions.json')) data.find(m=>m.id==='mission:concordance:road').summary='Updated mission summary';
  return new Response(JSON.stringify(data));
 });
 assert.equal(story.title,'Updated story');assert.equal(story.chapters[0].title,'Updated chapter');assert.equal(story.chapters[0].mission.summary,'Updated mission summary');
});
test('failed content requests are reported rather than displaying stale story prose',async()=>{
 await assert.rejects(loadStoryPreview(base,async()=>new Response('',{status:503})),/unavailable/);
});

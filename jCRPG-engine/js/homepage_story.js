import {loadOpeningStory, sliceSummary} from './opening_story.js';

const root = document.getElementById('opening-story');
loadOpeningStory().then(story => {
    const paragraphs = story.paragraphs.map(text => {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        return paragraph;
    });
    root.replaceChildren(...paragraphs);
}).catch(() => { root.textContent = 'The opening story could not load. Please reload to try again.'; });

Promise.all(['../worlds/seed0/v2/interactions/missions.json', '../worlds/seed0/v2/interactions/actors.json', '../json/starter_party.json'].map(async path => {
    const response = await fetch(new URL(path, import.meta.url));
    if (!response.ok) throw new Error('Could not load slice counts');
    return response.json();
})).then(([missions, actors, starter]) => {
    document.getElementById('slice-summary').textContent = sliceSummary(missions, actors, starter.party);
}).catch(console.error);

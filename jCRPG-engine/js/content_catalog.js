/** Main-page content catalogue. Reads the existing party and scenario sources. */
import { starterPartyRef } from './game_static_core.js';

async function loadXml(path) {
	const response = await fetch(path);
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	const xml = new DOMParser().parseFromString(await response.text(), 'application/xml');
	if (xml.querySelector('parsererror')) throw new Error('Invalid XML');
	return xml;
}

async function renderCharacters() {
	const { party } = await starterPartyRef.load();
	const list = document.getElementById('character-list');
	for (const member of party) {
		const item = document.createElement('li');
		const portrait = document.createElement('img');
		portrait.src = `media/portraits/${member.pictureRoot}/${member.genderType === 2 ? 'female' : 'male'}/${member.pictureId}`;
		portrait.alt = `${member.foreName} portrait`;
		portrait.width = 56; portrait.height = 72;
		const info = document.createElement('div');
		const name = document.createElement('strong');
		name.textContent = member.foreName;
		const role = document.createElement('span');
		role.textContent = `${member.race} · ${member.profession}`;
		const source = document.createElement('a');
		source.href = member.sourceFile;
		source.textContent = 'Character save (ZIP)';
		info.append(name, role, source);
		item.append(portrait, info);
		list.append(item);
	}
}

async function renderPopulations() {
	const ecology = await loadXml('scenario/jclassicrpg/ecology.xml');
	const animals = ecology.querySelectorAll('bestiary > animal');
	const rules = Array.from(ecology.querySelectorAll('populations > population'));
	const list = document.getElementById('population-list');
	document.getElementById('population-count').textContent = `Browse all ${animals.length} population and creature definitions`;
	for (const animal of animals) {
		const item = document.createElement('li');
		const implementation = animal.getAttribute('implementation');
		const animalId = animal.getAttribute('id');
		const name = document.createElement('a');
		name.href = `jCRPG-engine/src/main/java/${implementation.replaceAll('.', '/')}.java`;
		name.textContent = implementation.split('.').pop().replace(/([a-z])([A-Z])/g, '$1 $2');
		const habitats = [...new Set(rules.filter(rule => rule.getAttribute('ref-animal-id') === animalId)
			.map(rule => rule.getAttribute('ref-climat')))];
		const note = document.createElement('small');
		note.textContent = `${animalId} · ${habitats.join(', ') || 'No population rule'}`;
		item.append(name, note);
		list.append(item);
	}
}

async function renderStory() {
	const story = await loadXml('scenario/jclassicrpg/story/intro.xml');
	const container = document.getElementById('story-blocks');
	story.querySelectorAll('story > block').forEach((block, index) => {
		const details = document.createElement('details');
		const summary = document.createElement('summary');
		summary.textContent = index === 0 ? 'Read the original introduction' : 'Read the legacy Java tutorial';
		details.append(summary);
		if (index > 0) {
			const note = document.createElement('p');
			note.className = 'content-status';
			note.textContent = 'Historical controls, reproduced as written. For the web version, drag on the left to walk and on the right to look.';
			details.append(note);
		}
		const text = document.createElement('p');
		text.className = 'story-text';
		text.textContent = (block.querySelector('text')?.textContent ?? '').replaceAll('\\n', '\n').trim();
		details.append(text);
		container.append(details);
	});
}

// A missing source must not prevent the other catalogue sections from rendering.
for (const [render, id] of [[renderCharacters, 'characters'], [renderPopulations, 'populations'], [renderStory, 'quests']]) {
	render().catch(error => {
		const note = document.createElement('p');
		note.textContent = `Could not load this listing (${error.message}). Use the source links in this section.`;
		document.getElementById(id).append(note);
		console.error(error);
	});
}

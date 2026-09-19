/*
 * summary_page.js
 *
 * Renders the subsystem catalogue (loaded via GameStaticCore) as a set of
 * reference cards on index.html. Purely presentational - the actual web
 * port logic lives in game_static_core.js and its sibling modules.
 */

import { GameStaticCore, worldsRef, worldAssetsRef, charactersRef, gameAssetsRef, renderingAssetsRef } from "./game_static_core.js";

function renderSystemCard(system) {
	const card = document.createElement("section");
	card.className = "system-card";
	card.id = `system-${system.id}`;

	const title = document.createElement("h3");
	title.textContent = system.name;
	card.appendChild(title);

	const pkg = document.createElement("div");
	pkg.className = "java-package";
	pkg.textContent = system.javaPackage;
	card.appendChild(pkg);

	const desc = document.createElement("p");
	desc.className = "description";
	desc.textContent = system.description;
	card.appendChild(desc);

	if (system.keyClasses && system.keyClasses.length) {
		const classesLabel = document.createElement("div");
		classesLabel.className = "field-label";
		classesLabel.textContent = "Key classes";
		card.appendChild(classesLabel);

		const classes = document.createElement("div");
		classes.className = "chip-list";
		for (const c of system.keyClasses) {
			const chip = document.createElement("span");
			chip.className = "chip";
			chip.textContent = c;
			classes.appendChild(chip);
		}
		card.appendChild(classes);
	}

	if (system.javaLibraries && system.javaLibraries.length) {
		const libLabel = document.createElement("div");
		libLabel.className = "field-label";
		libLabel.textContent = "Java libraries used";
		card.appendChild(libLabel);

		const libs = document.createElement("div");
		libs.className = "chip-list";
		for (const l of system.javaLibraries) {
			const chip = document.createElement("span");
			chip.className = "chip chip-lib";
			chip.textContent = l;
			libs.appendChild(chip);
		}
		card.appendChild(libs);
	}

	if (system.webPort) {
		const webLabel = document.createElement("div");
		webLabel.className = "field-label";
		webLabel.textContent = "Web port approach";
		card.appendChild(webLabel);

		const approach = document.createElement("p");
		approach.className = "web-approach";
		approach.textContent = system.webPort.approach;
		card.appendChild(approach);

		if (system.webPort.targetFiles && system.webPort.targetFiles.length) {
			const files = document.createElement("div");
			files.className = "chip-list";
			for (const f of system.webPort.targetFiles) {
				const chip = document.createElement("span");
				chip.className = "chip chip-file";
				chip.textContent = f;
				files.appendChild(chip);
			}
			card.appendChild(files);
		}
	}

	return card;
}

function makeSection(title) {
	const section = document.createElement("section");
	section.className = "system-card";
	const h = document.createElement("h3");
	h.textContent = title;
	section.appendChild(h);
	return section;
}

function appendChips(parent, label, items) {
	const l = document.createElement("div");
	l.className = "field-label";
	l.textContent = label;
	parent.appendChild(l);
	const list = document.createElement("div");
	list.className = "chip-list";
	for (const item of items) {
		const chip = document.createElement("span");
		chip.className = "chip";
		chip.textContent = item;
		list.appendChild(chip);
	}
	parent.appendChild(list);
}

function appendKeyValues(parent, label, obj) {
	const l = document.createElement("div");
	l.className = "field-label";
	l.textContent = label;
	parent.appendChild(l);
	const dl = document.createElement("dl");
	dl.className = "kv-list";
	for (const [k, v] of Object.entries(obj)) {
		const dt = document.createElement("dt");
		dt.textContent = k;
		const dd = document.createElement("dd");
		dd.textContent = typeof v === "object" ? JSON.stringify(v) : String(v);
		dl.appendChild(dt);
		dl.appendChild(dd);
	}
	parent.appendChild(dl);
}

async function renderFirstWorldSummary(container) {
	const [worlds, assets, characters, gameAssets, rendering] = await Promise.all([
		worldsRef.load(),
		worldAssetsRef.load(),
		charactersRef.load(),
		gameAssetsRef.load(),
		renderingAssetsRef.load(),
	]);

	const boot = makeSection("First World — Boot Sequence");
	const bootDesc = document.createElement("p");
	bootDesc.className = "description";
	bootDesc.textContent = worlds.description;
	boot.appendChild(bootDesc);
	const ol = document.createElement("ol");
	for (const step of worlds.bootSequence) {
		const li = document.createElement("li");
		li.textContent = step;
		ol.appendChild(li);
	}
	boot.appendChild(ol);
	for (const note of worlds.notes) {
		const p = document.createElement("p");
		p.className = "web-approach";
		p.textContent = `Note: ${note}`;
		boot.appendChild(p);
	}
	appendKeyValues(boot, "Default game state", worlds.defaultGameState);
	container.appendChild(boot);

	const params = makeSection("World Generation Parameters (WorldParams schema)");
	appendKeyValues(params, "Fields", worlds.worldParamsSchema.fields);
	appendChips(params, "Known geography types", worlds.worldParamsSchema.knownGeographyTypes);
	appendChips(params, "Known climate belts", worlds.worldParamsSchema.knownClimateBelts);
	container.appendChild(params);

	const chars = makeSection("Default Character Creation");
	appendChips(chars, "Selectable races", characters.races.map((r) => r.id));
	appendChips(chars, "Selectable professions", characters.professions.filter((p) => !p.note).map((p) => p.id));
	container.appendChild(chars);

	const assetsSection = makeSection("First-World 3D Assets (by category)");
	const assetsDesc = document.createElement("p");
	assetsDesc.className = "description";
	assetsDesc.textContent = assets.description;
	assetsSection.appendChild(assetsDesc);
	for (const cat of assets.categories) {
		const label = document.createElement("div");
		label.className = "field-label";
		label.textContent = `${cat.id} (${cat.assets.length}) — ${cat.javaOwner}`;
		assetsSection.appendChild(label);
	}
	container.appendChild(assetsSection);

	const gameAssetsSection = makeSection("Engine/UI/Audio Assets");
	appendChips(gameAssetsSection, "Fonts", gameAssets.fonts.map((f) => f.id));
	appendKeyValues(gameAssetsSection, "Audio settings", gameAssets.audio.settings);
	appendKeyValues(gameAssetsSection, "Render settings (sample)", gameAssets.renderSettings.selected);
	container.appendChild(gameAssetsSection);

	const renderingSection = makeSection("Rendering & Asset Pipeline");
	const mediaNote = document.createElement("p");
	mediaNote.className = "web-approach";
	mediaNote.textContent = `Key finding: ${rendering.keyFinding_externalMediaTree.summary}`;
	renderingSection.appendChild(mediaNote);
	const cacheNote = document.createElement("p");
	cacheNote.className = "web-approach";
	cacheNote.textContent = rendering.modelCacheFormatCorrection.note;
	renderingSection.appendChild(cacheNote);
	appendChips(
		renderingSection,
		"Custom shaders (in-repo)",
		rendering.shaders.customInRepo.families.map((f) => `${f.id} (${f.files.length})`)
	);
	appendChips(
		renderingSection,
		"Bundled library shaders (Ardor3D/jME jars)",
		rendering.shaders.bundledInLibraries.families.map((f) => `${f.id} (${f.files.length})`)
	);
	appendChips(renderingSection, "Fonts", [
		rendering.fonts.customInRepo.id + " (in-repo)",
		rendering.fonts.bundledFallback.id + " (library fallback)",
		rendering.fonts.legacy.id + " (unused legacy)",
	]);
	const uiNote = document.createElement("p");
	uiNote.className = "web-approach";
	uiNote.textContent = `UI/portrait/icon images: ${rendering.uiAndPortraitImages.status}.`;
	renderingSection.appendChild(uiNote);
	container.appendChild(renderingSection);
}

async function main() {
	const container = document.getElementById("systems-summary");
	const status = document.getElementById("load-status");
	if (!container) return;

	const core = new GameStaticCore();
	try {
		const data = await core.load();
		if (status) status.textContent = `${data.portName} — source: ${data.sourceVersion}`;
		for (const system of data.systems) {
			container.appendChild(renderSystemCard(system));
		}
	} catch (err) {
		if (status) status.textContent = `Failed to load static core data: ${err.message}`;
		console.error(err);
	}

	const firstWorldContainer = document.getElementById("first-world-summary");
	if (firstWorldContainer) {
		try {
			await renderFirstWorldSummary(firstWorldContainer);
		} catch (err) {
			const p = document.createElement("p");
			p.textContent = `Failed to load first-world reference data: ${err.message}`;
			firstWorldContainer.appendChild(p);
			console.error(err);
		}
	}
}

main();

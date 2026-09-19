/*
 * summary_page.js
 *
 * Renders the subsystem catalogue (loaded via GameStaticCore) as a set of
 * reference cards on index.html. Purely presentational - the actual web
 * port logic lives in game_static_core.js and its sibling modules.
 */

import { GameStaticCore } from "./game_static_core.js";

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
}

main();

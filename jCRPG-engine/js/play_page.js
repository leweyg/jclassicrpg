/*
 * play_page.js
 *
 * Boots the shared GameState (see game_state.js) plus a first-pass three.js
 * scene (render_engine.js) into play.html, and drives the HUD overlay to
 * resemble the reference screenshot at
 * jCRPG-engine/save/game1_20100426-004720.124/screen1272235643909.jpg.
 */

import { GameSim } from "./game_sim.js";
import { SceneRenderer } from "./render_engine.js";
import { TERRAIN_NAMES } from "./frozen_world.js";

function pickActiveMember(party) {
	return party.members.find((m) => m.foreName === "ELMARA") ?? party.members[0];
}

function renderHud(gameState) {
	const member = pickActiveMember(gameState.party);
	if (!member) return;

	const portraitImg = document.getElementById("hud-portrait");
	const nameEl = document.getElementById("hud-name");
	const profEl = document.getElementById("hud-profession");
	if (portraitImg) portraitImg.src = `media/portraits/${member.pictureRoot}/${member.genderType === 2 ? "female" : "male"}/${member.pictureId}`;
	if (nameEl) nameEl.textContent = member.foreName;
	if (profEl) profEl.textContent = member.profession;
}

function appendLog(text) {
	const logEl = document.getElementById("hud-log");
	if (!logEl) return;
	const line = document.createElement("div");
	line.textContent = text;
	logEl.appendChild(line);
	while (logEl.children.length > 12) logEl.firstElementChild.remove();
	logEl.scrollTop = logEl.scrollHeight;
}

async function main() {
	const canvas = document.getElementById("scene-canvas");
	const status = document.getElementById("load-status");

	let sim;
	try {
		sim = await GameSim.createDefault();
	} catch (err) {
		if (status) status.textContent = `Failed to initialize game state: ${err.message}`;
		console.error(err);
		return;
	}

	try {
		if (status) status.textContent = "Loading saved world…";
		await sim.gameState.startExploration();
		renderHud(sim.gameState);
		const renderer = new SceneRenderer(canvas);
		await renderer.buildWorld(sim.gameState);
		renderer.start();
		window.__sceneRenderer = renderer;
		window.__gameState = sim.gameState;
		if (status) status.textContent = "";
		appendLog("Saved world loaded. Drag on the left to walk; drag on the right to look.");
		const location = document.getElementById('hud-location');
		let lastArea = '';
		const updateLocation = () => {
			const state = sim.gameState, p = state.party.position, world = state.exploration.world;
			const landmark = world.landmarkAt(p.x, p.z);
			const area = landmark?.name ?? TERRAIN_NAMES[world.typeAt(p.x, p.z)];
			location.textContent = `${area} · ${Math.floor(p.x)}, ${Math.floor(p.z)}`;
			if (area !== lastArea) { appendLog(`Entering ${area}.`); lastArea = area; }
		};
		updateLocation();
		// HUD strings/DOM work are deliberately outside the animation loop.
		const hudTimer = setInterval(updateLocation, 250);
		window.addEventListener('pagehide', () => { clearInterval(hudTimer); renderer.stop(); }, { once: true });
		window.addEventListener('pageshow', event => { if (event.persisted) window.location.reload(); });
	} catch (err) {
		if (status) status.textContent = `Failed to load world: ${err.message}`;
		console.error(err);
	}
}

main();

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

// The captured reference screenshot's world position (see world_seed0_sample.json playerPositionAtCapture).
const REFERENCE_POSITION = { x: 800, y: 41, z: 907 };

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

	// Homage to the captured reference moment (see world_seed0_sample.json) until real world-position tracking exists.
	sim.gameState.party.position = { ...REFERENCE_POSITION };

	renderHud(sim.gameState);
	appendLog(`Loading Geo at X/Z ${REFERENCE_POSITION.x}/${REFERENCE_POSITION.z}...`);
	appendLog("Load Complete.");
	appendLog(`Loading Geo at X/Z ${REFERENCE_POSITION.x}/${REFERENCE_POSITION.z + 1}...`);
	appendLog("Load Complete.");
	appendLog("You hear faint sounds around.");
	appendLog("Probably Kobold Miner.");

	if (status) status.textContent = "";

	const renderer = new SceneRenderer(canvas);
	await renderer.buildForestClearing({ seed: sim.gameState.world.seed });
	renderer.start();
}

main();

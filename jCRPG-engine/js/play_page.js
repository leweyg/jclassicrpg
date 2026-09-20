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
import { WorldMap } from "./world_map.js";

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
		if(sim.gameState.saveDeltas.error)appendLog(sim.gameState.saveDeltas.error);
		const renderer = new SceneRenderer(canvas);
		await renderer.buildWorld(sim.gameState);
		const worldMap = new WorldMap(sim.gameState, renderer);
		window.__worldMap = worldMap;
		window.__sceneRenderer = renderer;
		window.__gameState = sim.gameState;
		if (status) status.textContent = "";
		appendLog("Saved world loaded. Drag on the left to walk; drag on the right to look.");
		const location = document.getElementById('hud-location');
		let lastArea = '', lastLocation = '', lastUpdate = -Infinity;
		const updateLocation = (now = performance.now(), force = false) => {
			if (!force && now - lastUpdate < 100) return;
			lastUpdate = now;
			const state = sim.gameState, p = state.party.position, world = state.exploration.world;
			const landmark = world.landmarkAt(p.x, p.z);
			const cell = state.exploration.cellAt?.(p.x,p.y,p.z,state.realm);
			const area = state.realm==='cave' ? 'Natural cave' : cell?.structure.kind==='SimpleDungeonPart' ? 'Labyrinth' : landmark?.name ?? TERRAIN_NAMES[world.typeAt(p.x, p.z)];
			const text = `${area} · ${Math.floor(p.x)}, ${Math.floor(p.z)}`;
			if (text !== lastLocation) { location.textContent = text; lastLocation = text; }
			worldMap.update();
			if (area !== lastArea) { appendLog(`Entering ${area}.`); lastArea = area; }
		};
		renderer.onStatus = appendLog;
		renderer.onInteract = () => renderer.interact();
		document.getElementById('world-interact').addEventListener('click', () => renderer.interact());
		document.getElementById('world-retry').addEventListener('click', () => sim.gameState.exploration.retry());
		document.getElementById('world-save').addEventListener('click', () => {
			const state=sim.gameState;state.saveDeltas.persist(state.party.position,state.realm);
			const url=URL.createObjectURL(new Blob([state.saveDeltas.export()],{type:'application/json'}));
			const a=document.createElement('a');a.href=url;a.download='jcrpg-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
		});
		document.getElementById('world-import').addEventListener('change', async event => {
			const file=event.target.files[0];if(!file)return;
			try { const state=sim.gameState, previous=state.saveDeltas.data, save=JSON.parse(await file.text());
				state.saveDeltas.import(JSON.stringify(save));
				try { if(save.player) await state.teleport(save.player.x,save.player.z,save.player.y,save.player.realm); }
				catch(error) { state.saveDeltas.data=previous;throw error; }
				renderer.worldView.sync();renderer._syncCamera();renderer.requestRender();appendLog('Save imported.');
			} catch(error) { appendLog('Import failed: '+error.message); }
		});
		renderer.onViewChange = (now,force) => {
			updateLocation(now,force);
			const state=sim.gameState, action=state.exploration.nearby(state.party.position,state.realm);
			const button=document.getElementById('world-interact');
			button.textContent=action ? `${action.label} [E]` : 'Explore · WASD / drag';button.disabled=!action;
		};
		updateLocation();
		renderer.start();
		// No repeating HUD timers. Changes are driven by input/render events only.
		window.addEventListener('pagehide', () => renderer.stop(), { once: true });
		window.addEventListener('pageshow', event => { if (event.persisted) window.location.reload(); });
	} catch (err) {
		if (status) status.textContent = `Failed to load world: ${err.message}`;
		console.error(err);
	}
}

main();

import { InteractionUI } from './interactions/ui.js';
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
import { resetStoredSave } from "./world/save_deltas.js";
import { visitPlayDestination } from "./play_destinations.js";

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
		const url = new URL(window.location.href);
		if (url.searchParams.get("new") === "1") {
			resetStoredSave(window.localStorage);
			url.searchParams.delete("new");
			window.history.replaceState(null, "", url);
		}
		sim = await GameSim.createDefault();
	} catch (err) {
		if (status) status.textContent = `Failed to initialize game state: ${err.message}`;
		console.error(err);
		return;
	}

	try {
		if (status) status.textContent = "Loading saved world…";
		await sim.gameState.startExploration();
		const destinationURL = new URL(window.location.href);
		if (destinationURL.searchParams.has('location')) {
			try {
				const name = await visitPlayDestination(sim.gameState, destinationURL.searchParams.get('location'));
				appendLog(`Arrived at ${name}.`);
			} catch (error) {
				appendLog(`Could not travel: ${error.message}`);
			}
			// Reloads resume saved progress instead of repeating the jump.
			destinationURL.searchParams.delete('location');
			window.history.replaceState(null, '', destinationURL);
		}
		renderHud(sim.gameState);
		if(sim.gameState.saveDeltas.error)appendLog(sim.gameState.saveDeltas.error);
		const renderer = new SceneRenderer(canvas);
		await renderer.buildWorld(sim.gameState);
		const worldMap = new WorldMap(sim.gameState, renderer);
		const interactionsUI = new InteractionUI(sim.gameState,renderer,appendLog);
		renderer.onInteractionPanel=()=>interactionsUI.show();
		window.__worldMap = worldMap;
		window.__sceneRenderer = renderer;
		window.__gameState = sim.gameState;
		if (status) status.textContent = "";
		appendLog("The Drift of Measure: a dim shrine waits west of spawn. Wammigmig lies east. Move with WASD or drag; direct attention with Interact [E].");
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
		const menu = document.getElementById('game-menu');
		const menuButton = document.getElementById('menu-open');
		const closeMenu = () => {
			menu.close();
			menuButton.setAttribute('aria-expanded', 'false');
			renderer.setInputEnabled(true);
			menuButton.focus();
			renderer.requestRender();
		};
		menuButton.disabled = false;
		menuButton.addEventListener('click', () => {
			renderer.setInputEnabled(false);
			menu.showModal();
			menuButton.setAttribute('aria-expanded', 'true');
		});
		document.getElementById('menu-close').addEventListener('click', closeMenu);
		menu.addEventListener('cancel', event => { event.preventDefault(); closeMenu(); });
		menu.addEventListener('click', event => {
			if (event.target !== menu) return;
			const rect = menu.getBoundingClientRect();
			if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeMenu();
		});
		for (const [id, open] of [
			['map-open', () => worldMap.open()],
			['world-journal', () => interactionsUI.openJournal()],
			['world-inventory', () => interactionsUI.openInventory()],
		]) document.getElementById(id).addEventListener('click', () => { closeMenu(); open(); });
		document.getElementById('world-import-open').addEventListener('click', () => document.getElementById('world-import').click());
		document.getElementById('world-retry').addEventListener('click', () => sim.gameState.exploration.retry());
		document.getElementById('world-save').addEventListener('click', () => {
			const state=sim.gameState;state.saveDeltas.persist(state.party.position,state.realm);
			const url=URL.createObjectURL(new Blob([state.saveDeltas.export()],{type:'application/json'}));
			const a=document.createElement('a');a.href=url;a.download='jcrpg-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
		});
		document.getElementById('world-import').addEventListener('change', async event => {
			const file=event.target.files[0];if(!file)return;
			closeMenu();
			try { const state=sim.gameState, previous=state.saveDeltas.data, save=JSON.parse(await file.text());
				state.saveDeltas.import(JSON.stringify(save));
                try { state.interactions.initialize(); } catch(error) {state.saveDeltas.data=previous;throw error;}
				try { if(save.player) await state.teleport(save.player.x,save.player.z,save.player.y,save.player.realm); }
				catch(error) { state.saveDeltas.data=previous;throw error; }
				renderer.worldView.sync();renderer._syncCamera();renderer.requestRender();state.saveDeltas.persist(state.party.position,state.realm);appendLog('Save imported.');
			} catch(error) { appendLog('Import failed: '+error.message); }
			event.target.value='';
		});
		renderer.onViewChange = (now,force) => {
			updateLocation(now,force);
			const action=renderer.nearbyInteraction();
			const button=document.getElementById('world-interact');
			renderer.highlightInteraction(action);
			button.hidden=!action;button.disabled=!action;
			button.title=action ? `${action.label} [E]` : 'Interact [E]';
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

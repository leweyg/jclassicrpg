/*
 * sim_page.js
 *
 * UI glue for sim.html: boots a headless GameSim (no rendering), displays a
 * live JSON dump of the shared GameState, and lets you manually or
 * automatically step the mock turn clock.
 */

import { GameSim } from "./game_sim.js";

function log(logOut, msg) {
	const line = document.createElement("div");
	line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
	logOut.prepend(line);
}

function renderState(stateOut, sim) {
	stateOut.textContent = JSON.stringify(sim.gameState.toJSON(), null, 2);
}

async function main() {
	const status = document.getElementById("load-status");
	const stateOut = document.getElementById("state-dump");
	const logOut = document.getElementById("log");
	const stepBtn = document.getElementById("step-btn");
	const runBtn = document.getElementById("run-btn");

	let sim;
	try {
		sim = await GameSim.createDefault();
	} catch (err) {
		status.textContent = `Failed to initialize sim: ${err.message}`;
		console.error(err);
		return;
	}

	status.textContent = `Loaded scenario "${sim.gameState.scenario.name}" (seed ${sim.gameState.scenario.seed}) with ${sim.gameState.party.members.length} party member(s).`;
	renderState(stateOut, sim);
	log(logOut, "Sim initialized.");

	sim.gameState.events.addEventListener("turnAdvanced", (e) => {
		log(logOut, `Turn advanced -> ${e.detail.turn}`);
		renderState(stateOut, sim);
	});

	stepBtn.addEventListener("click", () => sim.step());

	runBtn.addEventListener("click", () => {
		if (sim.running) {
			sim.stop();
			runBtn.textContent = "Auto Run (1/sec)";
			log(logOut, "Auto-run stopped.");
		} else {
			sim.run(1000);
			runBtn.textContent = "Stop";
			log(logOut, "Auto-run started.");
		}
	});
}

main();

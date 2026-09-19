/*
 * game_sim.js
 *
 * Headless simulation driver: owns a GameState and steps it forward with no
 * rendering involved. Used directly by sim.html today; the same driver will
 * later be reused to advance state in the background while play.html renders
 * it with three.js.
 */

import { GameState } from "./game_state.js";

export class GameSim {
	constructor(gameState) {
		this.gameState = gameState;
		this._intervalId = null;
	}

	static async createDefault() {
		return new GameSim(await GameState.createDefault());
	}

	/** Advances exactly one mock turn. */
	step() {
		return this.gameState.advanceTurn();
	}

	/** Starts auto-stepping on an interval (default 1 turn/sec). */
	run(intervalMs = 1000) {
		this.stop();
		this._intervalId = setInterval(() => this.step(), intervalMs);
	}

	stop() {
		if (this._intervalId != null) {
			clearInterval(this._intervalId);
			this._intervalId = null;
		}
	}

	get running() {
		return this._intervalId != null;
	}
}

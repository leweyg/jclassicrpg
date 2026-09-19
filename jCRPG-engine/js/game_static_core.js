/*
 * game_static_core.js
 *
 * Entry point for the web port's data/reference layer. It loads the static
 * subsystem catalogue from static_core_data.json and exposes stub classes
 * that mirror the major Java packages of the original jCRPG engine
 * (org.jcrpg.world, .space, .threed, .audio, .game, .ui, .util.saveload,
 * .abs.change). These stubs are intentionally empty/minimal for now; they
 * exist so later work has a concrete place to attach the real web port
 * logic (WebGL rendering via three.js, Web Audio, etc.) system by system.
 *
 * This file is used both by index.html (to render the architecture summary)
 * and, eventually, by play.html (to actually boot the game).
 */

export const STATIC_CORE_DATA_URL = "jCRPG-engine/json/static_core_data.json";

// Reference data lists describing the first-world/first-scenario boot state.
export const WORLDS_DATA_URL = "jCRPG-engine/json/worlds.json";
export const WORLD_ASSETS_DATA_URL = "jCRPG-engine/json/world_assets.json";
export const CHARACTERS_DATA_URL = "jCRPG-engine/json/characters.json";
export const GAME_ASSETS_DATA_URL = "jCRPG-engine/json/game_assets.json";
export const RENDERING_ASSETS_DATA_URL = "jCRPG-engine/json/rendering_assets.json";
export const MEDIA_ASSETS_DATA_URL = "jCRPG-engine/json/media_assets.json";
export const STARTER_PARTY_DATA_URL = "jCRPG-engine/json/starter_party.json";
export const WORLD_SEED0_SAMPLE_DATA_URL = "jCRPG-engine/json/world_seed0_sample.json";

/**
 * Loads and caches the static core data JSON (subsystem catalogue).
 */
export class GameStaticCore {
	constructor(dataUrl = STATIC_CORE_DATA_URL) {
		this.dataUrl = dataUrl;
		this.data = null;
	}

	async load() {
		if (this.data) return this.data;
		const response = await fetch(this.dataUrl);
		if (!response.ok) {
			throw new Error(`Failed to load static core data: ${response.status} ${response.statusText}`);
		}
		this.data = await response.json();
		return this.data;
	}

	getSystems() {
		return this.data ? this.data.systems : [];
	}

	getSystem(id) {
		return this.getSystems().find((s) => s.id === id);
	}
}

/**
 * Generic fetch-once-and-cache loader for the reference JSON data lists
 * (worlds, world_assets, characters, game_assets).
 */
export class StaticJsonRef {
	constructor(dataUrl) {
		this.dataUrl = dataUrl;
		this.data = null;
	}

	async load() {
		if (this.data) return this.data;
		const response = await fetch(this.dataUrl);
		if (!response.ok) {
			throw new Error(`Failed to load ${this.dataUrl}: ${response.status} ${response.statusText}`);
		}
		this.data = await response.json();
		return this.data;
	}
}

// Ready-to-use singletons for the first-world reference data lists.
export const worldsRef = new StaticJsonRef(WORLDS_DATA_URL);
export const worldAssetsRef = new StaticJsonRef(WORLD_ASSETS_DATA_URL);
export const charactersRef = new StaticJsonRef(CHARACTERS_DATA_URL);
export const gameAssetsRef = new StaticJsonRef(GAME_ASSETS_DATA_URL);
export const renderingAssetsRef = new StaticJsonRef(RENDERING_ASSETS_DATA_URL);
export const mediaAssetsRef = new StaticJsonRef(MEDIA_ASSETS_DATA_URL);
export const starterPartyRef = new StaticJsonRef(STARTER_PARTY_DATA_URL);
export const worldSeed0SampleRef = new StaticJsonRef(WORLD_SEED0_SAMPLE_DATA_URL);

/*
 * Below: one stub class per major subsystem, named after and reflecting the
 * responsibilities of their Java package counterparts. Each will grow into
 * the real web-port implementation; for now they just record their intent.
 */

// org.jcrpg.world -> world state, geography, economy, politics, time
export class WorldState {
	constructor() {
		this.javaPackage = "org.jcrpg.world";
	}
}

// org.jcrpg.space -> cube/tile grid partitioning of the 3D world
export class SpaceGrid {
	constructor() {
		this.javaPackage = "org.jcrpg.space";
	}
}

// org.jcrpg.threed -> WebGL scene graph / model & terrain loading (three.js target)
export class RenderEngine {
	constructor() {
		this.javaPackage = "org.jcrpg.threed";
	}
}

// org.jcrpg.audio -> sound channels and playback (Web Audio API target)
export class AudioServer {
	constructor() {
		this.javaPackage = "org.jcrpg.audio";
	}
}

// org.jcrpg.game -> turn-based rules engine, encounters, character creation
export class GameLogic {
	constructor() {
		this.javaPackage = "org.jcrpg.game";
	}
}

// org.jcrpg.world.object -> items, weapons, armor, crafting, magic
export class ItemSystem {
	constructor() {
		this.javaPackage = "org.jcrpg.world.object";
	}
}

// org.jcrpg.ui -> HUD, windows, meters, minimap, text (DOM/canvas overlay target)
export class UIOverlay {
	constructor() {
		this.javaPackage = "org.jcrpg.ui";
	}
}

// org.jcrpg.util.saveload -> save/load game state (JSON + localStorage/IndexedDB target)
export class SaveLoad {
	constructor() {
		this.javaPackage = "org.jcrpg.util.saveload";
	}
}

// org.jcrpg.abs.change -> cross-system state-change event bus
export class ChangeEvents extends EventTarget {
	constructor() {
		super();
		this.javaPackage = "org.jcrpg.abs.change";
	}
}

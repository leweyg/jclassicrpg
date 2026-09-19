/*
 * game_state.js
 *
 * Rendering-agnostic game state model shared between sim.html (headless
 * simulation, no visuals) and, later, play.html's world/render layers. This
 * module must not import three.js or touch the DOM — it only models data:
 * scenario/world descriptors, the party, and a mock clock.
 *
 * Time/turn mechanics (org.jcrpg.world.Engine / Time / economy / ecology
 * ticking) are NOT implemented yet — SimTime is a placeholder that just
 * counts turns so the rest of the state shape can be agreed on now.
 */

import { starterPartyRef, worldsRef, ChangeEvents } from "./game_static_core.js";

/** Placeholder clock — real turn/day/season mechanics are ported later. */
export class SimTime {
	constructor({ turn = 0, hour = 12, day = 0, year = 0 } = {}) {
		this.turn = turn;
		this.hour = hour;
		this.day = day;
		this.year = year;
	}

	// TODO: replace with a real port of org.jcrpg.world.Engine / Time (hour/day/season rollover, ticks).
	advance() {
		this.turn += 1;
		return this.turn;
	}

	toJSON() {
		return { turn: this.turn, hour: this.hour, day: this.day, year: this.year };
	}
}

export class PartyMemberState {
	constructor(data) {
		this.foreName = data.foreName;
		this.surName = data.surName ?? "";
		this.race = data.race;
		this.profession = data.profession;
		this.genderType = data.genderType;
		this.pictureRoot = data.pictureRoot;
		this.pictureId = data.pictureId;
		this.attributes = { ...(data.attributes ?? {}) };
		this.resistances = { ...(data.resistances ?? {}) };
		this.skills = { ...(data.nonZeroSkills ?? data.skills ?? {}) };
	}

	toJSON() {
		return {
			foreName: this.foreName,
			surName: this.surName,
			race: this.race,
			profession: this.profession,
			genderType: this.genderType,
			pictureRoot: this.pictureRoot,
			pictureId: this.pictureId,
			attributes: this.attributes,
			resistances: this.resistances,
			skills: this.skills,
		};
	}
}

/** The party shares a single world position (matches PartyInstance in the Java engine). */
export class PartyState {
	constructor(members = [], position = { x: 0, y: 0, z: 0 }) {
		this.members = members;
		this.position = position;
	}

	toJSON() {
		return { members: this.members.map((m) => m.toJSON()), position: this.position };
	}
}

/** World generation descriptor only (no generated terrain/geometry yet — that comes with the render pass). */
export class WorldDescriptor {
	constructor({ name = "default", sizeX = 0, sizeY = 0, sizeZ = 0, magnification = 1, seed = 0 } = {}) {
		this.name = name;
		this.sizeX = sizeX;
		this.sizeY = sizeY;
		this.sizeZ = sizeZ;
		this.magnification = magnification;
		this.seed = seed;
	}

	get realSizeX() { return this.sizeX * this.magnification; }
	get realSizeY() { return this.sizeY * this.magnification; }
	get realSizeZ() { return this.sizeZ * this.magnification; }

	toJSON() {
		return { name: this.name, sizeX: this.sizeX, sizeY: this.sizeY, sizeZ: this.sizeZ, magnification: this.magnification, seed: this.seed };
	}
}

/**
 * Top-level, rendering-agnostic game state. Shared by sim.html and (later)
 * play.html — neither this class nor anything it references may depend on
 * three.js or the DOM.
 */
export class GameState {
	constructor({ scenario, world, time, party } = {}) {
		this.scenario = scenario ?? { id: "game1", name: "default", seed: 0 };
		this.world = world ?? new WorldDescriptor();
		this.time = time ?? new SimTime();
		this.party = party ?? new PartyState();
		this.events = new ChangeEvents();
	}

	/** Builds default state from the reference JSON data (starter party + real default world params). */
	static async createDefault() {
		const [starter, worlds] = await Promise.all([starterPartyRef.load(), worldsRef.load()]);

		const members = starter.party.map((m) => new PartyMemberState(m));
		const wp = worlds.realDefaultWorldParams;
		const world = new WorldDescriptor({
			name: wp?.name ?? "default",
			sizeX: wp?.size?.sizeX ?? 0,
			sizeY: wp?.size?.sizeY ?? 0,
			sizeZ: wp?.size?.sizeZ ?? 0,
			magnification: wp?.size?.magnification ?? 1,
			seed: worlds.defaultGameState?.randomSeedDefault ?? 0,
		});
		const time = new SimTime({
			turn: worlds.defaultGameState?.engine?.numberOfTurn ?? 0,
			hour: worlds.defaultGameState?.engine?.startHour ?? 12,
			day: worlds.defaultGameState?.engine?.startDay ?? 0,
			year: worlds.defaultGameState?.engine?.startYear ?? 0,
		});
		const party = new PartyState(members, { x: 0, y: 0, z: 0 });

		return new GameState({
			scenario: { id: worlds.defaultGameState?.gameId ?? "game1", name: world.name, seed: world.seed },
			world,
			time,
			party,
		});
	}

	/** Placeholder turn step — no economy/ecology/combat mechanics yet, just advances the mock clock. */
	advanceTurn() {
		const turn = this.time.advance();
		this.events.dispatchEvent(new CustomEvent("turnAdvanced", { detail: { turn } }));
		return turn;
	}

	toJSON() {
		return {
			scenario: this.scenario,
			world: this.world.toJSON(),
			time: this.time.toJSON(),
			party: this.party.toJSON(),
		};
	}
}

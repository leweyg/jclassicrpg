/*
 * game_state.js
 *
 * Rendering-agnostic game state model shared between sim.html (headless
 * simulation, no visuals) and play.html's world/render layers. This
 * module must not import three.js or touch the DOM — it only models data:
 * scenario/world descriptors, the party, and a mock clock.
 *
 * Time/turn mechanics (org.jcrpg.world.Engine / Time / economy / ecology
 * ticking) are NOT implemented yet — SimTime is a placeholder that just
 * counts turns so the rest of the state shape can be agreed on now.
 */

import { loadFrozenWorld, wrap } from "./frozen_world.js";
import { loadBakedStream } from "./world/baked_stream.js";
import { loadInteractions } from './interactions/runtime.js';
import { SaveDeltas } from "./world/save_deltas.js";

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

/** World dimensions/seed metadata; the frozen terrain is held by the exploration cache. */
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
 * Top-level, rendering-agnostic game state. Shared by sim.html and
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
		this.exploration = null; // Transient bounded cache; excluded from saves.
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

	/** Begin exploring the frozen save at its captured party position. */
	async startExploration() {
		const frozen = await loadFrozenWorld();
		this.world = new WorldDescriptor({ name: 'Frozen JClassicRPG', sizeX: frozen.sizeX, sizeY: 80, sizeZ: frozen.sizeZ, seed: frozen.seed });
		Object.assign(this.party.position, frozen.spawn);
		this.exploration = await loadBakedStream(frozen);
		if (this.exploration.manifest.files.map) {
			const r=await fetch(new URL(this.exploration.manifest.files.map.url,this.exploration.baseURL));
			if(!r.ok)throw Error('Compiled map unavailable');
			const map=await r.json();if(map.types.length!==160000)throw Error('Invalid compiled map');
			frozen.compiledMap=Uint8Array.from(map.types);
		}
		let storage = null;
		try { storage = globalThis.localStorage; } catch {}
		this.saveDeltas = new SaveDeltas(storage);
		this.interactions = await loadInteractions(this.exploration.baseURL,this.saveDeltas);
        this.exploration.interactionCatalog=this.interactions.maps;
		this.realm = this.saveDeltas.data.player?.realm ?? 'surface';
		if (this.saveDeltas.data.player) {
			const {x,y,z} = this.saveDeltas.data.player;
			Object.assign(this.party.position, {x,y,z});
		}
		this.exploration.update(this.party.position.x, this.party.position.z);
		await this.exploration.settled();
		if (!this.exploration.getChunk(this.party.position.x, this.party.position.z)) throw Error(this.exploration.chunks.find(c=>c.error)?.error ?? 'Starting chunk unavailable; traversal is blocked.');
		const floor = this.exploration.floorAt(this.party.position.x, this.party.position.y, this.party.position.z, this.realm);
		if (Number.isFinite(floor)) this.party.position.y = floor;
		else { this.realm='surface';this.party.position.y=this.exploration.heightAt(this.party.position.x,this.party.position.z); }
		// Confirmed entrances augment the saved map's cave-region markers.
		const response = await fetch(new URL('portals.json', this.exploration.baseURL));
		if (response.ok) {
			this.exploration.portalIndex = await response.json();
			frozen.additionalMapMarkers = [...frozen.additionalMapMarkers.map(m=>({...m,implemented:m.kind==='dungeon'||m.implemented})),
				...this.exploration.portalIndex.filter(p=>p.kind==='cave').map(p=>({id:p.id,name:'Cave entrance',kind:'cave',x:p.from[0],y:p.from[1],z:p.from[2],implemented:true,note:'Use Enter cave at the entrance'}))];
		}
		frozen.compiled = true;
		return this.exploration;
	}

	/** Mutates the existing position object; returns whether nearby areas changed. */
	moveParty(dx, dz) {
		if (!this.exploration || this._teleporting) return false;
		const world = this.exploration.world;
		if (this.exploration.canMove) {
			const p = this.party.position, stream = this.exploration;
			const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / 0.15));
			for (let i=0;i<steps;i++) {
				for (const axis of ['x','z']) {
					const delta = (axis==='x'?dx:dz)/steps;
					const nx=p.x+(axis==='x'?delta:0), nz=p.z+(axis==='z'?delta:0);
					if (!stream.canMove(p.x,p.y,p.z,nx,nz,this.realm)) continue;
					// Small body radius keeps the camera out of wall thickness.
					const sx=axis==='x'?Math.sign(delta)*0.12:0, sz=axis==='z'?Math.sign(delta)*0.12:0;
					if (!stream.canMove(nx,p.y,nz,nx+sx,nz+sz,this.realm)) continue;
					const y=stream.floorAt(nx,p.y,nz,this.realm);
					if (!Number.isFinite(y)) continue;
					p.x=wrap(nx,world.sizeX);p.z=wrap(nz,world.sizeZ);p.y=y;
				}
			}
			return stream.update(p.x,p.z);
		}
		this.party.position.x = wrap(this.party.position.x + dx, world.sizeX);
		this.party.position.z = wrap(this.party.position.z + dz, world.sizeZ);
		this.party.position.y = this.exploration.heightAt(this.party.position.x, this.party.position.z);
		return this.exploration.update(this.party.position.x, this.party.position.z);
	}

	async teleport(x,z,y=null,realm='surface') {
		const stream=this.exploration, p=this.party.position, revision=(this._teleportRevision??0)+1;
		this._teleportRevision=revision;this._teleporting=true;
		try {
			x=wrap(x,stream.world.sizeX);z=wrap(z,stream.world.sizeZ);
			stream.update(x,z);await stream.settled();
			if(this._teleportRevision!==revision)return false;
			if (!stream.getChunk(x,z)) { stream.update(p.x,p.z); throw Error('Destination unavailable; please retry.'); }
			const floor=y===null?stream.heightAt(x,z):stream.floorAt(x,y,z,realm);
			if(!Number.isFinite(floor)){stream.update(p.x,p.z);throw Error('Destination has no walkable floor.');}
			Object.assign(p,{x,y:floor,z});this.realm=realm;
			this.saveDeltas?.persist(p,realm);
			return true;
		} finally { if(this._teleportRevision===revision)this._teleporting=false; }
	}

    nearbyInteraction(facing=null,viewPosition=this.party.position) {
        const action=this.exploration.nearby?.(this.party.position,this.realm,1.8,{facing,viewPosition,priority:a=>this.interactions?.priority(a)??a.priority});
        return this.interactions?.describe(action)??action;
    }
	async interact(action=this.nearbyInteraction()) {
		if (!action) return 'Nothing nearby to use.';
		if (action.kind!=='portal') {
            const result=this.interactions.interact(action);
            this.saveDeltas.persist(this.party.position,this.realm);
            return result.message??result.text??'Recorded.';
        }

		const portal=action.portal, dest=portal[action.side==='from'?'to':'from'];
		const realm=portal.kind==='cave'?(this.realm==='cave'?'surface':'cave'):this.realm;
		await this.teleport(dest[0],dest[2],dest[1],realm);
		this.saveDeltas.data.discoveredLocations[portal.id]=true;
		this.saveDeltas.persist(this.party.position,this.realm);
		return portal.kind==='cave'?(realm==='cave'?'Entered the cave.':'Returned to the surface.'):'Changed floor.';
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

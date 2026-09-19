/*
 * render_engine.js
 *
 * First rendering pass: builds a three.js forest-clearing scene out of the
 * real jCRPG media/models assets (ground tiles + trees + bushes), a real sky
 * cubemap from media/textures/sky, and touch/mouse dual-stick style controls
 * (left half of the screen = move, right half = look; both work with mouse
 * drag or one-or-more simultaneous touches via the Pointer Events API). This
 * is aimed at getting visually close to the reference screenshot in
 * jCRPG-engine/save/game1_20100426-004720.124/screen1272235643909.jpg, not at
 * reproducing exact procedural world generation (that is a later pass).
 */

import * as THREE from "./threejs/three.module.js";
import { loadObjModel } from "./obj_mtl_loader.js";

const GROUND_DIR = "media/models/ground";
const TREE_DIR = "media/models/tree";
const BUSH_DIR = "media/models/bush";

const VEGETATION_LIBRARY = [
	{ dir: TREE_DIR, file: "pine_bb1.obj", kind: "tree", scale: [1.2, 1.8] },
	{ dir: TREE_DIR, file: "great_pine_bb1.obj", kind: "tree", scale: [0.6, 0.9] },
	{ dir: TREE_DIR, file: "palm_02.obj", kind: "tree", scale: [1.0, 1.4] },
	{ dir: TREE_DIR, file: "high_bb_1.obj", kind: "bush", scale: [0.8, 1.2] },
	{ dir: BUSH_DIR, file: "Bush_01.obj", kind: "bush", scale: [1.0, 1.6] },
	{ dir: BUSH_DIR, file: "bush1.obj", kind: "bush", scale: [1.2, 2.0] },
	{ dir: BUSH_DIR, file: "bush2.obj", kind: "bush", scale: [1.2, 2.0] },
];

const MOVE_SPEED = 4; // world units/sec at full stick deflection
const STICK_RADIUS = 55; // px a "move" stick drag is clamped to
const LOOK_SENSITIVITY = 0.006;

/** Small deterministic PRNG (mulberry32) so a given world seed always scatters vegetation the same way. */
function mulberry32(seed) {
	let a = seed >>> 0;
	return function () {
		a |= 0; a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export class SceneRenderer {
	constructor(canvas) {
		this.canvas = canvas;
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(62, canvas.clientWidth / canvas.clientHeight, 0.1, 500);
		this.camera.position.set(0, 1.7, 6);

		this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.shadowMap.enabled = true;
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;

		this.scene.fog = new THREE.Fog(0x9fb98a, 15, 70);

		this._yaw = Math.PI; // facing -Z into the scene
		this._pitch = -0.08;
		this._lastFrameTime = null;

		// Dual-stick touch/mouse input: pointerId -> { side: 'move'|'look', startX, startY, curX, curY }.
		this._pointers = new Map();
		this._joystickEl = this._createJoystickIndicator();
		this._bindControls();

		window.addEventListener("resize", () => this._onResize());
		this._onResize();
	}

	/** A small on-screen circle+knob shown under the finger/mouse while a "move" stick is active. */
	_createJoystickIndicator() {
		const base = document.createElement("div");
		Object.assign(base.style, {
			position: "fixed", width: "110px", height: "110px", marginLeft: "-55px", marginTop: "-55px",
			borderRadius: "50%", border: "2px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.08)",
			pointerEvents: "none", zIndex: "4", display: "none",
		});
		const knob = document.createElement("div");
		Object.assign(knob.style, {
			position: "absolute", left: "50%", top: "50%", width: "44px", height: "44px",
			marginLeft: "-22px", marginTop: "-22px", borderRadius: "50%", background: "rgba(255,255,255,0.35)",
		});
		base.appendChild(knob);
		base.knob = knob;
		document.body.appendChild(base);
		return base;
	}

	_bindControls() {
		const c = this.canvas;
		c.style.touchAction = "none";

		const sideForClientX = (clientX) => {
			const rect = c.getBoundingClientRect();
			return clientX - rect.left < rect.width / 2 ? "move" : "look";
		};

		c.addEventListener("pointerdown", (e) => {
			c.setPointerCapture?.(e.pointerId);
			const side = sideForClientX(e.clientX);
			this._pointers.set(e.pointerId, { side, startX: e.clientX, startY: e.clientY, curX: e.clientX, curY: e.clientY });
			if (side === "move") {
				this._joystickEl.style.left = `${e.clientX}px`;
				this._joystickEl.style.top = `${e.clientY}px`;
				this._joystickEl.style.display = "block";
			}
		});

		const onMove = (e) => {
			const p = this._pointers.get(e.pointerId);
			if (!p) return;
			if (p.side === "look") {
				const dx = e.clientX - p.curX;
				const dy = e.clientY - p.curY;
				this._yaw -= dx * LOOK_SENSITIVITY;
				this._pitch = Math.max(-1.2, Math.min(1.2, this._pitch - dy * LOOK_SENSITIVITY));
			}
			p.curX = e.clientX;
			p.curY = e.clientY;
			if (p.side === "move") {
				const dx = p.curX - p.startX;
				const dy = p.curY - p.startY;
				const dist = Math.min(Math.hypot(dx, dy), STICK_RADIUS);
				const angle = Math.atan2(dy, dx);
				this._joystickEl.knob.style.left = `calc(50% + ${Math.cos(angle) * dist}px)`;
				this._joystickEl.knob.style.top = `calc(50% + ${Math.sin(angle) * dist}px)`;
			}
		};
		const endPointer = (e) => {
			const p = this._pointers.get(e.pointerId);
			if (p?.side === "move") this._joystickEl.style.display = "none";
			this._pointers.delete(e.pointerId);
		};

		c.addEventListener("pointermove", onMove);
		c.addEventListener("pointerup", endPointer);
		c.addEventListener("pointercancel", endPointer);
		c.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") endPointer(e); });
	}

	/** Reads the current "move" stick (if any) as a normalized {x, y} in [-1, 1] (x=strafe, y=forward). */
	_moveVector() {
		for (const p of this._pointers.values()) {
			if (p.side !== "move") continue;
			const dx = p.curX - p.startX;
			const dy = p.curY - p.startY;
			const dist = Math.hypot(dx, dy);
			const clamped = Math.min(dist, STICK_RADIUS) / STICK_RADIUS;
			if (dist < 1e-6) return { x: 0, y: 0 };
			return { x: (dx / dist) * clamped, y: (dy / dist) * clamped };
		}
		return { x: 0, y: 0 };
	}

	_updateMovement(dt) {
		const stick = this._moveVector();
		if (stick.x === 0 && stick.y === 0) return;
		const forward = new THREE.Vector3(Math.sin(this._yaw), 0, Math.cos(this._yaw));
		const right = new THREE.Vector3(Math.cos(this._yaw), 0, -Math.sin(this._yaw));
		const speed = MOVE_SPEED * dt;
		// stick.y > 0 means dragging downward, which should move backward.
		this.camera.position.addScaledVector(forward, -stick.y * speed);
		this.camera.position.addScaledVector(right, stick.x * speed);
	}

	_onResize() {
		const w = this.canvas.clientWidth || 1;
		const h = this.canvas.clientHeight || 1;
		this.camera.aspect = w / h;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(w, h, false);
	}

	_applyLook() {
		const dir = new THREE.Vector3(
			Math.sin(this._yaw) * Math.cos(this._pitch),
			Math.sin(this._pitch),
			Math.cos(this._yaw) * Math.cos(this._pitch)
		);
		this.camera.lookAt(this.camera.position.clone().add(dir));
	}

	async loadSky() {
		const sky = "media/textures/sky";
		try {
			const cubeLoader = new THREE.CubeTextureLoader();
			// All six faces must be the same size; day/top.jpg is 1024^2 vs 512^2 for the rest, so use the matching top.jpg.
			const texture = await new Promise((resolve, reject) => {
				cubeLoader.load(
					[`${sky}/east.jpg`, `${sky}/west.jpg`, `${sky}/top.jpg`, `${sky}/bottom.jpg`, `${sky}/south.jpg`, `${sky}/north.jpg`],
					resolve,
					undefined,
					reject
				);
			});
			this.scene.background = texture;
		} catch {
			this.scene.background = new THREE.Color(0x9fc2d1);
		}
	}

	_addLights() {
		const ambient = new THREE.HemisphereLight(0xcfe8ff, 0x2b3a1f, 0.9);
		this.scene.add(ambient);

		const sun = new THREE.DirectionalLight(0xfff2d6, 1.4);
		sun.position.set(-15, 25, 10);
		sun.castShadow = true;
		sun.shadow.mapSize.set(1024, 1024);
		sun.shadow.camera.left = -25;
		sun.shadow.camera.right = 25;
		sun.shadow.camera.top = 25;
		sun.shadow.camera.bottom = -25;
		this.scene.add(sun);
	}

	async _buildGround(tilesPerSide = 10) {
		const tile = await loadObjModel(GROUND_DIR, "ground_1.obj");
		const mesh = tile.children[0];
		if (!mesh) return;
		mesh.castShadow = false;
		mesh.receiveShadow = true;

		const tileSize = 2; // ground_1.obj spans roughly [-1, 1] in X/Z
		const count = tilesPerSide * tilesPerSide;
		const inst = new THREE.InstancedMesh(mesh.geometry, mesh.material, count);
		inst.receiveShadow = true;
		const dummy = new THREE.Object3D();
		let i = 0;
		const half = (tilesPerSide - 1) / 2;
		for (let gx = 0; gx < tilesPerSide; gx++) {
			for (let gz = 0; gz < tilesPerSide; gz++) {
				dummy.position.set((gx - half) * tileSize, 0, (gz - half) * tileSize);
				dummy.rotation.y = 0;
				dummy.updateMatrix();
				inst.setMatrixAt(i++, dummy.matrix);
			}
		}
		inst.instanceMatrix.needsUpdate = true;
		this.scene.add(inst);
		this._groundExtent = (tilesPerSide * tileSize) / 2;
	}

	/**
	 * Several vegetation materials (e.g. the "pmat3" leaf material used by pine/bush models) have no
	 * usable web texture (source .mtl points at .dds/.tga variants not shipped as .png anywhere in
	 * media/). Rather than leave them a flat mid-gray "sail", tint them a plausible foliage green —
	 * the original engine renders these via a runtime billboard/atlas shader we haven't ported yet.
	 */
	_tintUntexturedFoliage(group, index) {
		const hue = 0.28 + ((index * 37) % 10) / 100; // slight per-species variation
		group.traverse((child) => {
			if (child.isMesh && !child.material.map) {
				child.material.color = new THREE.Color().setHSL(hue, 0.45, 0.32);
				child.material.roughness = 0.9;
			}
		});
	}

	async _scatterVegetation(seed = 0, count = 40) {
		const rand = mulberry32(seed);
		const extent = (this._groundExtent ?? 10) - 1;
		const models = await Promise.all(
			VEGETATION_LIBRARY.map((entry) => loadObjModel(entry.dir, entry.file).then((group) => ({ entry, group })))
		);
		models.forEach(({ group }, i) => this._tintUntexturedFoliage(group, i));


		for (let i = 0; i < count; i++) {
			const { entry, group } = models[Math.floor(rand() * models.length)];
			const instance = group.clone(true);
			instance.traverse((child) => {
				if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
			});
			const x = (rand() * 2 - 1) * extent;
			const z = (rand() * 2 - 1) * extent;
			// Keep a small clearing near the camera's start position, matching the reference screenshot's open foreground.
			if (Math.hypot(x, z - 3) < 2.5) continue;
			const [minS, maxS] = entry.scale;
			const s = minS + rand() * (maxS - minS);
			instance.position.set(x, 0, z);
			instance.rotation.y = rand() * Math.PI * 2;
			instance.scale.setScalar(s);
			this.scene.add(instance);
		}
	}

	async buildForestClearing({ seed = 0 } = {}) {
		this._addLights();
		await this.loadSky();
		await this._buildGround(10);
		await this._scatterVegetation(seed, 44);
	}

	start() {
		const loop = (now) => {
			const dt = this._lastFrameTime == null ? 0 : Math.min((now - this._lastFrameTime) / 1000, 0.1);
			this._lastFrameTime = now;
			this._updateMovement(dt);
			this._applyLook();
			this.renderer.render(this.scene, this.camera);
			requestAnimationFrame(loop);
		};
		requestAnimationFrame(loop);
	}
}

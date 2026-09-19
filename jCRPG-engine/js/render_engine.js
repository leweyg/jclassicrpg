/*
 * render_engine.js
 *
 * Exploration rendering: streams the frozen saved world with shared
 * real jCRPG media/models assets (ground tiles + trees + bushes), a real sky
 * cubemap from media/textures/sky, and touch/mouse dual-stick style controls
 * (left half of the screen = move, right half = look; both work with mouse
 * drag or one-or-more simultaneous touches via the Pointer Events API). This
 * is aimed at getting visually close to the reference screenshot in
 * jCRPG-engine/save/game1_20100426-004720.124/screen1272235643909.jpg, not at
 * reproducing exact procedural world generation (that is a later pass).
 */

import * as THREE from "./threejs/three.module.js";
import { WorldView } from "./world_view.js";

const MOVE_SPEED = 4; // world units/sec at full stick deflection
const STICK_RADIUS = 55; // px a "move" stick drag is clamped to
const LOOK_SENSITIVITY = 0.006;

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

		this.scene.fog = new THREE.Fog(0x9fb98a, 25, 58);

		this._yaw = Math.PI; // facing -Z into the scene
		this._pitch = -0.08;
		this._lastFrameTime = null;

		// Dual-stick touch/mouse input: pointerId -> { side: 'move'|'look', startX, startY, curX, curY }.
		this._pointers = new Map();
		this._movePointer = null;
		this._stick = { x: 0, y: 0 };
		this._lookTarget = new THREE.Vector3();
		this._frameId = null;
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
			if (side === "move" && !this._movePointer) {
				this._movePointer = this._pointers.get(e.pointerId);
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
			if (p === this._movePointer) {
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
			if (p === this._movePointer) {
				this._movePointer = null;
				this._joystickEl.style.display = "none";
			}
			this._pointers.delete(e.pointerId);
		};

		c.addEventListener("pointermove", onMove);
		c.addEventListener("pointerup", endPointer);
		c.addEventListener("pointercancel", endPointer);
		c.addEventListener("lostpointercapture", endPointer);
		window.addEventListener("blur", () => {
			this._pointers.clear();
			this._movePointer = null;
			this._joystickEl.style.display = "none";
		});
		c.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") endPointer(e); });
	}

	/** Reads the current "move" stick (if any) as a normalized {x, y} in [-1, 1] (x=strafe, y=forward). */
	_moveVector() {
		const stick = this._stick, p = this._movePointer;
		stick.x = 0; stick.y = 0;
		if (p) {
			const dx = p.curX - p.startX, dy = p.curY - p.startY;
			const divisor = Math.max(STICK_RADIUS, Math.hypot(dx, dy));
			stick.x = dx / divisor; stick.y = dy / divisor;
		}
		return stick;
	}

	_updateMovement(dt) {
		const stick = this._moveVector();
		if (!this.gameState || (stick.x === 0 && stick.y === 0)) return;
		const speed = MOVE_SPEED * dt, sin = Math.sin(this._yaw), cos = Math.cos(this._yaw);
		const changed = this.gameState.moveParty((-sin * stick.y - cos * stick.x) * speed,
			(-cos * stick.y + sin * stick.x) * speed);
		this._syncCamera();
		if (changed) this.worldView.sync();
	}

	_syncCamera() {
		const p = this.gameState.party.position;
		this.camera.position.set(p.x, p.y + 1.7, p.z);
		this._sun.position.set(p.x - 15, p.y + 25, p.z + 10);
		this._sun.target.position.set(p.x, p.y, p.z);
	}

	_onResize() {
		const w = this.canvas.clientWidth || 1;
		const h = this.canvas.clientHeight || 1;
		this.camera.aspect = w / h;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(w, h, false);
	}

	_applyLook() {
		const dir = this._lookTarget.set(
			Math.sin(this._yaw) * Math.cos(this._pitch),
			Math.sin(this._pitch),
			Math.cos(this._yaw) * Math.cos(this._pitch)
		);
		this.camera.lookAt(dir.add(this.camera.position));
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
		this.scene.add(sun, sun.target);
		this._sun = sun;
	}

	async buildWorld(gameState) {
		this.gameState = gameState;
		this._addLights();
		await this.loadSky();
		this.worldView = new WorldView(this.scene, gameState.exploration);
		await this.worldView.build();
		gameState.moveParty(0, 0);
		this._syncCamera();
		this._applyLook();
	}

	start() {
		if (this._frameId !== null) return;
		this._lastFrameTime = null;
		const loop = (now) => {
			const dt = this._lastFrameTime == null ? 0 : Math.min((now - this._lastFrameTime) / 1000, 0.1);
			this._lastFrameTime = now;
			this._updateMovement(dt);
			this._applyLook();
			this.renderer.render(this.scene, this.camera);
			this._frameId = requestAnimationFrame(loop);
		};
		this._frameId = requestAnimationFrame(loop);
	}

	stop() {
		if (this._frameId !== null) cancelAnimationFrame(this._frameId);
		this._frameId = null;
	}
}

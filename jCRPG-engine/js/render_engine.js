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
import { VISIBLE_RADIUS } from "./map_model.js";
import { createSky } from "./sky.js";

// A little darker than the skybox mountains, so distant silhouettes blend into blue.
const SURFACE_FOG_COLOR = 0x1f2f49;
const SURFACE_FOG_CAVE_COLOR = 0x171e21;
const SURFACE_FOG_DISTANCE = 0.61*VISIBLE_RADIUS;
const SURFACE_FOG_CAVE_DISTANCE = SURFACE_FOG_DISTANCE*0.3;

const MOVE_SPEED = 4; // world units/sec at full stick deflection
const STICK_RADIUS = 55; // px a "move" stick drag is clamped to
const LOOK_SENSITIVITY = 0.006;
const GESTURE_SLOP = 8;
const HOLD_MS = 600;
const STEER_SENSITIVITY = 0.25;
const STEER_TURN_SPEED = Math.PI * 1.5; // 270 degrees/sec at full right-drag deflection

function steeringAxis(delta) {
	const magnitude = Math.max(0, Math.abs(delta) - GESTURE_SLOP);
	return Math.sign(delta) * Math.min(1, magnitude * STEER_SENSITIVITY / (STICK_RADIUS - GESTURE_SLOP));
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

		this.scene.fog = new THREE.Fog(SURFACE_FOG_COLOR, 0.0, SURFACE_FOG_DISTANCE);

		this._yaw = Math.PI; // facing -Z into the scene
		this._pitch = -0.08;
		this._interactionForward = new THREE.Vector3();
		this._interactionFacing = [0, 0, 0];
		this._lastFrameTime = null;

		// Dual-stick touch/mouse input: pointerId -> { side: 'move'|'look'|'steer', startX, startY, curX, curY }.
		this._pointers = new Map();
		this._movePointer = null;
		this._stick = { x: 0, y: 0 };
		this._keys = new Set();
		this._lookTarget = new THREE.Vector3();
		this._frameId = null;
		this._running = false;
		this._inputEnabled = true;
		this._boundFrame = now => this._renderFrame(now);
		this.onViewChange = null;
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
		window.addEventListener('keydown', event => {
			if (event.defaultPrevented || !this._inputEnabled || /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName)) return;
			const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
			if (['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)) { event.preventDefault(); this._keys.add(key); this.requestRender(); }
			if (event.key.toLowerCase()==='e' && !event.repeat) this.onInteract?.();
		});
		window.addEventListener('keyup', event => { this._keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key); this.requestRender(); });
		c.style.touchAction = "none";
		// Long presses belong to the game's hold gesture, not the browser menu.
		c.addEventListener('contextmenu', event => event.preventDefault());
		c.addEventListener('touchstart', event => {
			if (this._inputEnabled && event.cancelable) event.preventDefault();
		}, { passive: false });

		const sideForClientX = (clientX) => {
			const rect = c.getBoundingClientRect();
			return clientX - rect.left < rect.width / 2 ? "move" : "look";
		};

		const clearAction = () => {
			clearTimeout(this._holdTimer);
			this._gestureAction = null;
			this.onGestureHighlight?.(null);
		};
		const look = (dx, dy) => {
			this._yaw -= dx * LOOK_SENSITIVITY;
			this._pitch = Math.max(-1.2, Math.min(1.2, this._pitch - dy * LOOK_SENSITIVITY));
		};
		const startStick = p => {
			this._movePointer = p;
			this._joystickEl.style.left = `${p.startX}px`;
			this._joystickEl.style.top = `${p.startY}px`;
			this._joystickEl.style.display = 'block';
			this._joystickEl.knob.style.left = '50%';
			this._joystickEl.knob.style.top = '50%';
		};
		c.addEventListener("pointerdown", (e) => {
			if (!this._inputEnabled) return;
			// A click exits latched steering and is consumed instead of interacting.
			if (this._movePointer?.side === 'steer') {
				for (const [pointerId, pointer] of this._pointers) {
					if (pointer === this._movePointer) {
						endPointer({ type: 'pointercancel', pointerId });
						break;
					}
				}
				return;
			}
			const steering = e.button === 2 && e.pointerType === 'mouse';
			if (e.button !== 0 && !steering) return;
			// Steering follows hover motion after release, without pointer capture.
			if (!steering) c.setPointerCapture?.(e.pointerId);
			const side = steering ? 'steer' : this._keys.size ? "look" : sideForClientX(e.clientX);
			const p = { side, startX: e.clientX, startY: e.clientY, curX: e.clientX, curY: e.clientY, moved: false };
			this._pointers.set(e.pointerId, p);
			if (steering) {
				p.noAction = true;
				clearAction();
				startStick(p);
			}
			if (this._pointers.size > 1) {
				for (const pointer of this._pointers.values()) pointer.noAction = true;
				clearAction();
			} else if (!steering) {
				this._gestureAction = 'interact';
				this.onGestureHighlight?.('interact');
				this._holdTimer = setTimeout(() => {
					if (!p.moved && !p.noAction && this.canIntuition?.()) {
						this._gestureAction = 'intuition';
						this.onGestureHighlight?.('intuition');
					}
				}, HOLD_MS);
			}
		});

		const onMove = (e) => {
			if (!this._inputEnabled) return;
			const p = this._pointers.get(e.pointerId);
			if (!p) {
				if (this._keys.size && e.pointerType !== 'touch') {
					look(e.movementX || 0, e.movementY || 0);
					this.requestRender();
				}
				return;
			}
			if (!p.moved && Math.hypot(e.clientX - p.startX, e.clientY - p.startY) >= GESTURE_SLOP) {
				p.moved = true;
				clearAction();
				if (this._keys.size && p.side !== 'steer') p.side = 'look';
				if (p.side === 'move' && !this._movePointer) {
					startStick(p);
				}
			}
			if (p.moved && p.side !== 'steer' && (p.side === 'look' || this._keys.size)) {
				if (p === this._movePointer) { this._movePointer = null; this._joystickEl.style.display = 'none'; }
				p.side = 'look';
				look(e.clientX - p.curX, e.clientY - p.curY);
			}
			p.curX = e.clientX;
			p.curY = e.clientY;
			if (p === this._movePointer) {
				const dx = p.curX - p.startX, dy = p.curY - p.startY;
				const dist = Math.min(Math.hypot(dx, dy), STICK_RADIUS), angle = Math.atan2(dy, dx);
				this._joystickEl.knob.style.left = `calc(50% + ${Math.cos(angle) * dist}px)`;
				this._joystickEl.knob.style.top = `calc(50% + ${Math.sin(angle) * dist}px)`;
			}
			this.requestRender();
		};
		const endPointer = (e) => {
			const p = this._pointers.get(e.pointerId);
			if (!p) return;
			if (p.side === 'steer' && ['pointerup', 'lostpointercapture'].includes(e.type)) return;
			const action = e.type === 'pointerup' && !p.moved && !p.noAction &&
				Math.hypot(e.clientX - p.startX, e.clientY - p.startY) < GESTURE_SLOP ? this._gestureAction : null;
			clearAction();
			if (p === this._movePointer) {
				this._movePointer = null;
				this._joystickEl.style.display = "none";
			}
			this._pointers.delete(e.pointerId);
			this.requestRender();
			if (action === 'intuition') this.onIntuition?.();
			else if (action === 'interact') this.onInteract?.();
		};

		c.addEventListener("pointermove", onMove);
		c.addEventListener("pointerup", endPointer);
		c.addEventListener("pointercancel", endPointer);
		c.addEventListener("lostpointercapture", endPointer);
		window.addEventListener("blur", () => this.cancelInput());
		document.addEventListener("visibilitychange", () => {
			this.cancelInput();
			if (!document.hidden) this.requestRender();
		});
		c.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") endPointer(e); });
	}

	/** Reads the current "move" stick (if any) as a normalized {x, y} in [-1, 1] (x=strafe, y=forward). */
	_moveVector() {
		const stick = this._stick, p = this._movePointer;
		stick.x = (this._keys?.has('d') || this._keys?.has('ArrowRight') ? 1 : 0) - (this._keys?.has('a') || this._keys?.has('ArrowLeft') ? 1 : 0);
		stick.y = (this._keys?.has('s') || this._keys?.has('ArrowDown') ? 1 : 0) - (this._keys?.has('w') || this._keys?.has('ArrowUp') ? 1 : 0);
		if (p) {
			const dx = p.curX - p.startX, dy = p.curY - p.startY;
			if (p.side === 'steer') {
				stick.x = 0;
				stick.y = steeringAxis(dy);
			} else {
				const divisor = Math.max(STICK_RADIUS, Math.hypot(dx, dy));
				stick.x = dx / divisor; stick.y = dy / divisor;
			}
		}
		return stick;
	}

	_updateMovement(dt) {
		const p = this._movePointer;
		if (p?.side === 'steer') {
			this._yaw -= steeringAxis(p.curX - p.startX) * STEER_TURN_SPEED * dt;
		}
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
		this.camera.position.set(p.x, p.y + (this.gameState.exploration.manifest ? 0.72 : 1.7), p.z);
		this._sun.position.set(p.x - 15, p.y + 25, p.z + 10);
		this._sun.target.position.set(p.x, p.y, p.z);
	}

	_onResize() {
		const w = this.canvas.clientWidth || 1;
		const h = this.canvas.clientHeight || 1;
		this.camera.aspect = w / h;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(w, h, false);
		this.requestRender();
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
			texture.colorSpace = THREE.SRGBColorSpace;
			this._sky = createSky(texture);
			texture.dispose(); // The six face maps now own the decoded images.
			this.scene.add(this._sky);
		} catch {
			this.scene.background = new THREE.Color(0x9fc2d1);
		}
	}

	_addLights() {
		const ambient = new THREE.HemisphereLight(0xcfe8ff, 0x2b3a1f, 0.9);
		this.scene.add(ambient);
		this._ambient = ambient;

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
		this._lantern = new THREE.PointLight(0xffddad, 2.2, 9, 1.5);
		this.scene.add(this._lantern);
	}

	async buildWorld(gameState) {
		this.gameState = gameState;
		this._addLights();
		await this.loadSky();
		this.worldView = new WorldView(this.scene, gameState.exploration, () => this.requestRender());
		await this.worldView.build();
		gameState.exploration.onChange = () => { this.worldView.sync(); this.requestRender(); };
		gameState.exploration.onError = error => { this.onWorldLoadError?.(error); this.onStatus?.(`World data unavailable: ${error.message}. Select Reconnected in the game menu to retry.`); this.requestRender(); };
		gameState.moveParty(0, 0);
		this._syncCamera();
		this._applyLook();
	}

	_hasMovement() {
		const p = this._movePointer;
		const dragging = p && (p.side === 'steer'
			? steeringAxis(p.curX - p.startX) !== 0 || steeringAxis(p.curY - p.startY) !== 0
			: p.curX !== p.startX || p.curY !== p.startY);
		return this._inputEnabled && ((this._keys?.size ?? 0) > 0 || !!dragging);
	}

	/** One frame for changes; repeat only while a movement stick is held off-center. */
	requestRender() {
		if (!this._running || document.hidden || this._frameId !== null) return;
		this._frameId = requestAnimationFrame(this._boundFrame);
	}

	_renderFrame(now) {
		this._frameId = null;
		if (!this._running || document.hidden) return;
		const moving = this._hasMovement();
		const dt = this._lastFrameTime === null ? 0 : Math.min((now - this._lastFrameTime) / 1000, 0.1);
		if (moving) this._updateMovement(dt);
		this._applyLook();
		if (this.gameState && this.worldView) {
			const cave=this.gameState.realm==='cave';
			this.worldView.setRealm(this.gameState.realm,this.gameState.saveDeltas?.data);
			if (this._sky) this._sky.visible=!cave;
			this._ambient.intensity=cave?0.65:0.9;
			this._sun.intensity=cave?0.15:1.4;
			const pos=this.gameState.party.position;
			const inside=this.gameState.exploration.cellAt?.(pos.x,pos.y,pos.z,this.gameState.realm)?.flags & 2048;
			if(this._lantern){this._lantern.visible=cave||!!inside;this._lantern.position.copy(this.camera.position);}
			this.scene.fog.color.set(cave?SURFACE_FOG_CAVE_COLOR:SURFACE_FOG_COLOR);
			this.scene.fog.far = (cave?SURFACE_FOG_CAVE_DISTANCE:SURFACE_FOG_DISTANCE);
			if (!this.scene.background?.isColor) this.scene.background=new THREE.Color();
			this.scene.background.set(cave?SURFACE_FOG_CAVE_COLOR:0x9fc2d1);
		}
		this.renderer.render(this.scene, this.camera);
		this.onViewChange?.(now, !moving);
		this._lastFrameTime = moving ? now : null;
		if (moving) this.requestRender();
	}

	cancelInput() {
		clearTimeout(this._holdTimer);
		this._gestureAction = null;
		this.onGestureHighlight?.(null);
		this._pointers.clear();
		this._keys?.clear();
		if (this.gameState?.saveDeltas) this.gameState.saveDeltas.persist(this.gameState.party.position,this.gameState.realm);
		this._movePointer = null;
		this._joystickEl.style.display = "none";
		this._lastFrameTime = null;
		if (this._frameId !== null) cancelAnimationFrame(this._frameId);
		this._frameId = null;
		this.onViewChange?.(performance.now(), true);
	}

	setInputEnabled(enabled) {
		this._inputEnabled = enabled;
		this.cancelInput();
	}

	async teleportTo(x, z) {
		if (!Number.isFinite(x) || !Number.isFinite(z)) return;
		this.cancelInput();
		const p = this.gameState.party.position;
		try {
			if (this.gameState.exploration.manifest) {
				this.setInputEnabled(false);
				await this.gameState.teleport(x,z);
			} else this.gameState.moveParty(x-p.x,z-p.z);
			this.worldView.sync();this._syncCamera();this.requestRender();
		} catch(error) { this.onStatus?.(error.message); }
		finally { this.setInputEnabled(true); }
	}

    nearbyInteraction() {
        this.camera.getWorldDirection(this._interactionForward);
        return this.gameState.nearbyInteraction(this._interactionForward.toArray(this._interactionFacing),this.camera.position);
    }
    highlightInteraction(action) {
        const changed=this.highlightedAction?.id!==action?.id;
        this.highlightedAction=action;
        if(!this._attentionRing){
            const mesh=new THREE.Mesh(new THREE.TorusGeometry(.48,.035,6,32),new THREE.MeshBasicMaterial({color:0xffdf83,transparent:true,opacity:.85,depthTest:false}));
            mesh.rotation.x=Math.PI/2;mesh.renderOrder=5;this.scene.add(mesh);this._attentionRing=mesh;
        }
        this._attentionRing.visible=!!action;
        if(action)this._attentionRing.position.set(action.position[0],action.position[1]+.08,action.position[2]);
        if(changed)this.requestRender();
    }
    async attentionPulse(action) {
        if(!action)return;
        this.highlightInteraction(action);
        try { const Audio=window.AudioContext??window.webkitAudioContext;if(Audio){this._interactionAudio??=new Audio();const ctx=this._interactionAudio;ctx.resume().catch(()=>{});const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.frequency.setValueAtTime(520,ctx.currentTime);oscillator.frequency.exponentialRampToValueAtTime(780,ctx.currentTime+.1);gain.gain.setValueAtTime(.025,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.12);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start();oscillator.stop(ctx.currentTime+.13);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};} } catch {}
        const end=new THREE.Vector3(...action.position);end.y+=.5;
        const geometry=new THREE.BufferGeometry().setFromPoints([this.camera.position.clone(),end]);
        const material=new THREE.LineBasicMaterial({color:0x9effe0,transparent:true,opacity:.85});
        const line=new THREE.Line(geometry,material);this.scene.add(line);this.renderer.render(this.scene,this.camera);
        // A bounded cue only; the normal world renderer remains idle at rest.
        await new Promise(resolve=>setTimeout(resolve,140));
        this.scene.remove(line);geometry.dispose();material.dispose();
    }
	async interact() {
		if (this._interacting || !this._inputEnabled) return;
		this._interacting=true;
        const action=this.nearbyInteraction();
        this.cancelInput();
		try { await this.attentionPulse(action);const message=await this.gameState.interact(action);this.onStatus?.(message);this.onInteractionPanel?.();this.worldView.sync();this._syncCamera();this.requestRender(); }
		catch(error) { this.onStatus?.(error.message); }
		finally { this._interacting=false; }
	}

	start() {
		this._running = true;
		this.requestRender();
	}

	stop() {
		this._running = false;
		this.cancelInput();
	}
}

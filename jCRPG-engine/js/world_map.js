import { buildMapMarkers, MARKER_STYLES, MINIMAP_RADIUS, VISIBLE_RADIUS, wrappedDelta } from './map_model.js';

const TERRAIN_COLORS = [[126, 143, 88], [59, 94, 59], [128, 123, 113], [49, 102, 134], [161, 128, 82], [204, 179, 104]];
const DASHED = [3, 3], SOLID = [];

/** Canvas maps share one fixed terrain raster. No timers or animation loops. */
export class WorldMap {
	constructor(gameState, renderer) {
		this.state = gameState;
		this.renderer = renderer;
		this.world = gameState.exploration.world;
		this.baseMarkers = buildMapMarkers(this.world, this.world.additionalMapMarkers);
		this.markers = [...this.baseMarkers,...(gameState.interactions?.markers()??[])];
		this.enabled = new Set(Object.keys(MARKER_STYLES));
		this.query = '';
		this.mini = document.getElementById('minimap-canvas');
		this.full = document.getElementById('world-map-canvas');
		this.dialog = document.getElementById('world-map-dialog');
		this.list = document.getElementById('map-locations');
		this.detail = document.getElementById('map-detail');
		this._lastX = NaN; this._lastZ = NaN; this._lastYaw = NaN;
		this.atlas = document.createElement('canvas');
		this.atlas.width = 400; this.atlas.height = 400;
		this._buildAtlas();
		this._buildFilters();
		const miniButton = document.getElementById('hud-minimap');
		miniButton.querySelector('span').textContent = `Map · ${MINIMAP_RADIUS}-unit radius`;
		miniButton.title = `Nearby map: ${MINIMAP_RADIUS}-unit radius, twice the visible area`;
		miniButton.addEventListener('click', () => this.open());
		document.getElementById('map-open').addEventListener('click', () => this.open());
		document.getElementById('map-close').addEventListener('click', () => this.close());
		this.dialog.addEventListener('click', event => { if (event.target === this.dialog) this.close(); });
		this.dialog.addEventListener('cancel', event => { event.preventDefault(); this.close(); });
		this.dialog.addEventListener('close', () => {
			// Native close is queued: do not cancel input that resumed in the meantime.
			if (!this.dialog.open && !renderer._inputEnabled) {
				renderer.setInputEnabled(true); renderer.requestRender();
			}
		});
		this.full.addEventListener('click', event => {
			const marker = this._hit(event);
			if (marker) this._teleport(marker);
			else this.close();
		});
		this.full.addEventListener('pointermove', event => {
			const marker = this._hit(event);
			this.detail.textContent = marker ? this._label(marker) : 'Tap a marker to teleport, or tap the map background to close.';
		});
		this.list.addEventListener('click', event => {
			const button = event.target.closest('button[data-marker]');
			if (button) this._teleport(this.markers[Number(button.dataset.marker)]);
		});
		document.getElementById('map-search').addEventListener('input', event => {
			this.query = event.target.value.toLowerCase().trim();
			this._drawFull(); this._renderList();
		});
		window.addEventListener('resize', () => this.update(true));
	}

	_kind(marker) { return MARKER_STYLES[marker.kind] ? marker.kind : 'other'; }
	_visible(marker) {
		return this.enabled.has(this._kind(marker)) && (!this.query ||
			`${marker.name} ${marker.kind} ${Math.floor(marker.x)} ${Math.floor(marker.z)}`.toLowerCase().includes(this.query));
	}
	_label(marker) {
		return `${marker.name} · ${MARKER_STYLES[this._kind(marker)].label} · ${Math.floor(marker.x)}, ${Math.floor(marker.z)}${marker.implemented ? '' : ' · Unimplemented'}${marker.note ? ` · ${marker.note}` : ''}`;
	}

	_buildAtlas() {
		const ctx = this.atlas.getContext('2d'), image = ctx.createImageData(400, 400);
		for (let y = 0; y < 400; y++) for (let x = 0; x < 400; x++) {
			const wx = (x + 0.5) * 4, wz = this.world.sizeZ - (y + 0.5) * 4;
			const type = this.world.typeAt(wx, wz), color = TERRAIN_COLORS[type], offset = (y * 400 + x) * 4;
			const climate = this.world.climateAt(wx, wz);
			for (let c = 0; c < 3; c++) image.data[offset + c] = type < 3 && climate === 1 ? color[c] * 0.5 + 120 : color[c];
			image.data[offset + 3] = 255;
		}
		ctx.putImageData(image, 0, 0);
	}

	_buildFilters() {
		const filters = document.getElementById('map-filters');
		for (const [kind, style] of Object.entries(MARKER_STYLES)) {
			const count = this.markers.filter(m => this._kind(m) === kind).length;
			if (!count) continue;
			const label = document.createElement('label'), input = document.createElement('input');
			input.type = 'checkbox'; input.checked = true;
			input.addEventListener('change', () => {
				if (input.checked) this.enabled.add(kind); else this.enabled.delete(kind);
				this._drawFull(); this._renderList(); this._drawMini();
			});
			const text = document.createElement('span');
			text.textContent = `${style.symbol} ${style.label} (${count})`; text.style.color = style.color;
			label.append(input, text); filters.append(label);
		}
		if (!this.markers.some(m => m.kind === 'mission' || m.kind === 'puzzle')) {
			document.getElementById('map-mission-note').textContent = 'Accept a mission to reveal its objectives. Shrine routes reveal the next relay as you awaken the network.';
		}
	}

	open() {
		if (this.dialog.open) return;
		this.renderer.setInputEnabled(false);
		this.detail.textContent = 'Tap a marker to teleport, or tap the map background to close.';
		this.dialog.showModal();
		this._drawFull(); this._renderList();
	}

	close() {
		if (!this.dialog.open) return;
		this.dialog.close();
		this.renderer.setInputEnabled(true);
		this.renderer.requestRender();
	}

	_teleport(marker) {
		this.close();
		if(marker.realm==='cave')this.state.teleport(marker.x,marker.z,marker.y,'cave').then(()=>{this.renderer._syncCamera();this.renderer.requestRender();}).catch(error=>this.renderer.onStatus?.(error.message));else this.renderer.teleportTo(marker.x, marker.z);
		this.update(true);
	}

	_renderList() {
		const fragment = document.createDocumentFragment();
		let count = 0;
		for (let i = 0; i < this.markers.length; i++) {
			const marker = this.markers[i];
			if (!this._visible(marker)) continue;
			const button = document.createElement('button');
			button.type = 'button'; button.dataset.marker = i;
			button.textContent = `${MARKER_STYLES[this._kind(marker)].symbol} ${this._label(marker)}`;
			fragment.append(button); count++;
		}
		this.list.replaceChildren(fragment);
		document.getElementById('map-location-count').textContent = `${count} locations — select one to teleport`;
		if (!count) this.list.textContent = 'No matching locations. Try another search or enable more marker types.';
	}

	_background(ctx, size, left, top, span) {
		const scale = size / span;
		ctx.clearRect(0, 0, size, size);
		ctx.imageSmoothingEnabled = false;
		for (let z = -1; z <= 1; z++) for (let x = -1; x <= 1; x++) {
			ctx.drawImage(this.atlas, (x * this.world.sizeX - left) * scale,
				(top - (z + 1) * this.world.sizeZ) * scale, this.world.sizeX * scale, this.world.sizeZ * scale);
		}
	}

	_marker(ctx, marker, x, y, size) {
		const style = MARKER_STYLES[this._kind(marker)];
		ctx.fillStyle = '#15202c'; ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
		ctx.strokeStyle = style.color; ctx.lineWidth = 1;
		ctx.setLineDash(marker.implemented ? SOLID : DASHED); ctx.stroke(); ctx.setLineDash(SOLID);
		ctx.fillStyle = style.color; ctx.font = `${size * 1.6}px sans-serif`;
		ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(style.symbol, x, y);
	}

	_player(ctx, x, y, size) {
		ctx.save(); ctx.translate(x, y); ctx.rotate(this.renderer._yaw);
		ctx.beginPath(); ctx.moveTo(0, -size); ctx.lineTo(size * 0.7, size); ctx.lineTo(0, size * 0.5); ctx.lineTo(-size * 0.7, size); ctx.closePath();
		ctx.fillStyle = '#ff4949'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.fill(); ctx.stroke(); ctx.restore();
	}

	_drawMini() {
		const ctx = this.mini.getContext('2d'), size = this.mini.width, p = this.state.party.position;
		this._background(ctx, size, p.x - MINIMAP_RADIUS, p.z + MINIMAP_RADIUS, MINIMAP_RADIUS * 2);
		const scale = size / (MINIMAP_RADIUS * 2);
		ctx.strokeStyle = '#ffffff88'; ctx.setLineDash(DASHED); ctx.beginPath();
		ctx.arc(size / 2, size / 2, VISIBLE_RADIUS * scale, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash(SOLID);
		for (const marker of this.markers) {
			if (!this.enabled.has(this._kind(marker))) continue;
			const dx = wrappedDelta(marker.x, p.x, this.world.sizeX), dz = wrappedDelta(marker.z, p.z, this.world.sizeZ);
			if (Math.abs(dx) > MINIMAP_RADIUS || Math.abs(dz) > MINIMAP_RADIUS) continue;
			this._marker(ctx, marker, size / 2 + dx * scale, size / 2 - dz * scale, 8);
		}
		this._player(ctx, size / 2, size / 2, 10);
		ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('N', size / 2, 16);
	}

	_drawFull() {
		if (!this.dialog.open) return;
		const ctx = this.full.getContext('2d'), size = this.full.width, p = this.state.party.position;
		this._background(ctx, size, 0, this.world.sizeZ, this.world.sizeX);
		for (const marker of this.markers) if (this._visible(marker)) {
			this._marker(ctx, marker, marker.x / this.world.sizeX * size, (1 - marker.z / this.world.sizeZ) * size, 7);
		}
		this._player(ctx, p.x / this.world.sizeX * size, (1 - p.z / this.world.sizeZ) * size, 10);
	}

	_hit(event) {
		const rect = this.full.getBoundingClientRect(), size = this.full.width;
		const x = (event.clientX - rect.left) / rect.width * size, y = (event.clientY - rect.top) / rect.height * size;
		let best = null, distance = (14 * size / rect.width) ** 2;
		for (const marker of this.markers) {
			if (!this._visible(marker)) continue;
			const dx = marker.x / this.world.sizeX * size - x, dy = (1 - marker.z / this.world.sizeZ) * size - y;
			const d = dx * dx + dy * dy;
			if (d < distance) { best = marker; distance = d; }
		}
		return best;
	}

	update(force = false) {
        const revision=this.state.saveDeltas?.data.deltaRevision??0;
        if(this._interactionRevision!==revision){this._interactionRevision=revision;force=true;const save=this.state.saveDeltas?.data;
            this.markers=[...this.baseMarkers.map(m=>m.kind==='shrine'?{...m,implemented:true,note:save?.shrines?.[m.id.replace('RoadShrine:','shrine:')]?.activated?'Awake relay':'Dormant relay'}:m),...(this.state.interactions?.markers()??[])];
            if(this.dialog.open)this._renderList();
        }
		const p = this.state.party.position, yaw = this.renderer._yaw;
		if (!force && p.x === this._lastX && p.z === this._lastZ && yaw === this._lastYaw) return;
		this._lastX = p.x; this._lastZ = p.z; this._lastYaw = yaw;
		this._drawMini(); this._drawFull();
	}
}

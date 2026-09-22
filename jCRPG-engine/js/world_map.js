import { buildMapMarkers, MARKER_STYLES, MINIMAP_RADIUS, VISIBLE_RADIUS, wrappedDelta } from './map_model.js';

import {knownLocation,rememberLocations,discoverVisited,cameraMapOffset} from './map_discovery.js';

import {MapViewport,bindMapGestures} from './map_viewport.js';
import {mapGoalPosition} from './interactions/navigation.js';

const TERRAIN_COLORS = [[126, 143, 88], [59, 94, 59], [128, 123, 113], [49, 102, 134], [161, 128, 82], [204, 179, 104]];
const DASHED = [3, 3], SOLID = [];

/** Canvas maps share one fixed terrain raster. No timers or animation loops. */
export class WorldMap {
	constructor(gameState, renderer) {
		this.state = gameState;
		this.renderer = renderer;
		this.world = gameState.exploration.world;
		this.baseMarkers = buildMapMarkers(this.world, this.world.additionalMapMarkers).map(m=>m.kind==='shrine'?{...m,id:m.id.replace('RoadShrine:','shrine:'),implemented:true}:m);
		const content=gameState.interactions?.content;
		if(content?.settlements){
			this.baseMarkers=this.baseMarkers.filter(m=>m.kind!=='settlement');
			for(const town of content.settlements)this.baseMarkers.push({id:town.id,name:town.name,kind:'settlement',x:town.position[0],y:town.position[1],z:town.position[2],realm:town.realm,implemented:true,capital:['capital','secondary-capital'].includes(town.settlementTier),aliases:this.world.landmarks.filter(l=>town.districtIds.includes(l.id)).map(l=>l.name)});
		}
        if(content){
            const extra=new Map();
            for(const mission of content.missions){
                const actor=gameState.interactions.maps.actors[mission.turnInActorId];
                extra.set(mission.id,{id:mission.id,name:mission.title,kind:'mission',x:actor.position[0],y:actor.position[1],z:actor.position[2],realm:actor.realm,implemented:true,revealOnly:true});
                for(const objective of mission.objectives)for(const goal of content.goals.filter(g=>objective.targetIds.includes(g.targetId)))extra.set(goal.id,{id:goal.id,name:objective.text,kind:'puzzle',x:goal.position[0],y:goal.position[1],z:goal.position[2],realm:goal.realm,implemented:true,revealOnly:true});
            }
            this.baseMarkers.push(...extra.values());
        }
		this.state.mapMarkers=this.baseMarkers;
		this.markers=[...this.baseMarkers];
		this.showAll=false;
		this.enabled = new Set(Object.keys(MARKER_STYLES));
		this.query = '';
		this.mini = document.getElementById('minimap-canvas');
		this.full = document.getElementById('world-map-canvas');
		this.viewport=new MapViewport(this.world.sizeX,this.world.sizeZ);
		this.mapGestures=bindMapGestures(this.full,this.viewport,()=>this._drawFull());
		this.dialog = document.getElementById('world-map-dialog');
		this.list = document.getElementById('map-locations');
		this.detail = document.getElementById('map-detail');
		this.popup = document.getElementById('map-place-dialog');
		document.getElementById('map-place-close').addEventListener('click',()=>this.popup.close());
		this.popup.addEventListener('cancel',event=>{event.preventDefault();event.stopPropagation();this.popup.close();});
		document.getElementById('map-place-travel').addEventListener('click',()=>{if(this.selectedMarker)this._teleport(this.selectedMarker);});
		document.getElementById('map-place-nav').addEventListener('click',()=>this.setSelectedNavigation());
		this._lastX = NaN; this._lastZ = NaN; this._lastYaw = NaN;
		this.atlas = document.createElement('canvas');
		this.atlas.width = 400; this.atlas.height = 400;
		this._buildAtlas();
		this._buildFilters();
		document.getElementById('map-show-all').addEventListener('change',event=>{this.showAll=event.target.checked;this.update(true);this._renderList();});
		const miniButton = document.getElementById('hud-minimap');
		miniButton.querySelector('span').textContent = `Map · ${MINIMAP_RADIUS}-unit radius`;
		miniButton.title = `Nearby map: ${MINIMAP_RADIUS}-unit radius, twice the visible area`;
		miniButton.addEventListener('click', () => this.open());
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
			if(this.mapGestures.suppressClick())return;
			const marker = this._hit(event);
			if (marker) this.showPlace(marker);
			else this.close();
		});
		this.full.addEventListener('pointermove', event => {
			const marker = this._hit(event);
			this.detail.textContent = marker ? this._label(marker) : 'Select a marker for details and travel, or tap the map background to close.';
		});
		this.list.addEventListener('click', event => {
			const button = event.target.closest('button[data-marker]');
			if (button) this.showPlace(this.markers[Number(button.dataset.marker)]);
		});
		document.getElementById('map-search').addEventListener('input', event => {
			this.query = event.target.value.toLowerCase().trim();
			this._drawFull(); this._renderList();
		});
		window.addEventListener('resize', () => this.update(true));
	}

	_kind(marker) { return MARKER_STYLES[marker.kind] ? marker.kind : 'other'; }
	_visible(marker) {
		return knownLocation(marker,this.state.saveDeltas?.data,this.showAll) && this.enabled.has(this._kind(marker)) && (!this.query ||
			`${marker.name} ${marker.kind} ${Math.floor(marker.x)} ${Math.floor(marker.z)}`.toLowerCase().includes(this.query));
	}
	_label(marker) {
		const visited=this.state.saveDeltas?.data.discoveredLocations['visited:'+marker.id];
		return `${marker.name}${marker.capital?' · Capital':''}${visited?' · Visited':''} · ${MARKER_STYLES[this._kind(marker)].label} · ${Math.floor(marker.x)}, ${Math.floor(marker.z)}${marker.implemented ? '' : ' · Unimplemented'}${marker.note ? ` · ${marker.note}` : ''}`;
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
			if (!count && !['mission','puzzle'].includes(kind)) continue;
			const label = document.createElement('label'), input = document.createElement('input');
			input.type = 'checkbox'; input.checked = true;
			input.addEventListener('change', () => {
				if (input.checked) this.enabled.add(kind); else this.enabled.delete(kind);
				this._drawFull(); this._renderList(); this._drawMini();
			});
			const text = document.createElement('span');
			text.textContent = `${style.symbol} ${style.label}`; text.style.color = style.color;
			label.append(input, text); filters.append(label);
		}
		if (!this.markers.some(m => m.kind === 'mission' || m.kind === 'puzzle')) {
			document.getElementById('map-mission-note').textContent = 'Accept a mission to reveal its objectives. Shrine routes reveal the next relay as you awaken the network.';
		}
	}

	open() {
		if (this.dialog.open) return;
		this.renderer.setInputEnabled(false);
		this.viewport.reset();this.mapGestures.reset();
		this.detail.textContent = 'Select a marker for details and travel, or tap the map background to close.';
		this.dialog.showModal();
		this.update(true); this._renderList();
	}

	close() {
		if (!this.dialog.open) return;
		if(this.popup.open)this.popup.close();
		this.dialog.close();
		this.renderer.setInputEnabled(true);
		this.renderer.requestRender();
	}

	showPlace(marker) {
		this.selectedMarker=marker;
		document.getElementById('map-place-title').textContent=marker.name;
		document.getElementById('map-place-detail').textContent=[this._label(marker),marker.description,marker.realm==='cave'?'Underground destination.':null].filter(Boolean).join('\n\n');
		if(!this.popup.open)this.popup.showModal();
		document.getElementById('map-place-close').focus();
	}

	setSelectedNavigation(){
		const marker=this.selectedMarker;if(!marker)return;
		const engine=this.state.interactions;
		const missionId=marker.missionId??(engine.maps.missions[marker.id]?marker.id:null)??(engine.navigationGoal()?.id===marker.id?this.state.saveDeltas.data.navMissionId:null);
		if(missionId&&['available','active','ready-to-turn-in'].includes(engine.missionState(missionId)))engine.setNavigationGoal(missionId);
		else engine.setNavigationLocation(marker);
		this.state.saveDeltas.persist(this.state.party.position,this.state.realm);
		this.popup.close();this.update(true);this.renderer.requestRender();
	}

	showQuestGoal(goal,mission) {
		if(!goal)return;
		this.open();
		this.viewport.zoom=Math.min(4,this.viewport.maxZoom);
		this.viewport.x=goal.position[0];this.viewport.z=goal.position[2];this.viewport.constrain();
		this._drawFull();
		this.showPlace({id:goal.id,missionId:mission.id,name:goal.name,kind:'mission',x:goal.position[0],y:goal.position[1],z:goal.position[2],realm:goal.realm,implemented:true,description:mission.title+'\n'+mission.summary});
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
		document.getElementById('map-location-count').textContent = `${count} locations — select one for details`;
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

	_player(ctx, x, y, size, yaw=this.renderer._yaw) {
		ctx.save(); ctx.translate(x, y); ctx.rotate(yaw);
		ctx.beginPath(); ctx.moveTo(0, -size); ctx.lineTo(size * 0.7, size); ctx.lineTo(0, size * 0.5); ctx.lineTo(-size * 0.7, size); ctx.closePath();
		ctx.fillStyle = '#ff4949'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.fill(); ctx.stroke(); ctx.restore();
	}

	_drawMini() {
		const ctx = this.mini.getContext('2d'), size = this.mini.width, p = this.state.party.position;
		const yaw=this.renderer._yaw;
		ctx.clearRect(0,0,size,size);ctx.save();ctx.translate(size/2,size/2);ctx.rotate(yaw);ctx.scale(-1,1);ctx.translate(-size/2,-size/2);
		this._background(ctx, size, p.x - MINIMAP_RADIUS, p.z + MINIMAP_RADIUS, MINIMAP_RADIUS * 2);
		ctx.restore();
		const scale = size / (MINIMAP_RADIUS * 2);
		ctx.strokeStyle = '#ffffff88'; ctx.setLineDash(DASHED); ctx.beginPath();
		ctx.arc(size / 2, size / 2, VISIBLE_RADIUS * scale, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash(SOLID);
		for (const marker of this.markers) {
			if (!knownLocation(marker,this.state.saveDeltas?.data,this.showAll)||!this.enabled.has(this._kind(marker))) continue;
			const dx = wrappedDelta(marker.x, p.x, this.world.sizeX), dz = wrappedDelta(marker.z, p.z, this.world.sizeZ);
			const offset=cameraMapOffset(dx,dz,yaw);
			if (Math.abs(offset.x) > MINIMAP_RADIUS || Math.abs(offset.y) > MINIMAP_RADIUS) continue;
			this._marker(ctx, marker, size / 2 + offset.x * scale, size / 2 + offset.y * scale, 8);
		}
		this._player(ctx, size / 2, size / 2, 10, 0);
		const north=cameraMapOffset(0,1,yaw),edge=(size/2-16)/Math.max(Math.abs(north.x),Math.abs(north.y));
		ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=4;ctx.strokeStyle='#17251b';
		ctx.strokeText('N',size/2+north.x*edge,size/2+north.y*edge);ctx.fillStyle='#fff';ctx.fillText('N',size/2+north.x*edge,size/2+north.y*edge);
		const goal=this.state.interactions?.navigationGoal();
		if(goal){const offset=cameraMapOffset(wrappedDelta(goal.position[0],p.x,this.world.sizeX),wrappedDelta(goal.position[2],p.z,this.world.sizeZ),yaw);this._navIcon(ctx,size/2+offset.x*scale,size/2+offset.y*scale,size,goal);}
	}

	_navIcon(ctx,x,y,size,goal){
		const at=mapGoalPosition(x,y,size);
		ctx.save();ctx.translate(at.x,at.y);ctx.fillStyle='#ffd75a';ctx.strokeStyle='#201907';ctx.lineWidth=3;
		ctx.beginPath();
		if(at.edge){ctx.rotate(at.angle);ctx.moveTo(12,0);ctx.lineTo(-8,-8);ctx.lineTo(-4,0);ctx.lineTo(-8,8);}
		else {ctx.moveTo(0,-11);ctx.lineTo(9,0);ctx.lineTo(0,11);ctx.lineTo(-9,0);}
		ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
		if(goal.realm!==this.state.realm){ctx.save();ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#201907';ctx.fillStyle='#ffd75a';const label=goal.realm==='cave'?'Cave':'Surface';const ly=at.y>size/2?at.y-16:at.y+24;ctx.strokeText(label,at.x,ly);ctx.fillText(label,at.x,ly);ctx.restore();}
	}

	_drawFull() {
		if (!this.dialog.open) return;
		const ctx = this.full.getContext('2d'), size = this.full.width, p = this.state.party.position;
		const view=this.viewport,span=view.span;
		ctx.clearRect(0,0,size,size);ctx.fillStyle='#101917';ctx.fillRect(0,0,size,size);ctx.imageSmoothingEnabled=false;
		const corner=view.project(0,this.world.sizeZ);
		ctx.drawImage(this.atlas,corner.x*size,corner.y*size,this.world.sizeX/span*size,this.world.sizeZ/span*size);
		for (const marker of this.markers) if (this._visible(marker)) {
			const at=view.project(marker.x,marker.z);
			if(at.x>=0&&at.x<=1&&at.y>=0&&at.y<=1)this._marker(ctx,marker,at.x*size,at.y*size,7);
		}
		const at=view.project(p.x,p.z);
		if(at.x>=0&&at.x<=1&&at.y>=0&&at.y<=1)this._player(ctx,at.x*size,at.y*size,10);
		const goal=this.state.interactions?.navigationGoal();
		if(goal){const target=view.project(goal.position[0],goal.position[2]);this._navIcon(ctx,target.x*size,target.y*size,size,goal);}
	}

	_hit(event) {
		const rect = this.full.getBoundingClientRect(), size = this.full.width;
		const x = (event.clientX - rect.left) / rect.width * size, y = (event.clientY - rect.top) / rect.height * size;
		let best = null, distance = (14 * size / rect.width) ** 2;
		const goal=this.state.interactions?.navigationGoal();
		if(goal){const projected=this.viewport.project(goal.position[0],goal.position[2]),at=mapGoalPosition(projected.x*size,projected.y*size,size);if((at.x-x)**2+(at.y-y)**2<distance)return {id:goal.id,name:goal.name,kind:'mission',x:goal.position[0],y:goal.position[1],z:goal.position[2],realm:goal.realm,implemented:true};}
		for (const marker of this.markers) {
			if (!this._visible(marker)) continue;
			const at=this.viewport.project(marker.x,marker.z);
			if(at.x<0||at.x>1||at.y<0||at.y>1)continue;
			const dx=at.x*size-x,dy=at.y*size-y;
			const d = dx * dx + dy * dy;
			if (d < distance) { best = marker; distance = d; }
		}
		return best;
	}

	update(force = false) {
        const nav=this.state.interactions?.navigationGoal();
        document.getElementById('hud-minimap').setAttribute('aria-label',nav?'Open world map. Navigation goal: '+nav.name:'Open world map');
        document.getElementById('map-mission-note').textContent=nav?'◆ Navigation: '+nav.name+' · '+nav.realm+'. Gold arrows point toward offscreen goals.':'Select a quest in the journal to set a navigation goal.';
        const save=this.state.saveDeltas;
        if(save&&discoverVisited(save,this.baseMarkers,this.state.party.position,this.state.realm,this.world.sizeX,this.world.sizeZ))save.persist(this.state.party.position,this.state.realm);
        const revision=save?.data.deltaRevision??0;
        if(this._interactionRevision!==revision||this._saveData!==save?.data||force){
            this._saveData=save?.data;
            this._interactionRevision=revision;force=true;
            const objectives=(this.state.interactions?.markers()??[]).map(m=>({...m,objective:true}));
            if(save&&rememberLocations(save,objectives.flatMap(m=>[m.id,m.id.replace(/^route:/,'')]))){save.persist(this.state.party.position,this.state.realm);this._interactionRevision=save.data.deltaRevision;}
            this.markers=[...new Map([...this.baseMarkers,...objectives].map(m=>[m.id,m])).values()];
            if(this.dialog.open)this._renderList();
        }
		const p = this.state.party.position, yaw = this.renderer._yaw;
		if (!force && p.x === this._lastX && p.z === this._lastZ && yaw === this._lastYaw) return;
		this._lastX = p.x; this._lastZ = p.z; this._lastYaw = yaw;
		this._drawMini(); this._drawFull();
	}
}

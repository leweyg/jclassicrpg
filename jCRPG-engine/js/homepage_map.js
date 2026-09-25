import { MapViewport, bindMapGestures } from './map_viewport.js';
import { MARKER_STYLES } from './map_model.js';
import { PLAY_DESTINATIONS } from './play_destinations.js';

const byId = id => document.getElementById(id);
const styles = { ...MARKER_STYLES, capital: { label: 'Capitals', color: '#ffdf87', symbol: '★' }, actor: { label: 'Characters', color: '#a3e9cb', symbol: '●' } };
const colors = [[126,143,88], [59,94,59], [128,123,113], [49,102,134], [161,128,82], [204,179,104]];

async function loadMap() {
  const files = ['map.json', 'interactions/settlements.json', 'interactions/shrines.json', 'portals.json', 'structures.json', 'interactions/actors.json', 'interactions/mission-index.json', 'interactions/puzzles.json'];
  const [terrain, towns, shrines, portals, structures, actors, missions, puzzles] = await Promise.all(files.map(async file => {
    const response = await fetch(new URL(`../worlds/seed0/v2/${file}`, import.meta.url));
    if (!response.ok) throw new Error(`Unable to load ${file}`);
    return response.json();
  }));
  const markers = [];
  const add = (kind, name, position, extra = {}) => markers.push({ kind, name, x: position[0], y: position[1], z: position[2], ...extra });
  for (const town of towns) add(['capital', 'secondary-capital'].includes(town.settlementTier) ? 'capital' : 'settlement', town.name, town.position, { realm: town.realm, note: town.settlementTier, id: town.id });
  for (const shrine of shrines) add('shrine', 'Relay shrine', shrine.position);
  for (const portal of portals.filter(p => p.kind === 'cave')) add('cave', 'Cave entrance', portal.from, { note: `${portal.componentSize} connected cave cells` });
  const townNames = new Map(towns.map(t => [t.id, t.name]));
  for (const structure of structures) {
    const kind = structure.kind === 'SimpleDungeonPart' ? 'dungeon' : structure.kind === 'PavedStorageAreaGround' ? 'storage' : null;
    if (kind) add(kind, `${townNames.get(structure.townId) || 'World'} · ${kind === 'dungeon' ? 'Labyrinth' : 'Storage'}`, structure.origin);
  }
  for (const actor of actors) add('actor', actor.name, actor.position, { realm: actor.realm, note: actor.role });
  const actorById = new Map(actors.map(a => [a.id, a]));
  for (const mission of missions) {
    const actor = actorById.get(mission.giverActorId || mission.turnInActorId);
    if (actor) add('mission', mission.title, actor.position, { realm: actor.realm, note: `Speak to ${actor.name}` });
  }
  for (const puzzle of puzzles) if (puzzle.position) add('puzzle', `${townNames.get(puzzle.townId) || 'World'} · Circuit`, puzzle.position, { realm: puzzle.realm });
  for (const [destination, stop] of Object.entries(PLAY_DESTINATIONS)) add(destination === 'start' ? 'start' : 'main-story', stop.name, stop.position, { destination });
  for (const marker of markers) {
    marker.destination ??= Object.keys(PLAY_DESTINATIONS).find(key => PLAY_DESTINATIONS[key].settlementId === marker.id && marker.id);
  }
  const canvas = byId('atlas'), ctx = canvas.getContext('2d');
  const size = terrain.side * terrain.step;
  const view = new MapViewport(size, size);
  view.minZoom = 1; view.maxZoom = 32;
  view.zoomAt(2);
  const atlas = document.createElement('canvas');
  atlas.width = atlas.height = terrain.side;
  const terrainCtx = atlas.getContext('2d'), raster = terrainCtx.createImageData(terrain.side, terrain.side);
  // The baked raster is stored south to north; canvas rows run north to south.
  for (let y = 0; y < terrain.side; y++) for (let x = 0; x < terrain.side; x++) {
    const color = colors[terrain.types[(terrain.side - y - 1) * terrain.side + x]] || colors[0];
    raster.data.set([...color, 255], (y * terrain.side + x) * 4);
  }
  terrainCtx.putImageData(raster, 0, 0);
  const kinds = new Set(markers.map(m => m.kind));
  const dotKinds = new Set(['shrine', 'cave']);
  const enabled = new Set([...kinds].filter(kind => !dotKinds.has(kind)));
  let query = '', selected = null;
  const matches = m => `${m.name} ${styles[m.kind].label} ${m.note || ''} ${Math.round(m.x)}, ${Math.round(m.z)}`.toLowerCase().includes(query);
  const visible = () => markers.filter(m => enabled.has(m.kind) && matches(m));
  function draw() {
    const width = canvas.width, corner = view.project(0, size);
    ctx.clearRect(0, 0, width, width); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(atlas, corner.x * width, corner.y * width, size / view.span * width, size / view.span * width);
    // Draw disabled cave/shrine locations beneath the full markers.
    for (const marker of markers.filter(m => dotKinds.has(m.kind) && !enabled.has(m.kind) && matches(m))) {
      const point = view.project(marker.x, marker.z);
      if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) continue;
      ctx.fillStyle = styles[marker.kind].color;
      ctx.beginPath(); ctx.arc(point.x * width, point.y * width, 2, 0, Math.PI * 2); ctx.fill();
    }
    for (const marker of visible()) {
      const point = view.project(marker.x, marker.z);
      if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) continue;
      const x = point.x * width, y = point.y * width, style = styles[marker.kind];
      const major = ['capital', 'main-story', 'start'].includes(marker.kind);
      ctx.fillStyle = '#101917'; ctx.beginPath(); ctx.arc(x, y, major ? 9 : 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = style.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${major ? 17 : 12}px sans-serif`; ctx.fillText(style.symbol, x, y);
      if (marker === selected) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x,y,13,0,Math.PI*2); ctx.stroke(); }
      if ((major && view.zoom >= 3) || marker === selected) {
        ctx.font = '15px sans-serif'; ctx.textAlign = 'left'; ctx.lineWidth = 4; ctx.strokeStyle = '#101917';
        ctx.strokeText(marker.name, x + 14, y); ctx.fillStyle = '#fff'; ctx.fillText(marker.name, x + 14, y);
      }
    }
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#101917'; ctx.lineWidth = 4; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'right';
    ctx.strokeText('N ↑', width - 18, width - 24); ctx.fillText('N ↑', width - 18, width - 24);
    byId('atlas-zoom').textContent = `${view.zoom.toFixed(1)}×`;
  }
  function select(marker, center = false) {
    selected = marker;
    const title = document.createElement('strong'); title.textContent = marker.name;
    const text = document.createElement('p'); text.textContent = `${styles[marker.kind].label} · ${Math.round(marker.x)}, ${Math.round(marker.z)}${marker.realm === 'cave' ? ' · Underground' : ''}${marker.note ? ' · ' + marker.note : ''}`;
    byId('atlas-detail').replaceChildren(title, text);
    const link = document.createElement('a');
    const destination = marker.destination || `map:${marker.x},${marker.y},${marker.z},${marker.realm || 'surface'}`;
    link.href = `play.html?${new URLSearchParams({ location: destination })}`;
    link.className = 'map-travel'; link.textContent = 'Travel here';
    byId('atlas-detail').append(link);
    if (center) { view.zoom = Math.max(view.zoom, 6); view.x = marker.x; view.z = marker.z; view.constrain(); }
    draw();
  }
  function refresh() {
    const items = visible(), fragment = document.createDocumentFragment();
    for (const marker of items) {
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = `${styles[marker.kind].symbol} ${marker.name} · ${Math.round(marker.x)}, ${Math.round(marker.z)}`;
      button.addEventListener('click', () => select(marker, true)); fragment.append(button);
    }
    byId('atlas-list').replaceChildren(fragment);
    byId('atlas-status').textContent = `${items.length} of ${markers.length} locations enabled${items.length ? '.' : '. Try another search or enable more location types.'}`;
    draw();
  }
  for (const kind of kinds) {
    const label = document.createElement('label'), input = document.createElement('input');
    input.type = 'checkbox'; input.checked = enabled.has(kind);
    input.addEventListener('change', () => { if (input.checked) enabled.add(kind); else enabled.delete(kind); refresh(); });
    const text = document.createElement('span'); text.textContent = `${styles[kind].symbol} ${styles[kind].label}`; text.style.color = styles[kind].color;
    label.append(input, text); byId('atlas-filters').append(label);
  }
  const gestures = bindMapGestures(canvas, view, draw);
  canvas.addEventListener('click', event => {
    if (gestures.suppressClick()) return;
    const rect = canvas.getBoundingClientRect(); let best = null, distance = 18;
    for (const marker of visible()) {
      const point = view.project(marker.x, marker.z);
      const d = Math.hypot(point.x * rect.width - event.clientX + rect.left, point.y * rect.height - event.clientY + rect.top);
      if (d <= distance) { best = marker; distance = d; }
    }
    if (best) select(best);
  });
  canvas.addEventListener('dblclick', () => {
    if (gestures.suppressClick() || !selected) return;
    byId('atlas-detail').scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'nearest',
    });
  });
  const zoom = factor => { view.zoomAt(factor); draw(); };
  byId('atlas-in').onclick = () => zoom(1.5);
  byId('atlas-out').onclick = () => zoom(1 / 1.5);
  byId('atlas-reset').onclick = () => { view.reset(); gestures.reset(); draw(); };
  byId('atlas-story').onclick = () => { view.zoom = 5; view.x = 810; view.z = 990; view.constrain(); draw(); };
  byId('atlas-search').addEventListener('input', event => { query = event.target.value.trim().toLowerCase(); refresh(); });
  canvas.addEventListener('keydown', event => {
    const pans = { ArrowLeft: [.12, 0], ArrowRight: [-.12, 0], ArrowUp: [0, .12], ArrowDown: [0, -.12] };
    if (pans[event.key]) { event.preventDefault(); view.pan(...pans[event.key]); draw(); }
    else if (['+', '=', '-'].includes(event.key)) { event.preventDefault(); zoom(event.key === '-' ? 1 / 1.5 : 1.5); }
    else if (event.key === 'Home') { event.preventDefault(); view.reset(); draw(); }
  });
  refresh();
}
loadMap().catch(error => { byId('atlas-status').textContent = 'The map could not load. Reload the page to try again.'; console.error(error); });

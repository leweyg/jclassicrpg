# jclassicrpg
very much in progress port of jClassicRPG (version jCRPG-engine-fix20100607 )

Play at: https://leweyg.github.io/jclassicrpg/play.html

Homepage: https://leweyg.github.io/jclassicrpg/

# Web Port TODO List

- [ ] Port over buildings, shrines, etc
- [ ] Port over caves, and exportable buildings (procedural?)
- [ ] Port over character interactions a
- DONE: Basic systems, sim and playable world.
- [x] Correct the cube-map sky’s X reflection while preserving Y.
- [x] Click the nearby map to expand it; its 116-unit radius is twice the visible radius.
- [x] Show saved shrines, settlements, dungeon/maze districts, cave regions and storage, including unimplemented locations. Mission/puzzle marker types are supported, but this save contains no such records.


## Frozen-world exploration

Serve the repository root (for example, `python3 -m http.server 8000`) and open
`http://localhost:8000/play.html`. Drag the left half to walk and the right half
to look. The location readout shows the current saved-world region and X/Z.

The browser starts at the bundled save's captured position, **800, 41, 907**.
`jCRPG-engine/json/frozen_world.json` is a compact export of that save's terrain
boundary masks, climate belts, settlement footprints and unique shrine locations.
It retains the fixed 1,600 × 1,600 map rather than generating a replacement world.
Rebuild it with `python3 scripts/export_frozen_world.py`; the export records the
source XML's SHA-256 and resolves XStream references. No Java runtime is required.

`FrozenWorld` queries those records and adapts the original Java HashUtil and
Plain/Forest/Mountain height formulas. The first surface renderer uses a two-unit
triangle grid, coarse ocean coasts and simplified river channels. Flora is
coordinate-stable decoration using the existing model assets. Settlement/shrine
footprints are tinted ground; buildings, roads, cave interiors, original flora
rules, collisions, swimming restrictions and encounters are not ported yet.
Movement follows the rendered surface, including water, and wraps at world edges.
This is exploration state in memory; reloading starts at the captured position.

`GameState` owns the party position and a transient `WorldStream`. Only 25 chunks
of 32 × 32 units are resident; crossing a boundary overwrites departing slots.
The renderer reuses terrain/instance buffers and shares a fixed set of models,
materials and textures. There are no per-area downloads or growing visited-area
caches. The movement/look path uses scalar math and reusable scratch objects;
chunk generation runs only on transitions. Rendering wakes for movement, looking,
teleporting and resize events. Frames repeat only while the movement stick is held
off-center; at rest there is no animation loop or repeating HUD timer. Opening the
map, losing focus or hiding the page cancels movement. HUD/map updates are capped
at 10 Hz during movement and refreshed on the final input change. Three.js may
still allocate internally. Fog ends before the edge of the resident area.

Click the minimap or top-bar Map button to open the full world map. Click a marker
or a searchable location-list entry to teleport to its X/Z on the rendered surface.
Click the map background, Close, or Escape to return to the minimap. All recorded
locations are shown, with dashed markers for unimplemented gameplay. Cave-region
markers identify saved cave areas, not confirmed entrances. The export also carries
map-only dungeon/maze and storage locations without changing surface generation.
The full map has type filters and a location search. A single cached terrain raster
is shared by both maps, and neither map has its own timer or frame loop.

Run the headless checks with `node --test jCRPG-engine/js/tests/*.test.mjs`
(Node 22+). They cover saved-map coverage, hashing, cache reuse over 1,000 moves,
revisits, terrain seams, world wrapping, camera-relative swipe direction, map
markers (including unknown types), sky orientation and idle frame scheduling.

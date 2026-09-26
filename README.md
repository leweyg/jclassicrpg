# jclassicrpg
very much in progress port of jClassicRPG (version jCRPG-engine-fix20100607 )

Play at: https://leweyg.github.io/jclassicrpg/play.html

Homepage: https://leweyg.github.io/jclassicrpg/

# Web Port TODO List

- [x] Add explorable baked buildings, streets, and shrine scenery (web-v1)
- [x] Add baked natural caves, procedural labyrinths, and exportable JSON scenes (web-v1)
- [x] Add persistent characters, dialogue, missions, shrine circuits and optional inventory (web-v2).
- DONE: Basic systems, sim and playable world.
- [x] Correct the cube-map sky’s X reflection while preserving Y.
- [x] Click the nearby map to expand it; its 116-unit radius is twice the visible radius.
- [x] Show saved shrines, settlements, dungeon/maze districts, cave regions and storage, including unimplemented locations. New authored mission and puzzle markers appear as their objectives become active.


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

The offline compiler now reconstructs all 208 saved districts, adds ordinary
buildings/streets, 25 labyrinths, shrine scenery, and natural cave interiors.
The browser loads versioned `lewcid_object` JSON through 25 reusable 32-unit
chunk slots. Collision gates movement until each chunk is ready; stale downloads
cannot replace a reassigned slot. Shared meshes and bounded normalized caches
are reused across visits.

Walk with the left stick or WASD/arrow keys; look with the right stick. Right-click
to toggle steering, then move the pointer relative to the click position: up/down
moves forward/backward, left/right turns continuously. Recenter to stop moving;
click again with any button to exit steering. Use **E**
or the contextual toolbar button for stairs, cave entrances/exits, and chests.
Save v2 deltas persist position, dialogue commitments, missions, puzzles, shrine routes and inventory;
Export/Import save provides portable JSON. On subsequent visits the saved local
position takes precedence over the original spawn.

Rebuild and validate with `node scripts/build_world.mjs` (Node 22+, Python 3).
The generated world and validation report are in `jCRPG-engine/worlds/seed0/v2`.
See [the review guide](docs/procedural-review.md) for controls, reproducibility,
editor scene entry points, Java golden fixtures, and explicit compatibility limits.
This is `web-baked-v2`: hash and maze bytes match Java, while the existing surface
adapter, cave entrance presentation, and some architectural geometry are adapted.

See [the interaction review and walkthrough](docs/interaction-review.md) for the opening mission, six cultural arcs, validation evidence and implementation limits. From spawn, awaken the shrine to the west and meet Marn in Wammigmig to the east. Use **Journal** to track tasks and **Inventory** to inspect collected items.

Click the minimap or top-bar Map button to open the full world map. Click a marker
or a searchable location-list entry to teleport to its X/Z on the rendered surface.
Click the map background, Close, or Escape to return to the minimap. All recorded
locations are shown, with dashed markers for unimplemented gameplay. Dashed cave-region
markers identify saved cave areas; solid Cave entrance markers provide entry links. The export also carries
dungeon/maze and storage locations alongside the generated world.
The minimap zooms toward the selected goal, holding it halfway between the player
and the map edge until it is within four world units (roughly four steps). Tune
this under **Map → Dev options → Minimap goal zoom**: enable/disable, goal screen
fraction, stopping distance, and smoothing seconds (zero is instant). These live
controls apply for the current page session; shipped defaults are in
`jCRPG-engine/js/minimap_zoom.js`. Surface and cave maps retain their normal
maximum radius when no nearby goal is selected. The radius readout shows the
current scale, and the dashed visibility circle remains a true world-distance
indicator, hidden when it falls outside the zoomed map.

The full map has type filters and a location search. A single cached terrain raster
is shared by both maps, and neither map has its own timer or frame loop.

Run the headless checks with `node --test jCRPG-engine/js/tests/*.test.mjs`
(Node 22+). They cover saved-map coverage, hashing, cache reuse over 1,000 moves,
revisits, terrain seams, world wrapping, camera-relative swipe direction, map
markers (including unknown types), sky orientation and idle frame scheduling.

Character visuals are defined in `jCRPG-engine/json/characters.json`: `models`
holds shared GLB sources and poses, `modelScale` controls all character sizes
(with optional per-model scale multipliers), and `actorModels` assigns stable actor
IDs to model IDs. The runtime replaces the assigned actors' baked proxies without
rebuilding the world; unassigned actors and failed downloads retain their proxies.
The supplied KeyKit Barbarian, Mage and Knight GLBs contain embedded textures and
rigs but no animation clips. Their relaxed Idle pose is baked once into cached,
instanced meshes. A matching clip, if supplied, contributes its initial pose.
Characters do not schedule frames or timers: the play page sleeps at rest, and
movement updates retain their 100 ms maximum delta after long frame gaps.

Cave debug landmarks: gold arches and floor rings mark exits to the surface;
blue beacons mark people, violet marks puzzle controls, and green marks evidence
readings. These markers only appear in loaded caves and are occluded by walls.

# game_development

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Compiler responsibilities, dependency order, reusable interface boundaries, and release gates. These plans explain how to extend the existing systems; completed phases are not instructions to rebuild or reset the project. Suggested TypeScript modules and work-package ownership are organizational designs. Source paths and current compiler entry points are indexed in [game_sources](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/development/sources.md).

## Deterministic compiler implementation

### Recommended compiler modules

```text
scripts/
  export_frozen_world.py          # extended legacy evidence
  compile_world.mjs               # atomic top-level build
  compile_interactions.mjs        # imported compiler stage
  interaction_allocation.mjs
  interaction_validation.mjs
  mission_templates.mjs
  puzzle_templates.mjs
  actor_assets.mjs
```

`compile_world.mjs` remains the atomic publisher. `compile_interactions.mjs` must run before chunk JSON and manifest hashes are finalized. Do not post-process the already published 2,500 scenes.

### Build order

1. export scenario state/events, actors, actor ownership, and party object instances;

2. generate the existing world structures, collision, portals, maze graphs, and objects;

3. reconcile actor ownership to compiled structures;

4. choose safe actor anchors;

5. define item types and concrete container contents;

6. select shrine and labyrinth goals;

7. generate/author puzzles and solve every one offline;

8. allocate goal-giving/explaining actors;

9. emit missions and dialogue;

10. add chunk interaction anchors and visual nodes;

11. validate all cross-references and reachability;

12. emit catalogs, chunk scenes, reports, and final manifest into staging;

13. atomically replace only a recognized generated world directory.

### Validation report additions

Report at least:

- legacy actor count and player/NPC split;

- district fixed-owner count;

- compiled owner matches and fallback anchors;

- object-instance count by source;

- item type and baked item instance counts;

- container count, empty count, locked/trapped count, mission-bound count;

- shrine definition and activation-anchor counts;

- puzzle count by family and maximum solver state count;

- mission count by template and state graph depth;

- actor coverage, maximum goals per actor, maximum giver-to-goal distance;

- dangling-reference count, which must be zero;

- unsolved mission/puzzle count, which must be zero;

- raw/gzip/Brotli interaction bytes and per-location additions;

- all intentional deviations from legacy data.

## Interaction delivery

### Phase 0 — contracts and fixture

1. bump the world and save format versions;

2. define culture, settlement hierarchy, shrine graph, maze generator, actor, interaction, dialogue, goal, mission, puzzle, item, and save schemas;

3. use Wammigmig and its nearby shrine as the first fixed interaction fixture;

4. implement canonical writers and validators;

5. prove editor preview and plain-static-host loading.

### Phase 1 — legacy export and actors

1. extend the Python exporter for scenario, persistent actors, ownership, and object instances;

2. add counts and source-kind fields;

3. reconcile all 208 district fixed owners;

4. restore the 25 labyrinth owner links;

5. place one visible, talkable actor with static/proxy mesh.

### Phase 2 — interaction runtime

1. generalize chunk-local nearby interaction indexing;

2. implement predicate/action registries;

3. implement atomic transactions and save v2;

4. implement the target highlight, attention pulse, and single contextual Interact action;

5. add contextual dialogue/choice presentation without introducing additional world verbs;

6. add v1 save migration.

### Phase 3 — Wammigmig and shrine routing

1. place Marn Even-Tally on saved `ownerMemberId: "544"` and place Pella and Orro at validated anchors;

2. implement the three-branch rational distribution state machine;

3. implement its observable resonance sequence using the same Interact action;

4. compile stable shrine neighbors and the Wammigmig-to-Awshowam mission route;

5. persist local structure state, dialogue commitments, shrine frontier, and mission progress;

6. pass the complete **A Fair Share of Light** browser test.

### Phase 4 — capitals, cultures, and major-town arcs

1. emit the six selected capitals, four secondary capitals per culture, and minor-settlement assignments;

2. bake Deep Ledger and four secondary Kobold cave settlements;

3. allocate the named principal characters and capital interaction anchors;

4. implement capital briefing, local-balance state, four regional objectives, and return synthesis;

5. validate reachability and cultural ownership of every route.

### Phase 5 — maze generators and full shrine graph

1. derive graph placement candidates from all 25 mazes and major cave components;

2. implement rational, resonance, and balanced operation families with solvers;

3. add generator/component visuals and stateful collision/effects;

4. bind generator effects to shrine-graph edges and settlement power states;

5. complete one full generator-reactivation slice;

6. validate all 173 shrines and expand generator templates only after both slices pass.

### Phase 6 — optional containers and inventory

1. export starting party object instances;

2. add party inventory and item catalog;

3. bake concrete contents for chests;

4. build container UI and transfer transactions;

5. replace the current searched-boolean-only chest behavior;

6. keep inventory optional for the main movement-and-Interact mission path.

### Phase 7 — polish and performance

1. convert remaining MD5 actor assets offline or improve proxies;

2. add audio/visual cues;

3. profile catalog loading, nearby selection, instance counts, and mobile rendering;

4. optimize only measured bottlenecks;

5. update review, validation, and browser evidence.

## Parallel-agent handoff

Freeze schemas, stable-ID rules, and the fixture before parallel implementation.

| Package | Ownership | Outputs | Must not independently change |
|---|---|---|---|
| A. Legacy evidence | Python XStream/scenario export | actors, ownership, object instances, source report, fixtures | runtime schemas after Gate 0 |
| B. Contracts/compiler | JSON Schemas, canonical emission, manifests, allocation framework | catalogs, scene anchors, validation report | runtime behavior without fixtures |
| C. Runtime state | transaction, predicates/actions, save v2/migration | deterministic interaction core and tests | content allocation |
| D. Items/containers | item catalog, inventory, loot bake, chest UI | concrete loot and transfers | mission graph semantics |
| E. Shrines/puzzles | activation, puzzle FSM/solver, component visuals | shrine/puzzle mechanics and validation | actor/dialogue allocation |
| F. Actors/missions | actor anchors/assets, dialogues, goals, mission engine/journal/map | complete giver-to-goal loops | world geometry contracts |
| G. Integration/QA | static-host E2E, editor/browser evidence, performance, docs | vertical-slice report and release gate | silent schema/fidelity changes |

### Merge gates

1. **Gate 0 — format fixture:** schemas, stable IDs, fixture catalogs, fixture scene, save v2, and editor preview are merged.

2. **Gate 1 — evidence:** actor/object/scenario export is deterministic and ownership reconciliation is complete.

3. **Gate 2 — generic interaction:** one fixture actor, chest, shrine, puzzle component, and portal resolve through the same nearby/transaction pipeline.

4. **Gate 3 — stateful world:** inventory, container transfer, shrine activation, save/reload, and v1 migration pass.

5. **Gate 4 — mission slice:** actor gives mission, journal/map update, objective completes, actor accepts turn-in, reward commits once.

6. **Gate 5 — labyrinth slice:** puzzle and mission chest are proven solvable in a real generated labyrinth.

7. **Gate 6 — world allocation:** all selected goals, actors, shrines, missions, and puzzles pass coverage and solvability reports.

8. **Gate 7 — release:** static-host browser and editor evidence passes with bounded memory and measured performance.

### File-ownership rules

- Package B owns schemas and compiler catalog writers.

- Package C owns save format and predicate/action/transaction interfaces.

- Package D owns item/container schemas only through changes reviewed by B/C.

- Package E owns puzzle transition semantics and solver.

- Package F owns mission/dialogue content and actor allocation.

- Package G owns integration fixtures and reports, not production semantics.

- Only one package edits `compile_world.mjs`, `scene.schema.json`, `save_deltas.js`, or the interaction format module at a time.

Agents contribute adapters and fixtures rather than copying shared constants.

## Suggested module boundaries

```text
world/hash.ts                    Java-compatible HashUtil
world/surface-query.ts           height, water, cave/surface facts
economy/district-state.ts        persistent district records
economy/economy-template.ts      entity/geography -> allowed types
economy/placement-checkers.ts    water/cave/type masks
economy/grown-infrastructure.ts  ordinary settlement specs
economy/default-infrastructure.ts
economy/big-block-infrastructure.ts
structures/semantic-volume.ts
structures/house-generators.ts
structures/simple-dungeon.ts     maze shell + 3D semantic output
structures/maze-tool.ts          pure recursive-division byte grid
navigation/cell-graph.ts
navigation/portals.ts
render/structure-batches.ts
```

Keep `maze-tool.ts` pure: no Three.js, DOM, world state, or mutable global seed. This makes exhaustive testing straightforward.

## World delivery

### Phase 1: compatibility foundation

- Finish Java-compatible hash/remainder helpers.

- Create golden vectors from Java.

- Export complete persistent district inputs, including `savedInhabitantNumber`, owner/template type, block origin, soil geography, and fixed NPC infrastructure.

- Define `StructureSpec` and semantic-cell formats.

### Phase 2: constructed dungeons

- Port `MazeTool` byte-for-byte.

- Add digest and connectivity tests.

- Port the `SimpleDungeonPart` outer shell and three-level cube mapping.

- Render floors/walls/doors with placeholder primitives.

- Add collision, entrance portals, BFS solver, and debug overlays.

This is the most isolated end-to-end feature and a good first procedural target.

### Phase 3: ordinary buildings

- Implement basic `House` semantics.

- Add `WoodenHouse`, roofs, and remaining residence variants.

- Map semantic elements to repository assets.

- Validate doors, stairs, windows, floor levels, and terrain-supported Y.

### Phase 4: city infrastructure

- Port placement checkers and economy-template selection.

- Port `GrownInfrastructure` for seed-0 settlements.

- Add fixed NPC-owned structure overrides.

- Group districts into towns for labels/map navigation.

- Port streets and other economic grounds.

### Phase 5: natural caves

- Port cave occupancy and vertical floor/ceiling rules.

- Port entrance detection and terrain interaction.

- Add local connectivity diagnostics and cave chunk rendering.

- Add cave-specific flora, sound, and lighting after traversal works.

### Phase 6: dynamic persistence

- Save persistent inputs plus generator version, not full generated geometry.

- Optionally cache generated structure chunks as disposable acceleration data.

- On load, regenerate and compare a stored structure digest; fail clearly or migrate if the generator version differs.

## Implementation handoff for parallel agents

This section freezes the cross-cutting decisions that must be shared before parallel work begins. Agents may refine internals behind these boundaries, but should not independently invent alternate coordinates, IDs, JSON scene semantics, or lifecycle rules.

### Locked baseline decisions

1. **Compile the procedural world offline.** Seed 0 version 1 ships baked region data. The browser does not need Java, a procedural-generation worker, or a server API.

2. **Bake simple, editor-compatible JSON scenes, not duplicated presentation assets.** Chunk files use `lewcid_object` JSON and link reusable JSON prefabs, meshes, textures, and materials through relative `source` paths. Gameplay metadata lives under `userData.jcrpg`; shared assets remain separate.

3. **Keep the existing spatial cadence.** Surface chunks are 32 world units; the active neighborhood is 5 × 5 chunks. Package 5 × 5 chunks into a region unless measurements justify a different packaging boundary.

4. **Target a static host.** All world and asset URLs are immutable and versioned. Fetch, HTTP caching, optional service-worker caching, and optional IndexedDB are sufficient.

5. **Separate immutable world facts from mutable saves.** The build provides stable IDs and default state. The save stores only local deltas such as opened doors, looted containers, defeated encounters, and discovered locations.

6. **Preserve full near-field visual fidelity as the baseline.** GPU budgets are diagnostic guardrails. First optimize mesh reuse, instancing, material count, hidden-face removal, buffer reuse, and shadows. Reduce visible detail only if profiling a dense town, dungeon, and cave on representative mobile hardware shows a real limit.

7. **Never make collision adaptive.** Geometry LOD, distant props, lighting, and shadows may scale; collision, portals, entity IDs, and gameplay semantics must not.

### Recommended build/runtime split

Use a two-stage offline toolchain:

- extend `scripts/export_frozen_world.py` to read and normalize XStream save data, resolve object references, and export the authoritative high-level world/district inputs;

- add a Node ESM compiler such as `scripts/compile_world.mjs` to run rendering-independent ports of the legacy generators and emit manifests, indexes, `lewcid_object` chunk/region scenes, JSON gameplay sidecars, asset dependencies, and a validation report;

- place pure generator logic in a rendering-independent module boundary such as `jCRPG-engine/js/procedural/` so it can be unit-tested against Java even though the browser does not call it in the first release;

- share JSON Schemas and generated TypeScript/JSDoc declarations between the compiler, editor-preview tests, and runtime loader, but do not make the runtime import compiler-only code.

The compiler must fail the build on unresolved required references, duplicate stable IDs, invalid portals, collision/nav disagreement, out-of-range coordinates, or nondeterministic output. A packaged low-detail safety region is acceptable as a network-error fallback; silently substituting newly generated content is not.

### Freeze these interfaces first

Before broad implementation, merge one small “format and fixture” change containing:

- `WorldManifest` fields, format version, generator version, seed, world bounds, wrap rules, and content hashes;

- canonical chunk, region, structure, level, and portal addressing;

- the exact `lewcid_object` node subset, `userData.jcrpg` schemas, relative-`source` rules, content hashes, and HTTP compression policy;

- stable ID derivation for towns, districts, buildings, levels, doors, containers, encounters, and portals;

- semantic cell and face flags, collision categories, navigation flags, mesh/material/asset IDs, and transform encoding;

- the save-delta schema and compatibility policy;

- one deliberately tiny fixture chunk and composition region with canonical JSON snapshots, byte length, content hashes, seam neighbors, a building entrance, and a vertical portal; both must open through `three_js_editor_small/editor/?file_path=...`.

No downstream agent should copy these definitions by hand. Generate or import them from a single source of truth. Format changes after this gate require an explicit version bump and fixture update.

### Parallel work packages

| Package | Primary ownership | Required output | Must not independently change |
|---|---|---|---|
| A. Legacy extraction and golden fixtures | Java behavior, saves, deterministic snapshots | normalized source fixtures; Java outputs for districts, houses, dungeon grids, cave slices | JSON scene schema; renderer contracts |
| B. Format and compiler shell | schemas, IDs, scene writer, manifest, validation | deterministic compiler CLI; canonical JSON writer/reader; content hashes; reports | procedural behavior without a golden fixture |
| C. Procedural parity | grown/default/big-block infrastructure, buildings, maze, cave | pure generator modules; parity tests; compiler adapters | runtime streaming or rendering |
| D. Asset calibration | OBJ/MTL/texture inventory, subtype mapping, transforms | asset manifest; calibration scene; bounds/pivot/orientation tests; pack dependencies | world coordinates or semantic flags |
| E. Runtime streaming | fetch, parse, normalize, priorities, slot revisions, caches | manifest loader; `lewcid_object`/source resolver; 5 × 5 coordinator; LRU; abort/stale guards | procedural rules; save meaning |
| F. Gameplay and visuals | instancing, seams, collision, nav, portals, saves | city/building/dungeon/cave rendering; interaction binding; delta overlay | JSON scene contract or stable ID derivation |
| G. Integration and performance | static-host deployment, fixtures, profiling | end-to-end tests; visual snapshots; network/memory/GPU measurements; release report | silent fidelity reductions |

Assign files so that only one package owns a shared file at a time. In particular, the manifest/JSON Schema module, canonical scene writer/loader contract, asset catalog, and streaming coordinator should each have a clear owner. Other packages should contribute fixtures or adapters rather than editing those files concurrently.

### Dependency and merge gates

1. **Gate 0 — format fixture:** the tiny fixture serializes canonically, parses, hashes, renders as debug geometry, and opens unmodified in `three_js_editor_small`. Stable ID and coordinate tests pass in Java-derived and JavaScript fixtures.

2. **Gate 1 — deterministic compiler:** the same inputs produce byte-identical regions on repeated builds. At least one district, house, dungeon, and cave slice matches golden semantics.

3. **Gate 2 — bounded streamer:** a plain static server streams the fixture through the 25 reusable slots, including cancellation, stale-result rejection, wrapping, and eviction.

4. **Gate 3 — calibrated visuals:** shared assets align with debug collision and neighboring cells; buildings cross chunk seams without duplicate geometry or interactions.

5. **Gate 4 — explorable spaces:** town exteriors, building interiors, dungeon levels, and natural caves support portals, collision, navigation, interaction IDs, and save deltas.

6. **Gate 5 — release profiling:** dense representative scenes meet network, memory, frame-time, and cache targets. Any fidelity reduction is based on captures from this gate and starts with distant/optional effects.

Each work package should land as small commits with its tests and fixtures. Do not combine format invention, parity changes, renderer changes, and optimization in one integration change; that makes visual or semantic regressions difficult to locate.

### First spikes to remove uncertainty

Complete these before scaling the implementation across the whole world:

1. reconstruct one real saved population/district through the Python normalizer and compare it with the Java load-time reconstruction;

2. emit one exact dungeon byte grid from Java and reproduce it byte-for-byte in the pure JavaScript generator;

3. export a cave entrance plus adjacent vertical slices and verify entrance coordinates, solid/empty polarity, collision, and the exterior portal;

4. build one asset-calibration scene containing a house, roof edges, wall variants, door, stairs, street, and collision/debug overlays;

5. compile and stream one 5 × 5 region from a plain static host, open a constituent chunk and the region composition in `three_js_editor_small`, then record compressed transfer size, parsed/normalized size, parse/normalization time, upload time, draw calls, and peak GPU memory.

These spikes directly address the highest-risk areas: XStream reference reconstruction, Java integer/random/remainder parity, cave coordinate conventions, model pivots/orientations, and realistic browser costs.

### Definition of done for the first complete vertical slice

- one command produces versioned, byte-reproducible build artifacts and a validation report;

- `python3 -m http.server` (or an equivalent static server) is sufficient to run the slice;

- the browser performs no procedural world generation and requires no worker for correctness;

- the player can approach a town, see streets and individually assembled buildings, enter a building, enter a procedural dungeon, and enter a natural cave;

- collision, navigation, portals, roofs/interiors, and interaction state remain correct across chunk and level boundaries;

- exactly 25 surface slots remain active, while normalized region and asset caches remain within configured bounds;

- stale fetch/parse/normalization results cannot update a reassigned slot;

- shared meshes/textures are reused and region eviction does not dispose assets still referenced elsewhere;

- save deltas survive eviction and reload without copying unchanged baked state;

- the expected initial-location and movement transfer budgets in [stream_budgets](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/runtime/streaming.md#per-location-client-budget) are measured in automated or repeatable tests;

- representative desktop and mobile traces report CPU frame time, GPU frame time where available, draw calls, triangles, texture memory, buffer memory, and worst navigation/collision update time;

- full near-field detail remains enabled unless those traces demonstrate a limit, in which case the first fallback affects outer-ring detail, distant props, or shadows—not gameplay geometry.

### Kickoff checklist

- merge the JSON scene/schema fixture contract before assigning dependent packages;

- give every agent the relevant legacy source files, this document, its owned file set, expected fixtures, and its gate acceptance tests;

- require agents to document every intentional deviation from Java behavior;

- require deterministic tests to specify seed, coordinates, input fixture version, and expected hash;

- keep generated build output out of hand-edited source directories;

- record compiler time and final compressed sizes, but optimize only after the vertical slice proves correctness;

- designate one integration owner to resolve cross-package changes and run the end-to-end gate after each merge.

At this point the plan is implementation-ready. The only decision that should precede agent kickoff is the exact JSON scene/schema owner; the implementation itself can establish the measured GPU ceiling during Gate 5.

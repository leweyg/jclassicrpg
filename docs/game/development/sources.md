# game_sources

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Legacy and web source locations for the systems described in these guides. Legacy Java paths beginning `world/`, `game/`, `ui/`, `space/`, or `threed/` are relative to `jCRPG-engine/src/main/java/org/jcrpg/`; legacy media and browser `js/` paths are relative to `jCRPG-engine/`. Baseline v1 paths identify earlier evidence, while shipped world and save behavior use v2.

## Interaction sources

### Legacy scenario and state

- `scenario/jclassicrpg/events.xml`: only authored scenario event, the intro.

- `scenario/jclassicrpg/story/intro.xml`: two non-interactive story blocks; shrine/rest theme and original controls.

- `game/scenario/Events.java`: event/element/story playback shell.

- `game/scenario/Scenario.java`: intro initiation and `intPlyd` state.

- `game/scenario/ScenarioState.java`: generic scenario-state map.

- `game/scenario/element/StoryPart.java`: non-interactive story blocks.

- `world/ai/abs/Goal.java`: empty placeholder.

### Legacy objects and storage

- `world/object/Obj.java`: object-type metadata and use limits.

- `world/object/ObjInstance.java`: per-instance uses and attachments; numeric-ID constructor issue.

- `world/object/EntityObjInventory.java`: inventory/equipment/transfer behavior.

- `world/object/ObjList.java`: object-type singleton registry.

- `world/ai/wealth/EntityCommonWealth.java`: common wealth, placeholder storage contents, lock/trap selection.

- `game/trigger/StorageObjectHandler.java`: proximity storage trigger and UI handoff.

- `space/sidetype/trigger/StorageObjectSideSubType.java`: chest trigger effects.

- `ui/window/interaction/StorageHandlingWindow.java`: Take/Take All legacy flow.

- `ui/window/interaction/LockInspectionWindow.java`: identify, disarm, force, and open flow.

### Legacy actors

- `world/ai/PersistentMemberInstance.java`: persistent character instance and position.

- `world/ai/EntityInstance.java`: entity ownership, relationships, and wealth.

- `world/ai/humanoid/group/*`: entity types, behavior, member grouping, and model hints.

- `media/models/humanoid/*`: human/anatipion/yeti OBJ assets and MD5 character assets.

- `media/models/monster/*`: possible static labyrinth actor/proxy assets.

### Current web build/runtime

- `scripts/export_frozen_world.py`: XStream export and current district ownership extraction.

- `scripts/compile_world.mjs`: atomic world compiler, scene emission, hashes, reports.

- `jCRPG-engine/js/world/format.js`: scene contract, IDs, constants, validation.

- `jCRPG-engine/js/world/scene.schema.json`: current `lewcid_object` JSON Schema.

- `jCRPG-engine/js/world/baked_stream.js`: 25-slot fetching, normalization, collision, nearby chests/portals.

- `jCRPG-engine/js/world/baked_view.js`: instancing and searched-chest appearance.

- `jCRPG-engine/js/world/save_deltas.js`: current save deltas and migration from v1.

- `jCRPG-engine/js/game_state.js`: exploration and interaction dispatch.

- `jCRPG-engine/js/play_page.js`: contextual prompt and save import/export wiring.

- `jCRPG-engine/js/map_model.js`: existing mission/puzzle marker styles.

- `jCRPG-engine/js/world_map.js`: current map marker/filter UI.

- `jCRPG-engine/js/procedural/maze.js`: deterministic maze generation and solver.

- `jCRPG-engine/js/procedural/structures.js`: labyrinth chests and semantic volumes.

- `jCRPG-engine/worlds/seed0/v1/structures.json`: current structure and partial owner linkage.

- `jCRPG-engine/worlds/seed0/v1/chunks/*.scene.json`: current interaction-placement destination.

- `docs/game/testing/world.md`: geometry review procedures and baseline compatibility limits.

## World sources

- `world/place/economic/Population.java`: transient generated lists and load-time reconstruction.

- `world/place/economic/AbstractInfrastructure.java`: shared generation lifecycle, sizing, terrain placement, and instantiation.

- `world/place/economic/infrastructure/GrownInfrastructure.java`: ordinary district growth walk.

- `world/place/economic/infrastructure/DefaultInfrastructure.java`: central-street and shuffled-block layout.

- `world/place/economic/infrastructure/BigBlockInfrastructure.java`: one large dungeon residence.

- `world/place/economic/population/SimpleDistrict.java`: ordinary district selection and placement checkers.

- `world/place/economic/population/DungeonDistrict.java`: dungeon district selection and placement checkers.

- `world/place/economic/residence/House.java`: basic procedural building template.

- `world/place/economic/residence/WoodenHouse.java`: roofed building template.

- `world/place/economic/residence/dungeon/MazeTool.java`: recursive-division byte grid.

- `world/place/economic/residence/dungeon/SimpleDungeonPart.java`: maze shell, cube mapping, and storage positions.

- `world/place/geography/sub/Cave.java`: natural cave occupancy and entrance logic.

- `world/place/economic/checker/CaveChecker.java`: shallow-cave infrastructure exclusion.

- `world/place/economic/checker/WaterChecker.java`: water infrastructure exclusion.

- `world/place/economic/Town.java`: district grouping and town center.

- `threed/scene/config/SideTypeModels.java`: authoritative semantic-subtype to model/material mapping.

- `threed/scene/side/RenderedContinuousSide.java`: neighbor-dependent wall/roof piece selection.

- `threed/scene/side/RenderedTopSide.java`: top/roof edge selection.

- `threed/standing/J3DStandingEngine.java`: original neighbor inspection and rendered-side emission.

- `threed/J3DCore.java`: cube scale, face order, directions, and rotations.

- `js/obj_mtl_loader.js`: existing browser OBJ/MTL and PNG texture loading path.

- `js/world_stream.js`: current fixed 5 × 5, 32-unit chunk cache and deterministic surface/flora generation.

- `js/world_view.js`: current reusable terrain/vegetation slot buffers and revision-based scene synchronization.

- `js/game_state.js`: exploration lifecycle and player-driven stream updates.

- [`three_js_editor_small/examples/models/json/space_scene.json`](https://github.com/leweyg/three_js_editor_small/blob/main/examples/models/json/space_scene.json): minimal `lewcid_object` scene example.

- [`three_js_editor_small/editor/js/FolderUtils.js`](https://github.com/leweyg/three_js_editor_small/blob/main/editor/js/FolderUtils.js): authoritative recursive JSON/source loader, transforms, `userData`, and exporter behavior.

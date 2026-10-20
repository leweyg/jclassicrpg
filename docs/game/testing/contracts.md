# test_contracts

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Validation requirements for world generation, content, runtime, and story. Fixture counts and the original Fair Share opening refer to their named baseline; current Concordance acceptance uses the Saima harness in [game_testing](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/testing/README.md). Requirements for future dynamic gates, equipment, or full Java parity are targets, not claims of completed checks.

### Acceptance criteria for thematic expression

- All six cultures have one primary capital, four reachable secondary capitals, and assigned minor settlements in compiled data.

- Capital assignments are deterministic, validated, and accompanied by ranking evidence.

- Kobold settlements are baked and stream through the same scene/chunk contracts as other settlements.

- Each cultural arc contains four regional layer tasks and one capital synthesis task.

- Every required objective resolves to a valid streamed anchor and can be completed without loading the whole world.

- At least one mission in each paired domain exposes a genuine disagreement between its practiced and wild expressions without declaring either culture categorically right.

- The two largest mixed towns receive cross-cultural actors and outcomes rather than being flattened to a single culture.

- Journal and dialogue copy identify whether information is fact, testimony, inference, symbol, or unresolved mystery where that distinction matters.

- The final capital interaction produces persistent dialogue/state changes across all four secondary capitals.

## Testing strategy

### Export tests

- XStream references resolve for all selected actor and object records;

- exactly 319 persistent members are found in the current fixture;

- exactly one is the saved player and 318 are NPCs;

- all 318 NPCs have owned infrastructure evidence;

- the four saved `ObjInstance` elements are exported with collision-free derived IDs;

- scenario state exports `intPlyd = true`;

- no false mission/puzzle evidence is produced.

### Schema and reference tests

- every catalog passes JSON Schema;

- every stable ID is unique within its namespace;

- every scene `interactionId` resolves;

- every actor, dialogue, mission, objective, goal, puzzle, component, item, and container reference resolves;

- no game catalog is placed in a visual `source` field;

- every asset source resolves inside the pack;

- canonical rebuilds are byte-identical.

### Interaction tests

- nearest eligible interaction wins deterministically;

- overlap priority behaves as specified;

- repeated input cannot double-commit;

- chunk eviction/reload retains state;

- stale chunk loads cannot restore old visual state;

- one failed action commits no partial mutations;

- imported saves reproduce prompts and visual state.

### Inventory/container tests

- taking an item removes it from the container exactly once;

- Take All is atomic;

- mission items progress only after successful transfer;

- existing v1 searched chests migrate without losing newly available contents;

- save export/import preserves item IDs and order;

- no mission-critical item is unreachable or duplicated unintentionally.

### Shrine tests

- all 173 compiled shrines have definitions and reachable anchors;

- activation is one-time and survives reload;

- activation updates visuals, journal, and map;

- repeated activation cannot duplicate rewards/progress;

- activating targets in any permitted order produces the same mission result.

### Puzzle tests

- offline solver completes every generated puzzle;

- every non-complete state can reset or continue;

- no gate traps the player;

- component state and collision restore after reload;

- wrong-input policy is deterministic;

- completion effects commit exactly once.

### Mission tests

- dependency graph is acyclic;

- every mission can be accepted, completed, and turned in in a simulated run;

- out-of-order world actions are handled according to objective policy;

- already activated shrines or previously taken items either backfill progress or are explicitly disallowed by content rules;

- reward transactions are idempotent;

- abandoned/failed/completed missions cannot incorrectly re-enter active state;

- mission markers reveal and clear correctly.

### Actor/dialogue tests

- all assigned actors have reachable anchors and visuals/proxies;

- all goal-giving actors explain their assigned nearby goals;

- every selected major goal has an explaining actor;

- no actor exceeds assignment capacity;

- dialogue graph nodes and choices are reachable and terminate;

- generated names/roles are marked as web-generated;

- missing animation never prevents interaction.

### Editor and browser tests

Open in `three_js_editor_small`:

- one actor-containing town chunk;

- one shrine chunk;

- one labyrinth with a maze generator and interaction components;

- one 25-chunk region composition.

Browser automation must complete **A Fair Share of Light** from spawn through shrine activation, Wammigmig inspection, rational setting, resonance sequence, stable distribution, capital-route illumination, save, reload, and imported-save continuation. A second test must reactivate one maze generator and persist its linked shrine effect.

## Definition of done for the first vertical slice

The feature is implementation-ready when:

- the build preserves Wammigmig, its existing structures, saved `ownerMemberId: "544"`, the spawn, and the nearby shrine as identified above;

- Marn, Pella, and Orro appear at validated anchors in editor-previewable chunk scenes;

- movement and one contextual Interact action are sufficient for every required step;

- each Interact invocation highlights its resolved target and emits a harmless attention pulse;

- the shrine activates, answers visually, and lights the next route node toward the active objective;

- the player can distinguish observed demand from NPC testimony in the journal/dialogue presentation;

- the rational distribution settings and resonance sequence are both solvable from visible/audible world cues;

- balancing Wammigmig updates its storage, homes, street relay, actors, and mission state atomically;

- Marn's handoff activates a persistent shrine route toward Awshowam and identifies the Boarman capital;

- the nearby cave emits its foreshadowing response without forcing an early detour;

- no combat, attack, damage, or hidden auxiliary verb is required or accidentally triggered;

- leaving/re-entering chunks does not lose actor, shrine, distribution, route, or mission state;

- save v2 export/import and v1 migration both work;

- the chunk and region still open directly in `three_js_editor_small`;

- the entire slice runs from a plain static server with no API or procedural worker;

- automated content solvers and browser tests prove the path end to end;

- the validation report distinguishes legacy-derived data from web-authored/generated content.

## Testing strategy

### Golden parity tests

Run small Java export utilities against representative seed-0 districts and store:

- hash vectors;

- infrastructure `StructureSpec` lists;

- maze byte grids;

- semantic cube/face outputs for selected coordinates;

- house template digests;

- natural cave occupancy around known entrances.

Compare JS output byte-for-byte.

### Property tests

- identical input always yields identical output;

- generated structures remain inside their district allocation;

- occupied blocks never overlap unless explicitly allowed;

- water/cave-rejected blocks receive no structure;

- all structure dimensions meet type minimums;

- maze faces are symmetric and required objectives are reachable;

- stairs link valid adjacent levels;

- semantic volumes contain no out-of-bounds writes.

### Visual/debug tools

Add toggles for:

- district bounds and block grid;

- unavailable water/cave masks;

- structure origins, types, and generation order;

- wall/door face arrows;

- maze region depth and `OPEN_PART` coloring;

- entrance portals and solver path;

- natural cave solid/open occupancy slices.

These overlays will reveal coordinate-orientation and off-by-one errors faster than inspecting final meshes.

## Acceptance checks for implementation

1. Fresh and existing saves can reach Saima from Talla; her opening has distinct initial, pending, local-complete, partial-regions, four-regions, and final-complete states. No introduction repeats on every visit.

2. The local capital balance is solvable without a sequence. The final sequence cannot be operated or tracked before all four **reported** regional missions complete, including attempts to interact directly with its scene anchor. After the gate, clue, labels, reset, success effect, and return marker work on desktop and phone.

3. Four regional missions have distinct names, witness conversations, local facts, puzzle interactions, and completion consequences. The mind puzzle displays values/current total/goal through Intuition; the wisdom item can be found in a reachable cave/maze, its entrance and exit markers behave correctly, and use is atomic.

4. The journal clearly distinguishes main chapter from its four required side proofs, shows a completed count, and guides to one selected next stop without covering the map in all targets. A side completion can return tracking to the main marker without overriding an intentionally selected active quest.

5. Generated missions, dialogue nodes/conditions, puzzle witnesses, objective targets, story graph, and streamed record indexes validate. Run a full simulated campaign, a fresh browser walk through at least one region plus the gate, and save/reload at partially complete and just-unlocked states. Check old saves with already completed regional work; do not make them replay the four proofs.

When revising cast, puzzles, or dialogue, review the writing and level layout together before changing code. The local item-use visit and final order now have persistent IDs and completion semantics; changes require the migration discipline described here.

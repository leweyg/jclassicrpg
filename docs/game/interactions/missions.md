# game_missions

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Mission graph, objectives, authoring integration, and automatic story progression. Use [game_mission_types](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/README.md#game_mission_types) for the implemented taxonomy: required regional tasks retain kind `side` and are dependencies through mission objectives. Earlier examples below describe conceptual contracts; the runtime uses `requires`, objective `kind` values such as `actor`, `puzzle`, `mission`, `item`, and `fitting`, and `accept`/`turnIn` actions. Read the live schema before creating records.

## Missions, goals, and objectives

### Mission state machine

```text
locked -> available -> active -> ready-to-turn-in -> completed
                              \-> failed
```

Do not infer mission state solely from dialogue. The mission engine owns it; dialogue only queries and requests transitions.

### Mission definition

```json
{
  "id": "mission:humancommoners-2:road-shrines",
  "title": "Lights Along the Road",
  "summary": "Activate the nearby road shrines and return to the wayfinder.",
  "giverActorId": "legacy-actor:HumanCommoners#2:6",
  "turnInActorId": "legacy-actor:HumanCommoners#2:6",
  "prerequisites": { "all": [] },
  "objectives": [
    {
      "id": "activate-nearby-shrines",
      "kind": "activateTargets",
      "targetKind": "shrine",
      "targetIds": [
        "shrine:shrine 4 6:183:263",
        "shrine:shrine 5 6:223:263"
      ],
      "required": 2
    }
  ],
  "rewards": [
    { "op": "grantItemType", "typeId": "MinorHealingPotion", "quantity": 1 }
  ],
  "mapPolicy": "active-objectives-only",
  "sourceKind": "web-authored-generated"
}
```

### Initial objective types

Implement these types first:

| Objective type | Completion source |
|---|---|
| `talkToActor` | actor dialogue transaction |
| `visitLocation` | realm/position entry event |
| `discoverPortal` | portal discovery/use event |
| `activateTargets` | shrine or other activatable IDs |
| `searchContainers` | unique container IDs inspected/opened |
| `takeItem` | item instance transferred to party inventory |
| `collectItemType` | inventory type/count predicate |
| `completePuzzle` | stable puzzle completion event |
| `reachMazeGoal` | validated maze goal cell entered |
| `returnToActor` | actor interaction while earlier objectives complete |

Prefer tracking sets of unique source IDs over incrementing anonymous counters. This prevents double counting after reloads or repeated events.

### Goal catalog

`goals.json` provides reusable world targets:

```json
{
  "id": "goal:maze:populationGreekMazeHorde#22:deep-chest",
  "kind": "container",
  "targetId": "populationGreekMazeHorde#22:structure:0:chest:220",
  "position": [24.5, 39, 854.5],
  "realm": "surface",
  "structureId": "populationGreekMazeHorde#22:structure:0",
  "discoverable": true
}
```

Goals may reference actors, containers, shrines, puzzles, portals, or pure location anchors. They do not contain mission progress.

### Event-driven progress

The mission engine consumes typed events after successful transactions:

```text
actor.talked
container.inspected
container.opened
item.taken
shrine.activated
puzzle.componentActivated
puzzle.completed
portal.discovered
portal.used
location.entered
mission.accepted
mission.turnedIn
```

Every event includes transaction ID, stable source ID, world/interaction content version, and relevant target IDs. Reprocessing the same transaction ID is a no-op.

### Mission graph validation

Compile missions into a dependency graph and validate:

- no prerequisite cycles;

- no mission requires its own reward;

- all giver and turn-in actors exist and are reachable;

- all target IDs exist;

- all objective kinds are supported;

- every required target is reachable in the necessary state;

- every mission-critical item has exactly one intended source unless duplication is explicit;

- failure conditions cannot trigger before acceptance unless designed as world state;

- all strings and map markers resolve.

### Story spine and quest taxonomy

Define one authored, versioned **main story** manifest with ID `story:concordance:opening`, title, premise, ordered chapter IDs, chapter entry and exit conditions, and a next-chapter fallback. The premise: a practical repair at Wammigmig exposes a failure in the Concordance Grid; a missing component in a nearby cave reveals that the problem extends toward the mystical Measured Oasis; competing ways of knowing must be reconciled on the journey to the central Antipion capital. This is an authored plot overlay, not a claim that the legacy save contained missions. Identify the opening's central capital explicitly as **Migbushoprahshotra / the Measured Oasis**; **Awshowam** remains the Boarman cultural capital for its later economic arc. Do not silently conflate a chapter's major town, a culture's capital, and the eventual central destination.

Every mission has `kind: "main" | "side" | "mini"`, `storyId` and `chapterId` where applicable, stable `id`, `requires`, giver or automatic start, objective IDs, turn-in rule, reward, and optional `followUpMissionIds` and `returnToMainMissionId`. A **main quest** is a chapter of the story spine and is always present in the journal once reached; a **side quest** develops a local character or consequence and can return attention to a main objective; a **mini quest** is a short, nearby activity (one target or compact cluster) that can be completed while exploring. A mini quest may belong to a side quest without becoming a main chapter. Keep authored story relationships in a separate story catalog or small manifest; chunk scenes carry only anchors and IDs, and dialogue/mission JSON remains keyed and streamed.

Start chapter one automatically on a new game, without requiring an NPC acceptance choice. Show its next goal immediately on the map/compass; the NPC conversation supplies character and stakes. Advance the story on an objective or report transaction exactly once, even across reloads. An automatic chapter should never require pressing an invisible Accept button; optional dialogue choices may affect tone or journal preference without blocking progression. Save only mission/chapter state and player navigation choices, never duplicated prose or scene content.

| Chapter | Place and activity | Player learns | Completion and handoff |
| --- | --- | --- | --- |
| 1. The road remembers | Starting shrine / Orro, then Wammigmig / Marn: **talk → activate one shrine → confirm**. Order the actors and shrine so the player does not have to double back. If Orro is the first talk, Marn is the confirmation; alternatively use Marn as both giver and nearby confirmer after moving the target. | Talk, Action, light feedback, journal, one marker | Marn explains why the cave component matters; automatically surface chapter 2 and its first waypoint. No evidence readings or switch arithmetic yet. |
| 2. A missing current | **Pella → `cave:760:920:0` → Pella's fitting**: enter, follow the listening-coil marker, take **one** marked component, use the exit markers, return and fit it. | Travel, portal, cave exploration, chest/item, return or use | Installing it reveals the next settlement relay and introduces the people affected. Do not consume the item before the use/report state is persisted. |
| 3. Every branch | **Wamwammigtraawsho / Talla Three-Wicks**: activate **Exchange, Homes, and Labyrinth** using the existing `puzzle:boarman:regional:1` all-switch circuit, observe the town respond, and confirm with Talla. | Multiple independent toggles and shared power | Reveal the road frontier north toward the Measured Oasis; optional readings explain different interpretations of the repair. |
| 4. What the numbers mean | **Varo Null-Scribe**, on the approach to the Measured Oasis or its outskirts: present a **subset/total** puzzle with Intuition showing each value, current total, and goal. Make evidence visits purposeful and local. | Selecting some branches and comparing quantities | Establish why correct arithmetic alone may leave a social cost. The existing Wammigmig sum circuit can instead become Marn's optional side quest. |
| 5. An order worth keeping | **Saima and Nemi at Migbushoprahshotra**: near the end, after all earlier patterns are familiar, use sequence switches with a named ordering and an in-world explanation of the binding; resolve with Saima. | Sequence, interpretation, synthesis | Persist chapter outcome, change visible grid state and dialogue, and expose the wider cultural arcs. |

This table preserves the original **difficulty and narrative order**. Its rollout implemented chapters 1 and 2 before the all-switch chapter and kept later chapters as stubs until playable. All five chapters now exist. For future staged additions, keep unfinished objectives out of navigation and do not expose unreachable markers. The first shrine, cave, and item/fitting need verified reachable anchors and real portal mapping. Reuse Pella's existing coil/chest/socket content only if the item really lies in the chosen cave; the current nearby chest must not be presented as cave exploration. Preserve the existing sum puzzle as later authored material; keep sequence puzzles gated until the end. Neither the opening mission nor its journal text should describe all these mechanics at once.

### Data and runtime integration for agents

1. Add a compact `stories` catalog / keyed story record to the interaction manifest, including chapter IDs, titles, synopsis, successor mapping, and chapter-to-mission IDs; explicitly validate the entire graph for missing IDs, cycles, and unreachable chapter starts. Keep dialogue and mission records individually retrievable or partitioned by town/chapter so late capital text is not fetched at spawn; only chapter summary/navigation metadata belongs in the small global manifest. Keep assets and scene anchor IDs stable for the three.js editor.

2. Extend mission compiler helpers in `scripts/compile_interactions.mjs` with explicit `kind`, `storyId`, `chapterId`, `startMode: "automatic" | "offer"`, `followUpMissionIds`, and `returnToMainMissionId`. Generate an ordered chapter map from authored data rather than inferring narrative order from array position, NPC proximity, culture, or `requires` alone. Move the current `START_MISSION` contents into small, explicitly linked definitions; update outdated wording in the earlier slice document as work lands.

3. Extend `validateContent` in `jCRPG-engine/js/interactions/format.js` to validate taxonomy, all cross-references, each chapter's entry/exit and successor, cave item reachability and solvability, and the distinction between optional side/mini work and required regional tasks: current required side missions are referenced by mission objectives, while main `requires` lists contain earlier main chapters. Maintain support for an optional objective with more than one target when the all-switch lesson needs it.

4. Extend `InteractionRuntime` initialization and completion transactions: materialize the first automatic main mission on new/old saves when appropriate; unlock the next chapter exactly once; grant objective credit from previously observed world events when `backfill` is enabled; expose `currentStoryChapter`, `mainNavigationGoal`, and selected-quest goal separately. Completion must be idempotent for shrine, item, fitting, turn-in, and rewards. Dialogue reads current chapter/mission state, not a hard-coded start mission ID.

5. Update `InteractionUI.openJournal`, quest detail, compass, and map to render the three sections and a persistent main-story header. Remove the current special case for `mission:wammigmig:fair-share` and the present grouping trick that treats a tracked quest as `active` regardless of its true state. Use accessible touch targets and short next-step labels on phone; Action/Intuition remain the two touch verbs. Do not show a cave exit marker after leaving the cave.

6. Define a **migration map** from existing saved mission IDs/objective IDs to the new chapters. Preserve activated shrines, collected items, installed items, Lightmarks, and completed puzzles. Map completed `fair-share` to all already-satisfied early chapters without replaying rewards; map partial progress from world deltas, and show the first unmet chapter. Do not mark cave retrieval complete merely because the old nearby coil was collected. Version/migrate interaction content deliberately; do not reset the campaign by changing an ID.

7. Validate three paths in browser: fresh start and chapter 1; chapter 2 with cave entry, known item marker, auto exit markers and safe return; old save with shrine activated or `fair-share` complete. Check journal ordering, manual side tracking, a side/mini return to main, reload at every transition, and compiler travel report. The initial rollout stopped at the all-switch milestone; the subsequent Saima continuation adds the local quantity test, regional subset puzzle, and final sequence. Validate both opening and continuation now.

**Editing rule:** mission IDs identify persistent player progress and must not change just because dialogue, captions, objectives' prose, rewards, or anchor positions are revised. Treat objective IDs and completion semantics as save contracts too. When a semantic change is unavoidable, write an explicit versioned migration and a before/after progression test. Keep story synopsis, chapter link, objective definition, and NPC dialogue as separate authored fields; a writer can rewrite one mission or conversation without breaking `requires`, navigation, or the next chapter. Build validation should print the story graph and its main/side/mini links in a readable report for developers.

## Data and streaming implementation

- Author unique Antipion dialogue in a dedicated source module (for example `scripts/saima_dialogue.mjs`) invoked after `authorMainStory`, rather than editing baked JSON by hand. The generated content in `jCRPG-engine/worlds/seed0/v2/interactions/` is rebuilt from scripts. Preserve actor, mission, puzzle, route, and objective IDs where their meanings remain stable; update displayed names centrally in the source templates.

- Each actor keeps a keyed dialogue record. Put Saima's entry states in her record; put Varo, Nemi, keepers, and witnesses in their own records. The small global story manifest stores chapter IDs, status, concise synopsis, and navigation metadata, never all conversation captions. Mission records remain keyed and fetched on demand. On approaching/selection, prefetch a nearby actor's dialogue; camera turn can begin before the captions arrive. Eviction must not erase persistent mission, puzzle, or learned evidence state.

- The four regional story branches should load their local scene chunks, actor dialogue, evidence, and mission record only on travel or proximity. The four IDs and completion flags can be in the global quest graph; avoid pulling four full conversations when Saima first names them. Once a mission is active, journal summaries may be fetched individually for its display.

- Update `scripts/compile_interactions.mjs` for unique puzzles and witness details, `scripts/main_story.mjs` for gate/objective wiring and Saima states, `scripts/mission_templates.mjs` for names and thematic summaries, and `jCRPG-engine/js/interactions/{puzzles,runtime,navigation,format,dialogue}.js` as needed for `subset`, unlock predicates, and state-aware review. Keep plain JSON semantics and editor preview compatibility: scene anchors reference IDs; puzzle and mission definitions remain external JSON records.

- Add migration rules for puzzle shape changes. Old saves may contain three-component values for regional:0 or sequence cursors for regional:1 and the capital. Preserve legitimate mission completions and effects; reset only incompatible unfinished local puzzle state, with no duplicate rewards. The new final sequence gets its own ID and goal anchor near Saima, not the reused `puzzle:antipion:capital` ID.

# interaction_contracts

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Architecture, stable identity, scene integration, selection, and transactional interaction. JSON examples preserve the design rationale; actual supported fields and operators are defined by `jCRPG-engine/js/interactions/format.js`, `predicates.js`, `actions.js`, and the compiled v2 catalogs. In particular, live anchors also support evidence and fitting, and use surface/cave realms. Suggested module/file layouts below are design boundaries, not a directory listing.

### Player verb and magical interaction grammar

The intended game has only two fundamental verbs:

- **move** through the world;

- **interact** with a selected or nearby semantic target.

There is no player combat system in this design. Do not add attack, damage, hostile targeting, weapon switching, combat resources, or combat-gated objectives. Legacy weapons may remain as recovered inventory evidence, but they are not usable combat verbs in this port phase.

Interact should feel like directing a small piece of magic rather than pressing a generic UI button:

1. Input selects the best valid target along the view ray or within a short assistance cone.

2. The player emits an **attention pulse**: a quick luminous glyph, spark, or arc traveling from the player to the target.

3. The target answers visually and audibly before any text panel appears.

4. The target's declarative interaction handler performs the contextual meaning: greet, inspect, activate, route, rotate, tune, collect, open, confirm, or traverse.

5. The same input advances dialogue or confirms a currently offered choice; movement cancels or leaves conversational focus.

The pulse never damages. Its fiction is attention made energetic: observation, intention, and participation entering the network. Range assistance must be generous enough that interacting with small runes or moving NPCs is comfortable, but the resolved target must always be highlighted before activation.

Puzzle complexity comes from target arrangement, state, sequence, timing, and world knowledge rather than additional controls. Supported operation families are:

| Operation family | Example | Dominant reading |
|---|---|---|
| inspect | pulse three conductors to reveal measured load | rational |
| set or cycle | advance a switch through visible integer states | rational |
| connect | energize a continuous route without exceeding capacity | rational |
| sequence | repeat a shrine's pulse order | mystical, but observable |
| resonate | activate spatially corresponding symbols | mystical |
| synchronize | combine exact settings with a resonance window | balanced |
| converse | direct attention to an NPC and choose/confirm commitments | Speech/Wisdom |
| traverse | activate a door, stair, cave, or maze threshold | Body |

“Magical” must not mean arbitrary guessing. A mystical operation has perceivable cues, consistent rules, and recoverable feedback even when characters interpret its meaning differently. Rational operations likewise must not be presented as morally sufficient merely because their arithmetic is correct.

## Purpose and implementation position

This document is the implementation handoff for the next layer over the completed `web-baked-v1` world build. It covers:

- expressing Spiritual Objectivism and the Body/Speech/Mind/Wisdom/Bliss progression through play;

- compiling cultural identity, primary capitals, secondary capitals, minor settlements, and their mission routes;

- extracting the interaction-relevant object and character instances that actually exist in the legacy save;

- adding those instances to the existing `lewcid_object` chunk scenes without creating a second world representation;

- real container contents and inventory transfer;

- activatable shrines;

- deterministic, solvable puzzles;

- mission definitions, objectives, rewards, journal state, and map markers;

- persistent characters who explain, give, and complete missions tied to nearby goals;

- mission and puzzle integration with all 25 generated labyrinths;

- bounded static-host streaming and local save deltas;

- agent work packages, merge gates, and acceptance tests.

The existing terrain, towns, buildings, labyrinths, caves, collision, portals, assets, and 25-slot streaming system remain authoritative. Interactions add stable semantic references and runtime state to that system; they do not regenerate or fork it.

The legacy source does **not** contain a finished quest system to port verbatim. The correct strategy is:

1. preserve and export every usable legacy fact;

2. make absence explicit rather than inventing recovered data;

3. build a deterministic, declarative mission layer around the frozen world;

4. keep all new placements reproducible and validated against navigation, ownership, and scene data.

## Core architecture

The system has four data layers:

| Layer | Mutability | Examples |
|---|---|---|
| frozen legacy evidence | build-time immutable | actors, party object instances, scenario story/state, ownership |
| compiled interaction content | deployed immutable JSON | missions, dialogues, containers, puzzles, item definitions, actor assignments |
| chunk-local scene anchors | streamed immutable JSON | actor positions, shrine/chest/puzzle interaction points, visual sources |
| player deltas | locally mutable | inventory, mission progress, opened containers, activated shrines, puzzle state |

The build pipeline is:

```text
savegame.zip + scenario XML + Java source
                 |
                 v
      export_frozen_world.py
  actors + objects + story evidence
                 |
                 v
       compile_world.mjs
 world geometry + interaction allocation
                 |
       +---------+----------+
       |                    |
       v                    v
chunk lewcid scenes    interaction catalogs
local anchors/meshes   missions/actors/items/etc.
       |                    |
       +---------+----------+
                 v
       browser interaction runtime
                 |
                 v
             save v2 deltas
```

No runtime procedural mission generator is required. The static host serves immutable JSON and shared assets; runtime only loads definitions, evaluates state, and persists deltas.

## Terminology and invariants

Use these terms consistently:

- **actor**: a persistent character that may be visible and interactive;

- **attention pulse**: the harmless magical-electric visual emitted whenever the player invokes Interact;

- **Concordance Grid**: the shrine, road, settlement, cave, and maze-generator network that distributes magical electricity;

- **maze generator**: a persistent rational/mystical control assembly that regulates a labyrinth and part of the Concordance Grid;

- **primary capital**: the cultural hub where four regional layer tasks are framed and their Bliss synthesis is completed;

- **secondary capital**: one of four major regional towns responsible for a Body, Speech, Mind, or Wisdom task;

- **minor settlement**: a settlement assigned to a secondary capital and used for local goals, evidence, and consequences;

- **interaction anchor**: a chunk-local position/range/prompt tied to an actor, object, shrine, puzzle component, or portal;

- **object type**: immutable item definition, such as `MinorHealingPotion`;

- **object instance**: a stable individual inventory or container item;

- **container**: a chest or other storage object with concrete baked contents;

- **goal**: a world target that an objective refers to;

- **objective**: a measurable condition within a mission;

- **mission**: a stateful set of prerequisites, objectives, completion rules, and rewards;

- **dialogue**: declarative actor text and choices, optionally gated by state;

- **puzzle**: a bounded finite-state machine driven by world interaction components;

- **transaction**: one atomic interaction that validates and commits all effects together.

Hard invariants:

1. Every persistent entity, actor, object, container, shrine, puzzle, component, mission, objective, dialogue node, and goal has a globally unique stable ID.

2. Scene JSON contains placements and references, not duplicated mission definitions.

3. Gameplay catalogs contain data only—never executable JavaScript, constructors, callbacks, or expressions evaluated with `eval`.

4. Every reference is validated during the offline build.

5. Every generated mission and puzzle is solvable from its required starting state.

6. Every mission-critical item is reachable before it is required.

7. Interactions are idempotent: retrying after a reload cannot duplicate rewards or progress.

8. Chunk eviction never discards player state.

9. Editing or previewing a scene in `three_js_editor_small` does not require the mission runtime.

10. New authored/generated content is labeled separately from legacy-derived facts in compiler reports.

11. The player-facing verb set is movement plus one contextual Interact action; mission completion never requires combat or a hidden auxiliary verb.

12. An attention pulse cannot damage an actor or object, and aggressive legacy flags cannot convert it into an attack.

## Static file layout

Add interaction catalogs to the existing versioned world directory:

```text
jCRPG-engine/worlds/seed0/v2/
  manifest.json
  actors.json
  structures.json
  portals.json
  interactions/
    manifest.json
    cultures.json
    settlements.json
    shrine-graph.json
    maze-generators.json
    actor-assignments.json
    dialogues.json
    missions.json
    goals.json
    puzzles.json
    containers.json
    item-types.json
    initial-inventory.json
    strings.en.json
  assets/
    actors/
    interactions/
  chunks/
    x000_z000.scene.json
    ...
```

Use a new world/interaction format version. Do not modify the meaning of `web-baked-v1` files in place while retaining the old version identifiers.

Catalog rules:

- `manifest.json` lists hashes and byte lengths for every catalog;

- catalog arrays are sorted by stable ID;

- object keys have deterministic order through `canonicalJSON`;

- chunk scene hashes are computed only after interaction anchors and actor/puzzle visual nodes are inserted;

- all URLs remain static-host relative URLs;

- interaction definitions use IDs, not `source`, because `FolderUtils.js` treats `.json` `source` values as visual scene prefabs;

- only visual prefab/mesh references use scene-node `source`.

## Scene integration contract

### Chunk root data

Extend `userData.jcrpg` with an inspectable `interactions` array:

```json
{
  "interactions": [
    {
      "id": "interaction:shrine:shrine-1-2",
      "kind": "shrine",
      "targetId": "shrine:shrine 1 2:63:103",
      "position": [65, 40, 105],
      "realm": "surface",
      "range": 2.2,
      "priority": 40,
      "prompt": "Activate shrine"
    }
  ]
}
```

Allowed anchor fields:

| Field | Meaning |
|---|---|
| `id` | stable interaction anchor ID |
| `kind` | `actor`, `container`, `shrine`, `puzzle`, `portal`, or later extension |
| `targetId` | catalog entity operated on |
| `position` | world position |
| `realm` | `surface`, `cave`, or a structure-local realm |
| `range` | interaction radius |
| `priority` | deterministic overlap resolution |
| `prompt` | default localized-string key or temporary English text |
| `facing` | optional preferred facing vector |
| `requiresLineOfSight` | optional boolean |

### Visual-node references

Add IDs to the existing visual node rather than emitting a duplicate model:

```json
{
  "name": "road_shrine_63_103",
  "position": [65, 40, 105],
  "source": "../assets/shrine.obj",
  "userData": {
    "jcrpg": {
      "structureId": "shrine:shrine 1 2:63:103",
      "interactionId": "interaction:shrine:shrine-1-2",
      "stateTargetId": "shrine:shrine 1 2:63:103",
      "realm": "surface"
    }
  }
}
```

Existing chest nodes already carry `objectId`; add `interactionId` and `containerId` without changing the stable chest ID.

Actor and puzzle visuals are ordinary editor-compatible nodes:

```json
{
  "name": "actor_humancommoners_2_6",
  "position": [24.5, 40, 264.5],
  "rotation_degrees": [0, 180, 0],
  "source": "../assets/actors/human-commoner.json",
  "userData": {
    "jcrpg": {
      "actorId": "legacy-actor:HumanCommoners#2:6",
      "interactionId": "interaction:actor:HumanCommoners#2:6",
      "realm": "surface"
    }
  }
}
```

These scenes must continue to open directly in `three_js_editor_small`.

### Scene schema changes

Update `jCRPG-engine/js/world/scene.schema.json` and the hand-written runtime validator together. Validate:

- unique interaction IDs within a chunk;

- finite coordinates and range;

- known interaction kind;

- target existence in the appropriate catalog;

- actor/node ID consistency;

- visual asset sources confined to the world pack;

- no mission definitions embedded in chunks;

- no interaction anchor outside the chunk unless it is an explicitly owned seam fragment.

## General interaction runtime

Replace the chest-specific branch in `BakedWorldStream.nearby()` with a general local interaction index.

Recommended modules:

```text
jCRPG-engine/js/interactions/
  format.js
  registry.js
  nearby.js
  transaction.js
  predicates.js
  actions.js
  inventory.js
  containers.js
  shrines.js
  puzzles.js
  missions.js
  dialogues.js
```

### Loading

At startup:

1. load the interaction manifest;

2. load item types and the lightweight mission/actor/goal indexes;

3. load full definitions eagerly if the compressed total is small;

4. otherwise load full dialogue and inactive mission bodies on demand;

5. normalize chunk interaction anchors when each chunk scene is normalized;

6. retain anchors only for active slots and normalized LRU chunks.

Active mission definitions and inventory item types are pinned independently of chunk eviction.

### Nearby selection

For each current chunk, index anchors into small local cells. Selection order is:

1. filter by realm and distance;

2. filter by predicate eligibility;

3. optionally filter by line of sight;

4. rank by explicit priority;

5. rank by facing alignment;

6. rank by distance;

7. break ties by stable interaction ID.

Default priority order:

| Interaction | Priority |
|---|---:|
| mission turn-in actor | 100 |
| required puzzle component | 90 |
| mission-giver actor | 80 |
| ordinary actor | 70 |
| container | 60 |
| shrine | 50 |
| portal | 40 |

The UI shows one primary prompt and may expose secondary choices through a small interaction list. Invoking the configured Interact action always operates on the highlighted target and emits an attention pulse before resolving the target's contextual handler. Keyboard builds may bind this to `E`, but content and runtime logic must refer to the semantic action rather than a particular key.

### Transaction model

Every interaction follows:

```text
resolve target
  -> evaluate prerequisites against one state snapshot
  -> create proposed mutations/messages/events
  -> validate capacity, references, and one-shot rules
  -> commit one save transaction
  -> emit mission events
  -> refresh visuals, journal, map, and prompt
```

If any mutation fails, commit none of them. Assign each committed interaction a monotonically increasing local transaction number so duplicate UI/input delivery can be ignored.

## Safe declarative predicates and actions

Use a small JSON predicate AST.

Supported predicates should initially be limited to:

- `all`, `any`, `not`;

- flag equals/exists;

- mission state;

- objective state/count;

- inventory has item type/count;

- container state;

- shrine activated;

- puzzle state/completed;

- actor dialogue flag;

- location discovered;

- player realm/location;

- comparison of bounded numeric counters.

Supported actions should initially be limited to:

- set/clear flag;

- increment bounded counter;

- grant/remove item instance;

- change container state;

- activate shrine;

- apply puzzle transition;

- accept, advance, complete, or fail mission;

- mark objective source ID;

- reveal/hide map marker;

- set actor dialogue flag;

- show localized text;

- queue a visual/audio cue.

Reject unknown operators. Limit AST depth, list length, string length, and numeric range. Never evaluate script strings from content JSON.

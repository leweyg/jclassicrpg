# game_actors

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Persistent actor identity, safe placement, assets, dialogue, and goal allocation. Named authored principals now coexist with generated residents. Current shared GLB models and variants are described in [game_runtime](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/runtime/README.md); proxy and MD5 discussion explains fallback and asset-conversion options. Dialogue JSON below is a conceptual example; author shipped conversations through the current source modules.

## Actors, dialogue, and mission-giver allocation

### Actor identity versus presentation

Preserve legacy identity fields, then add presentation fields:

```json
{
  "id": "legacy-actor:HumanCommoners#2:6",
  "legacy": {
    "numericId": "6",
    "entityId": "HumanCommoners#2",
    "entityType": "HumanCommoners",
    "memberDescriptionType": "StrongAnimalMale"
  },
  "presentation": {
    "displayName": "Wayfinder 6",
    "role": "wayfinder",
    "nameSource": "web-deterministic",
    "visualPrefab": "actors/human-commoner.json"
  },
  "homeStructureId": "populationHumanCommoners#2:structure:1",
  "anchor": [24.5, 40, 264.5],
  "missionIds": ["mission:humancommoners-2:road-shrines"],
  "dialogueId": "dialogue:HumanCommoners#2:6"
}
```

Never put a generated display name into `legacyName`.

For the first release, role labels are safer than elaborate invented personal lore. Examples: Wayfinder, Shrine Keeper, Delver, Maze Keeper, Cave Scout, Artisan, Hunter.

### Actor anchor selection

For each fixed actor:

1. match its legacy owner ID to a compiled structure;

2. prefer an accessible exterior point beside the structure's door;

3. for interior-only roles, use a validated interior floor near the entrance;

4. for a labyrinth owner, use the entrance landing or a safe first-room cell;

5. if the owned structure was not materialized, anchor at the owning district's nearest safe street/floor cell;

6. never place an actor in blocked collision, on stairs, inside a wall, or directly over another interaction;

7. orient the actor toward the nearest path or entrance.

The compiler records whether the anchor is `owned-structure`, `district-fallback`, or `generated-guide`.

### Visual assets

Immediately reusable static OBJ assets exist for:

- human male/female;

- anatipion;

- yeti;

- several Greek-maze creature types.

Boarman and kobold primary models are MD5 meshes. Convert them offline to GLB, or use a clearly labeled temporary static proxy. Do not add an MD5 parser to the browser merely to start the mission layer.

Actor visuals should initially be static or use a minimal idle animation. Conversation functionality must not depend on skeletal-animation completion.

### Dialogue format

```json
{
  "id": "dialogue:HumanCommoners#2:6",
  "start": "greeting",
  "nodes": {
    "greeting": {
      "text": "The road shrines nearby have gone dark.",
      "choices": [
        {
          "text": "I will tend them.",
          "when": { "missionState": ["mission:humancommoners-2:road-shrines", "available"] },
          "actions": [
            { "op": "acceptMission", "missionId": "mission:humancommoners-2:road-shrines" }
          ],
          "next": "accepted"
        },
        { "text": "Not now.", "next": "end" }
      ]
    },
    "accepted": { "text": "You will find both shrines along this road.", "next": "end" },
    "end": { "end": true }
  }
}
```

Dialogue must support:

- mission-available greeting;

- active progress hint;

- ready-to-turn-in response;

- completion response;

- ordinary repeat greeting;

- concise direction/distance hint for assigned nearby goals.

No branching dialogue scripting language is needed beyond predicates, choices, actions, and next-node IDs.

### Allocating actors to nearby goals

Run allocation offline after structures, portals, containers, shrines, puzzles, and actor anchors exist.

Candidate goals:

- unassigned nearby shrines;

- labyrinth entrances, puzzles, and selected chests;

- cave entrances;

- local discovery points;

- mission-item containers.

Candidate actors:

- fixed district owners first;

- same-town or same-district actors before distant actors;

- actors on safe accessible cells;

- roles compatible with the goal family;

- actors below their configured mission/hint capacity.

Use wrap-aware distance and, where practical, navigation/portal distance rather than raw Euclidean distance.

Recommended constraints:

- ordinary “nearby” goal radius: 192 world units, six chunks;

- hard assignment radius: 320 units;

- maximum primary missions per actor: 2;

- maximum simultaneously advertised goals per actor: 3;

- every generated mission has exactly one giver and one turn-in actor;

- every selected major goal has at least one explaining actor;

- the giver is reachable before the objective;

- do not assign an actor behind the puzzle, key, or mission it introduces.

If no legacy actor satisfies the hard radius, emit a deterministic `generated-guide` actor at a validated town, shrine, or labyrinth entrance. Report every such fallback.

Hints should be concrete and compiler-generated from geometry: direction, approximate distance, landmark type, and whether the destination is inside a labyrinth/cave. Avoid dynamic natural-language generation at runtime.

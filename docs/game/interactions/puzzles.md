# game_puzzles

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Shrines, circuits, maze generators, placement, and solvability contracts. [game_puzzles](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/README.md#game_puzzles) lists shipped mechanics. Graph-based routing currently uses deterministic proximity with ground connectivity checks, not a recovered road graph. Generic finite-state examples and gate/collision designs below describe extensions; current circuits do not close passages. Rest, fast travel, timing, movable objects, and resources are optional future designs where stated.

### Shrine routing and maze-generator reactivation

Compile the shrines into a static graph. Every shrine record needs stable neighbor IDs, route costs, world positions, and the cultural/settlement routes it can serve. The runtime stores only activation and current-route deltas.

When a route is active:

1. the current shrine lights its next one or two reachable relays;

2. the world-space pulse points along the correct outgoing road segment;

3. the map reveals only the activated portion and known destination;

4. interacting with the next shrine persists activation and advances the light frontier;

5. unloading either chunk does not lose state; reloading derives visuals from saved shrine IDs;

6. reaching a junction may expose a choice, but the journal can reassert the mission route without teleporting or drawing the whole path permanently.

Maze generators are persistent interactable assemblies associated with labyrinth districts or major cave components. Each has:

- a physical generator anchor and visible inactive/unstable/active states;

- a rational operation set involving topology, continuity, quantities, or causal switches;

- a mystical operation set involving resonance, order, correspondence, or archetypal phase;

- a validation rule proving that the final state is reachable using movement and Interact alone;

- a local power effect and a graph-level effect on one or more shrine routes;

- an owning settlement and characters who explain competing interpretations of the fault.

Some generators may be repaired rationally, some through resonance, and some only by satisfying both. Mission data must label the required operation family; the runtime executes generic interaction primitives and never embeds culture-specific puzzle logic in scene code.

## Activatable shrines

All 173 compiled shrine structures receive:

- a stable interaction anchor at their accessible side/center;

- an `interactionId` on the visual node;

- a `ShrineDefinition` catalog entry;

- persistent activation state;

- a map marker that changes appearance after activation.

### Shrine states

```text
dormant -> activated
```

Activation is one-time and idempotent. A later repeatable `rest` action may be offered at an activated shrine, but it is separate from activation.

Minimum activation effects:

- set `activatedShrines[shrineId]`;

- mark the shrine discovered;

- emit `shrine.activated` with the stable shrine ID;

- update mission objectives;

- change instance color or add a small glow/halo visual;

- show a short confirmation message.

Optional later effects:

- save/checkpoint affordance;

- restore party resources when those systems exist;

- safe-rest time advancement;

- fast-travel node after activation.

Do not make restoration or travel prerequisites for the initial mission implementation.

### Shrine placement validation

For each shrine:

- find an accessible floor cell adjacent to the model;

- ensure the interaction anchor is reachable from surrounding surface navigation;

- ensure no building wall encloses it;

- ensure the prompt does not overlap a portal at equal or higher priority;

- validate its map marker and chunk ownership;

- validate exactly one `ShrineDefinition` and one activation target per stable shrine ID.

## Puzzle system

Puzzles are declarative finite-state machines, not arbitrary scripts.

### Puzzle definition

```json
{
  "id": "puzzle:maze:populationGreekMazeHorde#22:runes",
  "kind": "ordered-sequence",
  "structureId": "populationGreekMazeHorde#22:structure:0",
  "initialState": "start",
  "resettable": true,
  "components": [
    { "id": "rune-a", "kind": "rune", "position": [12.5, 39, 842.5] },
    { "id": "rune-b", "kind": "rune", "position": [20.5, 39, 847.5] },
    { "id": "rune-c", "kind": "rune", "position": [27.5, 39, 851.5] }
  ],
  "transitions": [
    { "from": "start", "input": "rune-a", "to": "a" },
    { "from": "a", "input": "rune-b", "to": "ab" },
    { "from": "ab", "input": "rune-c", "to": "complete" }
  ],
  "wrongInput": "reset",
  "completeState": "complete",
  "onComplete": [
    { "op": "emit", "event": "puzzle.completed" }
  ]
}
```

### Initial puzzle families

Start with three bounded families:

1. **ordered runes** — activate components in a deterministic sequence;

2. **paired switches** — set a small combination of binary controls;

3. **route circuit** — visit or activate nodes along a maze-derived route.

Each family must support reset and must have a small, enumerable state space.

Avoid physics puzzles, timing-critical sequences, movable rigid bodies, and real-time multiplayer synchronization in the first phase.

### Puzzle visual components

Emit individual reusable meshes/prefabs:

- rune stone;

- lever or switch;

- pressure plate;

- indicator light;

- puzzle gate or seal;

- reset pedestal.

Each component scene node carries `puzzleId`, `componentId`, `interactionId`, and `stateTargetId`. Visual state changes use instance colors, transforms, or a small set of alternate assets. Collision changes must be applied atomically with puzzle state.

### Solving and validation

The offline validator performs BFS over:

```text
(player navigation cell, puzzle state, relevant gate states, held mission keys)
```

It must prove:

- a completion state is reachable;

- reset is reachable from every non-complete state or wrong input resets automatically;

- no required component is behind the gate it unlocks;

- the player cannot become trapped by a gate transition;

- required mission items remain reachable;

- reload from every persisted state produces the same available transitions;

- completion effects are idempotent.

Fail the build on an unsolved or soft-locking puzzle.

## Labyrinth mission and puzzle integration

All 25 labyrinths should receive a consistent but varied interaction package.

### Restore labyrinth owner links

Each `DungeonDistrict` already exports one fixed infrastructure owner. Attach that owner to its compiled `SimpleDungeonPart` structure and allocate it as a Maze Keeper, Delver, captive guide, or entrance contact according to the mission template.

### Use the maze graph

The existing 37 × 37 semantic shell and `solveMaze()` output provide:

- entrances;

- all reachable cells;

- shortest-path distance from entrances;

- dead ends;

- junctions;

- chokepoints;

- generated chest cells.

Derive candidate placements from these graph properties:

| Element | Preferred maze location |
|---|---|
| introduction actor | entrance landing or safe exterior |
| first puzzle component | early junction |
| later component | distinct branch or deeper junction |
| mission chest/item | deep reachable dead end |
| completion seal | optional side chamber or return gate |
| reset control | entrance side of any controlled gate |
| final goal | high-distance reachable cell |

### Initial labyrinth mission template

After the Wammigmig slice, use one maze-generator reactivation as the first labyrinth slice:

1. interact with the Maze Keeper to hear two competing interpretations of the fault;

2. enter the labyrinth using movement and Interact only;

3. inspect components to establish rational facts about topology, continuity, and state changes;

4. discover the observable resonance sequence carried by nearby shrines or maze symbols;

5. operate three or more components until both the rational constraints and resonance rule hold;

6. reactivate the generator and visibly energize its linked shrine route;

7. return to the Maze Keeper and record what is proven, inferred, symbolic, and still unknown.

The puzzle may open an optional side chamber, but it must never close the only route back to the entrance. Chests and inventory can provide optional evidence or rewards; no item pickup is required to prove the core movement-and-Interact loop.

### Variation without runtime generation

Vary offline by stable labyrinth ID:

- rune sequence;

- chosen deep chest;

- component placement among validated candidates;

- mission text template and role label;

- ordinary loot;

- optional shrine/cave follow-up goal.

All variations are emitted as concrete JSON and included in reproducibility hashes.

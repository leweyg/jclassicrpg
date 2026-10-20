# game_saves

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Save contracts and migration rationale. Keep world, interaction, and asset versions distinct. The examples document the original v2 design and may include conceptual fields; `jCRPG-engine/js/world/save_deltas.js` and `interactions/storyMigrations.json` define current behavior. Migration history is recorded in [test_results](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/testing/results.md). Never apply an older reset policy to current saves without an explicit migration.

## Save format v2 and migration

### Save shape

```json
{
  "saveVersion": 2,
  "worldId": "seed0-web-v2",
  "worldGeneratorVersion": "web-baked-v2",
  "interactionContentVersion": "interactions-v1",
  "player": { "x": 800, "y": 41, "z": 907, "realm": "surface" },
  "inventory": {
    "items": {},
    "order": []
  },
  "containers": {},
  "shrines": {},
  "puzzles": {},
  "missions": {},
  "actors": {},
  "flags": {},
  "discoveredLocations": {},
  "lastTransaction": 0
}
```

State examples:

```json
{
  "containers": {
    "container-id": {
      "inspected": true,
      "opened": true,
      "takenItemIds": ["item-id"]
    }
  },
  "shrines": {
    "shrine-id": { "activated": true, "turn": 14 }
  },
  "shrineRoutes": {
    "route-id": {
      "state": "active",
      "activatedShrineIds": ["shrine-a"],
      "litFrontierShrineIds": ["shrine-b"],
      "destinationTownId": "town:..."
    }
  },
  "settlements": {
    "town:populationBoarmanTribe#381": {
      "balanceState": "stable",
      "poweredTargetIds": ["structure-a", "structure-b"]
    }
  },
  "mazeGenerators": {
    "maze-generator-id": {
      "state": "active",
      "rationalState": "valid",
      "resonanceState": "valid"
    }
  },
  "puzzles": {
    "puzzle-id": { "state": "ab", "completed": false }
  },
  "missions": {
    "mission-id": {
      "state": "active",
      "objectiveSources": {
        "activate-nearby-shrines": ["shrine-a"]
      }
    }
  }
}
```

### Migration from save v1

Migrate:

- player position and realm unchanged;

- `discoveredLocations` unchanged;

- each `openedContainers[id] = true` to `containers[id].inspected = true`;

- do not mark new loot as taken, because the old implementation explicitly recorded discovery/search and awarded no items;

- preserve a `legacySearched` flag so visuals and journal text remain honest;

- initialize shrines, puzzles, missions, actors, and inventory from defaults plus exported starting items.

Migration must be deterministic and idempotent. Keep a fixture for an actual v1 exported save.

### Content-version changes

Do not invalidate terrain caches merely because mission text changes. Separate:

- world format/generator version;

- interaction schema version;

- interaction content version;

- asset-pack version.

If stable IDs change, publish a migration map. If an active mission is removed, convert it to an archived/abandoned entry with a clear message rather than rejecting the entire save.

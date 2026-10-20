# world_evidence

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Recovered source evidence and extraction contracts. Baseline counts and missing features describe commit `712f957` and the bundled legacy save before the interaction layer. Subsequent ownership reconciliation and playable campaign results are in [test_results](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/testing/results.md). New names, missions, and loot must remain distinguished from recovered data.

## Evidence from the current repository and save

Repository baseline inspected: commit `712f957`, “Static procedural towns, building interiors, streets, shrines, 25 labyrinths, caves, collision.”

### What is already implemented in the web port

The current build contains:

| Existing system | Current evidence |
|---|---:|
| world size | 1,600 × 1,600 |
| streamed chunks | 2,500 |
| region composition scenes | 100 |
| active surface slots | 25 |
| saved districts | 208 |
| towns | 196 |
| generated structures | 1,166 |
| labyrinth districts | 25 |
| compiled unique shrines | 173 |
| cave entrances | 489 |
| door portals | 553 |
| stair portals | 144 |
| generated chests | 925 |
| decorative crates | 63 |
| decorative barrels | 63 |
| decorative baskets | 63 |

The current `GameState.interact()` supports:

- stairs and cave portals;

- searching a chest once;

- persisting searched chest IDs and discovered portal IDs;

- changing a chest's instance color after it has been searched.

It does not yet transfer loot, evaluate objectives, activate shrines, run puzzles, speak to actors, or update a mission journal.

### Legacy mission and story findings

The original scenario is intentionally open-ended:

- `scenario/jclassicrpg/events.xml` contains one `intro` event.

- The event plays two non-interactive story blocks from `story/intro.xml`.

- `ScenarioState` is only a generic `HashMap<String,Object>`.

- The save's scenario-state map contains only `intPlyd = true`.

- `org.jcrpg.world.ai.abs.Goal` is an empty class.

- No concrete `Mission`, `Quest`, `Objective`, or puzzle-state classes were found.

- No authored dialogue trees or mission chains were found.

- The web map already recognizes `mission` and `puzzle` marker kinds, but the frozen save supplies no such records.

Therefore there are no hidden legacy objective records waiting to be rendered. Missions and puzzles in this phase are a compatible extension, not recovered original campaign data.

### Legacy object-instance findings

The saved XStream graph contains four non-reference `ObjInstance` elements, all in saved party inventory:

| Object type | Icon | Saved uses |
|---|---|---:|
| `MinorHealingPotion` | `potion/minorheal.png` | 0 |
| `LongSword` | `weapon/longsword.png` | 0 |
| `BattleAxe` | `weapon/battleaxe.png` | 0 |
| `LeatherArmor` | `armor/torso_leather.png` | 0 |

Important details:

- the saved `numericId` is `0` for all four and is not suitable as a web stable ID;

- `ObjInstance` tracks description, total uses, attachments, and timed bonus uses;

- `EntityObjInventory` supports add, remove, equip, unequip, grouping, and transfer;

- the current web `PartyMemberState` does not yet model inventory;

- `EntityCommonWealth.getObjectsOfStorage()` constructs a healing potion, throwing knife, and crude arrow on demand, but this is placeholder logic and is not serialized per chest;

- the legacy chest handler associates storage with the owning entity's common wealth, handles lock/trap inspection, then transfers selected objects to a party member.

The 925 current maze chests are deterministic web-generated instances with excellent stable IDs, but their contents are not legacy-saved contents. Loot must be deterministically baked into the new interaction catalog.

### Legacy character-instance findings

The save contains 319 non-reference `PersistentMemberInstance` elements:

- one is the player character ELMARA;

- 318 are non-player persistent members;

- all 318 NPC descriptions serialize as generic `StrongAnimalMale` instances;

- none of those 318 NPCs has an authored personal name in the save;

- every NPC owns one infrastructure object;

- the NPC entity groups are:

| Entity group | Persistent NPCs | Owned residence type |
|---|---:|---|
| `GreekMazeHorde` | 88 | `SimpleDungeonPart` |
| `HumanCommoners` | 86 | `House` |
| `BoarmanTribe` | 64 | `Hut` |
| `KoboldHorde` | 30 | `WoodenHouse` |
| `AnatipionCatchers` | 26 | `BrickHouse` |
| `YetiHunters` | 24 | `Igloo` |

The frozen district export currently includes 208 fixed-infrastructure owner records. The compiled structure catalog currently carries `ownerMemberId` on 151 materialized structures. Fifty-seven fixed owner links are not represented on a compiled structure, including all 25 labyrinth owners. This is an export/compiler linkage gap to repair before allocating quest givers.

NPC names, occupations, dialogue, and mission assignments must be deterministic additions. They must never be described as recovered authored content.

### Shrine and puzzle findings

`RoadShrine` provides a model and physical structure but no shrine-specific trigger handler or saved activation state. The intro describes shrines as safe resting places, which is useful thematic evidence, but activation, blessing, and mission behavior are new web mechanics.

No puzzle definitions or puzzle states were found. The maze engine provides deterministic connected maze topology and a solver. That topology is the right substrate for new validated labyrinth puzzles.

## Export the actual legacy interaction evidence

Extend `scripts/export_frozen_world.py`; do not create an unrelated parser for the same XStream graph.

### Scenario export

Add:

```json
{
  "scenario": {
    "id": "jclassicrpg",
    "name": "JClassicRPG",
    "version": "0.1",
    "state": { "intPlyd": true },
    "events": [
      {
        "id": "intro",
        "type": "intro",
        "elements": [
          { "type": "story", "source": "scenario/jclassicrpg/story/intro.xml" }
        ]
      }
    ],
    "missionEvidence": "absent",
    "puzzleEvidence": "absent"
  }
}
```

Preserve event and story source paths. Export story blocks to a story catalog if the web UI will replay them. Do not reinterpret the intro as a quest.

### Actor export

Export every non-reference `PersistentMemberInstance` with:

```json
{
  "legacyActorId": "legacy-actor:HumanCommoners#2:6",
  "numericId": "6",
  "entityId": "HumanCommoners#2",
  "entityType": "HumanCommoners",
  "memberDescriptionType": "StrongAnimalMale",
  "legacyName": null,
  "position": [21, 48, 261],
  "ownedInfrastructure": [
    {
      "type": "House",
      "legacyDistrictId": "populationHumanCommoners#2"
    }
  ],
  "sourceKind": "legacy-save"
}
```

Stable actor ID derivation must include the entity ID and member numeric ID. A numeric ID alone is insufficient.

Export:

- resolved entity description class;

- resolved member description class;

- saved roaming-boundary position;

- owned infrastructure references;

- population/district references where available;

- behavior classes and relation defaults if they can be resolved reliably;

- model/audio hints from the entity description source catalog;

- whether the record is the player or an NPC.

Fail the export on duplicate stable actor IDs or unresolved required ownership references.

### Object-instance export

Export actual object instances by inventory owner and list position:

```json
{
  "id": "party:ELMARA:inventory:000:MinorHealingPotion",
  "typeId": "MinorHealingPotion",
  "legacyNumericId": 0,
  "uses": 0,
  "attached": false,
  "ownerActorId": "party:ELMARA",
  "equipped": false,
  "sourceKind": "legacy-save"
}
```

Because the legacy numeric IDs are all zero in this save, stable web IDs must be derived from owner, inventory slot, and type. Preserve the legacy value only as evidence.

Export attachment dependencies and timed bonus-use data when present. Do not synthesize chest contents in the Python evidence exporter.

### Ownership reconciliation report

The build must report:

- all 318 NPC actor records;

- the 208 actors referenced by exported districts;

- actor-to-owned-infrastructure matches;

- compiled structures with `ownerMemberId`;

- owners whose infrastructure was not materialized;

- fallback actor anchors used for those owners.

Do not silently drop the 57 currently unmatched fixed-owner links. For labyrinth districts, explicitly attach the district's fixed actor to the compiled `SimpleDungeonPart` structure even though the current big-block layout did not propagate `ownerMemberId`.

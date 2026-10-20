# world_settlements

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Fixed capital choices, cultural hierarchy, compilation semantics, and validation requirements. Seed-0 capital identities remain authoritative. The general road-degree ranking described below is a proposed cross-seed policy; current secondary selection uses geographic coverage and routes use proximity with reachability checks.

### Settlement hierarchy and current seed

The legacy world contains districts and procedurally named towns, but no capitals or political hierarchy. The interaction compiler must add a stable hierarchy for each culture:

| Tier | Count per culture | World and story function |
|---|---:|---|
| **primary capital** | 1 | Largest or strongest eligible cultural center; gives the cultural arc its full framing, records completion of the four major-town tasks, and hosts the final Bliss/synthesis mission. |
| **secondary capital / major town** | 4 | Regional hub connected to the primary capital; each owns one required Body, Speech, Mind, or Wisdom task and delegates nearby work to minor settlements. |
| **minor settlement** | all remaining eligible settlements | Local characters, clues, resources, complications, optional missions, and concrete consequences of decisions made at the major towns. |

The four secondary capitals plus one primary capital deliberately create a five-node cultural circuit. The hierarchy is about narrative responsibility and connectivity; it need not imply monarchy or centralized political domination.

The primary capitals for the current frozen seed are fixed as follows:

| Culture | Selected primary capital | Position | Evidence and required treatment |
|---|---|---:|---|
| Humans | **Trawamprahshoaw** (`town:populationBoarmanTribe#379`) | `(850, 820)` | Four districts and 126 inhabitants, including two Human districts, one Boarman district, and one Greek Horde labyrinth. It is one of the two largest towns and the best expression of Humans as the social middle ground. Preserve its mixed character. |
| Boarmen | **Awshowam** (`town:populationBoarmanTribe#23`) | `(30, 890)` | Four districts and 126 inhabitants, including two Boarman districts, one Human district, and one Greek Horde labyrinth. It is tied for largest town and is the strongest Boarman commercial center. Preserve its mixed character. |
| Yetis | **Prahshoshosho** (`town:populationYetiHunters#0`) | `(60, 40)` | Two Yeti districts and 72 inhabitants; the largest unambiguously Yeti settlement. |
| Antipions | **Migbushoprahshotra** (`town:populationAnatipionCatchers#390`) | `(780, 1100)` | A pure 36-inhabitant Antipion settlement close to the world center and starting region. Promote it through authored ritual, grid, and civic content rather than pretending the legacy size already made it a capital. |
| Greek Horde | **Awshoshotra** (`town:populationGreekMazeHorde#454`) | `(980, 740)` | A pure 36-inhabitant labyrinth settlement close to the world center. Its maze becomes a civic and psychological center rather than a monster lair to clear. |
| Kobolds | **Deep Ledger** (`town:kobold:deep-ledger`) | cave entrance `(786.5, 872.5)` | New baked cave capital anchored to `cave:760:840:0`, whose component size is 454. Kobold entities exist in the save but their settlement economy is incomplete, so this is explicitly new authored content. |

These choices are authoritative for `seed0/v1`. General ranking rules remain necessary for validation, rebakes, or other seeds, but the compiler must not silently replace a listed capital because a scoring weight changes.

Capital selection must be deterministic and emitted as data, never recalculated differently at runtime. Apply these rules in order:

1. Build each town's cultural-presence record from its districts and saved inhabitants.

2. A primary capital must be a pure town or one in which the culture has the unique largest district presence. A culture may explicitly opt into a mixed capital when that mixture is part of its authored theme, as for Humans and Boarmen above.

3. Rank eligible candidates by cultural district count, cultural inhabitants, road-graph degree, total town size, distance to the culture's geographic centroid, then stable `townId`.

4. Select four secondary capitals from the remaining culturally eligible towns. Prefer road connectivity and geographic coverage over four neighboring settlements with nearly identical reach.

5. Assign every remaining cultural settlement to its nearest reachable secondary capital, breaking ties by stable ID.

6. Validate that each secondary capital can reach its primary capital and at least one assigned minor settlement. Emit a build error rather than creating an impossible mission route.

7. Store the chosen hierarchy in compiled JSON so a future rebake may report intentional changes in a reviewable diff.

Mixed towns retain each constituent culture's presence. A town may be a major node in more than one arc only when explicitly allowed; shared status should produce cross-cultural missions rather than duplicate NPCs standing beside one another and ignoring the same crisis.

### Compiled data required by the theme layer

Add or extend immutable catalogs with records equivalent to:

```json
{
  "cultureId": "antipion",
  "legacyEntityTypes": ["AnatipionCatchers"],
  "pairId": "shamanic",
  "expression": "practiced",
  "displayName": "Antipions",
  "capitalTownId": "town:...",
  "secondaryCapitalTownIds": ["town:...", "town:...", "town:...", "town:..."],
  "layerOrder": ["body", "speech", "mind", "wisdom", "bliss"]
}
```

Each compiled settlement record must include:

```json
{
  "townId": "town:...",
  "settlementTier": "capital | secondary-capital | minor",
  "cultureIds": ["human", "boarman"],
  "dominantCultureId": "human",
  "parentCapitalTownId": "town:...",
  "parentSecondaryCapitalTownId": "town:...",
  "roadReachable": true,
  "capitalRankEvidence": {
    "culturalDistricts": 2,
    "culturalInhabitants": 66,
    "roadDegree": 0,
    "totalDistricts": 4
  }
}
```

The exact filenames may follow the catalog layout defined later in this document, but these semantics are required. Runtime scenes reference the IDs; they do not embed or independently infer cultural hierarchy.

# Game

[index](https://github.com/leweyg/jclassicrpg/blob/main/README.md) · [fiction_theory](https://github.com/leweyg/jclassicrpg/blob/main/docs/fiction/README.md#fiction_theory) · [story_plot](https://github.com/leweyg/jclassicrpg/blob/main/docs/story/README.md#story_plot) · [story_ids](https://github.com/leweyg/jclassicrpg/blob/main/docs/story/ids/README.md)

## game_play

[Play in the browser](https://leweyg.github.io/jclassicrpg/play.html), or serve the repository root with `python3 -m http.server 8000` and open `http://localhost:8000/play.html`. The bundled world needs no Java runtime or API key.

Walk with WASD, arrow keys, or the left touch stick; look with the right stick. Use E or the contextual action button on a highlighted person, shrine, device, chest, or portal. The journal and waypoint show the next task. The map's marker details provide Travel and Waypoint actions. Export/Import saves transfers local progress.

The central verbs are movement and interaction. Action changes the world; Intuition exposes a target's readings, hints, and interpretation. The attention pulse expresses participation and never deals damage. This browser campaign has no player combat system; legacy weapons can remain inventory evidence without becoming attacks.

New play starts near `(800, 41, 907)` with Orro and the roadside shrine. The five main chapters lead through Pella, Talla, and Saima. Existing saves resume their persisted position and progress. See [story_plot](https://github.com/leweyg/jclassicrpg/blob/main/docs/story/README.md#story_plot) for the complete narrative, including puzzle and ending spoilers.

## game_mission_types

| Kind | Purpose | Start and continuation |
| --- | --- | --- |
| `main` | Carries an ordered chapter in `story:concordance:opening`. | Automatic chapter activation; objectives and the report advance to the successor. |
| `side` | Develops a local need, character, or cultural account. | Usually offered by a person; may return attention to a main chapter or another local task. |
| `mini` | Gives a compact nearby activity. | A short offer tied to exploration or a larger thread. |

**Kind is a journal classification, not a guarantee of optionality.** Current chapters four and five depend on offered missions whose stored kind is `side`: `mission:antipion:balance`, the four regional missions `mission:antipion:body`, `speech`, `mind`, and `wisdom`, and `mission:antipion:bliss`. They are required parts of Saima's main progression. Other local work can remain optional. Earlier briefs proposed a stricter separation; follow the compiled dependency graph when binding the story.

A mission has a persistent ID, objectives with persistent IDs, prerequisites, completion/report semantics, and a giver or automatic start. Main missions also bind `storyId`, `chapterId`, and successor IDs. `returnToMainMissionId` supplies a return path for local work. Selecting a quest controls navigation; rewritten prose must not reset its progress. Completion, rewards, item fitting, and chapter advancement must survive reload without being applied twice.

## game_puzzles

| Pattern | Story use | Rule |
| --- | --- | --- |
| Single activation | Orro's shrine; Iva's regional relay | One action after the relevant conversation or observations. |
| All branches | Talla's shared supply; Mira's public categories | Every required branch is active; order does not matter. |
| Quantity | Saima's local balance | Inspect Measured, Repeated, Remainder and set their loads to 1, 2, 3; this is not a sequence. |
| Subset | Varis's revised prediction | Stone 2, Reed 3, Wind 4; choose a subset totaling 6. Preserve the failed prediction of 5 in the account. |
| Find and fit | Pella's coil; Tavi's listener | Retrieve the specific cave item, return through a real portal, and use the matching fitting. The two items are distinct. |
| Named sequence | Saima's synthesis | After four regional reports and Nemi's clue, perform Ground → Word → Pattern → Welcome. A wrong order resets the attempt, not the reports. |

Intuition should make the relevant state and next step understandable. A puzzle tests a visible relationship; symbolic meaning gives the act context without replacing its rules. A completed device does not substitute for reporting to its keeper. The exact objectives, predicates, gates, and migrations live in the catalogs and authoring modules linked below.

## game_systems

The frozen 1,600 × 1,600 world preserves saved geography and identities. Offline compilation reconstructs districts, buildings, labyrinths, and caves into static `lewcid_object` scenes. The browser streams them through 25 reusable 32-unit chunk slots with bounded caches and collision readiness. Generated content is a deterministic adaptation; verified Java hash and maze parity does not imply full Java terrain or building parity.

Interaction catalogs carry actors, dialogues, missions, puzzles, containers, fittings, shrines, routes, and story relationships. Scenes carry anchors and IDs. Save deltas retain progress and player navigation rather than duplicate prose. Stable identity connects [story_ids](https://github.com/leweyg/jclassicrpg/blob/main/docs/story/ids/README.md) to those records; use explicit migrations when semantics change.

Shrines offer local feedback and route frontiers. Maps distinguish discovered destinations and current goals; caves require realm-aware goals and valid entrance/exit transitions. Dialogue responds to pending, ready, and completed states. Visuals use shared character models and bounded shrine particles, while idle rendering avoids unnecessary frame loops.

Detailed operating and visual notes from the previous root README are preserved in [game_runtime](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/runtime/README.md). Full implementation specifications and historical verification remain in [game_sources](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/README.md#game_sources).

## game_build

Run from the repository root with Node 22+ and Python 3:

```sh
python3 -m http.server 8000
```

For content changes, rebuild and run the existing checks:

```sh
node scripts/build_world.mjs
node --test jCRPG-engine/js/tests/*.test.mjs
```

The generated world is `jCRPG-engine/worlds/seed0/v2`. Narrative authoring lives in [story_opening](https://github.com/leweyg/jclassicrpg/blob/main/scripts/concordance_dialogue.mjs) and [story_saima](https://github.com/leweyg/jclassicrpg/blob/main/scripts/saima_dialogue.mjs); [game_compile](https://github.com/leweyg/jclassicrpg/blob/main/scripts/compile_interactions.mjs) connects it to catalogs and anchors. Edit source and regenerate rather than hand-edit compiled records.

For browser acceptance and focused checks, follow [game_testing](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/testing/README.md). Rendering configuration is indexed in [game_rendering](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/rendering/README.md). Dated reports are consolidated in [test_results](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/testing/results.md).

## game_sources

Detailed references are organized by subject. Design examples identify their implementation limits; dated results retain their original scope.

| Reference | Contents |
| --- | --- |
| [game_world](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/world/README.md) | Generation, evidence, settlement hierarchy, mazes, caves, and navigation. |
| [game_interactions](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/interactions/README.md) | Contracts, missions, actors, inventory, puzzles, and saves. |
| [game_runtime](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/runtime/README.md) | Browser operation, character presentation, maps, and streaming. |
| [game_rendering](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/rendering/README.md) | City meshes and shrine particles. |
| [game_interface](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/interface/README.md) | Dialogue, journal, map, and homepage behavior. |
| [game_development](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/development/README.md) | Compiler responsibilities, implementation order, and integration gates. |
| [game_testing](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/testing/README.md) | Commands, validation contracts, fixtures, and recorded results. |
| [story_authoring](https://github.com/leweyg/jclassicrpg/blob/main/docs/story/authoring/README.md) | Theme, pacing, opening evolution, Saima design, and dialogue. |
| [game_catalog](https://github.com/leweyg/jclassicrpg/blob/main/jCRPG-engine/worlds/seed0/v2/interactions/stories.json) | Current five-chapter manifest; use the catalogs for live IDs and dependencies. |
| [game_legacy](https://github.com/leweyg/jclassicrpg/blob/main/README) | Original Java setup, controls, and requirements. |

The [source site](https://leweyg.github.io/spirtual_objectivism/) supplies philosophy, archetypes, and the broader Temple World relationship. Its Fiction/Game framing is expanded here into Fiction/Story/Game.

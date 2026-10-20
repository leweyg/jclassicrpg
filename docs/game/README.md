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

For browser acceptance and focused checks, follow [game_testing](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/testing/README.md). Rendering configuration is indexed in [game_rendering](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/rendering/README.md). Dated reports remain in the archive as verification history.

## game_sources

Read the Fiction, Story, and Game READMEs first. Historical documents are collected in [older_v1](https://github.com/leweyg/jclassicrpg/blob/main/docs/older/v1/README.md). These retained references preserve detailed design, provenance, and verification without making earlier revisions compete with the current plot.

| Reference | Role and status |
| --- | --- |
| [game_testing](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/testing/README.md) | Active test commands, browser setup, and coverage limits. |
| [game_rendering](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/rendering/README.md) | Current rendering and visual-tuning references. |
| [game_catalog](https://github.com/leweyg/jclassicrpg/blob/main/jCRPG-engine/worlds/seed0/v2/interactions/stories.json) | Current five-chapter manifest; all five are marked playable. Individual missions resolve actual dependencies and objectives. |
| [game_runtime](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/runtime/README.md) | Previous root README's browser operation, streaming, character, and map detail. |
| [story_brief](https://github.com/leweyg/jclassicrpg/blob/main/docs/older/v1/main-story-implementation.md) | Opening design and pacing; its “chapters four and five planned” status is superseded by the catalog and Saima implementation. |
| [story_early](https://github.com/leweyg/jclassicrpg/blob/main/docs/older/v1/root/main-story-implementation.md) | Earlier root copy of the opening brief, retained for history. |
| [story_saima_brief](https://github.com/leweyg/jclassicrpg/blob/main/docs/older/v1/saima-regional-dialogue-and-puzzles.md) | Detailed regional design and dialogue script; proposal wording predates implementation. |
| [game_saima_checks](https://github.com/leweyg/jclassicrpg/blob/main/docs/older/v1/saima-implementation.md) | Implemented Saima arc and recorded browser verification, including limits on cross-country route coverage. |
| [game_interactions](https://github.com/leweyg/jclassicrpg/blob/main/docs/older/v1/root/jclassicrpg-interactions-missions-and-quests.md) | Comprehensive original theme and interaction specification. Old opening order and layer mapping are historical; use the new READMEs and live data for those. |
| [game_review](https://github.com/leweyg/jclassicrpg/blob/main/docs/older/v1/root/interaction-review.md) | Root interaction review covering later switch families and local collection/use revisions. |
| [game_early_review](https://github.com/leweyg/jclassicrpg/blob/main/docs/older/v1/interaction-review.md) | Earlier quantity/resonance implementation review and dialogue update; not the current opening walkthrough. |
| [game_world](https://github.com/leweyg/jclassicrpg/blob/main/docs/older/v1/root/jclassicrpg-procedural-settlements-and-mazes.md) | Detailed generation, geometry, streaming, and compatibility specification. |
| [game_world_plan](https://github.com/leweyg/jclassicrpg/blob/main/docs/older/v1/procedural-implementation.md) | Historical implementation stages and compatibility policy. |
| [game_world_review](https://github.com/leweyg/jclassicrpg/blob/main/docs/older/v1/procedural-review.md) | Historical web-v1 review and Java parity boundaries. |
| [game_world_checks](https://github.com/leweyg/jclassicrpg/blob/main/docs/older/v1/procedural-validation.md) | Recorded procedural validation and evidence. |
| [game_particles](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/rendering/shrine-particles.md) | Shrine particle rendering and tuning. |
| [game_page_checks](https://github.com/leweyg/jclassicrpg/blob/main/docs/older/v1/page-issues-review.md) | Later map, journal, introduction, and mobile UI verification. |
| [game_fixes](https://github.com/leweyg/jclassicrpg/blob/main/docs/older/v1/root/jclassicrpg-bugs.md) | Dated issue resolutions and their verification status. |
| [game_legacy](https://github.com/leweyg/jclassicrpg/blob/main/README) | Original Java controls, installation, requirements, and history. |

The [source site](https://leweyg.github.io/spirtual_objectivism/) supplies philosophy, archetypes, and the broader Temple World relationship. Its Fiction/Game framing is expanded here into Fiction/Story/Game. The site itself has not been changed.

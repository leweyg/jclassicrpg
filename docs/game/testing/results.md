# test_results

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Recorded results grouped by implementation revision. All counts, timings, screenshots, and limits below belong to the cited build/report; they are not fresh test results or a current campaign inventory. The early quantity/resonance campaign and the later switch campaign are distinct revisions. Evidence links are preserved even where both reports referenced the same evidence directory.

## Geometry baseline

All five implementation stages have local, reviewable outputs. This is the
`web-baked-v1` playable slice; the compatibility boundaries in the
[review guide](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/testing/world.md) remain explicit.

| Check | Result |
| --- | --- |
| Saved inputs | 183 ordinary districts, 25 dungeon districts, exact geography longs, 208 NPC overrides |
| Compiled content | 1,166 structures/grounds/shrines; 190,935 cave floor cells; 489 cave links |
| Automated tests | 31 passed; no failures or skipped tests |
| Independent Java fixtures | 24 hash vectors and every byte of 80 maze grids match original Java |
| Dungeon traversal | All four entrances and every chest reachable through every 37×37 shell |
| Stream lifecycle | 1,000 transitions; exactly 25 slots; cache capped at 50 chunks; retained terrain buffers |
| Network safety | Five new chunks per ordinary crossing; cache hits on return; stale responses rejected; failures block movement; retry recovers |
| Persistence/traversal | Cave portals, multi-floor stairs, symmetric blocking faces, overlapping teleports, portable/versioned save deltas |
| Static artifacts | 2,602 scenes; 780,186 source references resolve; 5,000 terrain seams agree |
| Repeat build | All 5,184 artifacts byte-identical in an independent output directory |
| Browser | Town, building interior, dungeon and cave loaded with 25 ready slots, no JavaScript exceptions or failed mesh loads |
| Editor | Unmodified fixture, calibration, town chunk and 25-chunk region imported/rendered successfully |
| Mobile layout | 390×844 viewport checked; physical mobile GPU performance not measured |

The baked world data is approximately **209.4 MB raw / 18.6 MB gzip / 15.8 MB
Brotli**. Those are whole-world artifact sizes, not startup downloads. Representative
25-chunk sets measure **86–133 KB gzip**, excluding shared assets and bootstrap
indices. A plain Python server serves uncompressed bytes; the compression figures
are build measurements, not claims that the local server applied compression.

Headless Chrome rendered the representative views with 165 draw calls in the town,
151 inside a house, 242 in the dungeon and 12 in the cave. The visited working set
reported about 0.67 MB of geometry buffers, 2.13 MB of instance buffers, and a
9.52 MB texture estimate. These are software-renderer diagnostics. CPU render
submission in the sampled cave was 0.1–0.3 ms; GPU frame time and physical iPhone
performance remain unmeasured. No near-field detail was removed to satisfy an
unmeasured GPU limit.

Evidence:

- [Build and 31 tests](https://github.com/leweyg/jclassicrpg/blob/main/docs/procedural-evidence/build-and-tests.txt)

- [Byte reproducibility and seams](https://github.com/leweyg/jclassicrpg/blob/main/docs/procedural-evidence/reproducibility.json)

- [Browser metrics](https://github.com/leweyg/jclassicrpg/blob/main/docs/procedural-evidence/report.json)

- [Editor import results](https://github.com/leweyg/jclassicrpg/blob/main/docs/procedural-evidence/editor-report.json)

- [Town](https://github.com/leweyg/jclassicrpg/blob/main/docs/procedural-evidence/town.png), [house interior](https://github.com/leweyg/jclassicrpg/blob/main/docs/procedural-evidence/house-interior.png), [dungeon](https://github.com/leweyg/jclassicrpg/blob/main/docs/procedural-evidence/dungeon.png)

- [Cave](https://github.com/leweyg/jclassicrpg/blob/main/docs/procedural-evidence/cave.png), [mobile viewport](https://github.com/leweyg/jclassicrpg/blob/main/docs/procedural-evidence/mobile-cave.png)

- [Editor calibration](https://github.com/leweyg/jclassicrpg/blob/main/docs/procedural-evidence/editor-calibration.scene.json.png), [editor region](https://github.com/leweyg/jclassicrpg/blob/main/docs/procedural-evidence/editor-regions_r000_008.scene.json.png)

## Initial interactions

The new `web-baked-v2` world adds persistent characters, dialogue, missions, shrine routing, circuit puzzles and optional inventory to the existing frozen geography. All content runs from a plain static server. There is no combat, runtime content generator, service dependency, or API key.

### Completed stages

1. **Evidence and contracts.** Extended the existing XStream exporter with all 319 actors (318 NPCs), four uniquely identified starting items, and the saved scenario state. Preserved Marn’s saved member ID `544`. Restored all 25 labyrinth owner links; reconciled all 208 district owners, including 32 explicit fallback placements. Introduced world v2, catalog/scene schemas, manifest hashes, transactional save v2, and v1 migration that retains searched chests without removing their new loot.

2. **Interaction mechanics.** One contextual Interact action selects a highlighted, nearby target using realm, floor, collision visibility, priority, facing and stable tie-breaking. Atomic transactions handle dialogue commitments, missions, shrine activation, bounded circuit machines and container transfers. Retry tokens prevent duplicate delivery; failed transactions publish no partial state. Portable saves retain progress through chunk eviction and reload.

3. **Wammigmig.** Marn, Pella and Orro explain **A Fair Share of Light**. Observations, integer distribution, observable resonance, a recorded commitment, capital-route handoff and the optional cave response form the opening loop. Buildings change color when powered. Awakened shrines and the next route relay change appearance, and the last active relay points toward the frontier.

4. **World campaign.** Six fixed primary capitals, 24 secondary capitals, minor assignments, 18 named capital principals and paired-culture witnesses are compiled as data. Each arc has a capital balance, four independent regional layer tasks, and a return/Bliss synthesis. There are **276 talkable actors, 62 missions, 56 circuits, 173 activatable shrines, 25 labyrinth generators, five Kobold cave generators, and 925 lootable chests**. Regional and capital consequences persist. The other saved NPC records remain available as evidence; not every roaming NPC has a rendered actor.

5. **Presentation and validation.** Added keyboard/touch dialogue, a categorized journal, inventory/Take All, mission map markers, attention pulses, short audio cues and culture-specific static actor silhouettes. Added content checks, surface/cave navigation checks, complete mission simulations, streamed-placement tests, browser acceptance tests and direct editor previews.

### Initial opening walkthrough

Serve the repository root with `python3 -m http.server 8000`, then open `http://localhost:8000/play.html`. A prior v1 save migrates automatically; it may resume far from spawn. Use the map’s **Saved starting point** marker to return to `(800, 907)`.

- Walk west to the shrine and use **Interact / E**. It repeats **Homes → Storage → Street**.

- Walk east into Wammigmig. Talk to Marn and accept **A Fair Share of Light**. Pella and Orro offer independent explanations.

- Inspect the storage, hut-ledger and household reading markers. Inspect each conductor once; subsequent interactions cycle its setting. Match **Storage 2, Homes 3, Street 1**, then pulse **Homes → Storage → Street**. A reset stone clears an unfinished circuit. The contextual prompt shows current quantity and demand.

- Talk to Marn, choose a commitment, then report completion. The journal records the facts and promise. The relay frontier leads toward Garrum in **Awshowam**.

- At a capital, accept and complete its local balance first. Its principal then offers routes to the four regional keepers. Regional tasks require an outlying reading, another culture’s witness, a recorded commitment and a repaired circuit. Return for the capital’s synthesis after all four reports.

The journal gives coordinates, actor names and objective progress. The map reveals active objective positions. In panels, use arrows/W/S to select a choice and E to confirm, or click/tap. Escape closes the panel. Movement pauses while a panel is open. Chest contents are optional; legacy weapons are carried evidence without combat controls.

### Initial evidence

- **39 Node tests pass**, including all 62 mission completions, all 56 puzzle solutions, atomic rollback, duplicate input, inventory conservation, migration, import/reload, priority/visibility, chunk bounds and existing geometry regressions.

- Every actor, shrine and control can be selected at its actual streamed floor. The compiler checks surface connectivity from spawn and **35 cave anchors** against their settlement’s portal-connected component.

- The browser walks the opening mission from spawn using production movement/collision and dialogue handlers. It exports a partly configured circuit, reloads, imports through the actual file input, and finishes the mission. A second run walks a real maze from its keeper, activates the generator, reports completion and reloads its linked shrine effect. **No JavaScript exceptions or missing actor/prop assets** were reported.

- The unmodified `three_js_editor_small` loads the actor chunk, shrine chunk, maze chunk and a 25-chunk region directly. Gameplay data remains in `userData.jcrpg`; only visual assets use `source`.

- Two independent bakes are **byte-identical across 5,217 files**. Verification checks 2,602 scenes, 780,721 visual references and all 5,000 terrain seams.

- Catalogs total **1,494,669 raw bytes / 87,267 gzip bytes / 80,444 Brotli bytes**. Runtime keeps 25 active chunk slots and the existing bounded cache. Ordinary transactions measured 0.1 ms median / 0.2 ms p95, and nearby selection averaged 0.027 ms in isolated headless Chrome. Browser timing and memory measurements are in [the browser report](https://github.com/leweyg/jclassicrpg/blob/main/docs/interaction-evidence/report.json).

Evidence: [Marn dialogue](https://github.com/leweyg/jclassicrpg/blob/main/docs/interaction-evidence/marn-dialogue.png), [completed journal](https://github.com/leweyg/jclassicrpg/blob/main/docs/interaction-evidence/opening-completed-journal.png), [maze generator](https://github.com/leweyg/jclassicrpg/blob/main/docs/interaction-evidence/maze-generator-active.png), [mobile journal](https://github.com/leweyg/jclassicrpg/blob/main/docs/interaction-evidence/mobile-journal.png), [editor report](https://github.com/leweyg/jclassicrpg/blob/main/docs/interaction-evidence/editor-report.json), [reproducibility](https://github.com/leweyg/jclassicrpg/blob/main/docs/interaction-evidence/reproducibility.json).

Run:

```sh
node scripts/build_world.mjs
node scripts/compile_world.mjs --out /tmp/jcrpg-interactions-repeat
node scripts/verify_world.mjs jCRPG-engine/worlds/seed0/v2 /tmp/jcrpg-interactions-repeat
```

For browser acceptance, serve this repository on port 8789 and start an isolated headless Chrome with WebGL and a debugging port. Then run:

```sh
JCRPG_CDP_PORT=9229 node scripts/check_interactions_browser.mjs
```

The browser harness resets only the test browser’s game save through the application’s import API. Use an isolated profile. It can use `JCRPG_TEST_ORIGIN` and a positional evidence-output directory. The editor harness accepts `JCRPG_EDITOR_ORIGIN` and `JCRPG_CDP_PORT`; serve only a copy of the editor’s public assets and the generated world.

### Initial limits

This is a working campaign implementation with some deliberate simplifications from the larger design:

- Shrine routes use a deterministic proximity graph, with ground connectivity checked separately. They do **not** reconstruct the legacy road graph or claim road-degree ranking evidence. Fixed seed-0 capitals are authoritative; secondary selection favors geographic coverage. General ranking for different seeds remains future work.

- Regional tasks use settlement circuits and minor witnesses. The 25 deeper labyrinth missions are independently playable; completing a regional task does not require completing one of those separate labyrinth missions. The five Kobold major hubs do bind their local circuits to cave generators.

- Actors use authored static proxies. No MD5 conversion, skeletal animation, autonomous walking, or physical mobile-GPU certification is claimed.

- The bounded puzzle families are quantity, resonance, and combined circuits. They have proven solution witnesses and universally available reset behavior; they never close a passage. Dynamic puzzle gates, inventory-key puzzles, timing puzzles, and movable objects are not included.

- Inventory is party-wide and optional, with concrete salvage loot. Equipment effects, item consumption, locks and traps are disabled. Save migration supports the shipped v1 world; future removed-content migration needs an explicit ID map.

### Initial caption revision

The Wammigmig opening now uses authored click-through captions for Marn, Pella,
and Orro. Continue, E, and a backdrop tap advance one caption; response choices
appear only after the last caption. Reading a caption does not accept a quest,
make a commitment, or grant a reward. Map discovery sees only the displayed
caption and its visible choices.

Marn has first-meeting, repeat, active, ready-to-report, and completed greetings;
acceptance, commitments, hints, and the Awshowam handoff have their own passages.
Pella explains observed household demand versus her judgment about priority;
Orro explains settings, the observable pulse order, and recovery after mistakes.
State-specific reactions no longer overwrite unrelated conversation topics.
The current borderless presentation, quotation layout, response indicator,
keyboard/touch input, inventory stacks, and saved progression are preserved.

This is an additive dialogue update for `interactions-v1`. It retains the
existing quantity-plus-resonance circuit (Storage 2, Homes 3, Street 1, followed
by Homes → Storage → Street). The root-level review's four switch families,
weighted-sum replacement, and Pella's collection/use follow-up describe a
separate gameplay revision; they are not claimed as implemented by this update.
No campaign reset or interaction-content migration is performed here.

Authoring lives in `scripts/opening_dialogue.mjs`, called by the world compiler.
Runtime caption/entry selection lives in `js/interactions/dialogue.js`;
`dialogue.test.mjs` covers the complete opening handoff and save/reload.

## Switch revision

Shared ownership counts, cultural hierarchy, evidence links, reproducibility checks, and harness commands are recorded under Initial interactions above. This revision changes the mechanics, migration, inventory use, and counts below.

### Switch changes

2. **Interaction mechanics.** One contextual Interact action selects a highlighted, nearby target using realm, floor, collision visibility, priority, facing and stable tie-breaking. Atomic transactions handle dialogue commitments, missions, shrine activation, four bounded switch machines, container transfers, and explicit item use. Retry tokens prevent duplicate delivery; failed transactions publish no partial state. Portable saves retain progress through chunk eviction and reload.

3. **Wammigmig.** Marn, Pella and Orro explain **A Fair Share of Light** in slower click-through captions. Observations, a visible weighted sum, a recorded commitment, capital-route handoff and the optional cave response form the opening loop. Pella's follow-up **A Coil for the Shared Relay** proves exact collection markers, persistent collection credit, and consumed item use at a world socket. Buildings change color when powered. Awakened shrines and the next route relay change appearance, and the last active relay points toward the frontier.

4. **World campaign.** Six fixed primary capitals, 24 secondary capitals, minor assignments, 18 named capital principals and paired-culture witnesses are compiled as data. Each arc has a capital balance, four independent regional layer tasks, and a return/Bliss synthesis. There are **276 talkable actors, 63 missions, 56 circuits, 173 activatable shrines, 25 labyrinth generators, five Kobold cave generators, and 925 lootable chests**. The switch distribution is 11 single, 28 all, 12 sum, and five rare sequence circuits. Regional and capital consequences persist. The other saved NPC records remain available as evidence; not every roaming NPC has a rendered actor.

5. **Presentation and validation.** Added keyboard/touch dialogue, a categorized journal, inventory/Take All, mission map markers, automatic connected-interior exit markers, attention pulses, short audio cues and culture-specific static actor silhouettes. Entering a labyrinth or cave preserves known objective markers and discovers every compiled exit sharing its `interiorId`. Exit markers hide on leaving and reappear on re-entry; discovery survives reload. Cave exits are realm-filtered on the minimap. Added content checks, surface/cave navigation checks, complete mission simulations, streamed-placement tests, browser acceptance tests and direct editor previews.

### Switch opening walkthrough

- Walk west to the shrine and use **Interact / E**.

- Inspect the storage, hut-ledger and household reading markers. The three switches are worth **Storage 2, Homes 3, Street 1**; toggle a subset totaling **4**. Intuition shows each fixed value, On/Off state, current total, and goal. A reset stone clears an unfinished circuit.

The journal gives coordinates, actor names and objective progress. The map reveals active objective positions, including the exact chest for a required item and its later use socket. In panels, use arrows/W/S to select a choice and E to advance or confirm, or click/tap. Choices appear after the last authored caption. Escape closes the panel. Movement pauses while a panel is open. Legacy weapons remain carried evidence without combat controls.

Existing `interactions-v1` saves migrate to `interactions-v2`: player position, exploration, activated shrines, containers, concrete loot, and inventory survive. Old puzzle, mission, commitment, settlement-power, generator, and route progress restarts because the former quantity-plus-sequence state cannot be interpreted safely as the new switch mechanics. Previously taken concrete items are backfilled into `collectedItems`.

### Switch evidence

- **76 Node tests pass**, including all 63 mission completions, all 56 puzzle solutions, all four switch mechanics, multi-caption gating, collection/use persistence, exact item and connected-interior exit markers, interaction-v1 migration, atomic rollback, duplicate input, inventory conservation, import/reload, priority/visibility, chunk bounds and existing geometry regressions.

- Catalogs total **1,832,511 raw bytes / 103,611 gzip bytes / 95,790 Brotli bytes**. Runtime keeps 25 active chunk slots and the existing bounded cache. Ordinary transactions measured 0.1 ms median / 0.2 ms p95, and nearby selection averaged 0.027 ms in isolated headless Chrome. Browser timing and memory measurements are in [the browser report](https://github.com/leweyg/jclassicrpg/blob/main/docs/interaction-evidence/report.json).

### Switch limits

- Circuit theme (`rational`, `resonance`, or `balanced`) is independent of the interaction mechanic (`single`, `all`, `sum`, or `sequence`). Every circuit has a proven witness and reset; none closes a passage. Sequence is deliberately rare, carries a name and Intuition clue, and is explained by a nearby keeper. Timing puzzles and movable objects are not included.

- Inventory is party-wide, with concrete salvage loot. The Wammigmig follow-up supports one consumed mission item; equipment effects, locks and traps remain disabled. Save migration supports the shipped v1 world; future removed-content migration needs an explicit ID map.

## Fixes September 28

- Regression tests cover mission acknowledgment, direct review and waypoint selection, every capital-puzzle step through return-to-giver, fixed cave arrival headings, camera cut before delayed dialogue loading, and current-mission-first journal ordering.

- Browser checks cover desktop/mobile dialogue layout, idle rendering, and the acceptance/review flow.

- Full test suite: 156 passed; three existing failures remain in map discovery and homepage destination tests.

## Saima September 29

Verified locally on 2026-09-29.

The opening now carries one shared account through Orro’s roadside observation,
Marn’s report, Pella’s cave retrieval and coil fitting, and Talla’s three branches.
Talla explicitly sends the player to Saima with repeatable observations and room
for disagreement. Ready, unfinished, completed and early-arrival dialogue reflect
actual mission state. Optional local tasks remain available in a separate choice.

Opening authoring is in `scripts/concordance_dialogue.mjs`; regional dialogue and
puzzles are in `scripts/saima_dialogue.mjs`. The compiler emits the playable v2
world. Saima commissions four regional accounts before the final Ground, Word,
Pattern, Welcome sequence. The journal displays submitted regional reports and
locked puzzle markers stay hidden. The wisdom listener requires its cave item;
only legacy saves receive the compatibility credit for the earlier circuit.
Puzzle validation checks references, bounded controls, gates and solvability.

### Saima checks

- `node scripts/compile_world.mjs`: successful generation and validation.

- `node --test jCRPG-engine/js/tests/*.test.mjs`: 168 passed, zero failed.

- `JCRPG_CDP_PORT=9231 JCRPG_TEST_ORIGIN=http://127.0.0.1:8789 node scripts/check_saima_browser.mjs`:
  all browser assertions passed; see [report](https://github.com/leweyg/jclassicrpg/blob/main/docs/saima-evidence/browser-report.json).

The browser runner requires an isolated Chrome debugging profile and a static
server. It clears that profile’s game save. It starts fresh and uses real dialogue
choices, movement and interaction handlers to complete the opening and all four
regional reports, enter and leave the listener cave, consume its fitting, reject
an incorrect final order, finish the correct sequence, and submit Saima’s report.
It uses the game teleport API between distant destinations, so this verifies
local approach paths and interactions rather than every cross-country route.
It reloads both a partial regional save and the newly unlocked final stage.
The farewell is reachable at 390×844 and 844×390; no scene assets failed to load
and no browser runtime exceptions were reported.

The original `check_main_story_browser.mjs` entry point now runs this expanded
check, retaining its original default port and output directory.

### Saima image

[Saima conversation](https://github.com/leweyg/jclassicrpg/blob/main/screenshots/saima-dialogue-2026-09-29.jpg) is an actual
1600×1000 browser capture after playing the opening. The background includes
nearby residents and a Measured Oasis building. The homepage Character dialogue
card links to this image and uses updated descriptive alt text.

## Pages September 29

`node --test jCRPG-engine/js/tests/*.test.mjs`: 173 passed, zero failed.

`node scripts/check_page_issues_browser.mjs`: 20 checks passed. Requires an
isolated Chrome debugging profile (default port 9231) and local static server
(default origin http://127.0.0.1:8789). The runner clears that profile's save.
It checks real UI interactions and uses the game teleport API to reach Orro,
plus a runtime acceptance transaction to seed the two-entry journal case.
Phone portrait (390×844), landscape (844×390), and desktop (1280×900) checks
cover visible actions, focus and scrolling. No scene asset failures or browser
runtime exceptions occurred. See [browser results](https://github.com/leweyg/jclassicrpg/blob/main/docs/page-issues-evidence/browser-report.json).

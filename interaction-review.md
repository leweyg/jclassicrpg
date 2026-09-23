# Concordance interactions — local review

The new `web-baked-v2` world adds persistent characters, dialogue, missions, shrine routing, circuit puzzles and optional inventory to the existing frozen geography. All content runs from a plain static server. There is no combat, runtime content generator, service dependency, or API key.

## Completed stages

1. **Evidence and contracts.** Extended the existing XStream exporter with all 319 actors (318 NPCs), four uniquely identified starting items, and the saved scenario state. Preserved Marn’s saved member ID `544`. Restored all 25 labyrinth owner links; reconciled all 208 district owners, including 32 explicit fallback placements. Introduced world v2, catalog/scene schemas, manifest hashes, transactional save v2, and v1 migration that retains searched chests without removing their new loot.
2. **Interaction mechanics.** One contextual Interact action selects a highlighted, nearby target using realm, floor, collision visibility, priority, facing and stable tie-breaking. Atomic transactions handle dialogue commitments, missions, shrine activation, four bounded switch machines, container transfers, and explicit item use. Retry tokens prevent duplicate delivery; failed transactions publish no partial state. Portable saves retain progress through chunk eviction and reload.
3. **Wammigmig.** Marn, Pella and Orro explain **A Fair Share of Light** in slower click-through captions. Observations, a visible weighted sum, a recorded commitment, capital-route handoff and the optional cave response form the opening loop. Pella's follow-up **A Coil for the Shared Relay** proves exact collection markers, persistent collection credit, and consumed item use at a world socket. Buildings change color when powered. Awakened shrines and the next route relay change appearance, and the last active relay points toward the frontier.
4. **World campaign.** Six fixed primary capitals, 24 secondary capitals, minor assignments, 18 named capital principals and paired-culture witnesses are compiled as data. Each arc has a capital balance, four independent regional layer tasks, and a return/Bliss synthesis. There are **276 talkable actors, 63 missions, 56 circuits, 173 activatable shrines, 25 labyrinth generators, five Kobold cave generators, and 925 lootable chests**. The switch distribution is 11 single, 28 all, 12 sum, and five rare sequence circuits. Regional and capital consequences persist. The other saved NPC records remain available as evidence; not every roaming NPC has a rendered actor.
5. **Presentation and validation.** Added keyboard/touch dialogue, a categorized journal, inventory/Take All, mission map markers, automatic connected-interior exit markers, attention pulses, short audio cues and culture-specific static actor silhouettes. Entering a labyrinth or cave preserves known objective markers and discovers every compiled exit sharing its `interiorId`. Exit markers hide on leaving and reappear on re-entry; discovery survives reload. Cave exits are realm-filtered on the minimap. Added content checks, surface/cave navigation checks, complete mission simulations, streamed-placement tests, browser acceptance tests and direct editor previews.

## Try the opening mission

Serve the repository root with `python3 -m http.server 8000`, then open `http://localhost:8000/play.html`. A prior v1 save migrates automatically; it may resume far from spawn. Use the map’s **Saved starting point** marker to return to `(800, 907)`.

- Walk west to the shrine and use **Interact / E**.
- Walk east into Wammigmig. Talk to Marn and accept **A Fair Share of Light**. Pella and Orro offer independent explanations.
- Inspect the storage, hut-ledger and household reading markers. The three switches are worth **Storage 2, Homes 3, Street 1**; toggle a subset totaling **4**. Intuition shows each fixed value, On/Off state, current total, and goal. A reset stone clears an unfinished circuit.
- Talk to Marn, choose a commitment, then report completion. The journal records the facts and promise. The relay frontier leads toward Garrum in **Awshowam**.
- At a capital, accept and complete its local balance first. Its principal then offers routes to the four regional keepers. Regional tasks require an outlying reading, another culture’s witness, a recorded commitment and a repaired circuit. Return for the capital’s synthesis after all four reports.

The journal gives coordinates, actor names and objective progress. The map reveals active objective positions, including the exact chest for a required item and its later use socket. In panels, use arrows/W/S to select a choice and E to advance or confirm, or click/tap. Choices appear after the last authored caption. Escape closes the panel. Movement pauses while a panel is open. Legacy weapons remain carried evidence without combat controls.

Existing `interactions-v1` saves migrate to `interactions-v2`: player position, exploration, activated shrines, containers, concrete loot, and inventory survive. Old puzzle, mission, commitment, settlement-power, generator, and route progress restarts because the former quantity-plus-sequence state cannot be interpreted safely as the new switch mechanics. Previously taken concrete items are backfilled into `collectedItems`.

## Validation evidence

- **76 Node tests pass**, including all 63 mission completions, all 56 puzzle solutions, all four switch mechanics, multi-caption gating, collection/use persistence, exact item and connected-interior exit markers, interaction-v1 migration, atomic rollback, duplicate input, inventory conservation, import/reload, priority/visibility, chunk bounds and existing geometry regressions.
- Every actor, shrine and control can be selected at its actual streamed floor. The compiler checks surface connectivity from spawn and **35 cave anchors** against their settlement’s portal-connected component.
- The browser walks the opening mission from spawn using production movement/collision and dialogue handlers. It exports a partly configured circuit, reloads, imports through the actual file input, and finishes the mission. A second run walks a real maze from its keeper, activates the generator, reports completion and reloads its linked shrine effect. **No JavaScript exceptions or missing actor/prop assets** were reported.
- The unmodified `three_js_editor_small` loads the actor chunk, shrine chunk, maze chunk and a 25-chunk region directly. Gameplay data remains in `userData.jcrpg`; only visual assets use `source`.
- Two independent bakes are **byte-identical across 5,217 files**. Verification checks 2,602 scenes, 780,721 visual references and all 5,000 terrain seams.
- Catalogs total **1,832,511 raw bytes / 103,611 gzip bytes / 95,790 Brotli bytes**. Runtime keeps 25 active chunk slots and the existing bounded cache. Ordinary transactions measured 0.1 ms median / 0.2 ms p95, and nearby selection averaged 0.027 ms in isolated headless Chrome. Browser timing and memory measurements are in [the browser report](interaction-evidence/report.json).

Evidence: [Marn dialogue](interaction-evidence/marn-dialogue.png), [completed journal](interaction-evidence/opening-completed-journal.png), [maze generator](interaction-evidence/maze-generator-active.png), [mobile journal](interaction-evidence/mobile-journal.png), [editor report](interaction-evidence/editor-report.json), [reproducibility](interaction-evidence/reproducibility.json).

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

## Explicit implementation limits

This is a working campaign implementation with some deliberate simplifications from the larger design:

- Shrine routes use a deterministic proximity graph, with ground connectivity checked separately. They do **not** reconstruct the legacy road graph or claim road-degree ranking evidence. Fixed seed-0 capitals are authoritative; secondary selection favors geographic coverage. General ranking for different seeds remains future work.
- Regional tasks use settlement circuits and minor witnesses. The 25 deeper labyrinth missions are independently playable; completing a regional task does not require completing one of those separate labyrinth missions. The five Kobold major hubs do bind their local circuits to cave generators.
- Actors use authored static proxies. No MD5 conversion, skeletal animation, autonomous walking, or physical mobile-GPU certification is claimed.
- Circuit theme (`rational`, `resonance`, or `balanced`) is independent of the interaction mechanic (`single`, `all`, `sum`, or `sequence`). Every circuit has a proven witness and reset; none closes a passage. Sequence is deliberately rare, carries a name and Intuition clue, and is explained by a nearby keeper. Timing puzzles and movable objects are not included.
- Inventory is party-wide, with concrete salvage loot. The Wammigmig follow-up supports one consumed mission item; equipment effects, locks and traps remain disabled. Save migration supports the shipped v1 world; future removed-content migration needs an explicit ID map.

The original v1 world is retained, and the pre-existing `.gitignore` edit was preserved. No GitHub push or local commit was made.

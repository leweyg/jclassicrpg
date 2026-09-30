# Saima implementation and verification

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

## Checks

- `node scripts/compile_world.mjs`: successful generation and validation.
- `node --test jCRPG-engine/js/tests/*.test.mjs`: 168 passed, zero failed.
- `JCRPG_CDP_PORT=9231 JCRPG_TEST_ORIGIN=http://127.0.0.1:8789 node scripts/check_saima_browser.mjs`:
  all browser assertions passed; see [report](saima-evidence/browser-report.json).

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

## Homepage image

[Saima conversation](../screenshots/saima-dialogue-2026-09-29.jpg) is an actual
1600×1000 browser capture after playing the opening. The background includes
nearby residents and a Measured Oasis building. The homepage Character dialogue
card links to this image and uses updated descriptive alt text.

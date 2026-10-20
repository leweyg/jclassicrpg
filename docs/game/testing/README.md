# game_testing

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md) · [game_build](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/README.md#game_build) · [story_binding](https://github.com/leweyg/jclassicrpg/blob/main/docs/story/README.md#story_binding)

Verification commands checked against the current script entry points. Commands assume the repository root, Node 22+, and Python 3. The historical reports linked below retain their dated results; this guide does not claim a new test run.

## Checks

Rebuild after changing authored content, then run the existing Node tests:

```sh
node scripts/build_world.mjs
node --test jCRPG-engine/js/tests/*.test.mjs
```

For a shrine-rendering change, the focused check is:

```sh
node --test jCRPG-engine/js/tests/shrine_particles.test.mjs
```

## Browser

Start a static server in one terminal:

```sh
python3 -m http.server 8789
```

Launch an isolated Chrome instance with WebGL enabled, a fresh user-data directory, remote debugging on port 9231, and an open page. Both harnesses select a page from that debugging session and navigate it to the test site. They clear the game save in that profile; use a dedicated test profile.

Run the harnesses sequentially against that session:

```sh
JCRPG_CDP_PORT=9231 JCRPG_TEST_ORIGIN=http://127.0.0.1:8789 node scripts/check_saima_browser.mjs /tmp/saima-browser-evidence
JCRPG_CDP_PORT=9231 JCRPG_TEST_ORIGIN=http://127.0.0.1:8789 node scripts/check_page_issues_browser.mjs /tmp/grid-issues-evidence
```

`JCRPG_CDP_PORT` and `JCRPG_TEST_ORIGIN` select the debugging endpoint and static server. The positional argument chooses the evidence output directory. The values above match the scripts' defaults, with output made explicit. Inspect each generated `report.json` and its screenshots before recording a result.

| Harness | Coverage and limits |
| --- | --- |
| [story_checks](https://github.com/leweyg/jclassicrpg/blob/main/scripts/check_saima_browser.mjs) | Opening journey, four regional reports, listener retrieval and fitting, wrong and correct final sequences, saved progress, and dialogue layouts. Uses game teleport between distant destinations; local movement checks do not certify every cross-country route. |
| [page_checks](https://github.com/leweyg/jclassicrpg/blob/main/scripts/check_page_issues_browser.mjs) | Homepage and play-page introduction, map details, Travel and Waypoint, journal selection, map orientation, and phone/desktop layouts. Seeds a journal case through a runtime transaction and uses teleport for some setup. |

## Evidence

The consolidated [saima_report](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/testing/results.md#saima-september-29) and [page_report](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/testing/results.md#pages-september-29) describe earlier runs and their limits. Their evidence remains in `docs/saima-evidence/` and `docs/page-issues-evidence/`. Keep new output separate until it is intentionally reviewed and recorded. Geometry, interaction, and reproducibility records are consolidated in [test_results](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/testing/results.md).

## Test references

[test_contracts](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/testing/contracts.md) collects required coverage for generation, interactions, and story. [world_checks](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/testing/world.md) preserves geometry review and Java fixture regeneration. [test_results](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/testing/results.md) keeps revision-specific counts, timings, compatibility limits, and evidence links.

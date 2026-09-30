# Homepage and play-page review

Verified locally on 2026-09-29.

1. Homepage attribution links Lewey Geselowitz to his existing about page.
2. Story includes Begin anew and a Main story outline anchor.
3. Project credit explicitly names the original jClassicRPG game.
4. The footer counts the compiled catalogs: 5 main quests, 62 side quests,
   1 mini quest, and 279 characters (276 world actors plus 3 starter party members).
   These counts refresh from JSON; the static fallback is checked against it.
5. At widths up to 700px, homepage map controls sit below the canvas.
6. Single-finger forward steering eases to 35% of the turning-in-place rate
   at full forward input. Forward speed, backward steering and dual controls
   retain their existing behavior.
7. Explanatory paragraphs above and below the play map were removed.
8. Map markers open an inline details section below the canvas and scroll it
   into view, with Travel and Waypoint buttons in one row.
9. The compact map journal shows the tracked quest and the next unfinished
   main-story quest when different. Clicking focuses and zooms its destination;
   only pressing Waypoint changes the tracked mission.
10. Both large maps now agree with the compass: north is +Z, east is -X.
    Terrain rendering, projection, player arrows, hit testing, pan and zoom
    all use that orientation. The camera-relative minimap was already correct.
11. Homepage and Read Story share `jCRPG-engine/json/opening_story.json`.
    The new-game offer ends on reading or when another interaction is selected,
    and its dismissal survives saving. The phone panel starts at paragraph one.
12. Interaction labels omit the redundant “Interact with” prefix.
13. The portrait no longer displays the profession subtitle.

## Verification

`node --test jCRPG-engine/js/tests/*.test.mjs`: 173 passed, zero failed.

`node scripts/check_page_issues_browser.mjs`: 20 checks passed. Requires an
isolated Chrome debugging profile (default port 9231) and local static server
(default origin http://127.0.0.1:8789). The runner clears that profile's save.
It checks real UI interactions and uses the game teleport API to reach Orro,
plus a runtime acceptance transaction to seed the two-entry journal case.
Phone portrait (390×844), landscape (844×390), and desktop (1280×900) checks
cover visible actions, focus and scrolling. No scene asset failures or browser
runtime exceptions occurred. See [browser results](page-issues-evidence/browser-report.json).

# game_interface

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Dialogue, journal, map, preview, and navigation behavior. Current tracked quests appear first, with the main story separately visible when different; old journal proposals below are design context. The sections dated September 28–29, 2026 record accepted interface changes and their exact behavior. Raw role subtitles and redundant interaction labels were removed by those revisions.

## UI, journal, map, and feedback

### Interaction prompt

The existing contextual button remains the primary affordance. It should display:

- Talk to `<actor>`;

- Accept/Complete `<mission>` when appropriate;

- Open/Search `<container>`;

- Activate Shrine;

- Use `<puzzle component>`;

- Enter/Leave Cave;

- Use Stairs.

Keyboard `E`, touch, and click must operate identically.

These are contextual labels for the same semantic Interact action, not separate verbs. Before dispatch, highlight the resolved target; on dispatch, play the attention pulse and target response. In dialogue or an explicit choice panel, movement/navigation changes the focused choice and Interact confirms it.

### Dialogue panel

Use a bounded modal or side panel with:

- actor name and role;

- optional portrait/icon;

- dialogue text;

- explicit choices;

- mission title/objective preview;

- accept/decline/continue/turn-in actions;

- keyboard and screen-reader focus management.

Pause movement input while the panel is open, not the streaming/render lifecycle.

### Mission journal

Mission status is separate from mission kind: available, active, ready to turn in, completed, failed, or archived. The journal combines these statuses with main/side/mini classification; a selected quest does not become active merely because it is tracked.

Each entry shows objective text, progress, giver, turn-in actor, known target hint, and reward preview when appropriate.

### Map behavior

The map already supports mission and puzzle marker styles. Populate them from the mission engine:

- unknown goals are hidden;

- accepted objectives reveal configured targets;

- approximate goals show an area marker rather than exact coordinates;

- completed goals change style or disappear according to mission policy;

- mission giver and turn-in markers have distinct states;

- puzzle markers appear only when discovered or mission-revealed;

- shrine markers show dormant/activated state.

Map state is derived from catalogs plus save deltas; it is not stored as duplicated marker state.

### Main landing page as a story preview

Keep `index.html` distinct from `play.html`. Below the opening links and existing location shortcuts, show a five-step, keyboard/touch-accessible plot walkthrough: a short premise, one selected chapter at a time, place/character, personal or civic stakes, what the player does, the first-visit exploration label, and a screenshot with truthful caption and alt text. Next/previous buttons and chapter selectors change only the preview; they do not modify game saves or spoil the exact puzzle answers. Include **Play from the beginning** and direct **Visit this place** links using only validated `play.html?location=...` destinations; explain that a location link is a preview shortcut preserving progress, while a new game begins the story normally. Mark unimplemented narrative chapters as **planned** even when their location and existing grid can already be visited. Do not call a current screenshot proof of a future quest. Use local screenshots and no new startup asset requests from the playable world pack; keep page useful without JavaScript and on a phone.

### Side quests, mini quests, and journal attention

Journal top level: **Main story** (chapter, current objective, next destination, progress through named chapters), **Side quests** (town/character, state), **Mini quests** (nearby and short), with completed entries collapsed. Mark every entry with its kind in text and icon, not color alone. Keep the main story visible while another quest is tracked; the selected quest appears first, followed by the main story when different. New game defaults navigation to the first main objective. Selecting another quest changes only the explicit navigation selection; returning from a side quest should offer a one-tap **Continue main story** action and restore the main waypoint when there is no newer explicit selection. Preserve the player's deliberate choice to track a side quest until they finish it or change it; never silently overwrite a manually selected target mid-quest.

Link a side quest to the main story with `returnToMainMissionId` or a chapter relationship and an authored handoff line: the local result changes or clarifies a coming main decision, marks the main destination, then invites the player to resume. Aim for a return to the main marker after most side quest completions, especially at travel transitions; allow chains that deliberately hand off to another nearby side quest or mini quest. Side quests may supply insight, Lightmarks, shortcuts, or visible improvements, but required main progression must not rely on optional quests. A mini quest should usually point back to its parent side quest or current main chapter on completion. Show nearby mini quests below the main objective, limit automatic marker clutter, and distinguish **available** offers from **accepted** commitments. The map/compass should prioritize the selected objective, show the main story as a distinct secondary marker when relevant, and avoid dumping every mission target at once.

## Addressed — 2026-09-28

1. **Reviewing a conversation does not select its mission.** When the player reviews a mission conversation, set that mission as the current mission and update the waypoint accordingly.

2. **Mission acceptance and review dialogue are misplaced.** After receiving a mission, replace “Until next time” with an acknowledgment such as “Got it.” If the player talks to that character again before completing the mission, show the review content as the conversation itself; do not present “Review” as a dialogue option.

3. **Mini-map subtitle is unnecessary.** Remove the subtitle shown beneath the mini-map.

4. **Dialogue arrives after character selection.** Preload dialogue when a character is selected, or earlier when the player is nearby. On interaction, cut the camera to the character first, then show the dialogue when it has loaded so late loading does not delay the camera cut.

5. **Cave transitions use the approach angle.** On entering or exiting a cave, align the player/camera to a fixed entrance angle facing along the cave passage, even if the player clicked the entrance from the side.

6. In the mission "The Unquantized Remainder: A Local Balance" the waypoint points to the first item to activate, but once activated it doesn't point to the next. The waypoint should always point to the next unactivated target, and then back to the mission giver.

7. In the Journal page, the tracked mission appears first, with main-story missions below when the tracked mission belongs to another thread.

## Page behavior

The September 29, 2026 review recorded these interface changes; its test results are in [test_results](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/testing/results.md).

1. Homepage attribution links Lewey Geselowitz to his existing about page.

2. Story includes Begin anew and a Main story outline anchor.

3. Project credit explicitly names the original jClassicRPG game.

4. The footer counts the compiled catalogs: 5 main quests, 62 side quests,
   1 mini quest, and 279 characters (276 world actors plus 3 starter party members).
   These counts refresh from JSON; the static fallback is checked against it.

5. At widths up to 700px, homepage map controls sit below the canvas.

6. Single-finger forward steering eases to 61% of the turning-in-place rate
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

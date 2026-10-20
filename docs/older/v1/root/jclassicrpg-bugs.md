# The Spiral Grid RPG — bugs to address

## Addressed — 2026-09-28

1. **Reviewing a conversation does not select its mission.** When the player reviews a mission conversation, set that mission as the current mission and update the waypoint accordingly.
2. **Mission acceptance and review dialogue are misplaced.** After receiving a mission, replace “Until next time” with an acknowledgment such as “Got it.” If the player talks to that character again before completing the mission, show the review content as the conversation itself; do not present “Review” as a dialogue option.
3. **Mini-map subtitle is unnecessary.** Remove the subtitle shown beneath the mini-map.
4. **Dialogue arrives after character selection.** Preload dialogue when a character is selected, or earlier when the player is nearby. On interaction, cut the camera to the character first, then show the dialogue when it has loaded so late loading does not delay the camera cut.
5. **Cave transitions use the approach angle.** On entering or exiting a cave, align the player/camera to a fixed entrance angle facing along the cave passage, even if the player clicked the entrance from the side.
6. In the mission "The Unquantized Remainder: A Local Balance" the waypoint points to the first item to activate, but once activated it doesn't point to the next. The waypoint should always point to the next unactivated target, and then back to the mission giver.
7. In the Journal page, the current mission should be listed at the top (regardless of it's on the main story or not), The main story missions (if the current isn't on teh main story) should be listed below that.

## Verification

- Regression tests cover mission acknowledgment, direct review and waypoint selection, every capital-puzzle step through return-to-giver, fixed cave arrival headings, camera cut before delayed dialogue loading, and current-mission-first journal ordering.
- Browser checks cover desktop/mobile dialogue layout, idle rendering, and the acceptance/review flow.
- Full test suite: 156 passed; three existing failures remain in map discovery and homepage destination tests.

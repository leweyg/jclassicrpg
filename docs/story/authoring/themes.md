# story_themes

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Detailed theme-to-action, character, pacing, and exploration guidance. These are authoring requirements; metadata proposals such as `newArea` and `storyScale` do not imply that every field is currently emitted. Use [story_plot](https://github.com/leweyg/jclassicrpg/blob/main/docs/story/README.md#story_plot) for the narrative and [fiction_layers](https://github.com/leweyg/jclassicrpg/blob/main/docs/fiction/README.md#fiction_layers) for philosophical correspondence.

### Interaction rules for expressing the philosophy

- Never deliver a layer only as a lore paragraph. Every thematic claim requires a corresponding player action and observable result.

- Distinguish `fact`, `testimony`, `inference`, `symbol`, and `unknown` in mission and dialogue data. Mind-layer puzzles must not present a guess as objective truth.

- Speech-layer choices persist as commitments. Later conditions should be able to test whether a promise was kept, revised honestly, or broken.

- Wisdom-layer outcomes must affect more than one actor or settlement. They should reveal who benefits, who bears cost, and which institution is being affirmed or challenged.

- Bliss is not a sixth reward chest. Use return, rest, breath, procession, shrine activation, changed ambience, reconciled movement, or another low-violence integrating action.

- Wild cultures receive full characters, reasons, institutions appropriate to their scale, and non-combat resolutions. Aggressive legacy encounter flags are mechanics, not moral descriptions.

- Business is not synonymous with greed, and shamanism is not synonymous with irrationality. Each domain must show both virtue and distortion.

- Shrines should serve as pauses between stages and as shared neutral infrastructure across cultures. Activating them can make the journey itself—the repeated act of moving, stopping, and breathing—part of mission progress.

- The two largest mixed towns, Trawamprahshoaw and Awshowam, should visibly demonstrate coexistence and tension through NPC allocation, building use, dialogue, and cross-cultural consequences.

## Theme, character arc, and travel rhythm

The plot asks where tested knowledge ends and ritualized numerical mysticism begins, and how people use both without confusing symbols for measurements or reducing a living community to a ledger. Show this twice: in the **microcosm**, a person must decide how to repair and interpret one light; in the **macrocosm**, a town and then a network must decide how to distribute, record, and keep those lights. Neither reason nor ritual is the villain. Reason checks repeatable claims and the costs of action; ritual holds attention, relationship, and the unanswered question. Both can harden into avoidance. A ritual can insist on a beautiful but false sequence; a ledger can hide an unpaid human cost. End the first complete arc with repeatable evidence still recorded and a modest shared rite that keeps it open to revision.

Characters embody choices rather than teach slogans. **Orro** can measure the first pulse but needs to trust another person's touch; **Marn** uses accounting as care, then notices the households beyond the entry; **Pella** names those people but respects the winter stores; **Talla** manages all three branches together rather than privileging her favorite; **Varo** protects reproducibility without demanding certainty about every experience; **Nemi** offers symbolic attention and submits its predictions to checking; **Saima** makes the final public practice answerable to both. Give every pivotal character a concrete caring motive and a specific limitation; make their pending and completed lines respond to visible world changes.

For pacing, annotate each mission leg with `newArea: true | false` (computed from discovered chunk/region or landmark IDs), `defaultPath`, `storyScale: "person" | "town" | "network"`, and its next destination. A leg to a **new** area counts as **mission + exploration**; returning to a known area advances the **mission** only; optional branches and places discovered beyond the suggested route count as **exploration**, with a side or mini quest if they yield an authored task. Use the player's actual discovery save for display, because a cave is no longer new on a second visit. These are pacing labels, not extra player-facing homework. Default choices and the default compass marker should move the story toward its next objective. Non-default dialogue choices may reveal a person, a detour, or a site, and must have a graceful way back. Never require exhaustive branch exploration for the next main chapter.

| Moment | Scale and use of reason / ritual | Default activity | New area on a first visit | Optional exploration |
| --- | --- | --- | --- | --- |
| Orro and the shrine | Person: observe one measured pulse; pause and attune to it | Talk → activate → tell Marn | Shrine and Wammigmig: mission + exploration | Ask Orro how the shrine keeps a pattern; inspect roadside space |
| Pella's missing component | Person to household: recover a physical part; listen to whose dark room matters | Cave → retrieve → return/use | Cave: mission + exploration; return to Wammigmig: mission | Cave side branches and other objects, with known exits retained while inside |
| Talla's three branches | Town: verify that all grid branches conduct; acknowledge distinct users | Travel to major town → turn all on → confirm | Major town: mission + exploration; confirmation walk: mission | Speak to households, exchange workers, and labyrinth witnesses |
| Varo and Nemi | Town to network: test quantities; let symbolism propose a question to test | Approach capital → inspect local totals → record uncertainty | Capital approach: mission + exploration; repeated tests: mission | Compare interpretations and visit a side-found shrine or reading |
| Saima's synthesis | Network: test a named sequence; create a public rite that can be corrected by new evidence | Complete late sequence → agree on shared practice | New capital precinct: mission + exploration; return to Saima: mission | Visit additional districts and cultural arcs; return to the main marker when ready |

Treat this as a **complete vertical-slice story arc** from person to network, even if implementation ships in stages. The first act must have a small payoff, the middle must show distinct towns and their consequences, and the capital must change the shared grid and its social practice. Count first-visit destinations and revisits per chapter in the compiler report; playtest the alternation so there is no long chain of reports or backtracking without a fresh place, character, consequence, or optional discovery. Once the player has visited a place, the mission remains meaningful through changed dialogue or world state rather than pretending the journey is new again.

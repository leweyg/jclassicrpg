# The Spiral Grid RPG — interactions, missions, actors, shrines, puzzles, and maze goals

## Expression of theme and social world

This interaction layer should give the generated world a coherent philosophical and social shape without pretending that the legacy game supplied a finished plot. Geography, populations, settlement forms, roads, shrines, caves, and labyrinths remain recovered world facts. Capitals, cultural interpretations, character roles, and mission arcs are a new deterministic narrative overlay built from those facts.

The central theme is **Spiritual Objectivism**: objective reality exists and matters, while any character's knowledge of it is partial, situated, and multidimensional. The game should express this through what the player repeatedly does, not only through explanatory dialogue.

### The five layers

The five layers provide both the philosophical structure of the story and the interaction grammar used to express it:

| Layer | Thematic imperative | Meaning in the game | Primary interaction expression |
|---|---|---|---|
| **Body** | **God is objective reality.** | There is a real truth to reach for—*Sat Nam*—but it is multidimensional and no single witness possesses it completely. | Observe terrain and ecology, travel to a real place, inspect physical evidence, recover an object, survive a route, and verify claims against the world. |
| **Speech** | **Goodness is when your virtues are prioritized with your values.** | Goodness is the goal of action; a professed value matters only when choices and commitments place virtues in an explicit order. | Dialogue, promises, contracts, testimony, negotiation, allocation, and consequences for keeping or breaking one's word. |
| **Mind** | **Reason the known; attune numerical mysticism for the unknown.** | Use reason ethically for what can be known, clearly mark uncertainty, and use number, symbol, and archetypal energy to approach what has not yet been quantified. | Evidence puzzles, counting and spatial patterns, maze reasoning, competing hypotheses, and explicit distinctions between fact, inference, and mystery. |
| **Wisdom** | **Humanity is political religion.** | Society is a constructed sacred order: it should be questioned, but also embraced where its institutions embody virtue. | Multi-party missions, town institutions, mixed settlements, public consequences, mediation, governance, and reconciliation between personal and communal goods. |
| **Bliss** | **Breath as your next prayer.** | Every step can be prayer. Integration is practiced continuously rather than awarded as a final abstraction. | Journey rhythm, shrine pauses, rest and breath, return, synthesis, and a final act that changes how ordinary movement through the world is understood. |

These are dramatic questions, not five facts that every NPC must recite or accept. Characters should disagree about what is objectively true, which virtues deserve priority, where reason ends, when institutions are sacred or corrupt, and whether ritual remains meaningful in ordinary action. The player demonstrates an answer through movement, exchange, puzzle solving, and social consequences.

### Paired cultures: practiced and wild forms

The six cultures form three thematic pairs. “Wild” means less mediated by settled institutions, formal doctrine, or regulated exchange. It must never be used as shorthand for stupid, evil, primitive, or disposable.

| Domain | Practiced or settled expression | Wilder expression | Productive tension |
|---|---|---|---|
| spirit and the unknown | **Antipions: shamanic practitioners** | **Yetis: wilder shamans** | Formal ritual, trained interpretation, and numerical symbolism versus direct embodied relation to weather, breath, animals, and place. |
| value and exchange | **Boarmen: businessmen** | **Kobolds: wilder businessmen** | Contracts, storage, markets, and accumulated capital versus mining, barter, salvage, opportunity, and frontier risk. |
| social humanity | **Humans: the social middle ground** | **Greek Horde: wilder humans** | Ordinary compromise, civic institutions, and plural coexistence versus appetite, fear, wonder, instinct, and the ungoverned social psyche expressed through labyrinths. |

Use **Antipion** as the player-facing culture name and retain `AnatipionCatchers` only as the legacy source identifier. Likewise, “Greek Horde” is a working cultural label for the labyrinth population; it does not assert that the legacy monster roster represents historical Greek people.

Each culture should express all five layers, but with a different emphasis:

| Culture | Body | Speech | Mind | Wisdom | Bliss |
|---|---|---|---|---|---|
| Antipion | Ritual objects and desert-built places | Oaths, initiations, careful naming | Number, symbol, divination, and acknowledged uncertainty | Custodianship and disciplined spiritual institutions | Formal breath practice becomes ordinary service |
| Yeti | Cold, hunger, tracks, weather, and animal presence | Sparse speech whose reliability matters | Pattern learned directly from seasons and signs | Kinship and reciprocal obligation without bureaucracy | Breath, warmth, and movement as immediate prayer |
| Boarmen | Goods, buildings, roads, storage, and logistics | Contracts, prices, promises, and reputation | Accounts, measures, forecasts, and risk | Markets as public institutions that may serve or exploit | Prosperity understood as circulation rather than hoarding |
| Kobolds | Ore, tools, caves, danger, and physical labor | Bargains, claims, warnings, and informal debt | Prospecting, practical geometry, and uncertain yield | Crews, mutual dependence, and contested ownership | The working rhythm of strike, listen, breathe, and proceed |
| Humans | Domestic life and the shared road | Mediation among incompatible vocabularies | Practical reason and comparison of testimony | The clearest examination of humanity as political religion | Plural life made sacred through repeated ordinary care |
| Greek Horde | Bodies, beasts, thresholds, and the labyrinth | Cry, story, temptation, rumor, and theatrical truth | Maze logic and confrontation with projected meaning | Emergent order without conventional civic restraint | Acceptance and integration of the uncivilized self |

No culture is the exclusive owner of spirituality, commerce, reason, civilization, or humanity. The pairings determine perspective and dramatic vocabulary, not moral alignment.

### Settlement hierarchy and current seed

The legacy world contains districts and procedurally named towns, but no capitals or political hierarchy. The interaction compiler must add a stable hierarchy for each culture:

| Tier | Count per culture | World and story function |
|---|---:|---|
| **primary capital** | 1 | Largest or strongest eligible cultural center; gives the cultural arc its full framing, records completion of the four major-town tasks, and hosts the final Bliss/synthesis mission. |
| **secondary capital / major town** | 4 | Regional hub connected to the primary capital; each owns one required Body, Speech, Mind, or Wisdom task and delegates nearby work to minor settlements. |
| **minor settlement** | all remaining eligible settlements | Local characters, clues, resources, complications, optional missions, and concrete consequences of decisions made at the major towns. |

The four secondary capitals plus one primary capital deliberately create a five-node cultural circuit. The hierarchy is about narrative responsibility and connectivity; it need not imply monarchy or centralized political domination.

The primary capitals for the current frozen seed are fixed as follows:

| Culture | Selected primary capital | Position | Evidence and required treatment |
|---|---|---:|---|
| Humans | **Trawamprahshoaw** (`town:populationBoarmanTribe#379`) | `(850, 820)` | Four districts and 126 inhabitants, including two Human districts, one Boarman district, and one Greek Horde labyrinth. It is one of the two largest towns and the best expression of Humans as the social middle ground. Preserve its mixed character. |
| Boarmen | **Awshowam** (`town:populationBoarmanTribe#23`) | `(30, 890)` | Four districts and 126 inhabitants, including two Boarman districts, one Human district, and one Greek Horde labyrinth. It is tied for largest town and is the strongest Boarman commercial center. Preserve its mixed character. |
| Yetis | **Prahshoshosho** (`town:populationYetiHunters#0`) | `(60, 40)` | Two Yeti districts and 72 inhabitants; the largest unambiguously Yeti settlement. |
| Antipions | **Migbushoprahshotra** (`town:populationAnatipionCatchers#390`) | `(780, 1100)` | A pure 36-inhabitant Antipion settlement close to the world center and starting region. Promote it through authored ritual, grid, and civic content rather than pretending the legacy size already made it a capital. |
| Greek Horde | **Awshoshotra** (`town:populationGreekMazeHorde#454`) | `(980, 740)` | A pure 36-inhabitant labyrinth settlement close to the world center. Its maze becomes a civic and psychological center rather than a monster lair to clear. |
| Kobolds | **Deep Ledger** (`town:kobold:deep-ledger`) | cave entrance `(786.5, 872.5)` | New baked cave capital anchored to `cave:760:840:0`, whose component size is 454. Kobold entities exist in the save but their settlement economy is incomplete, so this is explicitly new authored content. |

These choices are authoritative for `seed0/v1`. General ranking rules remain necessary for validation, rebakes, or other seeds, but the compiler must not silently replace a listed capital because a scoring weight changes.

Capital selection must be deterministic and emitted as data, never recalculated differently at runtime. Apply these rules in order:

1. Build each town's cultural-presence record from its districts and saved inhabitants.
2. A primary capital must be a pure town or one in which the culture has the unique largest district presence. A culture may explicitly opt into a mixed capital when that mixture is part of its authored theme, as for Humans and Boarmen above.
3. Rank eligible candidates by cultural district count, cultural inhabitants, road-graph degree, total town size, distance to the culture's geographic centroid, then stable `townId`.
4. Select four secondary capitals from the remaining culturally eligible towns. Prefer road connectivity and geographic coverage over four neighboring settlements with nearly identical reach.
5. Assign every remaining cultural settlement to its nearest reachable secondary capital, breaking ties by stable ID.
6. Validate that each secondary capital can reach its primary capital and at least one assigned minor settlement. Emit a build error rather than creating an impossible mission route.
7. Store the chosen hierarchy in compiled JSON so a future rebake may report intentional changes in a reviewable diff.

Mixed towns retain each constituent culture's presence. A town may be a major node in more than one arc only when explicitly allowed; shared status should produce cross-cultural missions rather than duplicate NPCs standing beside one another and ignoring the same crisis.

### Cultural-arc topology

Every cultural arc uses the same comprehensible route while varying its content:

```text
minor settlements -> regional task at a secondary capital --+
minor settlements -> regional task at a secondary capital ---+--> return to primary capital
minor settlements -> regional task at a secondary capital ---+       for Bliss/synthesis
minor settlements -> regional task at a secondary capital --+
                              ^
                              |
                 capital briefing and connections
```

Required progression:

1. A character in any secondary capital can introduce the local problem and direct the player to the cultural capital.
2. The capital's principal character frames the disagreement without supplying its answer and registers the four regional tasks.
3. The player completes the Body, Speech, Mind, and Wisdom task at the four secondary capitals. Each major-town task may require goals in one or more of its assigned minor settlements, nearby shrines, caves, buildings, or labyrinths.
4. The tasks may be completed in any order unless a specific dependency is justified in mission data.
5. The player returns to the primary capital. The Bliss task is a synthesis or practice, not merely another collection objective or boss fight.
6. Completion changes dialogue and at least one visible or systemic world state at the capital and at each secondary capital.

The shared topology permits a clear journal and predictable implementation, while the paired cultural interpretations keep six arcs from becoming reskinned copies.

### The common crisis: the Concordance Grid

The world has reached magical electricity by combining empirical engineering with numerical mysticism. Road shrines are relay stations; settlements draw light, heat, motive power, and navigational guidance from them; and labyrinths contain maze generators that regulate routing, phase, and transformation across the network.

This is not electricity wearing a fantasy texture. Its stable operation has two irreducible aspects:

- **reason** establishes observable topology, capacity, sequence, quantity, continuity, and cause;
- **numerical mysticism** establishes resonance, symbolic correspondence, archetypal phase, and relationships not yet fully quantized.

The crisis is called **the Drift of Measure**. The grid has not simply switched off. It is still moving power, but local optimizations, broken shrine sequences, dormant maze generators, monopolized routes, and untested ritual assumptions have pushed communities out of balance. A technically correct local repair can harm the wider network; a resonant ritual without material verification can overload it.

The campaign asks the player to repair increasingly large circles:

1. balance one small settlement;
2. connect that settlement to its cultural capital;
3. balance the mixed local community at the capital;
4. reactivate the four regional layer circuits and their maze generators;
5. return to the capital and establish a larger social balance that lets local differences participate in one living current.

“Bliss” is therefore not private transcendence or a victory screen. It is the experienced condition in which truthful observation, kept commitments, reasoned uncertainty, and just institutions allow energy to circulate without erasing difference.

### Capital stories and principal characters

The following names and roles are new authored content attached to the fixed locations above. Each capital has a principal interpreter, a rational specialist, and a character who reveals the social or mystical cost of the prevailing solution. None is an infallible exposition device.

#### Human capital — Trawamprahshoaw, the Common Forum

**Capital problem:** Its Human, Boarman, and Greek Horde districts share one relay and one labyrinth generator. Each district's account of the fault is internally plausible, but each measures a different consequence. The civic council keeps averaging incompatible evidence until no one is responsible and the maze absorbs the unresolved phase.

**Capital story:** The player must establish a public record of what is fact, testimony, inference, and unresolved symbol; restore current to homes, exchange yards, and the labyrinth without flattening their different needs; and write a covenant whose promises can be tested later in the four Human major towns.

Principal characters:

- **Mara Commonvoice**, forum mediator and Human capital mission giver. She values coexistence but initially mistakes compromise for truth.
- **Oren Line-Surveyor**, grid cartographer. He supplies measurements and route proofs but discounts phenomena he cannot yet instrument.
- **Iris-at-the-Common-Door**, Greek Horde liaison from the town's labyrinth. They communicate through spatial demonstrations and expose what the council has projected into the maze.

#### Boarman capital — Awshowam, the Grand Exchange

**Capital problem:** The strongest commercial city has kept the grid functioning by turning shrine current into contracts and priority claims. The ledgers are consistent, yet essential users without purchasing power are going dark, while the Greek labyrinth district receives unstable surplus as dumped load.

**Capital story:** The player must reconcile price, promise, need, and circulation. The four regional contracts test physical supply, honest speech, rational accounting, and the public legitimacy of exchange. The final capital act converts exclusive claims into a renewable commons without abolishing trade.

Principal characters:

- **Garrum Open-Ledger**, First Factor and Boarman capital mission giver. He believes every obligation should be visible and transferable.
- **Bela Common-Measure**, mutual-aid broker. She reveals values that the official accounts treat as external costs.
- **Tusk Coilwright**, engineer of the exchange relay and maze load-balancer. He can prove where current travels but needs the player to determine where it ought to travel.

#### Antipion capital — Migbushoprahshotra, the Measured Oasis

**Capital problem:** Antipion practitioners made the most precise ritual calibration tables in the world. Their filters now reject every pulse that fails the accepted ratios, including genuine new signals produced by the Drift.

**Capital story:** Reactivation requires preserving exact measurement while reopening a disciplined place for the unknown. Regional tasks recover independent observations, symbolic series, and failed predictions. The capital synthesis adds an explicitly marked “unquantized remainder” to the grid rather than disguising uncertainty as either fact or superstition.

Principal characters:

- **Saima of Nine Measures**, senior shaman and Antipion capital mission giver. She treats rigor as spiritual hospitality rather than control.
- **Varo Null-Scribe**, keeper of calibration tables. He fears that admitting unknowns will make every claim equally valid.
- **Nemi Reed-Breath**, resonance listener. She detects a real pattern but must learn to submit symbolic interpretation to repeatable tests.

#### Yeti capital — Prahshoshosho, the White-Breath Hearth

**Capital problem:** The Yeti network once followed weather, migration, and communal breathing rhythms. Fixed schedules imported from southern grids draw energy at the wrong moments, leaving heat where no one camps and darkness where families arrive.

**Capital story:** The player follows tracks, wind, and shrine pulses to distinguish variable natural pattern from randomness. The capital must adopt enough shared measure to coordinate distant groups without severing direct attention to place.

Principal characters:

- **Aro Whitebreath**, hearth shaman and Yeti capital mission giver. He reads the grid as weather but resists any durable record.
- **Ketu Track-Reader**, empirical observer of migration and load. She demonstrates that wild knowledge can be exact without being bureaucratic.
- **Seli Ember-Bearer**, keeper of communal warmth. She represents the people who bear the cost when spiritual and technical authorities argue.

#### Kobold capital — Deep Ledger

**Capital problem:** Kobold crews discovered that cave seams conduct the Concordance current. Informal claims and rapid extraction powered surrounding settlements, but overlapping tunnels now short symbolic phases together and awaken generators in unsafe orders.

**Capital story:** The player must map real continuity, honor labor and risk, adjudicate overlapping claims, and reactivate underground generators without turning the caves into either an unregulated rush or a closed monopoly. The result is a shared claim system based on continued listening to the rock.

Principal characters:

- **Vek Copper-Ear**, crew foreman and Kobold capital mission giver. He trusts whatever survives contact with the mine.
- **Nix Sparkbroker**, trader in claims, tools, and stored current. She sees opportunity clearly but treats future harm as someone else's account.
- **Rul Deep-Listener**, tunnel diviner and structural listener. His warnings are symbolically phrased but correspond to physical stresses that can be measured.

#### Greek Horde capital — Awshoshotra, the Labyrinth of Many Voices

**Capital problem:** Outsiders attempted to stabilize this maze generator by imposing one optimized route. The maze still has walls and a mathematically valid solution, but it no longer transforms or balances anything; displaced impulses now spill into nearby settlements.

**Capital story:** The player must separate objective invariants—connectivity, conservation, repeatable switch effects—from the belief that only one meaningful path can exist. The generator returns when several valid paths can coexist without breaking the shared constraints.

Principal characters:

- **Iris-of-the-Turn**, an Eye-Bat chorus keeper and Greek Horde capital mission giver. Iris remembers routes as overlapping songs.
- **Ember-Tusk**, a Hell-Pig keeper of appetite and motive force. Ember makes hidden desire materially visible but tends to consume any unclaimed surplus.
- **Clasp-of-Seven**, a Scorpoholder boundary keeper. Clasp insists on exact constraints while rejecting the outsider assumption that constraint implies uniformity.

### Starting settlement vertical slice — Wammigmig

The first fully worked example is the closest settlement to the saved starting point.

| Fact | Frozen-world value |
|---|---|
| player start | `(800, 41, 907)` |
| town | **Wammigmig** (`town:populationBoarmanTribe#381`) |
| district | `populationBoarmanTribe#381`, legacy district name **Migtrabu** |
| center and distance from start | `(820, 900)`, approximately 21.2 world units |
| population | 30 Boarmen |
| nearest relay shrine | `shrine:shrine 19 22:782:903` at `(782, 40, 903)`, approximately 18.4 units from start |
| nearby cave foreshadowing | `cave:760:920:0` at `(786.5, 928.5)`, component size 406 |
| existing structures | paved storage yard, owner-linked hut, two raw-street sections, and two wooden houses |

The owner-linked hut `populationBoarmanTribe#381:structure:1` already belongs to saved `ownerMemberId: "544"`. Reuse that persistent identity for the primary local character.

New local characters:

- **Marn Even-Tally** (`ownerMemberId: "544"`), factor of Wammigmig and local mission giver. Marn can account for every stored unit but has allowed storage priority to become the definition of fairness.
- **Pella Sharekeeper**, a newly authored resident anchored to one wooden house. She tracks household and communal needs excluded from the storage ledger.
- **Orro Coil-Tender**, a newly authored itinerant technician anchored first to the nearby shrine. Orro explains operation through demonstration, not a tutorial monologue.

The opening mission is **A Fair Share of Light**:

1. **Awaken:** From the spawn, the nearest shrine is visibly dim. Interacting casts a harmless luminous pulse into it. The shrine answers, lights Wammigmig's direction, and reveals only the next relevant relay rather than the whole network.
2. **Observe:** In Wammigmig, Marn asks the player to restore the settlement. Interacting with the storage yard, hut, and houses reveals concrete demand and continuity indicators. These observations are facts; Marn's claim that storage must always come first is testimony and policy.
3. **Reason:** The player routes available current among three branches using visible integer capacity and demand. Interact cycles or advances the selected conductor; no inventory tool or separate puzzle UI is required.
4. **Attune:** Correct quantities remain unstable until the branches are pulsed in the resonance sequence demonstrated by the shrine. The pattern is observable and repeatable, but its symbolic meaning remains open.
5. **Choose and witness:** The stable configuration supplies storage, households, and the shared street relay. Dialogue records how the player prioritized values, and each character reacts to the visible outcome.
6. **Connect:** Marn gives the player a letter of account for Garrum Open-Ledger in Awshowam. The local shrine sends a pulse to the next shrine on the baked route toward the Boarman capital.
7. **Foreshadow:** The nearby cave answers with a delayed underground pulse, hinting that Kobold conduction and the wider Drift are involved. Entering it is optional at this stage.

At Awshowam, the player first balances the capital's own mixed Boarman, Human, and Greek Horde loads. Only then does Garrum commission the four secondary-capital tasks. Completing those tasks and returning to Awshowam turns the local lesson—fair circulation among storage, homes, and a shared relay—into the larger Boarman resolution of trade serving social circulation.

This vertical slice must exercise the complete production path: compiled narrative records, actor placement, dialogue, contextual interaction, shrine graph state, visible structure state, journal progress, streaming unload/reload, save persistence, route guidance, and capital handoff.

### Player verb and magical interaction grammar

The intended game has only two fundamental verbs:

- **move** through the world;
- **interact** with a selected or nearby semantic target.

There is no player combat system in this design. Do not add attack, damage, hostile targeting, weapon switching, combat resources, or combat-gated objectives. Legacy weapons may remain as recovered inventory evidence, but they are not usable combat verbs in this port phase.

Interact should feel like directing a small piece of magic rather than pressing a generic UI button:

1. Input selects the best valid target along the view ray or within a short assistance cone.
2. The player emits an **attention pulse**: a quick luminous glyph, spark, or arc traveling from the player to the target.
3. The target answers visually and audibly before any text panel appears.
4. The target's declarative interaction handler performs the contextual meaning: greet, inspect, activate, route, rotate, tune, collect, open, confirm, or traverse.
5. The same input advances dialogue or confirms a currently offered choice; movement cancels or leaves conversational focus.

The pulse never damages. Its fiction is attention made energetic: observation, intention, and participation entering the network. Range assistance must be generous enough that interacting with small runes or moving NPCs is comfortable, but the resolved target must always be highlighted before activation.

Puzzle complexity comes from target arrangement, state, sequence, timing, and world knowledge rather than additional controls. Supported operation families are:

| Operation family | Example | Dominant reading |
|---|---|---|
| inspect | pulse three conductors to reveal measured load | rational |
| set or cycle | advance a switch through visible integer states | rational |
| connect | energize a continuous route without exceeding capacity | rational |
| sequence | repeat a shrine's pulse order | mystical, but observable |
| resonate | activate spatially corresponding symbols | mystical |
| synchronize | combine exact settings with a resonance window | balanced |
| converse | direct attention to an NPC and choose/confirm commitments | Speech/Wisdom |
| traverse | activate a door, stair, cave, or maze threshold | Body |

“Magical” must not mean arbitrary guessing. A mystical operation has perceivable cues, consistent rules, and recoverable feedback even when characters interpret its meaning differently. Rational operations likewise must not be presented as morally sufficient merely because their arithmetic is correct.

### Shrine routing and maze-generator reactivation

Compile the shrines into a static graph. Every shrine record needs stable neighbor IDs, route costs, world positions, and the cultural/settlement routes it can serve. The runtime stores only activation and current-route deltas.

When a route is active:

1. the current shrine lights its next one or two reachable relays;
2. the world-space pulse points along the correct outgoing road segment;
3. the map reveals only the activated portion and known destination;
4. interacting with the next shrine persists activation and advances the light frontier;
5. unloading either chunk does not lose state; reloading derives visuals from saved shrine IDs;
6. reaching a junction may expose a choice, but the journal can reassert the mission route without teleporting or drawing the whole path permanently.

Maze generators are persistent interactable assemblies associated with labyrinth districts or major cave components. Each has:

- a physical generator anchor and visible inactive/unstable/active states;
- a rational operation set involving topology, continuity, quantities, or causal switches;
- a mystical operation set involving resonance, order, correspondence, or archetypal phase;
- a validation rule proving that the final state is reachable using movement and Interact alone;
- a local power effect and a graph-level effect on one or more shrine routes;
- an owning settlement and characters who explain competing interpretations of the fault.

Some generators may be repaired rationally, some through resonance, and some only by satisfying both. Mission data must label the required operation family; the runtime executes generic interaction primitives and never embeds culture-specific puzzle logic in scene code.

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

### Compiled data required by the theme layer

Add or extend immutable catalogs with records equivalent to:

```json
{
  "cultureId": "antipion",
  "legacyEntityTypes": ["AnatipionCatchers"],
  "pairId": "shamanic",
  "expression": "practiced",
  "displayName": "Antipions",
  "capitalTownId": "town:...",
  "secondaryCapitalTownIds": ["town:...", "town:...", "town:...", "town:..."],
  "layerOrder": ["body", "speech", "mind", "wisdom", "bliss"]
}
```

Each compiled settlement record must include:

```json
{
  "townId": "town:...",
  "settlementTier": "capital | secondary-capital | minor",
  "cultureIds": ["human", "boarman"],
  "dominantCultureId": "human",
  "parentCapitalTownId": "town:...",
  "parentSecondaryCapitalTownId": "town:...",
  "roadReachable": true,
  "capitalRankEvidence": {
    "culturalDistricts": 2,
    "culturalInhabitants": 66,
    "roadDegree": 0,
    "totalDistricts": 4
  }
}
```

The exact filenames may follow the catalog layout defined later in this document, but these semantics are required. Runtime scenes reference the IDs; they do not embed or independently infer cultural hierarchy.

### Acceptance criteria for thematic expression

- All six cultures have one primary capital, four reachable secondary capitals, and assigned minor settlements in compiled data.
- Capital assignments are deterministic, validated, and accompanied by ranking evidence.
- Kobold settlements are baked and stream through the same scene/chunk contracts as other settlements.
- Each cultural arc contains four regional layer tasks and one capital synthesis task.
- Every required objective resolves to a valid streamed anchor and can be completed without loading the whole world.
- At least one mission in each paired domain exposes a genuine disagreement between its practiced and wild expressions without declaring either culture categorically right.
- The two largest mixed towns receive cross-cultural actors and outcomes rather than being flattened to a single culture.
- Journal and dialogue copy identify whether information is fact, testimony, inference, symbol, or unresolved mystery where that distinction matters.
- The final capital interaction produces persistent dialogue/state changes across all four secondary capitals.

## 0. Purpose and implementation position

This document is the implementation handoff for the next layer over the completed `web-baked-v1` world build. It covers:

- expressing Spiritual Objectivism and the Body/Speech/Mind/Wisdom/Bliss progression through play;
- compiling cultural identity, primary capitals, secondary capitals, minor settlements, and their mission routes;
- extracting the interaction-relevant object and character instances that actually exist in the legacy save;
- adding those instances to the existing `lewcid_object` chunk scenes without creating a second world representation;
- real container contents and inventory transfer;
- activatable shrines;
- deterministic, solvable puzzles;
- mission definitions, objectives, rewards, journal state, and map markers;
- persistent characters who explain, give, and complete missions tied to nearby goals;
- mission and puzzle integration with all 25 generated labyrinths;
- bounded static-host streaming and local save deltas;
- agent work packages, merge gates, and acceptance tests.

The existing terrain, towns, buildings, labyrinths, caves, collision, portals, assets, and 25-slot streaming system remain authoritative. Interactions add stable semantic references and runtime state to that system; they do not regenerate or fork it.

The legacy source does **not** contain a finished quest system to port verbatim. The correct strategy is:

1. preserve and export every usable legacy fact;
2. make absence explicit rather than inventing recovered data;
3. build a deterministic, declarative mission layer around the frozen world;
4. keep all new placements reproducible and validated against navigation, ownership, and scene data.

## 1. Evidence from the current repository and save

Repository baseline inspected: commit `712f957`, “Static procedural towns, building interiors, streets, shrines, 25 labyrinths, caves, collision.”

### 1.1 What is already implemented in the web port

The current build contains:

| Existing system | Current evidence |
|---|---:|
| world size | 1,600 × 1,600 |
| streamed chunks | 2,500 |
| region composition scenes | 100 |
| active surface slots | 25 |
| saved districts | 208 |
| towns | 196 |
| generated structures | 1,166 |
| labyrinth districts | 25 |
| compiled unique shrines | 173 |
| cave entrances | 489 |
| door portals | 553 |
| stair portals | 144 |
| generated chests | 925 |
| decorative crates | 63 |
| decorative barrels | 63 |
| decorative baskets | 63 |

The current `GameState.interact()` supports:

- stairs and cave portals;
- searching a chest once;
- persisting searched chest IDs and discovered portal IDs;
- changing a chest's instance color after it has been searched.

It does not yet transfer loot, evaluate objectives, activate shrines, run puzzles, speak to actors, or update a mission journal.

### 1.2 Legacy mission and story findings

The original scenario is intentionally open-ended:

- `scenario/jclassicrpg/events.xml` contains one `intro` event.
- The event plays two non-interactive story blocks from `story/intro.xml`.
- `ScenarioState` is only a generic `HashMap<String,Object>`.
- The save's scenario-state map contains only `intPlyd = true`.
- `org.jcrpg.world.ai.abs.Goal` is an empty class.
- No concrete `Mission`, `Quest`, `Objective`, or puzzle-state classes were found.
- No authored dialogue trees or mission chains were found.
- The web map already recognizes `mission` and `puzzle` marker kinds, but the frozen save supplies no such records.

Therefore there are no hidden legacy objective records waiting to be rendered. Missions and puzzles in this phase are a compatible extension, not recovered original campaign data.

### 1.3 Legacy object-instance findings

The saved XStream graph contains four non-reference `ObjInstance` elements, all in saved party inventory:

| Object type | Icon | Saved uses |
|---|---|---:|
| `MinorHealingPotion` | `potion/minorheal.png` | 0 |
| `LongSword` | `weapon/longsword.png` | 0 |
| `BattleAxe` | `weapon/battleaxe.png` | 0 |
| `LeatherArmor` | `armor/torso_leather.png` | 0 |

Important details:

- the saved `numericId` is `0` for all four and is not suitable as a web stable ID;
- `ObjInstance` tracks description, total uses, attachments, and timed bonus uses;
- `EntityObjInventory` supports add, remove, equip, unequip, grouping, and transfer;
- the current web `PartyMemberState` does not yet model inventory;
- `EntityCommonWealth.getObjectsOfStorage()` constructs a healing potion, throwing knife, and crude arrow on demand, but this is placeholder logic and is not serialized per chest;
- the legacy chest handler associates storage with the owning entity's common wealth, handles lock/trap inspection, then transfers selected objects to a party member.

The 925 current maze chests are deterministic web-generated instances with excellent stable IDs, but their contents are not legacy-saved contents. Loot must be deterministically baked into the new interaction catalog.

### 1.4 Legacy character-instance findings

The save contains 319 non-reference `PersistentMemberInstance` elements:

- one is the player character ELMARA;
- 318 are non-player persistent members;
- all 318 NPC descriptions serialize as generic `StrongAnimalMale` instances;
- none of those 318 NPCs has an authored personal name in the save;
- every NPC owns one infrastructure object;
- the NPC entity groups are:

| Entity group | Persistent NPCs | Owned residence type |
|---|---:|---|
| `GreekMazeHorde` | 88 | `SimpleDungeonPart` |
| `HumanCommoners` | 86 | `House` |
| `BoarmanTribe` | 64 | `Hut` |
| `KoboldHorde` | 30 | `WoodenHouse` |
| `AnatipionCatchers` | 26 | `BrickHouse` |
| `YetiHunters` | 24 | `Igloo` |

The frozen district export currently includes 208 fixed-infrastructure owner records. The compiled structure catalog currently carries `ownerMemberId` on 151 materialized structures. Fifty-seven fixed owner links are not represented on a compiled structure, including all 25 labyrinth owners. This is an export/compiler linkage gap to repair before allocating quest givers.

NPC names, occupations, dialogue, and mission assignments must be deterministic additions. They must never be described as recovered authored content.

### 1.5 Shrine and puzzle findings

`RoadShrine` provides a model and physical structure but no shrine-specific trigger handler or saved activation state. The intro describes shrines as safe resting places, which is useful thematic evidence, but activation, blessing, and mission behavior are new web mechanics.

No puzzle definitions or puzzle states were found. The maze engine provides deterministic connected maze topology and a solver. That topology is the right substrate for new validated labyrinth puzzles.

## 2. Core architecture

The system has four data layers:

| Layer | Mutability | Examples |
|---|---|---|
| frozen legacy evidence | build-time immutable | actors, party object instances, scenario story/state, ownership |
| compiled interaction content | deployed immutable JSON | missions, dialogues, containers, puzzles, item definitions, actor assignments |
| chunk-local scene anchors | streamed immutable JSON | actor positions, shrine/chest/puzzle interaction points, visual sources |
| player deltas | locally mutable | inventory, mission progress, opened containers, activated shrines, puzzle state |

The build pipeline is:

```text
savegame.zip + scenario XML + Java source
                 |
                 v
      export_frozen_world.py
  actors + objects + story evidence
                 |
                 v
       compile_world.mjs
 world geometry + interaction allocation
                 |
       +---------+----------+
       |                    |
       v                    v
chunk lewcid scenes    interaction catalogs
local anchors/meshes   missions/actors/items/etc.
       |                    |
       +---------+----------+
                 v
       browser interaction runtime
                 |
                 v
             save v2 deltas
```

No runtime procedural mission generator is required. The static host serves immutable JSON and shared assets; runtime only loads definitions, evaluates state, and persists deltas.

## 3. Terminology and invariants

Use these terms consistently:

- **actor**: a persistent character that may be visible and interactive;
- **attention pulse**: the harmless magical-electric visual emitted whenever the player invokes Interact;
- **Concordance Grid**: the shrine, road, settlement, cave, and maze-generator network that distributes magical electricity;
- **maze generator**: a persistent rational/mystical control assembly that regulates a labyrinth and part of the Concordance Grid;
- **primary capital**: the cultural hub where four regional layer tasks are framed and their Bliss synthesis is completed;
- **secondary capital**: one of four major regional towns responsible for a Body, Speech, Mind, or Wisdom task;
- **minor settlement**: a settlement assigned to a secondary capital and used for local goals, evidence, and consequences;
- **interaction anchor**: a chunk-local position/range/prompt tied to an actor, object, shrine, puzzle component, or portal;
- **object type**: immutable item definition, such as `MinorHealingPotion`;
- **object instance**: a stable individual inventory or container item;
- **container**: a chest or other storage object with concrete baked contents;
- **goal**: a world target that an objective refers to;
- **objective**: a measurable condition within a mission;
- **mission**: a stateful set of prerequisites, objectives, completion rules, and rewards;
- **dialogue**: declarative actor text and choices, optionally gated by state;
- **puzzle**: a bounded finite-state machine driven by world interaction components;
- **transaction**: one atomic interaction that validates and commits all effects together.

Hard invariants:

1. Every persistent entity, actor, object, container, shrine, puzzle, component, mission, objective, dialogue node, and goal has a globally unique stable ID.
2. Scene JSON contains placements and references, not duplicated mission definitions.
3. Gameplay catalogs contain data only—never executable JavaScript, constructors, callbacks, or expressions evaluated with `eval`.
4. Every reference is validated during the offline build.
5. Every generated mission and puzzle is solvable from its required starting state.
6. Every mission-critical item is reachable before it is required.
7. Interactions are idempotent: retrying after a reload cannot duplicate rewards or progress.
8. Chunk eviction never discards player state.
9. Editing or previewing a scene in `three_js_editor_small` does not require the mission runtime.
10. New authored/generated content is labeled separately from legacy-derived facts in compiler reports.
11. The player-facing verb set is movement plus one contextual Interact action; mission completion never requires combat or a hidden auxiliary verb.
12. An attention pulse cannot damage an actor or object, and aggressive legacy flags cannot convert it into an attack.

## 4. Export the actual legacy interaction evidence

Extend `scripts/export_frozen_world.py`; do not create an unrelated parser for the same XStream graph.

### 4.1 Scenario export

Add:

```json
{
  "scenario": {
    "id": "jclassicrpg",
    "name": "JClassicRPG",
    "version": "0.1",
    "state": { "intPlyd": true },
    "events": [
      {
        "id": "intro",
        "type": "intro",
        "elements": [
          { "type": "story", "source": "scenario/jclassicrpg/story/intro.xml" }
        ]
      }
    ],
    "missionEvidence": "absent",
    "puzzleEvidence": "absent"
  }
}
```

Preserve event and story source paths. Export story blocks to a story catalog if the web UI will replay them. Do not reinterpret the intro as a quest.

### 4.2 Actor export

Export every non-reference `PersistentMemberInstance` with:

```json
{
  "legacyActorId": "legacy-actor:HumanCommoners#2:6",
  "numericId": "6",
  "entityId": "HumanCommoners#2",
  "entityType": "HumanCommoners",
  "memberDescriptionType": "StrongAnimalMale",
  "legacyName": null,
  "position": [21, 48, 261],
  "ownedInfrastructure": [
    {
      "type": "House",
      "legacyDistrictId": "populationHumanCommoners#2"
    }
  ],
  "sourceKind": "legacy-save"
}
```

Stable actor ID derivation must include the entity ID and member numeric ID. A numeric ID alone is insufficient.

Export:

- resolved entity description class;
- resolved member description class;
- saved roaming-boundary position;
- owned infrastructure references;
- population/district references where available;
- behavior classes and relation defaults if they can be resolved reliably;
- model/audio hints from the entity description source catalog;
- whether the record is the player or an NPC.

Fail the export on duplicate stable actor IDs or unresolved required ownership references.

### 4.3 Object-instance export

Export actual object instances by inventory owner and list position:

```json
{
  "id": "party:ELMARA:inventory:000:MinorHealingPotion",
  "typeId": "MinorHealingPotion",
  "legacyNumericId": 0,
  "uses": 0,
  "attached": false,
  "ownerActorId": "party:ELMARA",
  "equipped": false,
  "sourceKind": "legacy-save"
}
```

Because the legacy numeric IDs are all zero in this save, stable web IDs must be derived from owner, inventory slot, and type. Preserve the legacy value only as evidence.

Export attachment dependencies and timed bonus-use data when present. Do not synthesize chest contents in the Python evidence exporter.

### 4.4 Ownership reconciliation report

The build must report:

- all 318 NPC actor records;
- the 208 actors referenced by exported districts;
- actor-to-owned-infrastructure matches;
- compiled structures with `ownerMemberId`;
- owners whose infrastructure was not materialized;
- fallback actor anchors used for those owners.

Do not silently drop the 57 currently unmatched fixed-owner links. For labyrinth districts, explicitly attach the district's fixed actor to the compiled `SimpleDungeonPart` structure even though the current big-block layout did not propagate `ownerMemberId`.

## 5. Static file layout

Add interaction catalogs to the existing versioned world directory:

```text
jCRPG-engine/worlds/seed0/v2/
  manifest.json
  actors.json
  structures.json
  portals.json
  interactions/
    manifest.json
    cultures.json
    settlements.json
    shrine-graph.json
    maze-generators.json
    actor-assignments.json
    dialogues.json
    missions.json
    goals.json
    puzzles.json
    containers.json
    item-types.json
    initial-inventory.json
    strings.en.json
  assets/
    actors/
    interactions/
  chunks/
    x000_z000.scene.json
    ...
```

Use a new world/interaction format version. Do not modify the meaning of `web-baked-v1` files in place while retaining the old version identifiers.

Catalog rules:

- `manifest.json` lists hashes and byte lengths for every catalog;
- catalog arrays are sorted by stable ID;
- object keys have deterministic order through `canonicalJSON`;
- chunk scene hashes are computed only after interaction anchors and actor/puzzle visual nodes are inserted;
- all URLs remain static-host relative URLs;
- interaction definitions use IDs, not `source`, because `FolderUtils.js` treats `.json` `source` values as visual scene prefabs;
- only visual prefab/mesh references use scene-node `source`.

## 6. Scene integration contract

### 6.1 Chunk root data

Extend `userData.jcrpg` with an inspectable `interactions` array:

```json
{
  "interactions": [
    {
      "id": "interaction:shrine:shrine-1-2",
      "kind": "shrine",
      "targetId": "shrine:shrine 1 2:63:103",
      "position": [65, 40, 105],
      "realm": "surface",
      "range": 2.2,
      "priority": 40,
      "prompt": "Activate shrine"
    }
  ]
}
```

Allowed anchor fields:

| Field | Meaning |
|---|---|
| `id` | stable interaction anchor ID |
| `kind` | `actor`, `container`, `shrine`, `puzzle`, `portal`, or later extension |
| `targetId` | catalog entity operated on |
| `position` | world position |
| `realm` | `surface`, `cave`, or a structure-local realm |
| `range` | interaction radius |
| `priority` | deterministic overlap resolution |
| `prompt` | default localized-string key or temporary English text |
| `facing` | optional preferred facing vector |
| `requiresLineOfSight` | optional boolean |

### 6.2 Visual-node references

Add IDs to the existing visual node rather than emitting a duplicate model:

```json
{
  "name": "road_shrine_63_103",
  "position": [65, 40, 105],
  "source": "../assets/shrine.obj",
  "userData": {
    "jcrpg": {
      "structureId": "shrine:shrine 1 2:63:103",
      "interactionId": "interaction:shrine:shrine-1-2",
      "stateTargetId": "shrine:shrine 1 2:63:103",
      "realm": "surface"
    }
  }
}
```

Existing chest nodes already carry `objectId`; add `interactionId` and `containerId` without changing the stable chest ID.

Actor and puzzle visuals are ordinary editor-compatible nodes:

```json
{
  "name": "actor_humancommoners_2_6",
  "position": [24.5, 40, 264.5],
  "rotation_degrees": [0, 180, 0],
  "source": "../assets/actors/human-commoner.json",
  "userData": {
    "jcrpg": {
      "actorId": "legacy-actor:HumanCommoners#2:6",
      "interactionId": "interaction:actor:HumanCommoners#2:6",
      "realm": "surface"
    }
  }
}
```

These scenes must continue to open directly in `three_js_editor_small`.

### 6.3 Scene schema changes

Update `jCRPG-engine/js/world/scene.schema.json` and the hand-written runtime validator together. Validate:

- unique interaction IDs within a chunk;
- finite coordinates and range;
- known interaction kind;
- target existence in the appropriate catalog;
- actor/node ID consistency;
- visual asset sources confined to the world pack;
- no mission definitions embedded in chunks;
- no interaction anchor outside the chunk unless it is an explicitly owned seam fragment.

## 7. General interaction runtime

Replace the chest-specific branch in `BakedWorldStream.nearby()` with a general local interaction index.

Recommended modules:

```text
jCRPG-engine/js/interactions/
  format.js
  registry.js
  nearby.js
  transaction.js
  predicates.js
  actions.js
  inventory.js
  containers.js
  shrines.js
  puzzles.js
  missions.js
  dialogues.js
```

### 7.1 Loading

At startup:

1. load the interaction manifest;
2. load item types and the lightweight mission/actor/goal indexes;
3. load full definitions eagerly if the compressed total is small;
4. otherwise load full dialogue and inactive mission bodies on demand;
5. normalize chunk interaction anchors when each chunk scene is normalized;
6. retain anchors only for active slots and normalized LRU chunks.

Active mission definitions and inventory item types are pinned independently of chunk eviction.

### 7.2 Nearby selection

For each current chunk, index anchors into small local cells. Selection order is:

1. filter by realm and distance;
2. filter by predicate eligibility;
3. optionally filter by line of sight;
4. rank by explicit priority;
5. rank by facing alignment;
6. rank by distance;
7. break ties by stable interaction ID.

Default priority order:

| Interaction | Priority |
|---|---:|
| mission turn-in actor | 100 |
| required puzzle component | 90 |
| mission-giver actor | 80 |
| ordinary actor | 70 |
| container | 60 |
| shrine | 50 |
| portal | 40 |

The UI shows one primary prompt and may expose secondary choices through a small interaction list. Invoking the configured Interact action always operates on the highlighted target and emits an attention pulse before resolving the target's contextual handler. Keyboard builds may bind this to `E`, but content and runtime logic must refer to the semantic action rather than a particular key.

### 7.3 Transaction model

Every interaction follows:

```text
resolve target
  -> evaluate prerequisites against one state snapshot
  -> create proposed mutations/messages/events
  -> validate capacity, references, and one-shot rules
  -> commit one save transaction
  -> emit mission events
  -> refresh visuals, journal, map, and prompt
```

If any mutation fails, commit none of them. Assign each committed interaction a monotonically increasing local transaction number so duplicate UI/input delivery can be ignored.

## 8. Safe declarative predicates and actions

Use a small JSON predicate AST.

Supported predicates should initially be limited to:

- `all`, `any`, `not`;
- flag equals/exists;
- mission state;
- objective state/count;
- inventory has item type/count;
- container state;
- shrine activated;
- puzzle state/completed;
- actor dialogue flag;
- location discovered;
- player realm/location;
- comparison of bounded numeric counters.

Supported actions should initially be limited to:

- set/clear flag;
- increment bounded counter;
- grant/remove item instance;
- change container state;
- activate shrine;
- apply puzzle transition;
- accept, advance, complete, or fail mission;
- mark objective source ID;
- reveal/hide map marker;
- set actor dialogue flag;
- show localized text;
- queue a visual/audio cue.

Reject unknown operators. Limit AST depth, list length, string length, and numeric range. Never evaluate script strings from content JSON.

## 9. Items, inventories, and containers

### 9.1 Item types

Create `item-types.json` from legacy object classes actually referenced by the saved party, baked loot, and mission rewards.

```json
{
  "id": "MinorHealingPotion",
  "name": "Minor Healing Potion",
  "icon": "potion/minorheal.png",
  "stackable": false,
  "maxUses": 1,
  "tags": ["potion", "healing"],
  "legacyClass": "org.jcrpg.world.object.magical.potion.MinorHealingPotion"
}
```

Do not attempt to port the full combat effect system as a prerequisite for loot. Items can exist in inventory before every use effect is implemented; unimplemented uses must be labeled and disabled.

### 9.2 Inventory scope

For the first interaction vertical slice, use a party-wide inventory while preserving optional `ownerActorId` on imported objects. This avoids blocking missions on per-character equipment UI. Later migration can distribute instances to individual party members without changing item IDs.

Inventory operations must be pure and testable:

- `has(typeId, count)`;
- `grant(instance)`;
- `remove(instanceId)`;
- `consume(typeId, count)`;
- `transfer(containerId, instanceIds)`;
- `listByTag(tag)`.

### 9.3 Concrete baked chest contents

Create one `ContainerDefinition` per generated chest:

```json
{
  "id": "populationGreekMazeHorde#22:structure:0:chest:220",
  "kind": "chest",
  "position": [24.5, 39, 854.5],
  "ownerStructureId": "populationGreekMazeHorde#22:structure:0",
  "lock": null,
  "trap": null,
  "items": [
    {
      "id": "item:populationGreekMazeHorde#22:structure:0:chest:220:000",
      "typeId": "MinorHealingPotion",
      "quantity": 1
    }
  ],
  "missionBindings": []
}
```

Bake concrete item instances offline. Do not roll loot when the chest opens; that would make saves and compiler changes difficult to reconcile.

Loot allocation rules:

- seed from stable container ID and interaction-content version;
- reserve mission-critical items before filling ordinary loot;
- never place a required item in a container gated by that same item;
- cap items per chest and total world items;
- validate item type references and unique item instance IDs;
- permit empty chests only when deliberately marked;
- treat crates, barrels, and baskets as decoration in the first slice unless explicit container definitions are emitted.

### 9.4 Container state

Use explicit states:

```text
unseen -> inspected -> unlocked -> opened -> looted
                      \-> forced
```

Lock/trap gameplay is a later subphase but the schema should reserve:

- lock type and level;
- trap type and level;
- identified/disarmed/forced flags;
- deterministic resolution seed;
- failure consequences.

The first release may set all locks/traps to `null`. Do not reproduce the legacy method's unconditional random trap placeholder as authoritative content.

### 9.5 Container UI

Opening a chest should show:

- container name and state;
- item list with icons and quantities;
- Take and Take All actions;
- mission-item badge;
- close action;
- clear feedback when inventory transfer succeeds.

Taking items and advancing linked objectives occur in the same transaction.

## 10. Activatable shrines

All 173 compiled shrine structures receive:

- a stable interaction anchor at their accessible side/center;
- an `interactionId` on the visual node;
- a `ShrineDefinition` catalog entry;
- persistent activation state;
- a map marker that changes appearance after activation.

### 10.1 Shrine states

```text
dormant -> activated
```

Activation is one-time and idempotent. A later repeatable `rest` action may be offered at an activated shrine, but it is separate from activation.

Minimum activation effects:

- set `activatedShrines[shrineId]`;
- mark the shrine discovered;
- emit `shrine.activated` with the stable shrine ID;
- update mission objectives;
- change instance color or add a small glow/halo visual;
- show a short confirmation message.

Optional later effects:

- save/checkpoint affordance;
- restore party resources when those systems exist;
- safe-rest time advancement;
- fast-travel node after activation.

Do not make restoration or travel prerequisites for the initial mission implementation.

### 10.2 Shrine placement validation

For each shrine:

- find an accessible floor cell adjacent to the model;
- ensure the interaction anchor is reachable from surrounding surface navigation;
- ensure no building wall encloses it;
- ensure the prompt does not overlap a portal at equal or higher priority;
- validate its map marker and chunk ownership;
- validate exactly one `ShrineDefinition` and one activation target per stable shrine ID.

## 11. Puzzle system

Puzzles are declarative finite-state machines, not arbitrary scripts.

### 11.1 Puzzle definition

```json
{
  "id": "puzzle:maze:populationGreekMazeHorde#22:runes",
  "kind": "ordered-sequence",
  "structureId": "populationGreekMazeHorde#22:structure:0",
  "initialState": "start",
  "resettable": true,
  "components": [
    { "id": "rune-a", "kind": "rune", "position": [12.5, 39, 842.5] },
    { "id": "rune-b", "kind": "rune", "position": [20.5, 39, 847.5] },
    { "id": "rune-c", "kind": "rune", "position": [27.5, 39, 851.5] }
  ],
  "transitions": [
    { "from": "start", "input": "rune-a", "to": "a" },
    { "from": "a", "input": "rune-b", "to": "ab" },
    { "from": "ab", "input": "rune-c", "to": "complete" }
  ],
  "wrongInput": "reset",
  "completeState": "complete",
  "onComplete": [
    { "op": "emit", "event": "puzzle.completed" }
  ]
}
```

### 11.2 Initial puzzle families

Start with three bounded families:

1. **ordered runes** — activate components in a deterministic sequence;
2. **paired switches** — set a small combination of binary controls;
3. **route circuit** — visit or activate nodes along a maze-derived route.

Each family must support reset and must have a small, enumerable state space.

Avoid physics puzzles, timing-critical sequences, movable rigid bodies, and real-time multiplayer synchronization in the first phase.

### 11.3 Puzzle visual components

Emit individual reusable meshes/prefabs:

- rune stone;
- lever or switch;
- pressure plate;
- indicator light;
- puzzle gate or seal;
- reset pedestal.

Each component scene node carries `puzzleId`, `componentId`, `interactionId`, and `stateTargetId`. Visual state changes use instance colors, transforms, or a small set of alternate assets. Collision changes must be applied atomically with puzzle state.

### 11.4 Solving and validation

The offline validator performs BFS over:

```text
(player navigation cell, puzzle state, relevant gate states, held mission keys)
```

It must prove:

- a completion state is reachable;
- reset is reachable from every non-complete state or wrong input resets automatically;
- no required component is behind the gate it unlocks;
- the player cannot become trapped by a gate transition;
- required mission items remain reachable;
- reload from every persisted state produces the same available transitions;
- completion effects are idempotent.

Fail the build on an unsolved or soft-locking puzzle.

## 12. Missions, goals, and objectives

### 12.1 Mission state machine

```text
locked -> available -> active -> ready-to-turn-in -> completed
                              \-> failed
```

Do not infer mission state solely from dialogue. The mission engine owns it; dialogue only queries and requests transitions.

### 12.2 Mission definition

```json
{
  "id": "mission:humancommoners-2:road-shrines",
  "title": "Lights Along the Road",
  "summary": "Activate the nearby road shrines and return to the wayfinder.",
  "giverActorId": "legacy-actor:HumanCommoners#2:6",
  "turnInActorId": "legacy-actor:HumanCommoners#2:6",
  "prerequisites": { "all": [] },
  "objectives": [
    {
      "id": "activate-nearby-shrines",
      "kind": "activateTargets",
      "targetKind": "shrine",
      "targetIds": [
        "shrine:shrine 4 6:183:263",
        "shrine:shrine 5 6:223:263"
      ],
      "required": 2
    }
  ],
  "rewards": [
    { "op": "grantItemType", "typeId": "MinorHealingPotion", "quantity": 1 }
  ],
  "mapPolicy": "active-objectives-only",
  "sourceKind": "web-authored-generated"
}
```

### 12.3 Initial objective types

Implement these types first:

| Objective type | Completion source |
|---|---|
| `talkToActor` | actor dialogue transaction |
| `visitLocation` | realm/position entry event |
| `discoverPortal` | portal discovery/use event |
| `activateTargets` | shrine or other activatable IDs |
| `searchContainers` | unique container IDs inspected/opened |
| `takeItem` | item instance transferred to party inventory |
| `collectItemType` | inventory type/count predicate |
| `completePuzzle` | stable puzzle completion event |
| `reachMazeGoal` | validated maze goal cell entered |
| `returnToActor` | actor interaction while earlier objectives complete |

Prefer tracking sets of unique source IDs over incrementing anonymous counters. This prevents double counting after reloads or repeated events.

### 12.4 Goal catalog

`goals.json` provides reusable world targets:

```json
{
  "id": "goal:maze:populationGreekMazeHorde#22:deep-chest",
  "kind": "container",
  "targetId": "populationGreekMazeHorde#22:structure:0:chest:220",
  "position": [24.5, 39, 854.5],
  "realm": "surface",
  "structureId": "populationGreekMazeHorde#22:structure:0",
  "discoverable": true
}
```

Goals may reference actors, containers, shrines, puzzles, portals, or pure location anchors. They do not contain mission progress.

### 12.5 Event-driven progress

The mission engine consumes typed events after successful transactions:

```text
actor.talked
container.inspected
container.opened
item.taken
shrine.activated
puzzle.componentActivated
puzzle.completed
portal.discovered
portal.used
location.entered
mission.accepted
mission.turnedIn
```

Every event includes transaction ID, stable source ID, world/interaction content version, and relevant target IDs. Reprocessing the same transaction ID is a no-op.

### 12.6 Mission graph validation

Compile missions into a dependency graph and validate:

- no prerequisite cycles;
- no mission requires its own reward;
- all giver and turn-in actors exist and are reachable;
- all target IDs exist;
- all objective kinds are supported;
- every required target is reachable in the necessary state;
- every mission-critical item has exactly one intended source unless duplication is explicit;
- failure conditions cannot trigger before acceptance unless designed as world state;
- all strings and map markers resolve.

## 13. Actors, dialogue, and mission-giver allocation

### 13.1 Actor identity versus presentation

Preserve legacy identity fields, then add presentation fields:

```json
{
  "id": "legacy-actor:HumanCommoners#2:6",
  "legacy": {
    "numericId": "6",
    "entityId": "HumanCommoners#2",
    "entityType": "HumanCommoners",
    "memberDescriptionType": "StrongAnimalMale"
  },
  "presentation": {
    "displayName": "Wayfinder 6",
    "role": "wayfinder",
    "nameSource": "web-deterministic",
    "visualPrefab": "actors/human-commoner.json"
  },
  "homeStructureId": "populationHumanCommoners#2:structure:1",
  "anchor": [24.5, 40, 264.5],
  "missionIds": ["mission:humancommoners-2:road-shrines"],
  "dialogueId": "dialogue:HumanCommoners#2:6"
}
```

Never put a generated display name into `legacyName`.

For the first release, role labels are safer than elaborate invented personal lore. Examples: Wayfinder, Shrine Keeper, Delver, Maze Keeper, Cave Scout, Artisan, Hunter.

### 13.2 Actor anchor selection

For each fixed actor:

1. match its legacy owner ID to a compiled structure;
2. prefer an accessible exterior point beside the structure's door;
3. for interior-only roles, use a validated interior floor near the entrance;
4. for a labyrinth owner, use the entrance landing or a safe first-room cell;
5. if the owned structure was not materialized, anchor at the owning district's nearest safe street/floor cell;
6. never place an actor in blocked collision, on stairs, inside a wall, or directly over another interaction;
7. orient the actor toward the nearest path or entrance.

The compiler records whether the anchor is `owned-structure`, `district-fallback`, or `generated-guide`.

### 13.3 Visual assets

Immediately reusable static OBJ assets exist for:

- human male/female;
- anatipion;
- yeti;
- several Greek-maze creature types.

Boarman and kobold primary models are MD5 meshes. Convert them offline to GLB, or use a clearly labeled temporary static proxy. Do not add an MD5 parser to the browser merely to start the mission layer.

Actor visuals should initially be static or use a minimal idle animation. Conversation functionality must not depend on skeletal-animation completion.

### 13.4 Dialogue format

```json
{
  "id": "dialogue:HumanCommoners#2:6",
  "start": "greeting",
  "nodes": {
    "greeting": {
      "text": "The road shrines nearby have gone dark.",
      "choices": [
        {
          "text": "I will tend them.",
          "when": { "missionState": ["mission:humancommoners-2:road-shrines", "available"] },
          "actions": [
            { "op": "acceptMission", "missionId": "mission:humancommoners-2:road-shrines" }
          ],
          "next": "accepted"
        },
        { "text": "Not now.", "next": "end" }
      ]
    },
    "accepted": { "text": "You will find both shrines along this road.", "next": "end" },
    "end": { "end": true }
  }
}
```

Dialogue must support:

- mission-available greeting;
- active progress hint;
- ready-to-turn-in response;
- completion response;
- ordinary repeat greeting;
- concise direction/distance hint for assigned nearby goals.

No branching dialogue scripting language is needed beyond predicates, choices, actions, and next-node IDs.

### 13.5 Allocating actors to nearby goals

Run allocation offline after structures, portals, containers, shrines, puzzles, and actor anchors exist.

Candidate goals:

- unassigned nearby shrines;
- labyrinth entrances, puzzles, and selected chests;
- cave entrances;
- local discovery points;
- mission-item containers.

Candidate actors:

- fixed district owners first;
- same-town or same-district actors before distant actors;
- actors on safe accessible cells;
- roles compatible with the goal family;
- actors below their configured mission/hint capacity.

Use wrap-aware distance and, where practical, navigation/portal distance rather than raw Euclidean distance.

Recommended constraints:

- ordinary “nearby” goal radius: 192 world units, six chunks;
- hard assignment radius: 320 units;
- maximum primary missions per actor: 2;
- maximum simultaneously advertised goals per actor: 3;
- every generated mission has exactly one giver and one turn-in actor;
- every selected major goal has at least one explaining actor;
- the giver is reachable before the objective;
- do not assign an actor behind the puzzle, key, or mission it introduces.

If no legacy actor satisfies the hard radius, emit a deterministic `generated-guide` actor at a validated town, shrine, or labyrinth entrance. Report every such fallback.

Hints should be concrete and compiler-generated from geometry: direction, approximate distance, landmark type, and whether the destination is inside a labyrinth/cave. Avoid dynamic natural-language generation at runtime.

## 14. Labyrinth mission and puzzle integration

All 25 labyrinths should receive a consistent but varied interaction package.

### 14.1 Restore labyrinth owner links

Each `DungeonDistrict` already exports one fixed infrastructure owner. Attach that owner to its compiled `SimpleDungeonPart` structure and allocate it as a Maze Keeper, Delver, captive guide, or entrance contact according to the mission template.

### 14.2 Use the maze graph

The existing 37 × 37 semantic shell and `solveMaze()` output provide:

- entrances;
- all reachable cells;
- shortest-path distance from entrances;
- dead ends;
- junctions;
- chokepoints;
- generated chest cells.

Derive candidate placements from these graph properties:

| Element | Preferred maze location |
|---|---|
| introduction actor | entrance landing or safe exterior |
| first puzzle component | early junction |
| later component | distinct branch or deeper junction |
| mission chest/item | deep reachable dead end |
| completion seal | optional side chamber or return gate |
| reset control | entrance side of any controlled gate |
| final goal | high-distance reachable cell |

### 14.3 Initial labyrinth mission template

After the Wammigmig slice, use one maze-generator reactivation as the first labyrinth slice:

1. interact with the Maze Keeper to hear two competing interpretations of the fault;
2. enter the labyrinth using movement and Interact only;
3. inspect components to establish rational facts about topology, continuity, and state changes;
4. discover the observable resonance sequence carried by nearby shrines or maze symbols;
5. operate three or more components until both the rational constraints and resonance rule hold;
6. reactivate the generator and visibly energize its linked shrine route;
7. return to the Maze Keeper and record what is proven, inferred, symbolic, and still unknown.

The puzzle may open an optional side chamber, but it must never close the only route back to the entrance. Chests and inventory can provide optional evidence or rewards; no item pickup is required to prove the core movement-and-Interact loop.

### 14.4 Variation without runtime generation

Vary offline by stable labyrinth ID:

- rune sequence;
- chosen deep chest;
- component placement among validated candidates;
- mission text template and role label;
- ordinary loot;
- optional shrine/cave follow-up goal.

All variations are emitted as concrete JSON and included in reproducibility hashes.

## 15. Save format v2 and migration

### 15.1 Save shape

```json
{
  "saveVersion": 2,
  "worldId": "seed0-web-v2",
  "worldGeneratorVersion": "web-baked-v2",
  "interactionContentVersion": "interactions-v1",
  "player": { "x": 800, "y": 41, "z": 907, "realm": "surface" },
  "inventory": {
    "items": {},
    "order": []
  },
  "containers": {},
  "shrines": {},
  "puzzles": {},
  "missions": {},
  "actors": {},
  "flags": {},
  "discoveredLocations": {},
  "lastTransaction": 0
}
```

State examples:

```json
{
  "containers": {
    "container-id": {
      "inspected": true,
      "opened": true,
      "takenItemIds": ["item-id"]
    }
  },
  "shrines": {
    "shrine-id": { "activated": true, "turn": 14 }
  },
  "shrineRoutes": {
    "route-id": {
      "state": "active",
      "activatedShrineIds": ["shrine-a"],
      "litFrontierShrineIds": ["shrine-b"],
      "destinationTownId": "town:..."
    }
  },
  "settlements": {
    "town:populationBoarmanTribe#381": {
      "balanceState": "stable",
      "poweredTargetIds": ["structure-a", "structure-b"]
    }
  },
  "mazeGenerators": {
    "maze-generator-id": {
      "state": "active",
      "rationalState": "valid",
      "resonanceState": "valid"
    }
  },
  "puzzles": {
    "puzzle-id": { "state": "ab", "completed": false }
  },
  "missions": {
    "mission-id": {
      "state": "active",
      "objectiveSources": {
        "activate-nearby-shrines": ["shrine-a"]
      }
    }
  }
}
```

### 15.2 Migration from save v1

Migrate:

- player position and realm unchanged;
- `discoveredLocations` unchanged;
- each `openedContainers[id] = true` to `containers[id].inspected = true`;
- do not mark new loot as taken, because the old implementation explicitly recorded discovery/search and awarded no items;
- preserve a `legacySearched` flag so visuals and journal text remain honest;
- initialize shrines, puzzles, missions, actors, and inventory from defaults plus exported starting items.

Migration must be deterministic and idempotent. Keep a fixture for an actual v1 exported save.

### 15.3 Content-version changes

Do not invalidate terrain caches merely because mission text changes. Separate:

- world format/generator version;
- interaction schema version;
- interaction content version;
- asset-pack version.

If stable IDs change, publish a migration map. If an active mission is removed, convert it to an archived/abandoned entry with a clear message rather than rejecting the entire save.

## 16. UI, journal, map, and feedback

### 16.1 Interaction prompt

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

### 16.2 Dialogue panel

Use a bounded modal or side panel with:

- actor name and role;
- optional portrait/icon;
- dialogue text;
- explicit choices;
- mission title/objective preview;
- accept/decline/continue/turn-in actions;
- keyboard and screen-reader focus management.

Pause movement input while the panel is open, not the streaming/render lifecycle.

### 16.3 Mission journal

Journal categories:

- Available;
- Active;
- Ready to turn in;
- Completed;
- Failed/Archived.

Each entry shows objective text, progress, giver, turn-in actor, known target hint, and reward preview when appropriate.

### 16.4 Map behavior

The map already supports mission and puzzle marker styles. Populate them from the mission engine:

- unknown goals are hidden;
- accepted objectives reveal configured targets;
- approximate goals show an area marker rather than exact coordinates;
- completed goals change style or disappear according to mission policy;
- mission giver and turn-in markers have distinct states;
- puzzle markers appear only when discovered or mission-revealed;
- shrine markers show dormant/activated state.

Map state is derived from catalogs plus save deltas; it is not stored as duplicated marker state.

## 17. Streaming and performance

Interaction streaming remains cheap:

- global item/mission/actor indexes are small JSON catalogs;
- chunk scenes carry only local anchors and visual nodes;
- active chunk anchors are normalized with the existing 25 slots;
- actor/puzzle meshes use the global asset cache;
- mission state and inventory are independent of chunk lifetime;
- inactive dialogue bodies may be lazy-loaded if measurement justifies it;
- no worker is required for correctness.

Target budgets:

| Resource | Target |
|---|---:|
| all compressed interaction catalogs | under 1–3 MB initially |
| added compressed data per ordinary chunk | under 2–10 KB average |
| nearby-query work | local active anchors only |
| interaction evaluation | under 2 ms for ordinary actions |
| puzzle transition | under 2 ms; offline solver bears complex work |
| active mission count | explicitly capped by content/UI policy, not runtime memory |

Do not reduce existing scene fidelity preemptively. NPC static meshes, interaction props, and shrine effects should first use asset reuse, instancing, and bounded visual cues.

## 18. Deterministic compiler implementation

### 18.1 Recommended compiler modules

```text
scripts/
  export_frozen_world.py          # extended legacy evidence
  compile_world.mjs               # atomic top-level build
  compile_interactions.mjs        # imported compiler stage
  interaction_allocation.mjs
  interaction_validation.mjs
  mission_templates.mjs
  puzzle_templates.mjs
  actor_assets.mjs
```

`compile_world.mjs` remains the atomic publisher. `compile_interactions.mjs` must run before chunk JSON and manifest hashes are finalized. Do not post-process the already published 2,500 scenes.

### 18.2 Build order

1. export scenario state/events, actors, actor ownership, and party object instances;
2. generate the existing world structures, collision, portals, maze graphs, and objects;
3. reconcile actor ownership to compiled structures;
4. choose safe actor anchors;
5. define item types and concrete container contents;
6. select shrine and labyrinth goals;
7. generate/author puzzles and solve every one offline;
8. allocate goal-giving/explaining actors;
9. emit missions and dialogue;
10. add chunk interaction anchors and visual nodes;
11. validate all cross-references and reachability;
12. emit catalogs, chunk scenes, reports, and final manifest into staging;
13. atomically replace only a recognized generated world directory.

### 18.3 Validation report additions

Report at least:

- legacy actor count and player/NPC split;
- district fixed-owner count;
- compiled owner matches and fallback anchors;
- object-instance count by source;
- item type and baked item instance counts;
- container count, empty count, locked/trapped count, mission-bound count;
- shrine definition and activation-anchor counts;
- puzzle count by family and maximum solver state count;
- mission count by template and state graph depth;
- actor coverage, maximum goals per actor, maximum giver-to-goal distance;
- dangling-reference count, which must be zero;
- unsolved mission/puzzle count, which must be zero;
- raw/gzip/Brotli interaction bytes and per-location additions;
- all intentional deviations from legacy data.

## 19. Testing strategy

### 19.1 Export tests

- XStream references resolve for all selected actor and object records;
- exactly 319 persistent members are found in the current fixture;
- exactly one is the saved player and 318 are NPCs;
- all 318 NPCs have owned infrastructure evidence;
- the four saved `ObjInstance` elements are exported with collision-free derived IDs;
- scenario state exports `intPlyd = true`;
- no false mission/puzzle evidence is produced.

### 19.2 Schema and reference tests

- every catalog passes JSON Schema;
- every stable ID is unique within its namespace;
- every scene `interactionId` resolves;
- every actor, dialogue, mission, objective, goal, puzzle, component, item, and container reference resolves;
- no game catalog is placed in a visual `source` field;
- every asset source resolves inside the pack;
- canonical rebuilds are byte-identical.

### 19.3 Interaction tests

- nearest eligible interaction wins deterministically;
- overlap priority behaves as specified;
- repeated input cannot double-commit;
- chunk eviction/reload retains state;
- stale chunk loads cannot restore old visual state;
- one failed action commits no partial mutations;
- imported saves reproduce prompts and visual state.

### 19.4 Inventory/container tests

- taking an item removes it from the container exactly once;
- Take All is atomic;
- mission items progress only after successful transfer;
- existing v1 searched chests migrate without losing newly available contents;
- save export/import preserves item IDs and order;
- no mission-critical item is unreachable or duplicated unintentionally.

### 19.5 Shrine tests

- all 173 compiled shrines have definitions and reachable anchors;
- activation is one-time and survives reload;
- activation updates visuals, journal, and map;
- repeated activation cannot duplicate rewards/progress;
- activating targets in any permitted order produces the same mission result.

### 19.6 Puzzle tests

- offline solver completes every generated puzzle;
- every non-complete state can reset or continue;
- no gate traps the player;
- component state and collision restore after reload;
- wrong-input policy is deterministic;
- completion effects commit exactly once.

### 19.7 Mission tests

- dependency graph is acyclic;
- every mission can be accepted, completed, and turned in in a simulated run;
- out-of-order world actions are handled according to objective policy;
- already activated shrines or previously taken items either backfill progress or are explicitly disallowed by content rules;
- reward transactions are idempotent;
- abandoned/failed/completed missions cannot incorrectly re-enter active state;
- mission markers reveal and clear correctly.

### 19.8 Actor/dialogue tests

- all assigned actors have reachable anchors and visuals/proxies;
- all goal-giving actors explain their assigned nearby goals;
- every selected major goal has an explaining actor;
- no actor exceeds assignment capacity;
- dialogue graph nodes and choices are reachable and terminate;
- generated names/roles are marked as web-generated;
- missing animation never prevents interaction.

### 19.9 Editor and browser tests

Open in `three_js_editor_small`:

- one actor-containing town chunk;
- one shrine chunk;
- one labyrinth with a maze generator and interaction components;
- one 25-chunk region composition.

Browser automation must complete **A Fair Share of Light** from spawn through shrine activation, Wammigmig inspection, rational setting, resonance sequence, stable distribution, capital-route illumination, save, reload, and imported-save continuation. A second test must reactivate one maze generator and persist its linked shrine effect.

## 20. Implementation sequence

### Phase 0 — contracts and fixture

1. bump the world and save format versions;
2. define culture, settlement hierarchy, shrine graph, maze generator, actor, interaction, dialogue, goal, mission, puzzle, item, and save schemas;
3. use Wammigmig and its nearby shrine as the first fixed interaction fixture;
4. implement canonical writers and validators;
5. prove editor preview and plain-static-host loading.

### Phase 1 — legacy export and actors

1. extend the Python exporter for scenario, persistent actors, ownership, and object instances;
2. add counts and source-kind fields;
3. reconcile all 208 district fixed owners;
4. restore the 25 labyrinth owner links;
5. place one visible, talkable actor with static/proxy mesh.

### Phase 2 — interaction runtime

1. generalize chunk-local nearby interaction indexing;
2. implement predicate/action registries;
3. implement atomic transactions and save v2;
4. implement the target highlight, attention pulse, and single contextual Interact action;
5. add contextual dialogue/choice presentation without introducing additional world verbs;
6. add v1 save migration.

### Phase 3 — Wammigmig and shrine routing

1. place Marn Even-Tally on saved `ownerMemberId: "544"` and place Pella and Orro at validated anchors;
2. implement the three-branch rational distribution state machine;
3. implement its observable resonance sequence using the same Interact action;
4. compile stable shrine neighbors and the Wammigmig-to-Awshowam mission route;
5. persist local structure state, dialogue commitments, shrine frontier, and mission progress;
6. pass the complete **A Fair Share of Light** browser test.

### Phase 4 — capitals, cultures, and major-town arcs

1. emit the six selected capitals, four secondary capitals per culture, and minor-settlement assignments;
2. bake Deep Ledger and four secondary Kobold cave settlements;
3. allocate the named principal characters and capital interaction anchors;
4. implement capital briefing, local-balance state, four regional objectives, and return synthesis;
5. validate reachability and cultural ownership of every route.

### Phase 5 — maze generators and full shrine graph

1. derive graph placement candidates from all 25 mazes and major cave components;
2. implement rational, resonance, and balanced operation families with solvers;
3. add generator/component visuals and stateful collision/effects;
4. bind generator effects to shrine-graph edges and settlement power states;
5. complete one full generator-reactivation slice;
6. validate all 173 shrines and expand generator templates only after both slices pass.

### Phase 6 — optional containers and inventory

1. export starting party object instances;
2. add party inventory and item catalog;
3. bake concrete contents for chests;
4. build container UI and transfer transactions;
5. replace the current searched-boolean-only chest behavior;
6. keep inventory optional for the main movement-and-Interact mission path.

### Phase 7 — polish and performance

1. convert remaining MD5 actor assets offline or improve proxies;
2. add audio/visual cues;
3. profile catalog loading, nearby selection, instance counts, and mobile rendering;
4. optimize only measured bottlenecks;
5. update review, validation, and browser evidence.

## 21. Parallel-agent handoff

Freeze schemas, stable-ID rules, and the fixture before parallel implementation.

| Package | Ownership | Outputs | Must not independently change |
|---|---|---|---|
| A. Legacy evidence | Python XStream/scenario export | actors, ownership, object instances, source report, fixtures | runtime schemas after Gate 0 |
| B. Contracts/compiler | JSON Schemas, canonical emission, manifests, allocation framework | catalogs, scene anchors, validation report | runtime behavior without fixtures |
| C. Runtime state | transaction, predicates/actions, save v2/migration | deterministic interaction core and tests | content allocation |
| D. Items/containers | item catalog, inventory, loot bake, chest UI | concrete loot and transfers | mission graph semantics |
| E. Shrines/puzzles | activation, puzzle FSM/solver, component visuals | shrine/puzzle mechanics and validation | actor/dialogue allocation |
| F. Actors/missions | actor anchors/assets, dialogues, goals, mission engine/journal/map | complete giver-to-goal loops | world geometry contracts |
| G. Integration/QA | static-host E2E, editor/browser evidence, performance, docs | vertical-slice report and release gate | silent schema/fidelity changes |

### 21.1 Merge gates

1. **Gate 0 — format fixture:** schemas, stable IDs, fixture catalogs, fixture scene, save v2, and editor preview are merged.
2. **Gate 1 — evidence:** actor/object/scenario export is deterministic and ownership reconciliation is complete.
3. **Gate 2 — generic interaction:** one fixture actor, chest, shrine, puzzle component, and portal resolve through the same nearby/transaction pipeline.
4. **Gate 3 — stateful world:** inventory, container transfer, shrine activation, save/reload, and v1 migration pass.
5. **Gate 4 — mission slice:** actor gives mission, journal/map update, objective completes, actor accepts turn-in, reward commits once.
6. **Gate 5 — labyrinth slice:** puzzle and mission chest are proven solvable in a real generated labyrinth.
7. **Gate 6 — world allocation:** all selected goals, actors, shrines, missions, and puzzles pass coverage and solvability reports.
8. **Gate 7 — release:** static-host browser and editor evidence passes with bounded memory and measured performance.

### 21.2 File-ownership rules

- Package B owns schemas and compiler catalog writers.
- Package C owns save format and predicate/action/transaction interfaces.
- Package D owns item/container schemas only through changes reviewed by B/C.
- Package E owns puzzle transition semantics and solver.
- Package F owns mission/dialogue content and actor allocation.
- Package G owns integration fixtures and reports, not production semantics.
- Only one package edits `compile_world.mjs`, `scene.schema.json`, `save_deltas.js`, or the interaction format module at a time.

Agents contribute adapters and fixtures rather than copying shared constants.

## 22. Definition of done for the first vertical slice

The feature is implementation-ready when:

- the build preserves Wammigmig, its existing structures, saved `ownerMemberId: "544"`, the spawn, and the nearby shrine as identified above;
- Marn, Pella, and Orro appear at validated anchors in editor-previewable chunk scenes;
- movement and one contextual Interact action are sufficient for every required step;
- each Interact invocation highlights its resolved target and emits a harmless attention pulse;
- the shrine activates, answers visually, and lights the next route node toward the active objective;
- the player can distinguish observed demand from NPC testimony in the journal/dialogue presentation;
- the rational distribution settings and resonance sequence are both solvable from visible/audible world cues;
- balancing Wammigmig updates its storage, homes, street relay, actors, and mission state atomically;
- Marn's handoff activates a persistent shrine route toward Awshowam and identifies the Boarman capital;
- the nearby cave emits its foreshadowing response without forcing an early detour;
- no combat, attack, damage, or hidden auxiliary verb is required or accidentally triggered;
- leaving/re-entering chunks does not lose actor, shrine, distribution, route, or mission state;
- save v2 export/import and v1 migration both work;
- the chunk and region still open directly in `three_js_editor_small`;
- the entire slice runs from a plain static server with no API or procedural worker;
- automated content solvers and browser tests prove the path end to end;
- the validation report distinguishes legacy-derived data from web-authored/generated content.

## 23. Source map

### Legacy scenario and state

- `scenario/jclassicrpg/events.xml`: only authored scenario event, the intro.
- `scenario/jclassicrpg/story/intro.xml`: two non-interactive story blocks; shrine/rest theme and original controls.
- `game/scenario/Events.java`: event/element/story playback shell.
- `game/scenario/Scenario.java`: intro initiation and `intPlyd` state.
- `game/scenario/ScenarioState.java`: generic scenario-state map.
- `game/scenario/element/StoryPart.java`: non-interactive story blocks.
- `world/ai/abs/Goal.java`: empty placeholder.

### Legacy objects and storage

- `world/object/Obj.java`: object-type metadata and use limits.
- `world/object/ObjInstance.java`: per-instance uses and attachments; numeric-ID constructor issue.
- `world/object/EntityObjInventory.java`: inventory/equipment/transfer behavior.
- `world/object/ObjList.java`: object-type singleton registry.
- `world/ai/wealth/EntityCommonWealth.java`: common wealth, placeholder storage contents, lock/trap selection.
- `game/trigger/StorageObjectHandler.java`: proximity storage trigger and UI handoff.
- `space/sidetype/trigger/StorageObjectSideSubType.java`: chest trigger effects.
- `ui/window/interaction/StorageHandlingWindow.java`: Take/Take All legacy flow.
- `ui/window/interaction/LockInspectionWindow.java`: identify, disarm, force, and open flow.

### Legacy actors

- `world/ai/PersistentMemberInstance.java`: persistent character instance and position.
- `world/ai/EntityInstance.java`: entity ownership, relationships, and wealth.
- `world/ai/humanoid/group/*`: entity types, behavior, member grouping, and model hints.
- `media/models/humanoid/*`: human/anatipion/yeti OBJ assets and MD5 character assets.
- `media/models/monster/*`: possible static labyrinth actor/proxy assets.

### Current web build/runtime

- `scripts/export_frozen_world.py`: XStream export and current district ownership extraction.
- `scripts/compile_world.mjs`: atomic world compiler, scene emission, hashes, reports.
- `jCRPG-engine/js/world/format.js`: scene contract, IDs, constants, validation.
- `jCRPG-engine/js/world/scene.schema.json`: current `lewcid_object` JSON Schema.
- `jCRPG-engine/js/world/baked_stream.js`: 25-slot fetching, normalization, collision, nearby chests/portals.
- `jCRPG-engine/js/world/baked_view.js`: instancing and searched-chest appearance.
- `jCRPG-engine/js/world/save_deltas.js`: current save v1.
- `jCRPG-engine/js/game_state.js`: current portal/chest interaction dispatch.
- `jCRPG-engine/js/play_page.js`: contextual prompt and save import/export wiring.
- `jCRPG-engine/js/map_model.js`: existing mission/puzzle marker styles.
- `jCRPG-engine/js/world_map.js`: current map marker/filter UI.
- `jCRPG-engine/js/procedural/maze.js`: deterministic maze generation and solver.
- `jCRPG-engine/js/procedural/structures.js`: labyrinth chests and semantic volumes.
- `jCRPG-engine/worlds/seed0/v1/structures.json`: current structure and partial owner linkage.
- `jCRPG-engine/worlds/seed0/v1/chunks/*.scene.json`: current interaction-placement destination.
- `docs/procedural-review.md`: current controls and explicit interaction limits.

Repository: <https://github.com/leweyg/jclassicrpg>

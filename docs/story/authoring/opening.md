# story_opening

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Opening geography, handoffs, travel budgets, and evolution of the five-chapter design. Read [story_plot](https://github.com/leweyg/jclassicrpg/blob/main/docs/story/README.md#story_plot) for the canonical narrative. The first Fair Share slice and later five-chapter proposal are retained here only for their unique mechanics, geometry, and migration rationale; the current opening is Orro → Pella → Talla → Saima. Saima now uses a local quantity test, four regional reports (including Varis’s subset), and a separate final sequence.

## Original Wammigmig slice

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

All five Concordance chapters are marked playable in the current story catalog. The original rollout shipped the first three before the Saima continuation. Landing-page captions must track the catalog status rather than repeat that earlier three-chapter limit.

## Selected cast and geography (seed0/v2)

The table records the opening design anchors and the additions that became Talla and the listening coil. Those names and items are now authored content. Preserve IDs across dialogue rewrites; “required addition” describes the original implementation brief rather than unfinished work.

| Stop | Stable anchor and approximate position `(x, z)` | Cast and dramatic purpose | Built content / required addition |
| --- | --- | --- | --- |
| Spawn and roadside shrine | Spawn `(800, 907)`; `shrine:shrine 19 22:782:903` `(784, 905)` | **Orro Coil-Tender** (`actor:wammigmig:orro`), the anxious, affectionate technician, introduces one trustworthy act of repair. | Orro currently stands `(787.5, 904.5)` beside the actual shrine. Automatic chapter begins with Orro as the first indicated conversation, then shrine activation; Marn confirms in town. |
| Small starting town: **Wammigmig** | `town:populationBoarmanTribe#381` `(820, 900)` | **Marn Even-Tally** (`legacy-actor:BoarmanTribe#381:544`) keeps the accounts and confirms the road light; **Pella Sharekeeper** (`actor:wammigmig:pella`) represents homes that the account misses. | Move the existing three readings and `puzzle:wammigmig:distribution` out of chapter one; let Pella introduce the missing cave part and eventually receive or fit it. |
| The nearby southern cave | `cave:760:920:0` entrance `(786.5, 928.5)`; baked component size 406 | **Pella** gives the personal reason to retrieve one component; **Orro** can interpret it on return. No new required cave NPC. | Bake one stable item instance, tentatively **the listening coil**, in a reachable chest inside this cave; anchor a fitting near Pella. This is a new placement. The existing optional CopperCoil chest is on the surface and does not satisfy the cave chapter. |
| First bigger town: **Wamwammigtraawsho** | `town:populationBoarmanTribe#423` `(860, 940)`; Wammigmig's actual `parentSecondaryCapitalTownId` | Give existing `actor:boarman:regional:1` a proper authored name, **Talla Three-Wicks**, a circuit keeper who explains how exchange, homes, and the labyrinth share a supply. Keep her existing actor ID. | Reuse `puzzle:boarman:regional:1`: the existing **Exchange / Homes / Labyrinth** three-switch puzzle already has `mechanic: "all"`. Provide an authored return conversation and route cue northward. This Boarman major town is distinct from Awshowam, its distant Boarman capital. |
| Central Antipion capital: **Migbushoprahshotra** / the Measured Oasis | `town:populationAnatipionCatchers#390` `(780, 1100)` | **Saima of Nine Measures** (`actor:antipion:principal:0`) receives the main story; **Varo Null-Scribe** (`actor:antipion:principal:1`) checks reproducible totals; **Nemi Reed-Breath** (`actor:antipion:principal:2`) notices what the record cannot yet name. | Introduce subset sums on the approach or outskirts with Varo, then reserve a clearly explained named sequence for the late capital chapter with Saima and Nemi. `puzzle:antipion:capital` is currently an **all-switch** puzzle; author a separate late sequence or migrate its semantics explicitly rather than silently treating it as one. |

The first stop to cave entrance is about 50 world units as the crow flies; cave entrance to Wamwammigtraawsho about 77; the major town to the Measured Oasis about 179. Wammigmig to the major town is about 57. These are **planning geometry only**; all walking budgets, interior legs, and shrine connections must use navigable paths and portal transitions. The southern cave requires a short outward detour before the major-town road. If route validation finds it unreasonably long, keep the same cave entrance and rearrange the handoff or waypoint spacing before changing the chosen locale.

### Named handoffs and optional threads

1. **Orro → shrine → Marn:** Orro speaks first, one light wakes, Marn receives news of its pulse. The first chapter ends on confirmation with Marn. Pella then points to the missing coil as the next main chapter; she is sympathetic rather than a second source of tutorial instructions.

2. **Pella → cave → fitting → Talla:** The retrieved cave coil changes a visible socket at Wammigmig and makes the road toward Wamwammigtraawsho legible. Talla receives the practical observation and asks the player to wake all three local grid branches. Orro remains available for optional technical intuition about the coil.

3. **Talla → Saima / Varo / Nemi:** Talla's completed circuit gives a measured account to carry north. Saima asks what the account misses; Varo helps test quantities before any sequence puzzle; Nemi offers an alternative reading and a clue to the late ordered activation. Saima handles the capital synthesis and the next main-story handoff.

4. **Side and mini quests:** Marn's storage/household readings become a local side quest that reframes Talla's three branches and returns the marker to her or the current main chapter. Orro can give one short relay-inspection mini quest; Pella may retain a separate household service task. Varo and Nemi can offer optional observation threads that return to Saima. Do not make any of these prerequisites for the main chapter, and do not duplicate the cave coil in the old surface-chest side quest.

### Longer term expansion around the story spine

The five chapters are the **central thread**, not the intended total amount of content. Build multiple linked missions around each chapter, using most reachable settlements, resident actors, shrines, buildings, caves, labyrinths, and cultural capitals over time. Extend the same pattern to the Human forum at Trawamprahshoaw (Mara, Oren, Iris), Boarman capital Awshowam (Garrum, Bela, Tusk), Yeti hearth (Aro, Ketu, Seli), Kobold Deep Ledger (Vek, Nix, Rul), and Greek Horde labyrinth (Iris-of-the-Turn, Ember-Tusk, Clasp-of-Seven). These places expose different consequences of the same grid and the five layers; they do not all need to be required stops on the first linear route.

Give each available resident a small authored role before adding missions mechanically: a local need, an observation or belief, a nearby actionable site, and a connection to the current chapter or another resident. Some remain witnesses or provide Intuition; many offer side quests; only a small cast drives main chapters. Attach optional arcs to a named main chapter and provide a return marker or specific onward handoff on most completions. Generate coverage reports per region (placed actors, actors with dialogue, quest givers, quest sites, unreachable/unused anchors) so expansion genuinely reaches most of the existing world without filling the journal with generic repeated jobs. Keep new authored personalities explicitly distinct from recovered legacy identities and settlement names.

The following design rationale explains the revision from the original Fair Share opening to the five-chapter progression. It supersedes the **mechanical order** of the earlier “First playable exploration slice” and the current compiled `A Fair Share of Light` opening; retain those sections as character, theme, and geography references. At that revision, the compiler put shrine, three evidence readings, a weighted sum, and a commitment into one first mission. Its browser route activated the shrine before meeting the giver; meeting Marn first creates a long return journey. Break that activity into linked chapters, so a new player always has one clear next promise.

### Travel budget and wayfinding

Measure **walkable path distance**, counting cave corridors and return legs; straight-line distance is insufficient around buildings and walls. In the pre-chapter opening, spawn → Marn → shrine → the three readings → two switches → Marn is approximately **209 one-unit walkable steps**; the test-script order that touches the shrine before talking is roughly **151 steps**. These are grid path estimates, not measured seconds of play. They are a baseline to improve, not target distances for the replacement.

For each proposed chapter emit a compiler report with leg ID, start/end realm and anchor, path length in cells, portal transition, estimated walking time using actual controller speed, and cumulative steps since last dialogue/reward. Validate player reachability and marker availability at **every** stage. Design target for the first chapter: a visible first contact, one short journey to a shrine, and a nearby confirmation, with no cross-town round trip; use playtesting to tune concrete limits. The cave chapter may be longer because exploration is its lesson, but place a light/reward or character beat before and after the cave. Each town-to-town leg needs its own forward shrine frontier and clear arrival cue. On cave entry show known mission goals and all discovered exits; on exit hide cave-only exit markers, as already required by the map system. If a goal is unknown, guide to the last known entrance or informant rather than revealing the hidden target.

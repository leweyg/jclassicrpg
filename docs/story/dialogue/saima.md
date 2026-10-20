# saima_dialogue

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Complete authored dialogue treatment, response choices, state wiring, and interaction copy for the Measured Oasis. These illustrative passages remain editable writing material, not a verbatim dump of the shipped script. `scripts/saima_dialogue.mjs` owns live captions and predicates. The listener and final-sequence IDs proposed in this treatment now exist; use their current compiled records and keep their identities stable.

## Explicit dialogue script and interaction copy

The lines below are proposed player-facing copy, not current shipped dialogue. Each numbered caption is one tap. Responses appear only after the last caption of their node. The displayed speaker name belongs to the actor ID in the heading. Keep `knowledge` on a node or caption where useful: a measurement is a fact, an eyewitness statement is testimony, and a suggested cause is inference. A choice labeled *Maybe later* closes without accepting or changing an objective. A player response should not assert a belief the player was never allowed to choose.

Implementation notation: `entry` identifies a predicate-selected node; `when` is the availability predicate; `accept`, `turnIn`, `commitment`, and `route` are existing action operations. Reuse the current `dialogue:actor:...` IDs, add the named node IDs to those records, and retain the existing `hint:mission:...` IDs for review. All spoken coordinates below are deliberately absent; map and journal provide positions. The illustrative language can be edited without changing the stable IDs.

### Saima: central capital conversation

Actor `actor:antipion:principal:0`; dialogue `dialogue:actor:antipion:principal:0`. Main chapters `mission:concordance:meaning` and `mission:concordance:order`. Local side mission `mission:antipion:balance`; synthesis `mission:antipion:bliss`. Varo is `actor:antipion:principal:1`; Nemi is `actor:antipion:principal:2`.

**`greeting` — first arrival, chapter 4 active, local balance available (three captions):**

1. “Talla sent you with three branches awake. I am Saima. I keep the Nine Measures, the public account of what the Grid carries and where it goes. People in this oasis plan their work by it.”

2. “You have done them a service, but I do not yet know you well enough to amend that account on your word. Last season a lovely pattern drew current away from a house where someone was ill. The instruments were correct about the current; our judgment about its use was not.”

3. “A pulse here has been excluded because it falls outside our prediction. Read the three conductors before changing them, then help Varo test what the table missed. If the result holds, I will take your account seriously beyond this courtyard.”

Responses: **“I’ll read the conductors”** → `accept mission:antipion:balance`; **“Why did the table reject the pulse?”** → `saima:table`; **“Maybe later”** → close. `mission:concordance:meaning` remains automatic. `saima:table` is optional context, then returns to the greeting choices: “The table keeps a range from readings we could repeat. This pulse arrived outside it. We may have measured badly, or the world may have changed; calling it false before we check would make the range a law it never earned.”

**`hint:mission:antipion:balance` — local task active (two captions, dynamically pick only the next unfinished action):**

1. “Varo keeps the three conductors beside this shelter. He will show you the recorded loads; read each one before you set it.”

2. “Come back after the local current holds. I want the outlying pulse beside the readings that did repeat.”

Review choice: **“Back to Saima”** → current state greeting; no acceptance replay. If the player has already read all three, caption 1 becomes “You have the readings. Set the conductors to the measured loads and watch what returns.” If the puzzle is complete, use “The local current holds. Tell me what you observed.”

**`local-account` — `mission:antipion:balance` completed, chapter 4 ready (three captions):**

1. “I asked Varo to run it again. The steady loads are where we expected. The fourth pulse is also there, and we cannot explain it by wishing it away.”

2. “You brought me a result narrower than a grand theory, and therefore useful. I owe you that much. But I will not change a rule for four towns because one courtyard agrees with us.”

3. “Each town has a keeper and a witness beyond our usual circle. Bring their accounts back separately. If they disagree, bring the disagreement too.”

Response **“Record the local result”** → `turnIn mission:concordance:meaning`; optional **“Why four towns?”** → `saima:four-towns`; **“Maybe later”** → close. In `saima:four-towns`: “A shared current crosses four regions before it returns here. A correction that works only in the capital is another way of making the capital comfortable at someone else’s cost.”

**`regional-account` — chapter 5 active, zero to three reports (three captions, variable slot):**

1. “The roads are lit for the four keepers. Iva asks what happened in the ground; Mira asks what we can honestly say; Varis tests a failed prediction; Tavi asks whose voice a decision has room to hear.”

2. “You have brought back **{completedCount} of four** accounts. **{nextKeeperName}** still needs your help at **{nextTownName}**. I will read the others while you travel; you need not return after each one.”

3. “If a witness unsettles our numbers, let that unease travel home with the measurement. We are capable of holding both until we know more.”

Responses: **“Guide me to {nextTownName}”** → set navigation to that available/active regional mission and light its existing route if needed; **“What have you heard from the others?”** → `saima:partial` (optional, based on completed IDs); **“I’ll return with the remaining accounts”** → close. If the four reports are already complete, this entry must yield to `four-accounts` instead of formatting an absent next keeper.

**`saima:partial` — optional, one or two captions assembled from *completed* reports only:**

- Body: “Iva kept the thaw beside the temperature. I had been comparing the numbers without the winter that made them.”

- Speech: “Mira left room for Seli’s account without printing its cause as a finding. Her restraint made the record stronger.”

- Mind: “Varis brought back the failed prediction with his revised sum. I am glad he chose to show both.”

- Wisdom: “Tavi did not ask Naru to become an instrument. She repaired an instrument so that Naru’s observation could be checked.”

End with **“Back to the regional work”** → `regional-account`. Show a maximum of two lines per visit, rotating or prioritizing the most recently completed report; do not concatenate a four-paragraph history on mobile.

**`four-accounts` — all four regional missions completed; synthesis available (four captions):**

1. “You came back with four accounts and none of them is a copy of mine. I believed you might choose the readings that made our first answer look clever. Instead you brought the awkward ones too.”

2. “I have begun to look forward to your return. Please do not tell Varo I said that before I asked him to check the totals.”

3. “Iva’s ground, Mira’s words, Varis’s tested thought, Tavi’s open decision: Nemi calls that a way of attending. We can give it a public form without pretending it predicts every future pulse.”

4. “There is a sequence device here beside the measures. Nemi will name the order; Varo will verify its starting condition. When all four accounts have been reported, I will trust you to set it.”

Responses **“I’ll prepare the four measures”** → `accept mission:antipion:bliss` (if available), then navigate to `puzzle:antipion:final-sequence`; **“I want to hear Nemi first”** → set navigation to Nemi (no mission acceptance); **“Maybe later”** → close. Saima's warmth follows concrete conduct; she does not declare the player unquestionably right.

**`hint:mission:antipion:bliss` — final sequence active (two captions):**

1. “Nemi names the order Ground, Word, Pattern, Welcome. Varo says all four measures are ready to answer. The sequence device is beside this shelter.”

2. “A wrong pulse only restarts its order. The four reports stay in the record. When the device holds, come back so we can choose what the public account will promise.”

**`final-account` — puzzle completed and synthesis commitment pending (three captions):**

1. “The four measures answered in the order we named. Varo has checked that the signal repeats; Nemi has recorded why that order helps her listen. Those are different statements, and both may stay.”

2. “I can amend the public account to include a named remainder: a place for a witnessed pulse we cannot yet explain. It will not be counted as supply, and it will not be erased from consideration.”

3. “I began by asking you to prove yourself. You kept returning with other people’s words intact. I trust that care more than a perfect recitation. Shall we keep this record open together?”

Responses **“Keep the record open”** → `commitment:antipion:breath`, then `turnIn mission:antipion:bliss` once its objectives are ready; **“What does the remainder change?”** → `saima:remainder`; **“I need a moment”** → close. `saima:remainder`: “Anyone may ask us to repeat a reading, and anyone may point to what our account failed to see. We will mark the claim, its witness, and what would test it; we will not sell uncertainty as power we can spend.”

**`journey-complete` — `mission:concordance:order` completed (three captions on first completion, a shorter repeat thereafter):**

1. “The roadside light, Pella’s coil, Talla’s three branches, and these four accounts now have a place in the same public record. The current reaches farther; the obligation reaches with it.”

2. “I did not expect to be glad to see a traveler arrive with another correction. You have made me glad. If we have learned anything, it is to leave the next page unfilled until someone can bring us what we missed.”

3. “Rest here if you wish. Other towns have their own ways of making a shared light answerable. I would like to hear what they teach you.”

Offer **“Tell me how the record changed”** → short recap; **“Until next time”** → close. The chapter 5 report action occurs before or immediately after `final-account`; never show a congratulatory completion node while `mission:concordance:order` is still ready-to-turn-in with no way to report it.

### Varo and Nemi: context at the capital

**Varo Null-Scribe** `actor:antipion:principal:1` / `dialogue:actor:antipion:principal:1`, initial local test (three captions):

1. “Saima asks for a second pair of eyes whenever a result will affect the public table. Mine are slow eyes, which is useful when everyone else is excited.”

2. “Read Measured, Repeated, and Remainder before touching the conductors. The first reading tells us what the instrument claims. We can then ask whether the claim survives the same test twice.”

3. “I am not trying to keep wonder out of the room. I am trying to make sure a family can tell whether the light promised to them is actually coming.”

Responses **“Show me the recorded loads”** → open the local puzzle hint/Intuition, no state mutation; **“How do you record an unknown?”** → optional one-caption explanation; **“I’ll test them”** → close and track the local mission. Pending reminder gives only next unfinished local control. After four reports, Varo says: “I checked each account against its own conditions. Their differences survived the check. The final device is ready; Nemi may name an order, and I will tell you whether it truly repeats.”

**Nemi Reed-Breath** `actor:antipion:principal:2` / `dialogue:actor:antipion:principal:2`, first arrival (three captions):

1. “Varo hears the pulse when it repeats. I hear the long space before it. Sometimes that space makes me notice where I should ask him to measure.”

2. “Once I thought the wind was answering me. It was the upper channel cooling at dusk. I was disappointed, then delighted; the wind had led me to a real question.”

3. “Saima is right to ask for evidence from the towns. A symbol that never risks being wrong becomes a way of refusing to listen.”

Before four reports, **“What do you sense here?”** returns an explicitly unconfirmed observation and no final solution. After all four reports, Nemi's `four-accounts` entry supplies the sequence in three captions: “Iva brought us ground. Mira brought a word we can answer for. Varis brought a pattern he let fail. Tavi made room for the next person.” / “The four marks on the device are Ground, Word, Pattern, Welcome. Touch them in that order. It is a reminder of how we reached a judgment, not a hidden law of the Grid.” / “If the signal disagrees, we will keep the disagreement. We can begin again without undoing what anyone told us.” Choices: **“Ground, Word, Pattern, Welcome”** → review final mission; **“I’ll return to Saima”** → navigate to her; **“Maybe later”** → close. After completion, Nemi acknowledges that the pattern proved a repeatable circuit action, not her wider interpretation.

### Body: Iva and Ketu

Keeper `actor:antipion:regional:0`, dialogue `dialogue:actor:antipion:regional:0`; witness `actor:antipion:witness:0`, dialogue `dialogue:actor:antipion:witness:0`; mission `mission:antipion:body`; evidence `evidence:antipion:regional:0`; puzzle `puzzle:antipion:regional:0`; commitment `commitment:mission:antipion:body`.

**Iva `greeting` / available (three captions):**

1. “You came from Saima? Then perhaps she will finally believe my spring. I have measured it each thaw since my brother taught me how to keep the marker level.”

2. “This year the water warmed before the ice above it broke. The capital's table called that sensor drift. Perhaps it is drift. But Ketu saw the first tracks and wrote down the hour and the weather beside mine.”

3. “Read the spring marker at Trashoprah, hear Ketu, then touch the single measuring relay here. It is one check, not an incantation. I want our conditions carried with the number.”

Responses **“I’ll check the spring”** → `accept mission:antipion:body`; **“What did your brother teach you?”** → `iva:brother` (“Write down the morning too. Numbers without weather are lonely things.”); **“Maybe later”** → close.

**Ketu `greeting` / before and after talk objective (three captions on first meeting):**

1. “I crossed above Trashoprah before sunrise. The snow held my weight; by the spring it had begun to soften. I could tell by the edge of a track I made on my way in.”

2. “Iva's marker had risen. I wrote the time and the ice condition because neither of us had expected warmth so soon.”

3. “I do not know what warmed it. Tell Saima what we saw together, and tell her what we still cannot say.”

Choices **“I’ll keep both observations”** → normal talk objective, no invented causal commitment; **“Until next time”** → close. Repeat line: “The track and the marker belong to the same morning. Please keep the morning with them.”

**Iva pending `hint:mission:antipion:body`:** “Start with the spring marker and Ketu at Trashoprah. When both accounts are in hand, wake the single relay here and return to me. Intuition will tell you which step is left.” Dynamically omit completed steps. **Commitment choice:** “I’ll record conditions with each reading” → existing commitment ID. **Puzzle Intuition:** “One measuring relay. Spring reading: observed with thaw conditions. State: off/awake. Action: awaken once.” **Puzzle success:** “The relay answers once and holds. Iva's temperature and Ketu's conditions remain paired in the public record.” **Iva ready/report (two captions):** “It held. I did not need Saima to call me right; I needed her to see what we actually measured.” / “Will you take her the thaw as well as the number?” Response **“I’ll carry both”** → `turnIn mission:antipion:body`. Completed repeat: “My brother would be pleased you left the weather on the page.”

### Speech: Mira and Seli

Keeper `actor:antipion:regional:1`, dialogue `dialogue:actor:antipion:regional:1`; witness `actor:antipion:witness:1`, dialogue `dialogue:actor:antipion:witness:1`; mission `mission:antipion:speech`; evidence `evidence:antipion:regional:1`; puzzle `puzzle:antipion:regional:1`; commitment `commitment:mission:antipion:speech`.

**Mira `greeting` / available (three captions):**

1. “Seli arrived here with three families after dark. I entered their arrival in the town record. Then I wrote that a change in the Grid had driven them down from the pass.”

2. “She had said they were afraid of the sound under the ice. I turned her fear into my explanation, and people repeated it as a measured cause. She has every right to be angry with me.”

3. “I have made three lamps so I cannot do it again unnoticed: what we observed, what a person reported, and what we inferred. Will you help me light all three without asking one to impersonate another?”

Responses **“I’ll keep the three accounts visible”** → `accept mission:antipion:speech`; **“Can I speak to Seli?”** → navigate to witness; **“Maybe later”** → close.

**Seli `greeting` / first meeting (three captions):**

1. “The children heard something below the ice. I heard it too. We came down the pass because I would rather be embarrassed in a warm room than brave on a breaking path.”

2. “Mira wrote that the Grid drove us out. I did not say that. I said what I heard and what we chose.”

3. “She came to apologize. I would like her record to be as careful as her apology.”

Responses **“I’ll carry your words as you said them”** → talk objective; **“Until next time”** → close. Repeat: “We arrived before the schedule said we would. Why the ice sounded that way is still a question.”

**Mira pending `hint:mission:antipion:speech`:** “Read the arrival marker and listen to Seli at Prahtraprahshowam. Here, turn on Observed, Reported, and Interpreted. Their order does not matter; their labels do.” The reminder should select next unfinished item. **Commitment choice:** “I’ll mark observation, testimony, and inference separately” → existing commitment ID. **Puzzle Intuition:** “Observed: off/awake · Reported: off/awake · Interpreted: off/awake. Goal: all three visible. Order: any.” **Puzzle success:** “Three lamps hold distinct light. No category has to borrow another's certainty.” **Mira ready/report (two captions):** “Seli read the new entry. She did not forgive the first one simply because we fixed it, but she said this one sounds like her.” / “Will you bring Saima the corrected record?” Response **“I’ll bring her the correction”** → `turnIn mission:antipion:speech`. Completed repeat: “I still ask Seli whether I have written what she meant.”

### Mind: Varis and Aro

Keeper `actor:antipion:regional:2`, dialogue `dialogue:actor:antipion:regional:2`; witness `actor:antipion:witness:2`, dialogue `dialogue:actor:antipion:witness:2`; mission `mission:antipion:mind`; evidence `evidence:antipion:regional:2`; puzzle `puzzle:antipion:regional:2`; commitment `commitment:mission:antipion:mind`.

**Varis `greeting` / available (three captions):**

1. “I predicted the pulse here for nine seasons. The model was simple enough that other keepers could check it, and I took pride in that. This season it missed.”

2. “I have been tempted to call Aro's warning lucky. He noticed a change in the wind and thaw before my instrument registered it. Luck is possible. So is a condition my model left out.”

3. “Read the outlying marker, hear him for yourself, and choose only the branches whose measured values reach the new load. The total will stay visible as you work. I want to put the failed prediction beside the revision.”

Responses **“I’ll test the revised load”** → `accept mission:antipion:mind`; **“What did the old model predict?”** → `varis:old-model` (the exact old and new values must match the authored puzzle); **“Maybe later”** → close.

**Aro `greeting` / first meeting (three captions):**

1. “The morning wind came up the slope while the lower snow was melting. It usually turns the other way by then. I thought the pulse would arrive late.”

2. “I told Varis before we saw the instrument. I was right about the delay, but I cannot promise I know why. The mountain has made a fool of me often enough.”

3. “If he finds a quantity that explains it, tell me. I would rather learn than win an argument.”

Responses **“I’ll compare your observation with the readings”** → talk objective; **“Until next time”** → close. Repeat: “Keep the direction of the wind in the account; we can test it next thaw.”

**Varis pending `hint:mission:antipion:mind`:** “The outlying marker and Aro's account come first. Then select branches beside me until their values total the measured goal. The device and Intuition show every value and the running total.” Dynamically omit completed steps. **Commitment choice:** “I’ll publish the failed prediction with the revision” → existing commitment ID. **Puzzle copy and data example for review:** three selectable branches **Stone = 2**, **Reed = 3**, **Wind = 4**; **goal = 6**; initial total **0**; solution **Stone + Wind**. Intuition: “Stone 2 [off/on] · Reed 3 [off/on] · Wind 4 [off/on]. Current total {total}; observed goal 6. Toggle a branch to include or remove its value.” A sum above six remains reversible, never a failure lock. **Puzzle success:** “The chosen branches carry six units. The old prediction remains recorded beside this new measurement.” **Varis ready/report (two captions):** “I wanted to tuck the old prediction out of sight. Aro asked to see both, and he was kinder to me than I had been to his warning.” / “Will you take Saima the sum and the error?” Response **“Both belong in the record”** → `turnIn mission:antipion:mind`. Completed repeat: “I have begun to value a model that can be corrected in public.”

### Wisdom: Tavi and Naru

Keeper `actor:antipion:regional:3`, dialogue `dialogue:actor:antipion:regional:3`; witness `actor:antipion:witness:3`, dialogue `dialogue:actor:antipion:witness:3`; mission `mission:antipion:wisdom`; evidence `evidence:antipion:regional:3`; proposed container `container:antipion:wisdom:listener`, item `item:antipion:wisdom:listener`, fitting `fitting:antipion:wisdom:listener`; existing puzzle `puzzle:antipion:regional:3` is no longer a required objective if the fitting replaces it. Commitment `commitment:mission:antipion:wisdom`. Validate a reachable cave and its actual portal ID during compilation before attaching the item and markers; the three proposed IDs are stable design targets, not claims that objects already exist.

**Tavi `greeting` / available (three captions):**

1. “We have families waiting for the lamps. Naru says the rock gives warning before a surge; our damaged listener says nothing. I can hear him fairly, but I cannot tell the town to spend a winter's reserve on my courtesy alone.”

2. “The old listening element is in a chest within the nearby cave. When the socket failed, no one wanted to go below to replace it. I waited too long for a perfect answer.”

3. “Speak to Naru, read the local marker, bring back the element, and fit it here. Then I can make a decision with a test in hand and a witness at the table.”

Responses **“I’ll bring back the listener”** → `accept mission:antipion:wisdom`; **“Why trust Naru?”** → `tavi:trust` (“Because he has described where and when the sound arrives, and he welcomes a check. Trusting his honesty does not require me to declare his explanation correct.”); **“Maybe later”** → close.

**Naru `greeting` / first meeting (three captions):**

1. “The stone carries a low sound before the line brightens. My grandmother heard it with her cheek against the wall. I hear it through my feet now.”

2. “I do not know whether the stone warns us or simply answers the same change a moment earlier. I have told Tavi where to listen and when.”

3. “If the new element hears nothing, I will help look for another cause. I would like the lamps on as much as anyone.”

Responses **“I’ll test the socket”** → talk objective; **“Until next time”** → close. Repeat: “I can take you to the place I heard it. The instrument should be allowed to disagree with me.”

**Tavi pending `hint:mission:antipion:wisdom`:** before item, “Read the marker and hear Naru. The chest with the listening element is inside the nearby cave; the map will show its known entrance and the exit while you are inside.” With item, “You have the element. Return through the marked exit and fit it into the socket beside me.” With fitting complete, “The socket answers. Tell me what we can decide tonight.” **Commitment choice:** “We’ll decide with evidence and revisit the result” → existing commitment ID. **Chest prompt:** “Open old listener chest”; **item acquisition:** “You take the naturally wound listening element. The socket in Trashobu is marked.” **Fitting prompt:** “Fit listening element”; **fitting success:** “A low pulse reaches the socket before the surge. Tavi records the interval; Naru's earlier observation can now be repeated.” **Tavi ready/report (two captions):** “The test does not settle every question Naru asked, but it gives us a warning we can act on. The families will have light tonight.” / “I will review the interval after the next surge. Will you tell Saima that the decision is provisional?” Response **“I’ll tell her how you decided”** → `turnIn mission:antipion:wisdom`. Completed repeat: “The lamps are on. Naru and I still compare notes.”

### Final sequence device and exact conditions

New proposed puzzle `puzzle:antipion:final-sequence`, goal `goal:puzzle:antipion:final-sequence`, at a verified reachable position within interaction range of Saima's capital precinct. Four components (stable IDs ending `:ground`, `:word`, `:pattern`, `:welcome`) have matching visible names and marks. The exact world position and asset instance IDs are assigned by the compiler from safe reachable cells; do not invent coordinates in dialogue. `unlockWhen.completedMissionIds` contains precisely `mission:antipion:body`, `mission:antipion:speech`, `mission:antipion:mind`, and `mission:antipion:wisdom`.

**Locked, before the four reports:** action label “Four regional accounts needed”; Intuition “The four measures are still. {completedCount}/4 regional accounts have been reported to their keepers. Return with the others before Saima can convene the final test.” Selecting Action presents a brief, non-mutating result and does not reveal or advance a sequence cursor. No active final puzzle marker appears on the map.

**Available, four reports complete:** action label “Inspect Ground/Word/Pattern/Welcome”; Intuition “The four regional accounts are present. Current order: Ground → Word → Pattern → Welcome. Progress: {cursor}/4. Touch a named measure to pulse it; a different next measure resets this attempt only.” Choose a simple `sequence` mechanic with initially ready components, or extend the existing resonance family to skip the value-setting phase for this device only. Do not imply the old `balanced` machine is already a direct four-step sequence. Nemi speaks the clue before the device becomes the default waypoint.

**After each correct touch:** “{label} answers. {cursor}/4 measures hold.” **Wrong touch:** “The pattern falls quiet. The accounts remain; begin again at Ground.” **Success:** “Four distinct pulses settle into one returning current. The capital relay and its linked lights answer. Speak to Saima about what this result should mean.” This completes the puzzle objective of `mission:antipion:bliss`; subsequent objective is her commitment. Success effects are applied once, and no repeated click can duplicate settlement rewards.

### State and response wiring checklist

| Dialogue state | Predicate / event | Node or action |
| --- | --- | --- |
| Saima arrival | `mission:concordance:meaning` active; `mission:antipion:balance` available | `greeting`; local accept choice |
| Saima local pending | `mission:antipion:balance` active | `hint:mission:antipion:balance` and short local return |
| Saima local result | `mission:antipion:balance` completed; `mission:concordance:meaning` ready | `local-account`; report main chapter |
| Saima regional work | `mission:concordance:order` active; fewer than four regional missions completed | `regional-account`, plus optional `saima:partial` |
| Saima four reports | All four completed, `mission:antipion:bliss` available | `four-accounts`; accept synthesis |
| Saima final pending | `mission:antipion:bliss` active; final puzzle incomplete | `hint:mission:antipion:bliss` |
| Saima final decision | Final puzzle completed; commitment absent | `final-account`; record commitment, report synthesis |
| Saima chapter report | Synthesis completed; `mission:concordance:order` ready | Short report action; show chapter completion exactly once |
| Saima afterward | `mission:concordance:order` completed | `journey-complete`; brief repeat on later visits |
| Each regional keeper | Own mission available / active / ready / completed | First meeting / dynamic `hint:mission:antipion:{layer}` / report / changed-state repeat |
| Each witness | First talk / subsequent talk / local mission complete | Three-caption testimony / one-line reminder / observed consequence |

The current predicate vocabulary supports `missionState`, `all`, `not`, and flags, but it does not directly count four completed missions for dynamic prose. Implement `four-accounts` as an `all` predicate over the four mission states and compute `{completedCount}` / `{nextKeeperName}` for presentation from the current save, or author a bounded set of explicit state variants. Test entry ordering: `journey-complete`, chapter report, final decision, four reports, regional work, local result, initial arrival. Do not attach the same copied choice list to every node; expose only choices meaningful in that state. The existing dialogue system already renders caption arrays; new text should be authored in source and emitted into its keyed JSON records.

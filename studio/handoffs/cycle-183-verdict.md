# Cycle 183 — Verdict

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-596 — the festival gathering (Milestone 28 structure arc 1)

**Rationale:**
- 8/8 criteria pass, none by inspection only. The calendar is a pure function with its window and once-a-season rule
  pinned in units; the live path (a 3 s real-time check gated like the sky roll) is pinned by an e2e that lets the
  clock run from 09:59 and watches it open on its own.
- Guests are not migrants. They take a bare `setZone`, none of `crossDino`'s founding, carrying, tenure or
  seen-ground effects. A guest is a visitor, and nothing about the ground it came from changes because it went to a party.
- A save never strands a guest: `currentSaveData` writes every guest back to its home ground while one is present.
  The new field is optional and absent until a festival is held, so an old save round-trips to itself.
- Migration does not roll during the festival or the walk home. This is the cheapest guard against the bowl
  briefly holding twice its capacity.
- Ceiling, named: an away span that crosses a festival day holds no festival. It is checked only on the live clock,
  by design, so a restore cannot conjure one.

**Reachability (v7):** *In a fresh save, watched for ten minutes, what does the player see that they could not before?*
The park boots at 08:00 on day 1, which is the first day of spring. At 10:00, two real minutes in, a banner reads
*"🎏 The spring festival — the whole park gathers at the bowl pond"*. Bramble, Pip, Thornback, Murk and Ember walk
in from the bowl's east edge, and all ten dinos ring the pond. Before tonight, no resident of another ground had
appeared in the bowl except by migrating. At 12:00 the five guests walk back out.

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-594 — who leads and who sulks (Milestone 28 lore arc 1)

**Rationale:**
- 6/6 criteria pass. Leader, sulkers, rings, registers and memories are pure and unit-pinned. The founding-park
  outcome is pinned twice: in a unit test on the founding graphs and in an e2e on the live park.
- The designer corrected the lore handoff from the data. Rex was the guess, but Sunny's founding bonds sum highest
  (62), so Sunny leads. Leadership is read from the graph, not chosen by hand.
- A sulker never leads, and the leader's line uses the same three-register split 139 uses for the thankful line.
  So a prickly leader would open with *"Fine. Everyone's here."*, and the park already knows how to read that voice.
- Not shipped: the post-festival greet (595), any bond change from attending, and the model's half.

**Reachability (v7):** the same two minutes. Sunny walks onto the festival tile and opens with *"Everyone's here!
Spring's come round again — come stand by the water!"*. Mossback and Twitch both float *"😤 not standing anywhere
near …"*, naming each other, and stand at the edge of the circle. Each of the ten files its own memory of the day.

## Board
Build clean; unit 3302 (+8); e2e 898/898 on the first full run; web-llm boundary clean; one additive optional save
field. CI on `main` going in: last run `success` (cycle 182-art).

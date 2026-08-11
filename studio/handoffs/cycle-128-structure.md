# Cycle 128 — Structure Handoff

**Intent:** Make the skyline cost something. Every other economy in this park has a running cost — food
spoils at cap (455), a plot's yield can be worked flat (384/473), a pile drains when it builds — but a
**structure**, once raised, is permanent and free forever. That is why a zone's structure count is the
one number in the park that only ever climbs, and why the prosperity index (428) has a term that can
never fall. BACKLOG-480 gives a standing landmark a small upkeep drawn from its zone's resource pile,
and lets a ground that can't pay drop a landmark into **disrepair** — a reversible state, not a
demolition — with the granary's food-cap lift (454) and the prosperity index then reading the
*maintained* count rather than the raised one. The spoilage lesson applied to walls: plenty you don't
tend stops being free.

**Added to Structure Track:** none. The queue stands at 4 open (466 / 480 / 482 / 481) — **at** cap
X=4, so drain-before-invent forbids brainstorming. Picking 480 drops it to 3; the *next* Structure-smith
fire may refill.

**Chosen this cycle:** **BACKLOG-480** — per-day upkeep from the zone pile, reversible disrepair, and
every downstream read moved onto the maintained count.

**Milestone:** Milestone 12 ACTIVE, structure arc **4 of 4** — the last one. If it ships, the structure
half closes and **the milestone ships**.

**Collision check vs. the lore pick (401):** clean and total. 401 is per-pair, reads the recall ring,
and fires on the drop hook inside `checkFeeding`. 480 is per-zone, reads the resource stockpile, and
fires on the in-game-day hook beside `checkSpoilage`. No shared module, no shared save field, no shared
render. The only overlap is the collection book, and 480 does not touch it.

**The expected shape of the finding (for QA and the Validator to hold the Coder to):** three things,
and the third is the one that will actually bite.

1. **Where "standing" is read, not just where it is written.** The maintained count has at least four
   consumers already (`baseLandmarks` granary gate, `hasGranary` cap lift, `zoneSignals.structures`,
   the map-lens 🏛️ marker). A Coder that adds a `derelict` flag and updates only the prosperity fold
   has half-shipped it. Grep every consumer of the four structure arrays and decide *per consumer*,
   out loud, whether it wants raised-or-maintained.
2. **The granary is a trap.** `hasGranary` currently answers two different questions with one call —
   *does this ground get the +3 cap?* and *has this ground already used up its one granary slot?* The
   moment a granary can be derelict those answers diverge, and a naive maintained-only `hasGranary`
   lets a zone build a **second** granary while the first stands rotting. The one-per-zone gate must
   keep reading the raised count; only the cap lift moves to maintained.
3. **It must be inert on a fresh park, and self-limiting after.** 476's calibration is the precedent:
   the park boots with few landmarks and a thin pile, and an upkeep that bites on day one would read as
   a bug, not an economy. A ground with a single landmark should owe nothing. And disrepair must have
   a floor in practice — a zone that has lost landmarks owes *less*, so the system pushes toward a
   sustainable skyline instead of cascading a ground to zero.

Away-catch-up symmetry is expected too (455 got its 462 twin in the very next cycle): a park left alone
for days should come back to the upkeep it owed, through the same pure function, not a second rule.

# Cycle 77 — Structure Handoff

**Intent:** The two zone economies exist but are sealed off from each other. Per-zone resources (314) and per-zone stockpiles (328) shipped, but a branch banked in the grove can never reach the bowl — the piles only ever grow from local gathering. **BACKLOG-329 (carry between zones)** opens the first trade route: a dino that visibly crosses (334) ferries one banked resource from the zone it's leaving to the zone it's entering. It's the load-bearing prerequisite for everything that *flows* between zones — directed carry (356), edge barter (358) — and gives the divergent piles (348) a reason to matter.

**Cap rule:** queue was at **3 open** (329/348/349 < X=4), so seeded **3** new structural items.

**Added to Structure Track:**
- BACKLOG-356 [emergent] Directed carry — ferry the kind the destination is short of, not a random spare.
- BACKLOG-357 [core] Both-zone stores readout — the plaque shows both piles at once.
- BACKLOG-358 [emergent] Edge-meet barter — two dinos from different zones swap a resource each at the shared edge.

**Chosen this cycle:** BACKLOG-329 — carry between zones (one banked resource ferried on a visible crossing).

**Files note:** 329 lives in `world/resource.ts` (a pure pick-one-to-carry helper) + `WorldScene.crossDino` (the transfer + log) + the save already round-trips `stockpileByZone`. **Disjoint** from the lore track's 346 (`world/groveword.ts` + `WorldScene.converse`) — both touch `WorldScene.ts` but in different methods (`crossDino` vs `converse`), no file-region collision. phase stays designer-pending.

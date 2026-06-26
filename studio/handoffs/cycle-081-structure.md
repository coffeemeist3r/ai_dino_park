# Cycle 81 — Structure Handoff

**Intent:** Advance the zone-economy spine. The two zones now gather different things (348 bias), bank
separate piles (328), and a crosser already ferries *something* between them (329) — but it carries a
*random* spare, so the trade route doesn't yet do any actual balancing. **Directed carry (356)** is the
beat that makes the route purposeful: a crossing dino ferries the kind the destination zone is *short of*
for its next craft, so once the economies diverge the carry pulls them back toward buildable. It's the
natural next vertebra — everything it needs (329 carry, 348 divergence, 328 per-zone piles) is shipped.

**Added to Structure Track:** BACKLOG-377 (zone-distinct craft) + BACKLOG-378 (third-zone spine) — the
queue stood at 3 open (356/357/358), below X=4, so I refilled by 2 (drain-before-invent). 377 makes each
zone *build* what its bias favors (diverging landscapes, not just piles); 378 generalizes the hard-coded
bowl↔grove pair into an N-zone chain, the spine the wider-map arc needs.

**Chosen this cycle:** **BACKLOG-356 — directed carry.** Top unblocked structural item. Files: a pure
`directedCarry` helper in `world/resource.ts` (the kind dest most needs for its next craft, src can
supply, dest can accept — falling back to today's `pickCarry` when dest is fully stocked) + a one-line swap
in `WorldScene.crossDino`. **File-disjoint** from the lore track's loner-payoff pick (369 → `loner.ts` +
the meet-site/`__bondPair` hook), so the Coder's two-track fire has no collision.

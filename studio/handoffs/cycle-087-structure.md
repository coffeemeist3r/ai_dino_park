# Cycle 87 — Structure Handoff

**Intent:** Advance the inter-zone economy spine. The two-zone trade route today is strictly *one-way*:
carry (329/356/377) moves a resource only when a dino physically crosses, and only in the direction it
walks. BACKLOG-358 adds the converse — when two dinos from *different* zones meet at their shared edge, they
**barter**, each handing the other the kind its zone is short of. It's the first two-way exchange, built
directly on the pieces already shipped: `directedCarry` (356, the "give what the other needs" logic) run in
both directions, `takeResource`/`bankResource` (the lossless transfer path 329 conserved on), and the
adjacency table (383) + `zoneNeighbors` (378) to know which edges link. No new spine — a second caller of
seams already load-bearing, so the diverging piles (348/377) now flow both ways.

**Added to Structure Track:** none — drained from queue (4 open = X=4; 358 / 384 / 398 / 400).

**Chosen this cycle:** BACKLOG-358 — edge-meet barter (top unblocked; 329/328/334/383 all shipped).

**File disjointness:** clean of the lore pick (405 solitary tic). 358 lives in `resource.ts` (`barterSwap`),
`zones.ts` (`nearLinkEdge`), and a `maybeBarter`/`doBarter` pair in WorldScene's `forceStep` **tail**
(beside `checkFeeding`/`maybeSpawnResource`). 405 lives in a new `world/tic.ts` and WorldScene's `forceStep`
**per-dino decision branch** (beside the wander/mope logic) — different methods' worth of the same file, no
symbol overlap. Coder does 405's decision-branch edit and 358's tail edit independently.

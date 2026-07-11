# Cycle 98 — Structure Handoff

**Intent:** Advance Milestone 3's economy spine — *All three zones farm*. Milestone 2 gave each zone
its own crop in the ground (418: bowl berries, grove greens), but the Fernreach — the third zone since
cycle 85 — still grows nothing (349 only ever cut a bowl + grove plot), and FOODS holds just two plant
crops, both already spoken for. This cycle gives the Fernreach its own plot and adds a third *farmable*
food, so the three-zone farming divergence 418 started reads complete: three zones, three distinct
crops in three distinct soils.

**Milestone duty:** Milestone 3 "Enough to go around" ACTIVE. This is Structure arc 2, *All three
zones farm — the Fernreach gets its own plot and a third farmable crop (BACKLOG-432)*.

**Cap rule:** Structure Track sits at 4 open (432/433/435/436) = X → at cap, **no new seeds**; drain.

**Added to Structure Track:** none — drained from queue (4 open ≥ X).

**Chosen this cycle:** **BACKLOG-432** — Fernreach plot + a farmable third crop. Top unblocked
structure item and the milestone's next structure arc.

**Complementarity with the lore pick (385/386):** disjoint surfaces. 432 is farm data — `world/foods.ts`
(a new crop) + `world/plot.ts` (the Fernreach's crop identity + plot tile) + the save's plot fields; the
plot machinery in `WorldScene` is already fully zone-generic (it iterates `PLOT_TILE_BY_ZONE`), so the
structure track adds a zone row, not new plumbing. The lore pick lives in `world/feeding.ts` +
`checkFeeding`. No file collision.

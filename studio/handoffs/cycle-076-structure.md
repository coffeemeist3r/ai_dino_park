# Cycle 76 — Structure Handoff

**Intent:** Localize the economy. The two zones now grow their own resources (314) and the split is legible (316), but everything a dino gathers — bowl or grove — still banks into one global pile with one global cap (285/309). Split the stockpile per zone so each zone banks, caps, and spends its *own* gathering. This is the load-bearing prerequisite for both queued economy beats: per-zone caps make carry-between-zones (329) a real transfer, and a divergent resource bias (348) only matters once piles are separate.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4: 328/329/348/349).

**Chosen this cycle:** BACKLOG-328 — Per-zone stockpile. Top unblocked (329/348 both build on it). The pure `resource.ts` helpers (`bankResource`/`atCap`/`canCraft`/`craft`/`buildShelter`) already take a pile argument, so they go per-zone unchanged — the work is a `stockpileByZone` map in WorldScene + an additive save migration (old single `stockpile` → bowl pile). Files (resource banking in `checkGather`, the plaque stockpile line, the stockpile save field) are disjoint from the lore track's migration-selection + new `curiosity.ts` — clean two-track fire.

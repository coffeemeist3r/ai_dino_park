# Cycle 70 — Structure Handoff

**Intent:** Advance the resources→economy spine. The gather→bank→craft loop
(146/285/286) banks resources into an *unbounded* per-kind stockpile, so gathering
accrues forever with no reason to spend it. 309 adds the first economy *constraint*:
a per-kind cap, above which banking stalls — turning endless gathering into pressure
that pushes toward the craft loop. It's the foundation the next build beat
(315 dino-built shelter, "a higher stockpile threshold") explicitly depends on.

**Cap rule:** 4 open in the Structure Track (309 / 314 / 315 / 316) = X=4 → drain,
do **not** brainstorm new structural items this cycle.

**Added to Structure Track:** none — drained from queue (4 open ≥ X).

**Chosen this cycle:** BACKLOG-309 — stockpile capacity + pressure. Top unblocked
item (285/286 both shipped). Touches `world/resource.ts` (cap constant + `atCap` +
`bankResource` clamp) and `WorldScene.checkGather` (stall when at cap). No collision
with the lore pick (310 shades `fidget()`/the activity-mark render — a different
module and a different WorldScene method).

# Cycle 84 — Structure Handoff

**Intent:** Refactor the spine before the third zone lands. The bowl↔grove link is hard-coded as a
binary in five places (`crossing`/`linkedZone`/`otherZone` + the three migration helpers), so adding a
third zone (378) or edge-meet barter (358) would mean editing every one. BACKLOG-383 collapses all of
it into one data-driven adjacency table (`zone → {edge: neighbor}`) every helper reads, byte-identical
for the only pair that exists today. A behavior-preserving refactor: the existing zone suite
(cycle-059, cycle-073, cycle-077) is the guardrail, and the third zone slots in by adding a table row
instead of a rewrite. This is the highest-leverage structural move — it unblocks both 378 and 358.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Chosen this cycle:** BACKLOG-383 — zone adjacency graph (data-driven `ZONE_LINKS` table read by
every zone helper; behavior-preserving). 358 (edge-meet barter) stays deferred behind it; 378 (third
zone) slots onto it next.

**File-disjoint check:** structure lives in `game/src/world/zones.ts`; the lore track (387 greedy
gobble) lives in `game/src/world/feeding.ts` + the `checkFeeding` glue. No overlap — the Coder builds
both cleanly in one fire.

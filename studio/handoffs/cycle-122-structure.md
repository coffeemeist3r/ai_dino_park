# Cycle 122 — Structure Handoff

**Intent:** Open Milestone 11 with the spine the whole milestone rests on. The park has four grounds and
a flat neighbour list, and I read the three cross-zone systems this cycle to check the item's claim before
picking it. It is worse than 475 states: the ferry and the demand read are one-hop *by construction*
(they only ever consult `zoneNeighbors`), which is defensible — but the two migration **pulls** this studio
shipped in the last two cycles are one-hop *by discard*. `plentyDestOf` (458) and `yearnDestOf` (362) both
compute what a dino wants and then throw the answer away if it isn't adjacent:

```
return zoneNeighbors(home).some((l) => l.to === target) ? target : null;   // plentyDestOf
yearnedZone(..., zoneNeighbors(home).map((l) => l.to), ...)                 // yearnDestOf
```

A dino standing in the bowl that misses the Hollow, or has heard the Hollow is thriving, wants nothing at
all. Both were correct when the chain was three long and every zone bordered the middle; the Hollow is the
first ground that can be two and three hops from a mouth that wants it. That is the milestone in one bug.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4: 466, 475, 476, 477).

**Chosen this cycle:** **BACKLOG-475 — distance on the chain.**

Not the top pointer (466, the dry season) — an off-order pick that needs its one line: 475 is a Milestone 11
structure arc and 466 is not, and the milestone rule puts checklist-advancing picks first. 475 is also the
arc's foundation: 476 (carrying capacity) wants a distance read to damp appeal *by how far away the crowd
is*, and 361/360 on the lore side both become richer once a dino can actually cross more than one ground.
466 keeps its place at the head of the queue for the cycle after the milestone.

**Shape (the Designer is free to override):** one new pure module — hops derived from `ZONE_LINKS` by
breadth-first walk, deterministic in link order, plus `stepToward(from, to)` (the neighbour on the shortest
path) and a nearest-qualifying pick. Then three call sites read it: the two pulls above stop discarding a
distant target and instead cross *one ground toward it* (arriving, the pull re-reads and steps again — the
walk emerges from the existing per-roll decision, no path state to persist), and the demand read (438)
prefers the nearest qualifying grower over the merely-largest one.

**No collision with the lore track.** 347 lives in the arrival seam (`crossDino`), the idle-bubble path and
the book; 475 lives in the migration *decision* (`scarcityMigrate`, `pickMigrant`, `yearnDestOf`,
`plentyDestOf`) and `lenses.zoneWant`. They meet at exactly one file, `WorldScene.ts`, in different methods.

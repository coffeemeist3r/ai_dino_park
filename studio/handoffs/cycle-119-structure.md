# Cycle 119 — Structure Handoff

**Intent:** Milestone 10's spine is the one line 449 wrote and left uncashed — *a fourth zone is a row,
not three branches*. Every cross-zone system built since (prosperity 428, harvest 433, demand 438, pantry
446, ferry 447, provider 448, migration 450, decline 460, governance 463/467/468) claims to generalize,
and three grounds has been too small a number to test the claim: with three zones a "neighbour" and "the
rest of the park" are nearly the same set. Tonight lays the fourth ground and lets those nine systems meet
it with no code written for them. Whatever breaks is the honest answer to a question the project has been
asserting for ten cycles.

**Milestone duty:** added the **Structure arcs** to Milestone 10 in `studio/MILESTONE.md` — the fourth
ground (472) and the unsettled ground (474).

**Added to Structure Track:** queue stood at **3 open** (466, 472, 473), below the cap of X=4, so brainstormed:
- BACKLOG-474 [core] The unsettled ground — a zone opens with zero residents and no provider and fills by
  migration alone; the first to settle founds it, the first to bank founds its provider. The M10 arc that
  turns 472 from a config row into something the player watches happen.
- BACKLOG-475 [core] Distance on the chain — a derived hop-distance off the adjacency graph, so the ferry,
  the demand read, and migration prefer the *nearest* qualifying ground rather than any neighbour. Only
  becomes a distinction worth drawing at four zones; queued, not picked.

Structure Track now stands at **5 open** (466 · 472 `[~]` · 473 · 474 · 475) — at cap, so the next fire drains.

**Chosen this cycle: BACKLOG-472 — The fourth ground.** On-milestone (structure arc 1 of 2). Top unblocked
item and the one everything else in M10 stands on: 474 needs a ground to be unsettled *in*, and 475 needs a
chain long enough for distance to mean anything.

**Collision check with the lore track (343, pioneer in the book):** clean at the data level. 472 is the
`ZONES` table, `ZONE_TERRAIN`, the adjacency links, the per-zone crop/waterhole tables and the lens box;
343 is one persisted `zoneId → first dino` map written at the existing crossing/settle seam and read by the
collection book. Both tracks land in `WorldScene.ts` but at different methods, and neither reads the
other's state. The happy accident: if both ship, the fourth ground gets its pioneer recorded with zero
extra code — which is exactly the generalization proof 472 exists to produce.

**Scope note for the Designer:** the deliverable is *the row plus the proof*, not new mechanics. The
fourth ground needs its `ZONES` row, its terrain descriptor, one adjacency link onto the existing chain,
its own crop (418), its own waterhole (445), and its box on the zone-map lens. Every other system should
need **zero** lines. Where one does need a line, that line is the finding — call it out in the codeplan
rather than quietly patching it, because a hard-coded three anywhere in the park is the thing this item
was written to smoke out.

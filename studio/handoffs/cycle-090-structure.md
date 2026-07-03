# Cycle 90 — Structure Handoff

**Intent:** Serve Milestone 1's structure half — the bigger world made *legible*.
Three zones exist and nothing on screen admits it: no cue at a linked edge, no way
to see the chain whole. This cycle ships the edge indicator (398, the operator's
own nudge); the map lens (425) and the save envelope the minds arc will need (426)
are seeded as the next two arcs. Structure arcs added to `studio/MILESTONE.md`.

**Added to Structure Track:** BACKLOG-425 (zone map lens), BACKLOG-426 (versioned
save envelope) — queue was 3 open < X=4.

**Chosen this cycle:** BACKLOG-398 — edge indicator. Reads the adjacency table
(383) so it's correct for any zone in the chain, both directions. Arc-sized under
v6: markers at every linked edge in every zone, legible label, correct after
migration/crossing, e2e-proven. File-disjoint from the lore pick (393 lives in
`ai/` + movement weights; 398 lives in `zones.ts` reads + a UI layer).

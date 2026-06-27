# Cycle 83 — Structure Handoff

**Intent:** Make the build arc's divergence *visible in the landscape*, not just the piles. For
two cycles the zones have leaned different resource mixes (348 bias) and the trade route has
balanced toward each zone's craft (356 directed carry) — but both zones still build the *same*
landmarks: every zone stacks cairns, then saves toward an identical lean-to (286/315 escalation,
zone-agnostic). 377 turns the bias into built form: the stone-rich **bowl** stacks 🗿 stone cairns,
the branch-rich **grove** raises 🛖 branch lean-tos. The two zones' skylines finally read apart.
This reuses the seam already built for it — `directedCarry`'s `recipe` param (356) — so the carry
route ferries toward each zone's *actual* structure, no new plumbing.

**Added to Structure Track:** 383 (zone adjacency graph — behavior-preserving spine for the third
zone, 378) + 384 (resource regrowth — the first renewable gather constraint). Queue was 3 open
(358/377/378) < X=4, so refilled to 5 per the cap rule (drain-before-invent now satisfied).

**Chosen this cycle:** BACKLOG-377 — zone-distinct craft. Picked over the top item 358 (edge-meet
barter), which is deferred: the zones share no physical tiles, so "two dinos meet *at the shared
edge*" wants the adjacency/edge work (383) under it first — awkward as a clean one-cycle beat now.
377 is the unblocked build-arc continuation, builds on the fresh 348/356, and is file-disjoint from
the lore pick (375 = feeding.ts + checkFeeding; 377 = resource.ts + checkGather/crossDino).

# Cycle 74 — Structure Handoff

**Intent:** Advance the resources→build spine past its first step. The cast has gathered (146),
banked (285), capped (309), and built one thing — the cairn (286) — for ten cycles. 315 gives the
build arc its second, *larger* structure: a dino-raised lean-to, the first real landmark a zone
earns. Now that the grove is inhabited (274), terrained (294), and zone-scoped (308), a structure
raised there reads as that place's own — and the lore track's 339 (first steps in the grove) means a
dino crossing in finally has something worth crossing *for*.

**REWORK check:** structure track's last verdict was APPROVED → pick fresh.

**Cap rule:** `## Structure Track` has **4 open** items (315, 316, 328, 329) — count ≥ X=4, so **no
new structural items** this cycle. Drain, don't invent.

**Added to Structure Track:** none — drained from queue (4 open ≥ X).

**Chosen this cycle:** BACKLOG-315 — Dino-built shelter. Top unblocked item; 286/308/309 all shipped.

**Build shape (for the chain):** mirror the cairn exactly. A richer recipe in `world/resource.ts`
(`SHELTER_RECIPE {branch:6, stone:4}` + `canBuildShelter`/`buildShelter`, pure twins of
`canCraft`/`craft`); the escalation gate is `SHELTER_AFTER_CAIRNS = 3` — because the cairn drains the
shared pile at {3,2} on *every* gather, the pile can never climb to {6,4} while cairns keep firing, so
once a zone has stacked 3 cairns it stops draining on cairns and *saves* toward one shelter (one
landmark per zone). Placed/persisted/zone-scoped exactly like the cairn: additive `shelters` save
field (mirrors `cairns`, old saves → [], no `SAVE_VERSION` bump), zone from the crafter's home zone
(308), 🛖 glyph fallback now with the pixel prop seeded as the lore track's 344.

**Collision check vs the lore pick (339):** disjoint. 315 lives in `checkGather`/`resource.ts`; 339
lives in `crossDino`/the forceStep arrival branch. No shared method.

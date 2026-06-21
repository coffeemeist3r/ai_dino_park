# Cycle 64 — Structure Handoff

**Intent:** Cash the build arc's first payoff. Cycle 62 made dinos *gather* (146), cycle 63 made the gather *bank* into a shared park stockpile (285) — a number sitting on the plaque waiting to be spent. This cycle a dino finally **spends** it: at a stockpile threshold, the cast turns banked branches and stones into the first crafted object in the bowl's history — a cairn. The first resources→**craft** step, the brick that turns "the dinos collect things" into "the dinos *make* things."

**Cap rule:** Structure Track was at 3 open (145 / 274 / 286), below cap X=4 → refilled. Added 2:
- **BACKLOG-293** [emergent] Crafted-object persistence — the cairn 286 places gets recorded in the save + re-rendered on load (built history accrues, not just remembered history).
- **BACKLOG-294** [core] Grove terrain — give the grove its own ground (floor tint + path/water sub-regions in `zones.ts`) so the benched path/water art (033) finally has a home.

Both are the natural follow-ons to 286 — once a thing is crafted, it should persist (293) and have a distinct place to stand (294 ties the grove into the build/art arc).

**Chosen this cycle:** **BACKLOG-286** — first craft. Top live-arc item, the direct payoff of last cycle's 285 stockpile, and disjoint from the lore track's files: 286 lives in `world/resource.ts` (a pure craft rule reading the stockpile) + a WorldScene craft check beside `checkGather`, while the lore track (288) is in the sky-gather step + the bond/memory store. One recipe, one output (a cairn at a threshold of branches+stones); multi-recipe crafting and building stay deferred to 029. Keep it pure + Phaser-free in `resource.ts`, additive on the save if the cairn needs to persist (or defer persistence cleanly to 293 — Designer's call on scope).

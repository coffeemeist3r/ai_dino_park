# Cycle 67 — Structure Handoff

**Intent:** Advance the bigger-world spine by making the second zone read as a *different place*. The grove has been walkable since cycle 59 (143) but renders as cloned bowl grass — a copy, not a destination. This cycle gives it its own ground: a distinct floor tint plus defined path/water sub-regions in `zones.ts`, which also finally hands the long-benched path/water tile art (033) a home to land in. Chosen now because it's purely additive — the grove draws empty of dinos today (143's intent), so a distinct grove floor can't regress the bowl — and its files (the `zones.ts` terrain layout + the floor bake/render swap) don't collide with the Lore-smith's book-UI pick (303). The heavier 274 (populate-grove, per-dino migration in `forceStep`) stays deferred; it's the riskier track and would collide with active per-dino motion work.

**Cap rule:** queue was at **3 open** (274 / 293 / 294) — below X=4 — so brainstormed **2** new structural items before picking.

**Added to Structure Track:**
- BACKLOG-308 [core] Zone-scoped world objects — cairns/plot/resources carry a home zone and render/interact only there (the per-zone world-state spine; the cross-zone prop bleed 294 will surface).
- BACKLOG-309 [emergent] Stockpile capacity + pressure — the shared stockpile gains a per-kind cap so gathering becomes a pressure that drives crafting (the first economy constraint).

**Chosen this cycle:** BACKLOG-294 — grove terrain (distinct floor tint + path/water sub-region layout in `zones.ts` + the per-zone floor render swap). Terrain definition + render plumbing only; the path/water **pixel rigs** stay the Artist's (033) — they drop into the sub-regions 294 defines.

**Flag (carried forward):** BACKLOG-293 (crafted-object persistence) still reads as already-shipped by 286's additive `cairns` save field (persists + re-renders on load). Recommend the Validator formally **ABANDON-as-duplicate** it on a future pass so the queue stops carrying dead debt — not picked this cycle (294 is the real work).

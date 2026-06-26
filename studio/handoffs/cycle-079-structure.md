# Cycle 79 — Structure Handoff

**Intent:** Finish the second zone's economy. The grove now gathers its own resources (314), banks
its own pile (328), leans its own resource mix (348), and trades over the carry route (329) — but it
still **grows** nothing. The plantable plot (145) is a fixed bowl-only installation (308 gates it to
the bowl), so the farming half of the economy lives in one zone only. **BACKLOG-349** gives the grove
its own plot: a second fixed plot tile in the grove, plant/grow/harvest on the same realtime-day
stage clock, zone-scoped so each plot draws and works only in its own zone. With it, the grove is a
genuinely self-sufficient economy — gather *and* grow — not a satellite of the bowl.

**Added to Structure Track:** none — drained from queue (4 open = X=4: 349/356/357/358).

**Chosen this cycle:** **BACKLOG-349** — top unblocked structure item. Generalize the single
`this.plot` to a per-zone map (`plotByZone`), add `GROVE_PLOT_TILE`, and key the existing
plant/harvest/refresh/save off the active/gatherer zone. Files (`world/plot.ts` + the plot glue in
WorldScene) are **disjoint from the lore pick** — 359 lives in `world/arrival.ts` (pond-proximity)
+ a new per-step pond-sight pass, not the plot's P-key/grow path — so the Coder's two-track fire
stays clean. Additive save (`grovePlot` alongside the existing `plot`); old saves load grove-empty.

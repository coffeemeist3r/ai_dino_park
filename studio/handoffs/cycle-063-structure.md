# Cycle 63 — Structure Handoff

**Intent:** Bank the build arc's first stored value. Cycle 62 shipped the gathering *spine* (146) — a
resource appears, a curious dino fetches it, a per-dino `gathered` tally rises. But that tally banks
nowhere: it's a counter on each dino, not a park resource the rest of the arc can spend. 285 turns the
flow into a stock — gathered resources accrue into a single shared, per-kind **park stockpile**
(`{ branch, stone }`), persisted and shown on the plaque, which is exactly the number 286 (first craft)
and 029 (crafting) will read a threshold off. Foundation that unblocks the most: pick it now.

**Added to Structure Track:** none — drained from queue (145/274/285/286 = 4 open ≥ X=4).

**Chosen this cycle:** BACKLOG-285 — resource stockpile (gathered resources bank into a shared per-kind
park total, persisted additively, with a plaque readout).

**File-collision check vs. the lore track (150 — stargazer's awe):** clean. 285 lives in
`world/resource.ts` (pure bank + readout helpers), `world/saveGame.ts` (additive `stockpile` field),
`ui/plaque.ts` (a third optional line), and the `checkGather` region of WorldScene. 150 lives in
`world/skyEvent.ts` + the `stepSky` region. The only shared file is WorldScene.ts, in two disjoint
methods — no clobber; the Coder can build either track first.

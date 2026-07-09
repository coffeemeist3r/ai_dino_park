# Cycle 96 — Structure Handoff

**Intent:** Close Milestone 2. Five of its six arcs have shipped; the last is the structure arc **BACKLOG-428 — the zone prosperity index**, the milestone's "a zone you can read" payoff. Every per-zone signal it folds already exists in isolation (stockpile 328, built structures 286/315/417, resident head count 316, crop harvest at the plot); 428 is the pure derived read that folds them into one legible tier and hangs it on the map lens (425), so "which zone is thriving" becomes a glance instead of four separate lookups. It is also the foundation the deferred governance/festival items (031/026) are meant to read instead of re-deriving.

**Cap rule:** Structure Track had 4 open (428/429/432/433) = X, so **no new items** — drained from the queue. (After 428 ships the queue falls to 3 < X, so next cycle's Structure-smith refills.)

**Added to Structure Track:** none — drained from queue (4 open ≥ X).

**Chosen this cycle:** **BACKLOG-428** — Zone prosperity index (pure `world/prosperity.ts`: fold per-zone stockpile total + crops harvested + built structures + resident heads into one score/tier; expose via the map lens + a `__zoneProsperity` hook).

**Scope note for the Designer:** "crops harvested" is a single global `harvested` counter today (per-zone split is the still-open BACKLOG-433). 428 needs a real per-zone farming term to be honest, so it adds the minimal per-zone harvest *counter* at the one harvest site and folds it in; 433's residual scope becomes *surfacing* per-zone farming as its own map/book line. Files: new `world/prosperity.ts` + `ui/lenses.ts` (tier on `ZoneMapEntry`) + `WorldScene.ts` (signals wiring, lens draw, hook). Clear of the lore pick (410 → `world/tic.ts` + the tic driver).

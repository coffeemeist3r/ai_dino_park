# Cycle 85 — Structure Handoff

**Intent:** Lay the third link in the chain. The world has been a bowl↔grove *pair* since cycle 59;
the cycle-84 adjacency graph (383) collapsed that hard-coded binary into a `ZONE_LINKS` table on the
explicit promise that "the third zone slots in as a table row." This cycle cashes that promise:
**BACKLOG-378** adds one more zone reachable by walking off the *grove's* far (east) edge — the first
zone that isn't bowl-adjacent — and generalizes the three things still keyed to a single neighbour
(migration's walk-to-edge / cross / entry helpers) past two, while occupancy and the zone tally
generalize for free (both already iterate `ZONES` / a zone→count map). The keeper crossing already
generalizes through the table; the work is making *dinos migrate* to a zone the home zone reaches
through a different edge than its other neighbour.

**Added to Structure Track:** queue was at 3 open (358/378/384, below cap X=4) → seeded three:
- BACKLOG-398 [core] Edge indicator — the operator's Idea-Box nudge, handed over by the Lore-smith; a cue at a linked edge naming the neighbour zone. Earns its keep now the chain is three zones long.
- BACKLOG-399 [core] Third-zone terrain identity — its own ground sub-regions (the grove's path/water treatment, 294), so the spine's tinted-grass placeholder becomes a real place.
- BACKLOG-400 [emergent] Third-zone resource bias — lean the new zone toward its own kind, extending 348 past two so the chain runs three diverging economies.

**Chosen this cycle:** BACKLOG-378 — third zone spine. Highest-leverage structural move available: it's
the exact item 383 was built to unblock, and it converts the adjacency table from "could hold three
zones" to "does." Ships spine-only — the third zone is walkable, inhabitable, migratable-to, and shows on
the tally; its distinct terrain (399), edge cue (398), and resource lean (400) follow.

**File-disjointness from the lore track (BACKLOG-390):** 390 lives in `feeding.ts` + `WorldScene.checkFeeding`;
378 lives in `zones.ts` + `WorldScene` migration/`drawFloor`/`zoneStores` glue. They share WorldScene but
touch disjoint methods — no collision. (Codeplan to confirm ordering.)

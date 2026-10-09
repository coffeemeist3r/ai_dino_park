# Cycle 182 — Structure Handoff

**Intent:** Milestone 27 structure arc 2: the grudge graph woven into the away system. `fastForward` drifts bonds
together and apart across an absence (106/113) but never touches the grudges (574), so a feud left for a week comes
back exactly as hot while every friendship around it has moved. This applies a capped per-minute cooling to the
grudge graph over the away span and lets the homecoming digest say so.

**Reachability:** the founding feud (Mossback|Twitch, 40) exists from frame one, and away beats fire at a five-minute
absence (`AWAY_BEAT_MIN_MINUTES`). Step away five minutes and the digest reads *"Mossback and Twitch cooled off a
little."*; stay away long enough to cross `RIVAL_BAR` and it reads *"Mossback and Twitch seem to have let it go."*

**Added to Structure Track:** none — drained from queue (3 open < X=4, but 578 was seeded with this exact slice in
mind and 563/581 still lack a reachability answer; brainstorming more would only pile on).

**Chosen this cycle:** BACKLOG-578 — grudges cool while you're away.

**Collision check:** 139 lives in `world/comfort.ts` and the greet opener chain; 578 lives in `world/away.ts` and the
two `fastForward` call sites. Both touch `WorldScene.ts`, in methods far apart.

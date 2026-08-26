# Cycle 141 — Structure Handoff

**Intent:** Milestone 16's spine is the CHARTER v7 bar pointed at the park's oldest structural loop. The
per-zone stockpile (285 → 328) is now load-bearing in five separate systems — it pays upkeep, it funds a
mend, it stakes a ballot, it fills toward the granary cap, it is what a courier ferries — and every one of
those is arithmetic the player can only witness by opening the zone-map lens and reading a line of text.
A dino carries a stone across a ground, which was the entire point of 328, and the stone becomes an integer
in a menu one screen away from where it was set down. Milestone 16 opens on that, because it is the single
largest gap between what this park has built and what it shows, and because everything else on the queue
gets easier once a ground has a place where its stock lives.

**Structure arcs added to MILESTONE.md** (the Lore-smith drafted the headline + feel arcs this fire):
- The pile gets a place (504, with 506 drawing the heap)
- The branch gets a stake (503)
- The frontier gets a reachable form (505)
- The reachability register (501)

**Added to Structure Track:** none — drained from queue (**5 open ≥ X=4**). First drain-not-invent fire in
three cycles, exactly as the cycle-140 housekeeping note predicted.

**Chosen this cycle:** **BACKLOG-504** — a per-ground bank tile the gathering visibly accumulates on, whose
rendered heap steps with `pileTotal` and shrinks when the pile is spent.

**Why 504 over the two items above it in the queue.** 495 (the founding fixture) and 501 (the reachability
register) are both *instruments* — they measure founding state and reachability rather than adding either.
An instrument calibrated the cycle before a founding-state change is an instrument that has to be
recalibrated the cycle after it, and 504 changes founding state (every ground gains a bank tile at boot).
Both instruments are better bought after this arc lands, and 501 is explicitly on the milestone for that
reason. 505 and 503 are the milestone's later arcs and neither is blocked by this one.

**Reachability, stated up front so the Designer specs to it (CHARTER v7):** in a fresh save, standing on
the Grove, there is a heap of gathered stone on the ground that was not there before, and it is *not* the
same heap ten minutes later — the founding stockpile must put a visible pile on the map at boot, and the
first upkeep bill or mend must be watchable as the heap dropping a step. A bank tile that ships empty on a
fresh park and fills on the day boundary is the exact defect the v7 corollary names. Founding constants get
tuned so the park starts *above* the first step, not below it.

**Collision check against the lore track (BACKLOG-300):** clean. 300 lives in the greeting/dialogue path and
the activity read; 504 lives in zone/stockpile state, founding constants and prop placement. The only shared
file either is likely to touch is `WorldScene`, and on opposite ends of it.

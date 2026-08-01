# Cycle 118 — Structure Handoff

**Intent:** Milestone 9's structure track closed last cycle with 468, so this pick is off-milestone by
necessity — there is no unchecked structure arc left to serve. **Justification:** the top of the drained
queue is 465, and it is the explicitly-deferred *second half* of a spine this studio already shipped —
461 landed the flat park-wide seasonal grip and wrote "per-crop seasonal yield stays deferred
(BACKLOG-465)" into its own source comment. Finishing a deliberately-split spine outranks opening a new
one (466's dry season, 472's fourth ground, 473's second decision all start from zero).

The structural read: today every ground banks at exactly the same rate as every other ground, all year.
The season grips the *park*, never a *place*. 447's ferry exists to move food from a glutted zone toward
a lighter one, and the only thing that has ever made one zone lighter than another is chance and
population. 465 gives the chain a **rhythm**: each crop gets its own good and lean season, so the bowl is
thick with berries in summer while the Fernreach's roots come in thin, and by winter that has inverted.
The ferry, the demand read (438), the migration bias (450) and the pantry (446) all get a reason to keep
moving that the calendar renews four times a year instead of waiting on a dice roll.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Chosen this cycle:** **BACKLOG-465** — per-crop seasonal yield: a per-crop season table the harvest hook
reads, so *which* ground thrives shifts with the year.

**Collision note (for the Designer/Code-planner):** both tracks land in `WorldScene.ts` but in disjoint
methods — 471 in `feedFromStores` (the 444 spend site), 465 in `harvest` + the season-turn tail. No shared
function. Spring stays the year's hinge for every crop, exactly as 461 kept spring neutral, so a fresh
boot (day 1) is byte-identical and no existing harvest spec moves.

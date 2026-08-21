# Cycle 136 — Structure Handoff

**Intent:** Advance the *performed economy* spine. Every other economy in this park is done by a body —
a harvest is hauled by the resident nearest the plot (448), a unit crosses an edge in the arms of a dino
that remembers carrying it (447/451), a landmark is raised where a dino was standing. Repair alone is
arithmetic: `runUpkeep` flips the oldest derelict flag on the day tick with nobody within ten tiles of
it. **BACKLOG-488** is the item that closes that hole, and cycle 135's operator pass is what makes it
worth building now — at `ACTIVE_SCALE` the day boundary is 24 real minutes rather than 24 real hours, so
a beat hung off upkeep is finally a thing a player can sit and watch.

It is also the item that forces the CHARTER v7 corollary to be honoured rather than quoted. `upkeep.ts`
documents its own inertness as a virtue ("a fresh park is inert (476's precedent)") — one landmark per
ground, no bill, nothing derelict, nothing to mend, ever, on any save a new player will ever open. Under
v7 that is a defect, and the fix ships **in this cycle, not behind it**: the founding park carries a
**fallen cairn in the Grove** and enough stone in the Grove's pile to put it back up. Bramble and Pip
live there (CHARTER v7's spread cast), the Grove is one edge from the player's spawn, and the item's own
backlog text already names the memory — *"put the Grove's cairn back up."*

**Added to Structure Track:** none — drained from queue (3 open; 488 is the top unblocked item and its
dependencies 480 / 485 / 447 / 451 all shipped). *(Note: the queue is at 3, one below cap X=4. Rather
than invent a fourth for the sake of the count, cycle 135's operator block already left **BACKLOG-493**
resolved and the two remaining — 489, 492 — are both Milestone 15 structure arcs with clear motivation.
Inventing a fifth structural item this cycle would pad a queue the milestone is about to drain. Flagged
here so the next fire can decide with the number in front of it.)*

**Chosen this cycle:** **BACKLOG-488** — hands on the derelict. A resident of a ground carrying a ruin
walks to it and the patch-up resolves **on arrival**, not on the day tick; the pure arithmetic in
`upkeep.ts` is untouched, what moves is *who* triggers `repaired` and *where they are standing when it
happens.* Plus the founding-state change that makes it reachable on a fresh ten-minute save.

**Milestone:** Milestone 15 structure arc 1. On-milestone.

**Cross-track note:** the lore pick (BACKLOG-420) lives in `world/tic.ts` and the greet path
(`WorldScene.replyFor`); this item lives in a new `world/mending.ts`, the landmark arrays, the founding
seed and the world step. The only shared file is `WorldScene.ts`, in regions that do not touch.

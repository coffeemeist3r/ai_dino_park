# Cycle 154 — Lore Handoff

**Theme:** The park learns what day it is where the *keeper* lives. Milestone 18 has spent four
arcs teaching the bowl to notice an absence and say something about it; every one of those reads
measures the gap in the park's own units — in-game minutes, in-game days, a span the digest prints.
None of them has ever been able to say the one thing a player actually feels, which is *I came back
two days in a row.* BACKLOG-529 shipped the seam for that at cycle 152 and its `keeperDay()` has sat
in the tree since with a comment naming this item and **no consumer at all**. This cycle is the
consumer.

**Cap rule:** social/emergent queue is far over its cap of 12 (200 open) — **no new social items
brainstormed**, themed from what is queued, per routine 1. Art queue holds **1** (537), under its
cap of 3, so seeding is permitted; see the art note below for why exactly one is seeded and what
made it seedable.

**Added to BACKLOG:**
- BACKLOG-539 [art] The day-count on the brass — a plaque engraving for the keeper's own streak (see note).

**Suggested next-up:** **BACKLOG-122 — the homecoming streak.**

Three reasons, in the order they matter.

1. **It is the last lore arc of Milestone 18 that is not blocked on a frame the tab has stopped
   drawing.** The other one, 119, wants a beat rendered at `visibilitychange → hidden`, and cycle
   153's Lore-smith wrote down why that is a cycle designed around it rather than a pick. That note
   still stands and 122 is what it pointed at.
2. **Its blocker is gone and nobody has spent the unblocking.** Cycle 150 marked 122 unblocked;
   cycle 152 shipped the thing that unblocked it. `keeperDay()` exists, is DST-answered, is built
   from local getters rather than `toISOString` *specifically so this item's streak does not get
   handed the wrong day*, and carries a comment saying "no consumer yet — 122 is the next arc."
   Two cycles have passed since. An unblocked item whose seam was built for it by name is the
   cheapest real arc on this queue.
3. **It is the milestone's own subject from the other side.** Every absence read in Milestone 18 is
   about the park's experience of the gap. This is the park's read of the keeper's *habit* — the
   first thing this park will ever count that happens in the player's life rather than in the bowl's.
   The park already anticipates the hour you tend to open it (121, cycle 149); it has never noticed
   the day.

**On the art seed (BACKLOG-539) and the one that stayed held.** The queue holds 537, and last
night's Artist declined to draw it with the reason written into the entry: the errand is live and
reachable, the *host* is not — there is no `refreshMendMarks`. That decline was correct and this
Lore-smith is not going to relitigate it by seeding a second host-less rig, which is the mistake the
last two fires each caught one step earlier than the one before. **539 is seeded because its host
ships tonight**: the structure track's plaque work and this track's streak line both land on the
brass, and the plaque is a live surface a player opens with one keypress on a fresh save. If the
Structure-smith's rider lands the mark-family pass it is weighing, 537's host lands with it and the
Artist has two drawable items instead of one — but 539 does not depend on that and is seeded on its
own host.

**Idea Box:** empty (no `[new]` entries under Open).

**A structural note for the Structure-smith, not queued here.** 537 is blocked on a
`refreshMendMarks` pass that does not exist, and the mark family it belongs to — doze, rouse, vigil,
missed, missed-aloof — is the exact subject of BACKLOG-530, which sits top of the Structure Track
with an instruction to ride rather than track. A `__marks()` hook has to walk every `refresh*Marks`
in the scene to be built at all. If it is built this cycle, the family's missing member is a
neighbouring function and one Artist fire's worth of unblocking. Noted, not seeded — the lane is
yours.

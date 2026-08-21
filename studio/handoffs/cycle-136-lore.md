# Cycle 136 — Lore Handoff

**Theme:** *Somebody does it.* Cycle 135 closed Milestone 14 and then spent an operator pass proving
that half of what this park had built was unreachable — a cast stacked in one ground, a migration
nobody could wait out, a day that cost twenty-four real hours. The clock now runs at two rates and the
cast ships across the map, which means the systems built on the day boundary are, for the first time,
things a player can *sit and watch*. Milestone 15 is the follow-through: the park's work grows hands
(a body performs it, in a place, where you can see it), and the park's private moments stop repeating
themselves (a solitary dino caught twice does not say the same thing twice). Both halves are the same
sentence — **a park is what you can watch happen, not what its save file says is true.**

**Milestone:** none was ACTIVE. Drafted **Milestone 15 — "Somebody does it"** in `studio/MILESTONE.md`
(lore arcs here; the Structure-smith adds the spine arcs in its fire).

**Cap rule:**
- *Social/emergent queue:* ~215 open ≥ 12 — **no new social items seeded.** The queue is the landfill
  the cap exists to stop; this cycle drains from it.
- *Art queue:* 1 open (`BACKLOG-490`, 2 of 7 drawn) < 3 — **one art item seeded**, below.

**Added to BACKLOG:**
- BACKLOG-494 [art] Ruin rigs — a *derelict* grid per landmark rig (a toppled cairn, a caved lean-to, an
  unravelled thatch, a cracked granary), so disrepair reads as a **fallen thing** rather than the same
  prop at 45% alpha. `DERELICT_ALPHA` was the honest placeholder when nothing was drawn; with the
  founding park now shipping a ruin in the Grove (this cycle's structure track) it is the first thing a
  player walks up to. Renders standalone — a prop rig, so it clears the stash-ahead rule (cycle 91)
  without waiting on a host. Builds on 480 / 488 / 344 / 427 / 454.

**Suggested next-up:** **BACKLOG-420 — Caught again.** The keeper greeting a dino mid-ritual has read
exactly two ways since cycle 89 — bashful if it barely knows you, pleased if it loves you — and it has
read that *same* way on the first catch and the fifth, in the same unbroken stretch of solitude. A dino
whose reaction to being found never changes is not a mind; it is a lookup table with a warm coat of
paint. 420 gives the catch a **register that escalates within one stretch**: pleasure → playful teasing
→ fond resignation, and a tease worded from that dino's own signature axis so five dinos are teasing you
five different ways. It is reachable in the first minute of a fresh save (walk up to a ticcing dino,
press Z, press Z again), it costs no new system, and it is the smallest change in the park that turns a
repeated event into a *relationship*.

**Idea Box:** empty (no open entries).

**Noted for the Structure-smith:** the top of the Structure Track (**BACKLOG-488**, hands on the
derelict) is the exact structural twin of this cycle's lore pick, and it now clears the CHARTER v7
reachability bar for the first time — the day boundary is 24 real minutes, not 24 real hours. It will
need a founding-state change to be watchable (a fresh park has one landmark per ground and therefore
nothing to mend); per the v7 corollary that is part of the item, not an excuse to defer it. Its files
(`upkeep.ts`, the landmark arrays, the founding seed) do not overlap the lore pick's (`tic.ts`, the
greet path), so the two tracks build clean in one Coder fire.

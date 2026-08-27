# Cycle 142 — Structure Handoff

**Intent:** Give the branch a stake. `zoneChain()` walks the grounds east in a line and exactly one of
them — the Ridge — hangs off a branch out of the Grove's north edge. It is the most interesting piece of
map geometry this studio has built, and it is spent on nothing: the Ridge grows what the line grows, banks
what the line banks, and every migration heuristic that weighs it (450's prosperity pull, 340's
homesickness, 476's crowding damp) is choosing between two identical arguments. This cycle makes the climb
mean something — the park's first genuinely **zone-exclusive** resource, the landmark built from it, and a
body that sets out for it because its own ground has none.

**Structure Track count:** **4 open** (495, 501, 505, 503) — at the cap of X=4, so **no new structural
items brainstormed**; drained from the queue for the second cycle running.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Chosen this cycle:** **BACKLOG-503** — the branch with nothing to choose.

**Why 503 over the three above it in the queue.** Milestone duty says pick toward the unchecked structure
arcs first, and three of the four queued items are on the milestone (501, 505, 503); 495 is not, so it is
out on that rule alone. Between the remaining three:

- **501 (the reachability register)** sits above 503 in queue order and is the item this smith would
  ordinarily take. It is deferred one cycle on the bar it exists to enforce. Asked CHARTER v7's own
  question — *in a fresh save, watched for ten minutes, what does the player see that they could not see
  before?* — a register of machine-checked claims answers "nothing", and the honest way to ship it is
  beside a cycle whose reachability claim it can *register*. 503 manufactures exactly that claim. 501 goes
  next cycle with 503's entry as its first row.
- **505 (the frontier's form)** is a *decision* item — it asks what an unsettled ground is for in a park
  with none, and the two honest candidates it names (a sixth ground, or re-pointing the tier at a ground
  that has lost its last resident) are both larger than they look and both touch the residency invariant.
  It also collides head-on with 503's file set: both edit the migration destination tiers in `WorldScene`.
  Doing them in the same cycle would mean two new tiers landing in one ordering, written blind of each
  other.
- **503** is the one that puts a thing on the ground. It is also the operator's own Idea Box nudge from
  2026-07-18, which cycle 106 routed to this lane with an explicit instruction — weigh the "genuinely
  zone-exclusive resource → a body that must go fetch it" framing *when 450 is built*. 450 has been built
  for thirty-six cycles.

**The shape, so the Designer and the Coder can see the seam.** The stake is **obsidian**: a fourth
`ResourceKind` that rolls on the Ridge and on no other ground, and is the *only* thing the Ridge rolls —
an exclusivity, not 348's lean. The Ridge raises a **beacon** from it, its own entry in the
`STRUCTURE_BY_BIAS` table 377/417 already built for exactly this. And the pull is a new migration
destination tier — a **quarry errand** — that aims a migrant at the Ridge (multi-hop, through 475's
`hopToward`) when its own ground holds none, with the existing carry (`pickCarry`) ferrying the shard home
on the way back. The *need* is the granary: `GRANARY_RECIPE` gains one obsidian, so a ground that wants to
lift its food cap has to have sent somebody up the mountain.

**Deliberately not done:** a tithe of obsidian on *every* structure recipe. It is the version of this item
with the most teeth — no skyline anywhere in the park without a climb — and it reaches into
`CRAFT_RECIPE`, which `directedCarry` (356), `pressuredCarry` (429) and `barterSwap` (358) all read as the
deficit driver, plus thirteen spec files. That is a second cycle's work with its own verdict, not a rider
on this one. Filed as the follow-up in the design's Out of scope.

**File-overlap note for the Coder:** the lore track (507) works in `world/tic.ts` and the *sprite* layer of
`WorldScene` (a `syncBank`-shaped draw loop). This track works in `world/resource.ts`, a new
`world/quarry.ts`, `world/granary.ts` and the *migration/spawn* layer of `WorldScene`. The two meet only
in the import block and the dev-hook block. No shared function.

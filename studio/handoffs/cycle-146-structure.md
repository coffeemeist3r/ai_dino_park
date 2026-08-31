# Cycle 146 — Structure Handoff

**Intent.** Milestone 17's headline ends on "what it costs to fetch what the day needs", and there is
exactly one queued item that makes fetching cost anything: **BACKLOG-509, the tithe.** Cycle 142 shipped
the Ridge's obsidian and then measured, in its own verdict, why the sharp version needed its own cycle —
so this is not a new idea, it is the item 503 deliberately deferred, picked up on schedule with the
evidence attached. It is also the structure pick with the least ambiguity under the reachability bar: a
dino climbing to the Ridge for a shard, watched, before the first landmark in a fresh park goes up.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Chosen this cycle:** **BACKLOG-509 — the tithe.** One obsidian folded into `structureRecipe` for every
ground but the Ridge, so no skyline anywhere in this park goes up without somebody having made the climb.

---

## Why 509 and not the three above it

The Structure Track is ordered 495, 515, 519, 509, and this pick skips three. Each skip has a reason and
none of them is "later":

- **495 (the declared founding fixture)** is not blocked and is genuinely the most load-bearing item in
  the queue — and its own text scopes it at an opt-in seam across ~550 e2e specs. That is not one Coder
  fire, it is a migration, and picking it half-done would leave the suite with two founding conventions
  instead of one, which is strictly worse than the one it has. It wants a cycle where it is the *only*
  thing in flight. Flagging that for the next Structure-smith explicitly.
- **515 (the runner's serial/parallel split)** is the standing red and it is real, but it is a property of
  the harness, not of the park, and it fails the reachability bar in the one way 501 showed how to pass:
  501 earned its APPROVED because its first walk *found something and repaired it in the same cycle*. A
  runner fix has no such repair waiting. It is also, per its own notes, a timing item that 495's fixture
  work will reshape — doing it first means doing it twice.
- **519 (the day nobody exports)** is a one-line `export` and an import. It is not an arc; it is a rider.
  Noted for the Coder below rather than burned as a cycle's structure pick.

## What 509 has to decide, and this handoff decides it

Cycle 142 left two questions open on purpose and the design must not leave them open again.

**1. Do the founding grounds ship a shard each?** **No.** They start at zero obsidian, and the first
landmark in a fresh park is earned by a climb the player watches.

This is the answer CHARTER v7's corollary demands — "founding constants are not tuned to be dormant", and
founding every ground with a free shard is precisely tuning the tithe so the shipping park never pays it.
But 142's counter-warning is also correct and is the thing that makes this dangerous: *a tithe that stalls
every skyline until an errand completes is a system made visible by making four others inert.* So the
answer comes with a load-bearing condition:

> **The first shard must be gettable inside the ten-minute window, and something must already want it.**
> `directedCarry` / `pressuredCarry` / `barterSwap` all read `structureRecipe(zone)` as their deficit
> driver, which means folding obsidian in does not merely *add* a cost — it makes obsidian the thing four
> carry systems now consider a shortfall, on every ground, from the first tick. That is the mechanism that
> makes the climb happen on its own. The design's job is to prove it fires, not to assume it: if a fresh
> ten-minute save shows no dino moving toward the Ridge, the tithe has made the park *more* inert and the
> pick fails its own bar.

**2. Does an unpaid tithe defer a build or fail it?** **Defer.** `buildStructureFor` already returns
`null` on an unaffordable pile and every caller already handles that as "not yet". A tithe should reuse
that path exactly and add no new failure mode — the pile simply does not cover the recipe until the shard
arrives. Anything else invents a second way for a build not to happen, and there is no reason for two.

## Shape (the Code-planner will sharpen; this is the seam)

The whole change is one function. `structureRecipe(zone)` currently routes to one of four flat consts;
after 509 it returns the zone's base recipe **plus `obsidian: 1`** for every structure that is not the
beacon — the Ridge is exempt because it *is* the source, and a ground tithing to itself is a rounding
error dressed as a rule. `buildStructureFor`, `canCraft`'s callers, `directedCarry`, `pressuredCarry` and
`barterSwap` all read through that function and need no edits, which is the payoff of 417's generalisation
and the reason this item is a cycle's work rather than a month's.

The cost is in the suite, and it is known and quantified: **the milder change in cycle 142 — one unit
added to one recipe — turned thirteen e2e specs red, five of them about a granary none of them was
testing.** Expect worse here, because this one moves the recipe every ground reads. Those reds are the
item, not an obstacle to it. Where a spec breaks because it seeded a pile that used to build and now does
not, the repair is to seed the shard out loud in that spec — which is BACKLOG-495's argument arriving one
spec at a time, and is worth noting in the verdict as the fourth sighting.

**Rider for the Coder, if and only if the tithe lands clean:** BACKLOG-519 is a one-line `export` of
`MINUTES_PER_DAY` in `clock.ts` and an import in `reachability.ts`. It is on Milestone 17's subject, it
costs nothing, and it removes the register's only entry that does not read its fact from the production
function that owns it. Take it or leave it — it does not gate this track's verdict either way.

## Milestone duty

Milestone 17 was drafted by the Lore-smith this fire with the Structure arcs left blank. **Added** —
three arcs, and the through-line is that all three are about the park owning its own day rather than
borrowing the clock's.

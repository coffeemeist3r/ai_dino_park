# Cycle 123 — Structure Handoff

**Intent:** Milestone 11's second structure arc, and the counterweight that has been missing since the day
migration got a direction. I read the decision path before picking, and the item's claim holds exactly:

```ts
// scarcityDestOf — the whole destination read
unsettledNeighbor(...) ?? richestNeighbor(neighbors, (z) => this.zoneAppeal(z)) ?? otherZone(home)
// zoneAppeal — prosperity + banked food. Monotonic in plenty. Nothing else.
```

Every pull in the park points *up* the appeal gradient and nothing points back down. 450 sends mouths toward
plenty; 460 makes the ground they leave hollow faster; 458 spreads word of the richest ground; 362 calls them
back to grounds they miss. Four systems, all accelerative, and the only brake in the whole set is
`ZONE_FLOOR` — a floor on the ground being **emptied**, never a ceiling on the ground being **filled**. A
ground can absorb the entire cast and the park has no way to notice, let alone object. At three grounds the
stampede had nowhere interesting to go; at four, with 475 now letting a pull reach clear across the chain, a
dino two hops away can be recruited into a pile-up it can't see.

**Added to Structure Track:** none — 3 open (466, 476, 477) after this pick, which is below X=4, so the
refill is due. Deliberately **not** doing it this cycle: 477 is the milestone's last structure arc and the
next fire is the one that should refill against whatever the milestone's closing item teaches. Noting it here
so the next Structure-smith fire treats a refill as its first job, not an option.

**Chosen this cycle:** **BACKLOG-476 — what a ground can hold.**

Not the top pointer (466, the dry season) — the same one-line off-order justification 475 took last cycle:
476 is a Milestone 11 structure arc and 466 is not, and the milestone rule puts checklist-advancing picks
first. 466 keeps its place at the head of the queue for the cycle after the milestone closes.

**Shape (the Designer is free to override):**

One new pure module, `world/capacity.ts`, with capacity **derived** — not a hand-written number per zone.
The 449 lesson is that a second table you have to keep in sync with the first is the bug; `ZONE_TERRAIN`
already holds each ground's `tileAt`, so how much open ground a zone has is a *fact the park already
contains* and just never asked for. Count the tiles a body can live on over the grid and divide by a single
tuned knob. A fifth ground is still a row, and it gets a capacity the day it gets a terrain function.

Then two reads, both strictly gated on `heads > capacity`:

1. **appeal damps.** `zoneAppeal` is documented monotonic in plenty and is read by `poorestResidents` as
   well as by `richestNeighbor` — the trap `frontier.ts` (474) already walked into and solved with a *tier*
   rather than a weight. Crowding is different from the frontier case: damping appeal for a crowded ground
   is correct in **both** readings (a crowded ground is genuinely a worse place to arrive at, *and* a
   genuinely more likely place to leave), so this one folds into the appeal number honestly. Worth the
   Designer stating that explicitly as an acceptance criterion.
2. **leave-lean lifts.** A crowded ground's settled residents resist the ambient wander at a lower damp,
   the same lever 460 pulled for a declining ground. A ground that is both crowded and declining takes the
   weaker hold of the two.

**Calibration matters more than usual here.** The knob must be set so the founding state — five dinos in the
bowl, everyone else empty — is **at or under** capacity, never over. If the park boots crowded, every pinned
migration spec in the suite shifts and the change becomes a rewrite of the test suite wearing a feature's
clothes (the M10 finding, in reverse). Ship it so the beat is dormant on a fresh save and bites only when
the cast genuinely piles up — which is exactly the pile-up 475 just made reachable.

**No collision with the lore track.** 361 lives in the arrival seams, `bookRows`/`BookRow`, and a new module
reading `seenZones` + `distance.ts`. 476 lives in `zoneAppeal`, the `maybeMigrate` resist gate, and a new
module reading `ZONE_TERRAIN`. They meet in `WorldScene.ts` in different methods, and in `saveGame.ts` only
if 361 needs a field (476 needs none — capacity is derived and crowding is read live).

# Cycle 133 — Verdict

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-407 — Shared tic (Milestone 14 lore arc 2)

All twelve acceptance criteria pass. The item does the thing the milestone's headline promises and the park
has never done: a behaviour crosses from one living dino to another. Every other way a dino comes by a trait
in this codebase runs vertically (seeded at birth, blended at a hatch) or inward (self-nudged by its own
experience, capped); this is the first horizontal edge, and it lands on the beat best suited to carry it,
because a tic is already the most *individual* thing a dino owns.

Three implementation calls are worth the record. The **band** rather than a radius: a watcher must be outside
company range, which is not a tuning choice but a consequence — a dino any nearer would have broken the
solitude the ritual requires, so the friend who can learn your ritual is definitionally the friend who left
you to it. The **axis key** in the save rather than the rendered tic, so a reworded glyph can never orphan a
learned habit. And the single `ticFor` funnel: three call sites previously read `signatureTic` directly, and
after 407 those three would have shown the player one ritual and the keeper another. Nothing in the diff
writes a bond — watching a friend reads the bond graph and never feeds it.

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-485 — The bill reaches the call (Milestone 14 structure arc 2)

All eleven acceptance criteria pass, and the compatibility claim is carried by the strongest evidence this
studio has: the entire prior suite ran **unamended**, including the three specs (cycle-121-work-priority,
cycle-128-upkeep, cycle-129-council-vote) that own the systems it wires together.

The shape is right. `decideWork` is the pre-485 ladder byte-for-byte — including what it *stores* — and the
public read wraps it. That split is the whole feature: a lean that had been written into
`workPriorityByZone` would have left every recovered ground stuck on an emergency footing nobody ever voted
to leave, and no acceptance criterion phrased as "a derelict ground gathers" would have caught it. The
criterion that does catch it reads the ground's call *before* the lapse and asserts the same value returns
after the patch-up.

---

## The finding of the cycle: the guard that silences exactly the wrong grounds

485's first draft was correct in every hook and posted nothing to the player. 481's `checkCouncilCall` seeds
silently on a ground's first recorded call — a sound rule for a vote, since a park's opening seating is not a
turnover. But a ground with no seated council never records a call at all, so its first record is always a
seeding, and a bill-driven turn from such a ground could never be announced. The grounds that qualify are
young, small, and poor: **precisely the grounds whose walls fall down.** The guard was silent exactly where
the feature lives.

It generalizes past this cycle. A freshness gate written against one source of an event will silence a second
source added later, and it will silence it most reliably in the cases that second source was built for —
because a new source usually arrives to cover the population the first one never reached. Every gate in this
park is now carrying an implicit "…as decided by the thing that was here first": 222/233's rumor freshness,
251's gratitude fade, 226's one-visit-per-sorrow, 471's once-a-day discontent. Worth a look the next time one
of them acquires a second cause.

The paired note is smaller and equally reusable: **zero existing assertions were amended for the second
cycle running**, on a suite ten specs larger than yesterday's. Milestone 12 kept finding assertions looser
than their systems; this milestone keeps producing items with an explicit unchanged fallthrough, and a suite
standing perfectly still is what makes the fallthrough a fact rather than a claim.

## Suite health — and a recommendation the studio should stop deferring

`mobile-minds` fell on the first full run and passed 5/5 isolated in five seconds; a fresh run was
522/522. That is the **third distinct victim in four cycles**, and cycle 132's argument — that one more clean
cycle would furnish BACKLOG-486's three consecutive green runs — did not survive contact with a suite ten
specs larger. The evidence is now unambiguous in the direction 486 already stated: the failure is a property
of the run. **Recommendation to the next Structure-smith: pick 486.** It is off-milestone, and the
justification is that the milestone's remaining arcs are being judged by a suite whose green is a coin-flip
away from being uninformative.

## Milestone

Milestone 14 arc 2 marked `[x]` on both tracks. Two arcs remain — 409 (a ritual with a name) on the lore
track, 487 (the other call goes to the council) on the structure track — plus 485's own newly-seeded
follow-up 488 outside the checklist.

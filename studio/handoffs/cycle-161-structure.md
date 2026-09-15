# Cycle 161 — Structure Handoff

**Intent:** Take the oldest known defect in the suite, and take it the way its own text says to take
it: **a reproduction first, not a fix.** `BACKLOG-538` has sat at the top of this queue since cycle
157 and has been re-diagnosed by five routines who each had ten minutes for it and no instrument. The
one thing that has ever moved this class of bug in this repo — cycle 148's `515` — moved when
somebody could reproduce it on demand and watch the victim move. Nothing in this repo can currently
answer the first question you would ask: **how long does a boot actually take, and how close to the
30s ceiling does it get under load?** Not once, ever, has that number been written down.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Chosen this cycle:** **BACKLOG-538** — the boot-flake instrument: a boot clock on every ordinary
run, and a standalone harness that puts N cold browsers on a cold server and prints the distribution.

## Solo cycle — considered and NOT declared

Cycle 161 is the first cycle in which a solo cycle is *legal* (`lastSoloCycle` 151, so
`161 - 151 = 10`), and both the cycle-160 structure handoff and the cycle-160 verdict recommended
declaring one here, for this item. I am declining, and the reasons are conditions the CHARTER states
rather than a preference:

**Condition 1 — unsplittable at a playable seam.** It is not. The item's own text names the seam in
its own words: *"The first deliverable is a reproduction, not a fix."* Measurement and repair are two
deliverables with a clean joint between them, and the first is worth shipping alone because the second
cannot be honestly attempted without it. A justification paragraph naming what makes this unsplittable
could not be written truthfully, and CHARTER v8 asks for exactly that paragraph.

**Condition 3 — passed over at least twice *for scope*.** It has been passed over four times (157,
158, 159, 160), but the record says why each time, and until cycle 159 the reason was **blockage**,
not scope: the reachability bar had no reading for `[infra]` and the item was not takeable. The
cycle-159 ruling supplied the reading. The evidence the condition asks for — *"two consecutive
pass-overs for scope is the evidence, and it is the only evidence that counts"* — has been generated
once, at cycle 160, not twice. A declaration on this record would be reading a blocked item's waiting
as a queue failing to drain, which is exactly the substitution the cap was written to prevent.

**And the cost is real.** Milestone 20 is at 4 of 6 with both remaining arcs on the lore lane. Spending
the studio's first legal solo cycle on an item that splits, and paying for it with the milestone's
pace, is the wrong trade when the same evidence lands beside a lore track tonight.

The declaration stays available. If the instrument this cycle ships proves the cause is something like
a budget floor that needs the ceiling, the workers, the fixture seam and thirty specs moved at once,
*that* is a solo-cycle item and it will have the evidence CHARTER v8 asks for, produced by this cycle.

## Why not 551, which is cheaper

`551` is ten lines and unblocks a third of the art queue, and the Lore-smith flagged it. It is third
in the queue, not top, and skipping past the top item for a cheaper one is precisely the pattern that
let `495` sit for fourteen cycles and `538` for four. It keeps its place.

## The reachability bar, answered

Per the cycle-159 ruling, `[infra]` answers the substituted question: *what can the next cycle do that
it could not do before, and what is the evidence produced in this cycle that it works?*

- **What the next cycle can do:** read a boot-time distribution off any full suite run, and reproduce
  the parallel-cold-boot seam on demand in minutes rather than by running 759 specs and hoping.
- **The evidence, produced inside this cycle:** the harness is **run** in this cycle and the verdict
  carries its numbers — the observed boot times, the worst boot, and the headroom against the 30s
  `BOOT_TIMEOUT`. The hard condition is that the deliverable is demonstrated, not described. It will be.

If the harness is run and catches nothing at any load it can produce, that is still a number this
project has never had, and the verdict says so plainly rather than dressing a null result as a fix.

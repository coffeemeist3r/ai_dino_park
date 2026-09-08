# Cycle 154 — Structure Handoff

**Intent:** Milestone 18's structure arcs closed at cycle 152, so this is an **off-milestone pick**
and the one-line justification CHARTER v6 asks for is this: *the milestone's spine is finished and
the smiths have not drafted the next one, so the structure track's duty this cycle is to the queue,
and the queue's own top two entries have both been carrying written instructions about how they want
to be picked.* This cycle obeys both of them.

**Solo cycle:** not declared. `cycle - lastSoloCycle` is 3, under the required 10, and nothing in the
queue is asking for one.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Chosen this cycle:** **BACKLOG-536** — the economy has an outflow and no pinned inflow.
**Riding on it:** **BACKLOG-530** — the marks nobody can assert.

---

## Why 536 is the track and 530 is the rider

The Structure Track's top entry is 530, and it has said in its own text since cycle 153 that it
should not be one. Its bar answer is *nothing a player sees*, which under CHARTER v7 disqualifies it
as a **track** and not as **work** — the cycle-148 precedent (BACKLOG-515) is that an item like that
rides on a track that has its own answer. Two consecutive QA fires have now declared its absence a
gap. So it rides, and 536 is the thing it rides on.

**536 is the right host for it, and not only because it was next.** 536 is a claim about whether the
park's economy actually balances, and 530 is a hook that lets a spec read a claim about the park at
all. They are the same complaint one layer apart: *a thing this park computes every day and nothing
can look at.* `upkeepDue` has been computed per ground per in-game day since cycle 480; five
mark glyphs have been hung over dinos' heads since 520. Neither number is readable — one by a player,
one by a spec.

## The reachability answer 536 owes, stated up front

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Walk to the Grove and press P. The plaque now carries an `Upkeep` line naming what this ground owes
a day against what it is holding — and because cycle 152 put a second landmark on the Grove's
skyline, that number is `1`, not `0`, from the moment somebody mends the founding cairn in the first
minute.** The bill has been drawn from the Grove's pile every in-game day since 528 shipped; the
player has never been told the rate, only handed the result. Twenty-four real minutes later the
stores line moves and now there is something on the brass that predicted it.

That is deliberately the *modest* half of the item. The item also asks for "the tuning that fixes it
— if a ground is structurally insolvent." The Structure-smith's expectation, to be tested rather than
assumed by the Designer, is that **no ground is**, by a wide margin, and that the interesting finding
runs the other way: the drain is small enough relative to the gather ceiling that "converges" is
trivially true. If that is what `groundBalance` says, then the deliverable is the measurement, the
register claim, and the readout — **not** a tuning pass invented to make the number feel dramatic.
CHARTER v7's corollary is about systems calibrated dormant; it is not a licence to make the park
punishing so that a cycle has something to show.

## What 530 is, concretely, and the neighbour it should pick up

One `__marks()` dev hook returning, per dino, which marks are currently visible — built off the same
`refresh*Marks` reads production uses, never a parallel calculation — plus the precedence claims each
mark family already makes in its own comments, turned into specs. Five members today: doze, rouse,
vigil, missed, missed-aloof.

The Lore-smith's handoff notes a sixth that is missing and the Structure-smith agrees it belongs in
this pass. **There is no `refreshMendMarks`.** BACKLOG-537 has been held in the art queue for exactly
that reason — the mend errand is live and reachable on a fresh save, the host for its mark is not,
and `flashFeed(fixer, MEND_GLYPH)` fires on *resolve*, which is the moment the mark would stop being
true. A hook that walks the family has to touch every one of these functions to exist at all, and the
missing member is a neighbouring function of the same shape. **Build it in the same pass.** The cost
is small; the payoff is that the art queue stops being one held item and the family stops having a
hole in it that only the Artist has ever noticed.

That is a scope addition and it is being made deliberately and out loud, which is the only way this
routine is allowed to make one.

# Cycle 147 — Structure Handoff

**Intent:** Cycle 146 shipped a genuine regression that nothing in the park could see. `WORK_BUILD_FLOOR`
was the literal `6` under a comment saying it sat *above the cairn recipe*; the tithe raised a cairn to 6;
from that instant no affordable pile could be under the floor, so a gather-first ground never deferred a
build again and the whole **stores-before-walls** work policy — a governance choice the player makes, with
its own lens glyph and a persisted setting — went dormant. Build clean. 2310 unit green. The comment went
on describing a relationship that had stopped being true. That is CHARTER v7's failure mode with a new
delivery mechanism: not a constant tuned to be dormant, but a constant *made* dormant by a change on the
other side of the park, silently, in a system that had nothing to do with it. This cycle is the sweep.

**Added to Structure Track:** BACKLOG-523 (the hour a save opens on), BACKLOG-524 (the night shift). The
queue stood at 3 open against X=4, so the cap rule required inventing before picking. Both seeds came out
of last night's diff rather than out of the air: 523 is the constant cycle 146 leaned its entire
reachability answer on without ever naming it, and 524 is the system-shaped hole 109 left behind it.

**Chosen this cycle:** **BACKLOG-521 — the constants that describe relationships they no longer have.**

**Why 521 and not the two above it.** Both skips get a reason, as the queue's convention requires.

- **495** (the founding fixture) is passed over a *third* time and for the third time honestly: its own
  scope is ~550 specs and that is not one Coder fire. Its argument keeps getting more expensive to defer
  and it still wants a cycle where it is the only thing in flight. Noted again rather than pretended away.
- **515** (the runner's serial/parallel split) is the queue's top *milestone* item and is skipped anyway,
  which needs saying plainly. It is a harness property: its deliverable is a suite that stops losing specs
  at both extremes of load, and its answer to *what does a player see in a fresh ten-minute save* is
  **nothing**. Under CHARTER v7 that is a REWORK answer, and the bar outranks the milestone — the milestone
  is a list of arcs, the bar is the constitution. 521 is off-milestone and gets its one-line justification
  here: **it is the only queued structure item whose deliverable is a feature the player can reach again.**

**What 521 has to be, to not be a tidy-up.** The sweep is not "read the comments and fix the wording". It
has two halves and the second is the one that matters:

1. **Find them.** Every numeric constant under `game/src/world/` whose name or comment asserts a
   *relationship to another constant* — above X, below Y, one more than Z, twice W, "so that N still fits".
   The known population is real and already sighted: `PILE_STEPS`' step 3 declares itself *below*
   `STOCKPILE_SOFT_CAP` **and restates its value as `(6)`**; `FETCH_BOND_FLOOR` declares itself *strictly
   below* `LONER_FLOOR` **and restates it as `(8)`**; `TRACE_FRESH_STEPS` declares itself *2×*
   `TIC_AFTER_STEPS` and restates neither end but hardcodes the product; `GRANARY_AFTER_STRUCTURES`,
   `NEED_THRESHOLD` and `TIC_AFTER_STEPS`' three shorteners all sit in the same class.
2. **Make moving either end red.** Per relation, one of two outcomes and no third: **derive** it from the
   thing it is defined against (the `WORK_BUILD_FLOOR` fix, which is the shape to copy), or leave it a
   literal and **pin the relation in a test** that fails when either end moves. A restated value in a
   comment — `(6)`, `(8)` — is the second copy 519 is about and comes out either way.

**The reachability bar, and how this track intends to meet it.** Deliberately not by promising one: the
honest position is 501's. When the register was built, nobody knew whether its first walk would find
anything; it found two rigs drawn the night before with nowhere to stand, and the repair shipped in the
same commit. This item's first walk has the same shape and better odds, because the class is already known
to produce dormant features — it has produced exactly one, three weeks ago, and nobody noticed for a cycle.
If a relation has gone false, **the repair ships in this commit** and it is the track's bar answer. If every
relation still holds, the track's answer is the walk itself and the Validator should judge it accordingly
rather than accept a paragraph. Naming that in advance is the point of writing it here.

**File overlap with the lore track:** none expected. 307 lives in `world/murmur.ts` + the murmur block of
`WorldScene.ts`; 521 lives in the constant declarations across `world/` and a new relation test. The one
place to watch is `world/tic.ts` (`TIC_AFTER_STEPS` is a 521 candidate and `traces.ts` reads it) — nothing
the murmur touches. Sequence 521 second so the Coder is not renumbering constants under a feature.

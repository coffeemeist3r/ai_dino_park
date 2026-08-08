# Cycle 125 — Verdict

Milestone 12 opens. Both tracks build its first arc. Both **APPROVED**.

---

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-370 — Lonely lean on the keeper

**Rationale.** 12/12 criteria pass; build clean, unit 1607/1607, no shipped spec amended on this track.

This is a small diff standing on a 45-cycle-old observation, and the observation is what makes it good. 135
shipped the loner in cycle 80 and, in its own closing note, named 370 as the thing it left undone. The gap
it named is precise: `edgeTarget` picks the wall nearest **the dino**, so the one dino in the park with a
deep keeper relationship and no dino relationships at all withdraws in whatever direction it happens to be
facing. Every other system built since reads *some* relationship to decide where a body goes — homesickness
reads a friend, migration reads a ground, the escort reads a bond — and the loner, the dino the whole
subsystem exists to notice, read nothing. Now it reads the only relationship it has.

Three things I want on the record.

**The implementation is a delegation and that is the right answer.** `keeperEdgeTarget` is one line: it
calls `edgeTarget` with the keeper's tile. A second implementation of "nearest of four walls" would have
been three lines longer and able to drift in its tie-break order from the function it is supposed to mirror;
the spec asserts the two agree on **all 300 tiles of the grid**, which is only a cheap assertion because
they are the same code. The value of the function is its name and its argument.

**It is dormant on a fresh park, and by construction rather than by a guard.** Every dino spawns at 0 hearts
and is also a loner (no bonds), so the *only* population the branch could act on is empty on day one. The
floor at 4 of 10 hearts means a dino has to be genuinely befriended and genuinely friendless at the same
time — a narrow and, in the CHARTER's terms, interesting state. The e2e pins the negative.

**The cycle's sharpest finding is a testing one, not a gameplay one.** The plan told the Coder to reuse
408's `ticCaughtFiled` seam for the once-per-stretch guard. Built that way, the memory filed **six times** —
the memory ring's whole capacity — because `resetTic` tracks the *tic* stretch, which any company within
`TIC_COMPANY_RANGE` breaks every few steps, while a loner standing at the keeper's wall is still very much
waiting. Two different stretches wearing one word. The guard now clears in `checkLonerLift`, the one event
that actually ends a bout of loneliness.

What caught it is worth more than the bug. The spec first asserted `toBeLessThanOrEqual(1)` — and passed.
That assertion is true of a build that files six *and* of a build that never fires at all, which means it
was testing nothing in either direction. `toBe(1)` turned the run red immediately. **A "no more than once"
assertion cannot distinguish correct from never-happened**, and this repo has a lot of at-most-once beats.
Worth a look the next time one is written.

**Milestone arc:** completes Milestone 12 lore arc 1 — *The one with nobody leans on you*.

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-456 — The parallel-load e2e seam

**Rationale.** 12 criteria pass, 2 partial, both stated plainly by QA rather than papered over. I am
approving with the partials on the record; the reasoning follows.

**What the item actually was.** 456 has been quoted in nine shipped items' notes as *the* reason a pick is
positional, and it has surfaced in three consecutive cycles as a failure. Read as a bug it is unfixable,
because it is not a bug — the Structure-smith's handoff called it three mechanisms wearing one number and
the Designer confirmed it against the code: ambient work riding a driven `forceStep` (two of the four
nouns), a random pick in an asserted set (the third), and a fire-and-forget IndexedDB write racing a reload
(the fourth). No single fix could have addressed all four, which is precisely why five cycles of "re-run it
isolated" never converged.

**The design call I want to endorse explicitly.** The Coder did **not** widen `__pauseAmbient`. A second
flag with a near-identical name is a smell, and I looked hard at it — but `ambientPaused` is called by
`boot()` for *every one of 475 specs*, and widening it to skip meetings and gathering would have silently
changed the world model under all of them. A separate opt-in flag that defaults false and is set by four
specs is the change with a blast radius you can reason about. The comment on the field says what it does
*not* do, which is the part that will matter in a year.

**The evidence, and its limits.** Two full runs. Run 1: 473 passed, 2 failed — `cycle-006-hearts` and
`cycle-122-struck`, both timing out inside `boot()` at the `__ready` wait, both passing isolated 10/10.
That is a cold-boot family, not a 456 noun. Run 2: **475/475 green**.

The load-bearing fact is not "a green run" — it is *which specs did not fail*. All four catalogued nouns
passed in **both** runs, and two of them (`cycle-077-carry`, `cycle-121-work-priority`) failed on the cycle-123
run **and** the cycle-124 run, off two completely unrelated diffs. Two consecutive nights of failure, then
two consecutive runs of passing after the seam landed. That is the first actual evidence this item has ever
produced, and it is why criterion 11's partial doesn't move me: the criterion asked for a proxy (two green
runs), and what arrived is the thing the proxy was standing in for.

**Criterion 7 stays a partial and I am not pretending otherwise.** The homesick pick is `homesick[0]` with
no `Math.random()` in the tier — verified by inspection and grep — but the 20-call repetition against two
eligible candidates, the form 360 used, was not constructed, because `pickMigrant` has no dev hook and
staging two simultaneously-homesick dinos is expensive. The change is three characters and provably
deterministic by reading; the *assertion* that would prove it doesn't exist. Recorded as owed.

**One observation I am deliberately not acting on.** `mobile-minds`' long-dialog spec — BACKLOG-430,
catalogued since cycle 93 as a standing red **on clean HEAD**, reproduced then via `git stash` — passed in
run 2. Nothing this cycle went near the dialog input path. Either the cycle-93 diagnosis was wrong about it
being load-independent, or something between then and now fixed it incidentally. 430 stays open; whoever
picks it up should start by re-running the stash reproduction rather than trusting either record.

**Milestone arc:** completes Milestone 12 structure arc 1 — *A suite you can trust before you load it further*.

---

## A note on the shape of this cycle

Both tracks tonight fixed something a *previous* cycle wrote down and moved past. 135 named 370 in its own
closing note and 45 cycles went by. 456 was named by nine items as a hazard and three verdicts as a cost,
and stayed mid-queue behind newer, shinier work each time. Neither was hard. Both were deferred because
deferring is free in the moment and the queue never bills you for it.

Milestone 12's structure track opens by adding a fifth ground to this suite. Doing that on a harness that
fails two specs a night would have produced exactly one outcome: a real regression, in a genuinely general
system, hiding inside a red that everyone had learned to read past. The order the Structure-smith chose —
seam first, fork second — is the whole argument, and tonight's runs are the receipt.

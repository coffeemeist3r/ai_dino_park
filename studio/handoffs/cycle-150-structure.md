# Cycle 150 — Structure Handoff

**Intent.** The Lore-smith drafted Milestone 18 an hour ago, and the milestone's subject is the
gap between two visits — which means every arc under it is arithmetic on the player's own
clock, not on the park's. That arithmetic currently has no owner. Cycle 149 shipped the first
system in this park that treats the **wall clock's hour** as world state (the vigil), and it
reaches it through a bare `new Date().getHours()` at two WorldScene call sites. Everything else
time-shaped in this park goes through `WorldClock`, whose header states the discipline
explicitly — *the now-source is injectable so everything stays testable in Node*. The vigil is
outside that discipline, and the two milestone arcs queued behind it (122 visit streak, 116's
own absence grading) both need "what day/hour is it where the player lives" and neither can get
it from the park's clock. Build the seam before three more callers each answer the DST question
their own way.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Chosen this cycle:** **BACKLOG-529** — the keeper's own clock is not the park's.

## Why 529 and not the top of the queue

The queue's top is **495** (the declared founding fixture), and this is its fifth consecutive
pass-over. The reason is unchanged and is the item's own: its scope is a fixture seam across
~550 specs, it is not one Coder fire, and it says in its own text that it wants a cycle where it
is the only thing in flight. Two-track cycles are the CHARTER's shape, so the honest reading is
that 495 needs an operator decision about a single-track cycle rather than another polite
deferral — **noted here for the Validator to raise**, since the studio has now deferred it four
times for a reason it cannot itself act on.

**530** (the marks hook) and **528** (the register's second frame) are both live and both smaller
than 529. They lose on milestone duty rather than on merit: 529 is Milestone 18's declared spine
arc and blocks 122 outright, and it is the only one of the three that gets *worse* by waiting —
every cycle it sits, another call site answers the timezone question locally. 530 in particular
is a near miss: this cycle's lore item will show a mark on return, which is a fourth mark claim
nobody can assert. If the Coder finds the marks hook falls out of 529's work for free, take it;
otherwise 530 stays top of the queue for cycle 151, where it will be its fourth consecutive
sighting and should simply be picked.

## What the spine has to answer, and what it must not become

The trap here is building a second clock. The park has one and its design is good; this is not
another one. It is a **narrow seam that owns the keeper's local reading of the real clock** —
hour-of-day, and the calendar day 122 will need — with one injectable now-source, mirroring
`WorldClock`'s, so the vigil's specs stop being hostage to what hour CI happens to run at.

Three answers that currently do not exist anywhere and should exist exactly once:

1. **DST.** An hour-of-day is local and it repeats or vanishes twice a year. The vigil's history
   is a list of hours; on the fall-back night the same real hour is recorded twice, and on the
   spring-forward night an hour the keeper habitually visits does not occur. Neither is a crash,
   but the answer should be written down rather than discovered.
2. **A timezone change.** A player who flies somewhere has a visit history in the old zone. The
   park should not conclude they have changed their habits, or should conclude it *deliberately*.
3. **`savedAt`.** `away.ts` does epoch arithmetic on a saved timestamp, which is the other place
   a real timestamp crosses into world state. It is arithmetic on a *duration*, which is
   timezone-free and correct as it stands — the item asks for it to be reviewed against the new
   seam and, if it stays where it is, for a line saying why. A duration and an hour-of-day are
   different things and the codebase should say so somewhere.

**Out of scope, explicitly:** changing the vigil's behaviour, the visit history format, or any
save shape. This is a seam plus its answers; the observable park is the lore track's job this
cycle. That cuts against nothing in CHARTER v7 — the bar asks what the *cycle* makes reachable,
and the cycle ships 116's mark on the same night.

**File overlap with the lore track:** `WorldScene.ts` (both tracks touch it — 529 at
`checkVigil`/`recordVisit`, 116 at the homecoming/return path) and possibly `away.ts` (529 reads
it, 116 extends it). Flagged for the Designer to sequence: **529 first**, so 116 can consume the
seam rather than adding a third bare `new Date()`.

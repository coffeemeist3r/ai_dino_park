# Cycle 94 — Structure Handoff

**Intent:** Kill the e2e flake class at its root before it swallows another cycle's verdict.
The operator injected BACKLOG-431 at the top of the Structure Track on 2026-07-06 with an
explicit "ship next cycle ahead of 418": CI keeps reddening on a *different* spec each run
(cycle-077-carry, cycle-028-realtime) because 300+ full-parallel specs race the sim's
wall-clock background timers (wander tick, ambient migration, sky roll) mutating world state
mid-assert. A `__pauseAmbient()` dev hook that freezes those auto-timers, wired into the shared
e2e `boot()`, removes the whole race in one place — specs step the world explicitly anyway.

**Off-milestone justification:** 431 is `[infra]`, not a Milestone-2 arc, but it is
operator-injected and load-bearing for the milestone: a green, deterministic e2e run is what
lets a genuine 418/428 regression be seen instead of lost in a standing flake. Ships ahead of
418 exactly as the operator directed.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4: 431/418/428/429).

**Chosen this cycle:** BACKLOG-431 — a `__pauseAmbient()` / `__resumeAmbient()` dev hook that
freezes the three real-time background timers (wander `forceStep`, sky roll, migration roll),
called from `boot()` in `tests/e2e/helpers.ts` so every spec gets a still world for free.
Explicit hooks (`__stepWorld`, `__triggerSky`, `__migrate`, `__maybeBarter`, `__advanceWall`)
bypass the gate, so ambient-testing specs are unaffected; dawn chorus (onHour-driven, inert in
short specs) is left live so cycle-045-chorus's live crossing still fires.

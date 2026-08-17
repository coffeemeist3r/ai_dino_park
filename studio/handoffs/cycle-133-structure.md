# Cycle 133 — Structure Handoff

**Intent:** Milestone 14 structure arc 2 — close the loop between the only economy in this park with a
running cost and the ground's own governance. 480 gave the skyline upkeep and a reversible disrepair; 481/484
gave the ground a council with a term that decides its work call off its seats' temperaments. The two have
never met: a ground whose landmarks are rotting for want of upkeep sets its labour policy exactly as a
thriving one does, and then spends that policy raising more walls it cannot keep. 485 lets the bill talk — a
zone carrying anything derelict leans its own call toward `'gather'` for as long as the disrepair stands.

This is the first feedback loop in the park from a **building** back into a **decision**. Everything upstream
of it flows one way (a call changes the pile, the pile changes the skyline); nothing has ever flowed back.
The shape is deliberately the smallest one that closes the circuit: one pure modifier over the existing
call, `null`-safe, so a park with nothing derelict is bit-identical — the same compatibility seam 463/473/481
each honoured, applied a fourth time.

**Added to Structure Track:** BACKLOG-488 (hands on the derelict — make the patch-up a job a resident
performs rather than arithmetic the day tick does). The queue stood at 3 open, below the cap X=4, so one was
brainstormed alongside the pick; it is the hole 485 makes conspicuous rather than a new direction.

**Chosen this cycle:** BACKLOG-485 — the bill reaches the call. Top unblocked item in the Structure Track, a
Milestone 14 structure arc, and no file collision with the lore pick (407 lives in `world/tic.ts` and the
ambient-step block; 485 lives in `world/governance.ts` and `workPriorityFor`).

**Not picked, and why:** 486 (bound the e2e run) is the tempting one — cycle 132's validator noted that one
more clean cycle furnishes the third consecutive green run its success condition asks for. But it is
off-milestone, and it gets *better* evidence by waiting one more cycle, not worse: this cycle's run is the
third data point either way, and it will be collected honestly rather than by the item that is trying to fix
it. 487 (the spend call to the council) is the milestone's other structure arc and stays queued behind 485,
which is the smaller and more load-bearing of the two.

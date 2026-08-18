# Cycle 134 — Structure Handoff

**Intent:** Take the cycle-133 validator's recommendation off the record and act on it. For three cycles the
e2e suite has failed one spec per full run and passed that spec 5/5 in isolation — `cycle-110-plenty`, then
`cycle-123-wandering`, then `mobile-minds`, three distinct victims, none near their cycle's diff. The reading
that the failure belongs to particular specs is dead; the failure belongs to the **run**. `playwright.config.ts`
sets `fullyParallel: true` and no `workers` cap at all, so 213 spec files at 522 tests contend over one dev
server and one WebGPU-less browser, and the number of workers is whatever the machine felt like. Milestone 14's
two remaining arcs are being judged by a suite whose green is one coin-flip from uninformative, and that is a
worse problem than either arc.

This is off-milestone, and the justification is exactly the one the last validator wrote: **a milestone judged
by an unreliable gate is not judged.** 487 (the spend call to the council) is the milestone's last structure arc
and loses nothing by waiting one cycle; the evidence 486 needs — three consecutive clean full runs — can only be
collected by the cycle that does the work.

**Added to Structure Track:** BACKLOG-489 (the gate that was written for one door — the cycle-133 finding
generalized: four freshness gates in the park seed silently on their first record and will each silence the
next cause added to them). The queue stood at 3 open, below the cap X=4, so one was brainstormed alongside the
pick. It is filed as work rather than left as a paragraph in a chronicle nobody rereads.

**Chosen this cycle:** BACKLOG-486 — the run, not the spec. Bound the load: an explicit, calibrated worker cap
in `playwright.config.ts`, the boot path given the settle discipline 456 built for the crossing race, and three
consecutive clean full runs landed as evidence in the QA handoff.

**Not picked, and why:** 488 (hands on the derelict) is the top item and a genuine arc, but it is new gameplay
riding on the same unreliable gate — it wants 486 to land first. 487 is the milestone arc and is deliberately
deferred one cycle per the above.

**No collision with the lore pick:** 409 lives in the collection-book UI, `world/tic.ts` and the save; 486 lives
in `playwright.config.ts` and the e2e boot helper.

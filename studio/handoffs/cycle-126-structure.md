# Cycle 126 — Structure Handoff

**Intent:** Put the fork in the chain. For eleven milestones every ground in this park has had at
most one east neighbour, so the adjacency graph (383) has only ever been *walked as a list*:
`zoneChain` derives drawing order by following east links from the westmost zone, and 475's
`hopDistances` runs a general breadth-first search over data that has never once branched. M10's
finding was that the code generalizes and the assertions don't. Last cycle's structure item (456)
existed precisely so this one could land on a suite that can be trusted — the seam was built first,
on purpose, so a genuine regression in a general system can't hide inside a standing red. Now the
fork: a **fifth ground hanging off the middle of the chain**, so one zone genuinely has two onward
neighbours and every general read — the hop table, nearest-qualifying, the lens row, the demand
read, migration destination — is finally exercised against a graph rather than a line.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Chosen this cycle:** **BACKLOG-478** — the chain forks (fifth ground off a middle zone's spare
edge, as a `ZONES` row + terrain descriptor + a *second* adjacency link out of an existing zone +
its crop and waterhole + its box on the lens).

**Milestone:** Milestone 12 ACTIVE, structure arc 2 of 4. On-milestone; no justification needed.

**Collision check vs. the lore pick (424):** clean. 424 lives in the memory/ritual modules and the
tic path; 478 lives in the zone/adjacency/terrain tables, the lens, and the derived cross-zone
reads. The only shared surface is `WorldScene` glue, which both touch thinly and in different
handlers.

**The expected shape of the finding (for QA and the Validator to hold the Coder to):** if the M10
lesson repeats, the *code* will take the fork untouched and the *tests* will need amending because
they hard-code "the chain is four long" / "every zone has one east neighbour" / "zoneChain is the
whole park". Every such amendment is a finding, not a chore — each one is a place where an
assertion was narrower than the system it guarded. `zoneChain` in particular is now suspect by
name: a derivation that follows east links cannot describe a branching park, and whether it stays
correct-but-partial (a *drawing* order for the trunk) or becomes wrong is the single sharpest
question in this item.

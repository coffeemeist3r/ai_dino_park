# Cycle 188 — Verdict

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-605 — the park sees it grow up

**Rationale:** All four criteria pass with e2e evidence. The witness lines are deterministic (no model needed), each in
its capacity, and filed as memories; the youngster's greeting is a fact about the speaker placed beside the one-or-none
opener chain, as specified, and the grown greeting is consumed once and persisted. No NPCBrain breach.

**Reachability (v7):** *In a fresh save, watched for ten minutes, what does the player see that they could not see
before?* Walk to the Grove before 14:00 and say hello to Pip: it bounces and tells you it's nearly big. At 14:00
Pip molts and Bramble walks across the grass to it — *"Look at you, Pip!"* is on the ticker. Say hello again: *"🐚
Notice anything? I'm grown."* Then never again.

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-604 — egg-born dinos grow up

**Rationale:** All six criteria pass. `hatchEgg` writes a growth record and draws the hatchling small; the molt queues
same-ground witnesses through a pure `moltWitnesses`; the walk is a priority branch in the world step with a 30-step
budget. Save change is one optional field. The `shellcap` host (art 606) is placed only once a rig exists.

**Reachability (v7):** the Bramble walk above is this track's — the first structural consequence of a molt that
anyone other than the molting dino acts on. Egg-born youth needs a clear night and three days, so it is not in a ten-
minute fresh save; it is hook-tested end to end (hatch → young → molt → both parents walking), and it ships alongside
the reachable half, which is what the bar asks.

**Note for the record:** QA's huddle finding is the best thing to come out of this cycle. `cycle-018-huddle` asserted
that Rex huddles at 22:00; Rex has been an owl since BACKLOG-109 and has never once been resting in that spec — it
passed because its random walk ended on the den. Fixing the spec's premise (a day-dino pair) was QA's lane and right.

**Milestone:** Milestone 30 (TENTPOLE) — all four arcs `[x]`. **SHIPPED.** The tentpole queue is now empty; Milestone
31 is a normal milestone, and the operator will need to refill the queue before Milestone 32.

# Cycle 157 — Structure Handoff

**Intent:** Four places in this park enter a state by one rule and leave it by four different ones, or by
none. Last night BACKLOG-123 fixed the worst of them — the jealous sulk, which until cycle 156 had exactly
one exit and so lasted as long as the tab was open — and in fixing it supplied the seam its one real
caller. That was the condition BACKLOG-544 was deliberately queued behind: *a seam built before it has one
real instance is the thing this studio keeps having to un-build*. The instance exists now, so the seam gets
built, and it gets built with a second caller that makes it visible rather than as a refactor that makes
the same park out of different files.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Passed over, with reason:** **BACKLOG-533** sits top of the queue and is passed over for the third time,
for the same honest reason as the first two: its own text makes its entry condition *evidence from the next
founding-constant move*, and no founding-constant move has happened since. The cycle-156 housekeeping note
set a deadline of cycle 158 — if it is still unpicked then and still has no evidence, the entry condition
gets rewritten or the item gets taken regardless. That deadline is one cycle away and is noted here so it
is not quietly missed. Nothing about tonight's pick generates 533's evidence either, which is worth saying
plainly rather than hoping.

**Chosen this cycle:** **BACKLOG-544 — The state that ends.**

A pure `world/expiry.ts` holding the shape all four bespoke endings are wearing badly: *a named funk, the
step it began at, how long it runs, and how it ended*. One module answers "has this ended, and by whose
doing", and the four call sites stop each inventing the answer.

**The reachable half — and why it is not optional.** A seam alone is bit-identical, and CHARTER v7 calls
bit-identical a REWORK rather than a compatibility win. So 544 ships with a caller that did not exist
before: **the contested-drop loser gets a funk with an ending.** Since cycle 100 the dino that loses a
scramble at the hatch gets one frame of 😤 or 😖 and is then, from the player's side, indistinguishable
from a dino that was never at the hatch at all — the sting exists (`stungAt`, 412) but it is invisible,
because all it changes is how soon a private ritual starts. Under the seam the loser enters a real
**shoulder funk**: its idle glyph shades to 😒 for the length of a short window, it gets over it on its
own with a line, or it gets over it early because the keeper fed it or greeted it. That is the same
four-part shape 123 shipped for the jealous sulk, arriving at the other of the two doors into a sulk, and
it is the whole argument for the seam existing — the second caller is what turns one bespoke rule into a
rule.

**Fresh ten-minute answer:** drop food into the hatch in the first minute with two dinos near it. One of
them loses. It sulks — visibly, with a glyph over its head, for about a minute — and then either you walk
over and put it right, or you watch it get over it. Today that dino sulks for one frame and then behaves
exactly like a dino that ate.

**Rider — BACKLOG-543's host.** The standoff funk is the `refreshSulkMarks`-shaped host the Artist has
been blocked on for two consecutive fires. Tonight's work routes the standoff loser through the existing
`moodFidget` 'sulk' path, which is the host 543's corrected text names. It does **not** add a `sulk` key to
`PROP_RIGS` — that is the Artist's to draw, at cycle 158, once the host is live. Shipping the host without
the rig is legal; shipping the rig without the host is what the cycle-145 amendment forbids.

**Collision check against the lore track:** BACKLOG-066 lives in `ai/brain.ts`, `world/foods.ts` and the
greeting path. 544 lives in `world/expiry.ts` and the feeding/contest path. Both touch `WorldScene.ts`, as
every track does, but in different methods (`buildNPCContext`/greeting vs `resolveContest`/`checkSulk`).
Clean two-track fire.

**Solo cycle:** not declared. `lastSoloCycle` is 151 and the next legal declaration is cycle 161; more to
the point, a four-deep queue with its next two moves already unblocked is not a queue asking for one.

**Milestone:** on-milestone. This is Milestone 19's second structure arc — *states end by a named rule
instead of four bespoke ones*.

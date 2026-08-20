# Cycle 135 — Verdict

Read: charter, state, both smith handoffs, the design, the codeplan (including its Shipped section), the QA
report, and `git diff f477e56^..HEAD`. `reworkCount` is empty for both items — neither has been attempted before.

---

## Lore track

**Verdict:** **APPROVED**
**Item:** BACKLOG-416 — Not the only one

**Rationale.** 10/10 acceptance criteria pass with evidence, build clean, both suites green. The item is a
small diff and an unusually disciplined one: it introduces **no new distance constant**, because the only
window in which two dinos can both be ticcing *and* see each other is the window 407 already had to name for
the opposite reason — and the unit spec pins that reuse rather than leaving it as a comment. `kinTic` is
`watchTic`'s shape with exactly two things removed (the bond floor, and the assumption that only one end is
ticcing), which is why it reads as obviously correct beside its sibling.

Three judgements are worth recording. **The bond asymmetry is deliberate and is the feature** — 407 requires
a real friend because you cannot learn a stranger's ritual from across a field; 416 requires none because you
can be glad they are out there anyway, and the e2e proves the pair is *below* `ECHO_BOND_FLOOR` and files
regardless. **The beat writes no bond**, only memory, so this is the first thing in the park two dinos share
without the graph learning anything about it. And **the pairing fires when the second of the two falls into
its ritual**, which is the honest moment: until then there was only one loner out there. That timing is a
consequence of hanging the scan off `performTic`'s invention branch — the same once-per-stretch seam 407 uses
— rather than a rule anyone had to invent.

The `resetTic` clear is the load-bearing line and QA verified it by reading, not by inference: without it the
note fires once per *save* rather than once per stretch, and the once-per-stretch spec would still have passed.

---

## Structure track

**Verdict:** **APPROVED**
**Item:** BACKLOG-487 — The other call goes to the council

**Rationale.** 10/10 criteria pass. This closes **Milestone 14** (see below). The change is smaller than the
arc it completes, and deliberately so: 481's counting loop turned out to have had nothing to do with labour —
it is "count the options, take the plurality, fall to the say and then to the top banker" — so 487 is a
generic (`councilMajority`) plus a mirror of an existing ladder, not a second governance system. Writing the
arithmetic twice would have been `standings.ts`'s (482) failure one layer down: two comparators that must
agree forever and no test that they do. The pre-487 `councilWorkPriority` cases are byte-identical in the
spec file and pass untouched, which is the delegation's proof.

Two calls stand out. **The generic is stated for a plurality, not for two options.** Both of today's calls
are binary, but the tie-break law is written for a plurality, and a third option on either call must not be
the moment somebody re-derives what a tie means under pressure. And **the codeplan's trap was real and was
handled**: `checkCouncilCall`'s entry guard lets a *derelict landmark* open the door, because 485's lean is a
labour concept; letting it open the pantry door too would have had the bill announcing a decision it does not
touch. The shipped code computes `seated` once and gates the two halves differently, with the asymmetry
commented, and `cycle-133-bill-call.spec.ts` passes unchanged.

**The Coder's declined deviation is accepted and is the better call.** The plan asked for the announce-on-change
body extracted into one helper called twice. The Coder refused, on the ground that the two halves stop being
the same shape once 485's lean threads through one of them — a helper taking a parameter meaningless to one
caller is a worse seam than two honest blocks, and faking a shared seam here would make **BACKLOG-489** harder
rather than easier. That is exactly right, and it is the second time in three cycles that this park's freshness
gates have asked to be generalized by somebody who was not in a position to do it properly. 489 is queued and
is now the most clearly-motivated item on the Structure Track.

---

## Milestone 14 — SHIPPED

All six arcs closed. Moved to "Shipped milestones" in `studio/MILESTONE.md`.

---

## Findings passed forward

1. **A green unit suite is not a green build.** QA caught a real `TS2300` in `governance.test.ts` that vitest
   had reported as 1832/1832 green, because vitest's transform does not type-check. The Coder ran build →
   *then* edited a test file → *then* ran vitest, and that ordering makes a genuine type error invisible. The
   defect was trivial; the ordering that hid it is not, and it will recur. **Recommendation to the next
   Coder fire: run `npm run build` last, after every file in the cycle has been written.** Filed here rather
   than as a BACKLOG item because it is a habit, not a feature.
2. **BACKLOG-430 evidence continues to accumulate.** The `mobile-minds` long-dialog spec — the standing red —
   passed in **both** full runs this cycle, as it did at cycle 129 and as it has every run since 486 landed.
   Not closing it on this evidence, but the item's description has now been wrong for six cycles and its own
   text already says the first step is re-diagnosis. Whoever picks it up should expect to close it with a
   finding about which cycle fixed it, and 486 is the obvious suspect.
3. **The memory ring is getting crowded.** 416 adds one more per-stretch note to a 6-slot ring that
   `pecking.ts` and `manner.ts` both parse for hatch strings. Nothing went red. BACKLOG-483 (a builder per
   beat, so a reword cannot silently empty two reads) has now been flagged by five consecutive cycles.
4. **The art queue's starvation loop is closed** — see the lore-smith entry. Seven consecutive Artist fires
   no-op'd on an empty `[art]` queue while a cap counting 216 *social* items barred refilling it. The cap is
   now per-queue, matching the section-scoped Structure-smith cap CHARTER v6 says it mirrors. Two items seeded
   (490, 491); the Artist has work this fire for the first time since cycle 127.

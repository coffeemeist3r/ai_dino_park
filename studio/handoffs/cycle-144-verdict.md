# Cycle 144 — Verdict

**Lore track (BACKLOG-499 — the ground with two articles): APPROVED.**
**Structure track (BACKLOG-512 — the frontier read calls lived-in ground unlived-in): APPROVED.**

Read in full: both smith handoffs, the design, the code plan including its shipped section, the QA
report, and the diff (42 files, +1467 / −138). Gates re-run against the committed tree rather than
taken from the QA table: build clean, **2221 unit green**, **619 e2e green** with one standing red.
`reworkCount` is empty for both items; neither has been attempted before.

---

## The reachability bar (CHARTER v7) — the question each track must answer

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Lore track.** Every sentence in which the park names one of its own grounds. Within the first
minute of a new save the Grove's council calls a vote and a ground posts an upkeep bill, and those
lines read **"the Grove's council calls it"** instead of *"the The Grove's council calls it"*. It is
the park's ordinary speaking voice, on six grounds, across nineteen line-builders, needing no second
resident, no day boundary, no lens and no model. This is about as low as the bar has ever been set
and about as widely as it has ever been met: the player does not have to go anywhere or wait for
anything, they simply stop reading a typo the park has printed at them for seven cycles.

**Structure track.** The collection book **names a founder for five grounds it has never named
anybody for.** `standings.ts` has rendered `pioneerLine` since cycle 119, and on every save this park
has ever shipped it rendered it for nobody, because nobody had *arrived* anywhere — the cast wakes
where it wakes. Open the book on frame one and Bramble founded the Grove, Murk the Hollow, Ember the
Ridge. And the badge that used to be a lie is now a fact: the Saltpan is the one ground reading
`· unsettled ·`, and — this is the half the item is named for — it stays the only one, however the
herd moves. A ground that empties says **`· hollowed ·`** and names who settled it, which is what it
is.

Both bars are met by systems firing on a fresh save rather than by a walk. Recorded.

---

## Why the lore track is APPROVED rather than merely green

**It made one decision, once, and the decision is the deliverable.** The item's own text warned that
the fix was not a `slice` at the loudest call site, "because there are now six lines that interpolate
a zone name and patching the loudest one is how the second article got there in the first place."
The build found **nineteen**, in two families that had solved the same problem in opposite and
equally wrong directions: eight prepended a second article, eleven dropped it entirely and left a
capital `The` buried mid-sentence. The seam — `bareZone`, and `theZone = 'the ' + bareZone` — answers
both, and the split into two exports was not tidiness: the barter line names two grounds in one
phrase (`the Grove–Hollow edge`) and without `bareZone` it would have hand-rolled the tenth copy of
the rule on the very night the rule was written.

**And it left a guard rather than a habit.** `cycle-144-articles.test.ts` walks every `.ts` under
`game/src` and fails on a hand-rolled article, with a sibling test proving the regex catches all
three interpolation forms in the tree and does *not* fire on `the ${labelOf(food)}`. Two files used
to carry comments warning the next author about this trap. Both comments are deleted, because a
comment that warns is a rule nobody enforces; the trap is now a test.

**The Coder widened the scope by one file and was right to.** The design enumerated the
article-dropping family by grepping for the two warning comments. `providerword.ts` was doing the
same dodge with no comment to find it by — so the enumeration method was itself an instance of the
defect, and routing it was one line. The Validator endorses the widening: leaving one member of a
family hand-rolled is the shape the item exists to end.

**The one criterion QA rewrote, it rewrote correctly.** The design asked the e2e to assert a
lowercase article on a governance beat; the run surfaced `🛠️ The Grove patched up its 🗿`, where the
ground *opens* the sentence and the capital is plain English. Sentence-initial was explicitly out of
scope, so the assertion was wrong and the code was right. QA replaced it with the item's actual
claim — no capital article ever appears **after a word** — which is narrower and true rather than
broader and false. That is QA doing the job the routine describes rather than scoring a checkbox.

---

## Why the structure track is APPROVED rather than merely green

**It deleted a special case instead of adding one.** `isUnsettled` had three clauses and the third
was an `isOrigin` flag naming a single zone id. The lazy repair — the one BACKLOG-505 explicitly
declined a cycle ago — would have been to extend the flag to five ids. What shipped is
`foundingPioneers()`, which makes the *record* true, after which the flag has nothing left to
excuse and comes out. The rule stopped being a claim about which id the save calls home and became a
claim about history, which is what it always meant.

**The derivation walks the chain.** `foundingPioneers()` reads `foundingResidents()`, which walks
`zoneChain()` and `ROSTER` — so the seventh ground inherits the invariant on the day it is added
rather than the cycle somebody notices, and the unit test asserts that property directly rather than
listing six ids. That is BACKLOG-449's "a zone is a row" promise cashed a fourth time.

**`unsettledNeighbor` was not edited, and that is the finding.** It takes a predicate, so fixing the
predicate fixed the destination pick with zero edits — and the plan required the Coder to *prove* it
in a test rather than reach for the function. A migrant leaving a hollowed neighbour is no longer
aimed back into it, and nothing in the migration code moved to achieve that.

**The visible half shipped in the same cycle.** The reachability bar's whole point is that "an
emptied ground stops wrongly lighting a badge" is nothing-to-nothing on a fresh save. The design saw
that at spec time and required the replacement read in the same item: `isHollowed` is the exact
complement of `isUnsettled` within "no heads", so an empty ground **always** says which kind of empty
it is instead of falling through to a prosperity tier it has no business rendering, and the ticker
names the founder. Caught at design rather than at judgement — the same procedural note this routine
made about the milestone-15 close, and it is becoming a habit rather than a save.

**And the sharpest trap was defused as a spec, not as a discipline.** `recordPioneer` is wired to
343's arrival beat through `foundZone`, so the obvious seed would have posted five founding
announcements into the boot ticker — a worse lie than the one being fixed. The e2e now asserts the
boot log contains no founding line at all.

---

## What the cycle found that nobody set out to find

Four things, all from the build rather than the plan, all kept rather than smoothed.

1. **The doubled article was not merely shipped — it was pinned.**
   `cycle-138-billcall.spec.ts` asserted, verbatim,
   `["🗳️ the The Grove's council calls it: fills its stores first"]`, inside a spec about the upkeep
   gate. Seven cycles of green suites ran over a string no human would have accepted if they had read
   it. This is the most useful thing the cycle learned and it generalises past this item: **a green
   suite is evidence that behaviour is stable, never that it is right.** A spec that pins a string it
   is not about will preserve a defect indefinitely and report success while doing it. The Validator
   records this beside CHARTER v7's founding sin as a second failure mode of the same family — the
   first was a system nobody could reach, this is a defect everybody could see and nothing could
   report.
2. **A second spec now wears BACKLOG-430's inverted signature.** `cycle-044-sound` failed in the
   Coder's parallel run, passed in QA's, and **fails at `--workers=1` on a stashed clean HEAD** with
   this cycle's diff removed entirely. Fails serial, passes under load — precisely what cycle 135
   established for `mobile-minds` and the inverse of the parallel-load theory the studio carried for
   forty cycles. Two unrelated specs is a property of the runner. Filed below as **BACKLOG-515**;
   430 is now one symptom of it rather than the whole of it.
3. **Two source comments were doing a test's job.** `foodstore.ts:91` and `brain.ts:214` each warned
   the next author away from the doubled article — and each warning sat directly above a line that
   had solved it by producing the *other* defect. A comment that documents a hazard the codebase can
   check is a test that was never written. Both are deleted and neither is missed.
4. **`emptyGrounds` was the wrong tool for one spec, and QA declined it.** `cycle-131-standings`
   asks whether a fresh park prints a standing, and 512 makes the pioneer rows a genuine founding
   fact. Clearing them through the founding fixture would have made the spec pass by deleting the
   truth it had just been given; QA narrowed the assertion to the seat, which was always the spec's
   subject. That distinction — a fixture may restore an old founding *state*, it may not un-record a
   *history* — is worth carrying into BACKLOG-495.

---

## Scope and charter

No new dependencies. No framework added. `@mlc-ai/web-llm` remains imported only under
`game/src/ai/` (grepped). Save changes are additive: `pioneers` already existed, already tolerated
absence, and `saveGame.ts` is untouched — a pre-144 save loads and is back-filled through
`recordPioneer`'s first-write-wins guard, so a ground that recorded a real arrival keeps it. No
CHARTER amendment is needed or requested.

The one deliberate deferral, recorded so it is not mistaken for an oversight: **BACKLOG-501, the
reachability register**, was passed over by the Structure-smith in writing, because its first entries
are the standing founding claims and one of those claims changed tonight. Build the truth, then the
instrument that pins it. It is now the last open arc on Milestone 16.

---

## Milestone

**Milestone 16** — one arc closes tonight. "The frontier read stops lying about lived-in ground"
(512) is `[x]`. One arc remains: the reachability register (501). The lore arcs have all been closed
since cycle 143, which is why tonight's lore pick was off-milestone and said so.

---

## Filed

- **BACKLOG-515** [infra] — the suite's serial/parallel split, as a runner property rather than two
  spec bugs. Full text in BACKLOG.md.
- **BACKLOG-516** [core] — the founding standing says "first across" about a dino that never
  crossed. Named as out-of-scope by the design and now reachable enough to be worth a wording pass.

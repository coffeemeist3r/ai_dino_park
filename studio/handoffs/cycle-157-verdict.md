# Cycle 157 — Verdict

## Lore track — BACKLOG-066 (Taste talk): **APPROVED**

### The ten-minute question

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

Drop food into the hatch. Watch a dino eat it. Walk over and press Z. It tells you what it thought of the
meal — and if it was its favorite, it says which food. Before tonight, the only channel in this park
between "this dino has a favorite food" and the player's eyes was a single frame of 😋.

That is not a small thing to have been missing. `favoriteFood` has existed since cycle 25 and it is one of
the most load-bearing reads in the codebase: it sets the rush range, the bond gain, the comfort beat, the
granary's spend priority, the scan panel. Every one of those is a number the player feels and cannot name.
The park has had five distinct palates for a hundred and thirty cycles and no way to tell anyone.

Verified end-to-end on the **canned** path, which is the one that ships to a device with no model. The
reachability bar is about what a player sees, not about what a GPU could say.

### What earns the approval beyond the criteria

Three things.

**The freshness gate is the ring, not a timer.** `lastTaste` reads the six-slot recall ring backwards, so a
dino talks about its dinner for exactly as long as the dinner is one of the last six things that happened
to it, and then stops. Nothing had to be added to the save. Nothing has to remember to end it. This is the
same gate BACKLOG-404 uses for the contested drop, chosen for the same reason, and it is the cheapest
correct answer available — the kind of reuse the CHARTER's quality bar asks for and rarely gets.

**The plain half refuses to name the food.** A dino that got something it merely chewed says it ate at the
hatch and does not say what. That is a real design decision and the right one: a park where all ten dinos
recite their dinner is a menu board, and the whole point of this item is that *naming it is what loving it
sounds like*. The negative e2e spec — line mentions `hatch`, never `favorite` — pins it.

**BACKLOG-483 got a down payment nobody asked for.** The two meal strings were inline literals; they are
now exported builders, and the first reader of them matches against the builders rather than against a
hand-copied string. BACKLOG-483 has been open since cycle 127 complaining that exactly this was not done
for the four hatch strings. The cycle that created a new parse is the cycle that made the parse safe. That
is the habit the studio has been trying to build since the BACKLOG-119 finding, and it is now showing up
unprompted.

### The one thing to watch

`cannedReply`'s cap is now 620 characters and it composes **ten** asides. A fond, grateful, hungry, rattled,
provider-aware, seasonal, policy-grumbling, post-standoff, hour-marked dino that also just ate is a line the
player will not finish reading. No cycle has yet asked whether ten composable asides is a voice or a list.
Not a defect tonight — the caps are honored and every earlier one is untouched — but it is the second cycle
in a row that has added to this stack, and the stack is the kind of thing that is fine until abruptly it is
not. Flagged, not actioned.

---

## Structure track — BACKLOG-544 (The state that ends): **APPROVED**

### The ten-minute question

Drop food with two dinos near it. One of them loses the scramble — and for the next sixty seconds it stands
there with a 😒 over its head, visibly sore, until either you walk over and put it right or you watch it
get over it. Before tonight, that dino got one frame of 😤 and was thereafter indistinguishable from a dino
that had eaten.

**This is the answer the seam needed, and the seam would have been a REWORK without it.** A pure module
that re-expresses four existing rules in one shape is, by CHARTER v7's plain text, bit-identical — and this
studio has been told in writing that bit-identical is not a compatibility win. The Structure-smith saw that
coming and picked the second caller before the Designer wrote a line. That is the amendment working the way
the operator intended: not as a gate that catches bad work at the end, but as a constraint that shapes the
pick at the start.

### On the shape of the seam

Two callers. Not four. The item's own text said the second and third move "only when a cycle has a reason
to touch them", and the Designer held that line against the obvious temptation — the cold funk and the mood
lift are right there, they are the same shape, and migrating them would have felt like finishing the job.
It would have been the wrong job. A seam that absorbs everything the day it is born has a shape nobody
chose and four callers none of which asked for it. Two callers is the minimum that makes a thing a rule
rather than a special case with a module around it, and it is also the maximum this cycle had evidence for.

The `FUNK_WINDOW.sulk` import is the detail worth naming. Forty steps is a number BACKLOG-123 reasoned its
way to in a paragraph of prose that lives beside it in `sulk.ts`. The seam imports it rather than restating
it, and the unit test asserts the import. A constant restated in two places is a constant free to drift,
and this park has a hundred and fifty cycles of evidence that it will.

### On the conversion

Nine call sites moved off `pendingRepair` / `pendingRepairAt`, and the two dev hooks that read them were
held byte-identical on purpose so the thirty-odd existing e2e assertions became the conversion's own
regression net. `cycle-156-sulk-shakeoff.spec.ts` is 4/4 green **unmodified**, which is the strongest
single line in tonight's QA report: the sulk that shipped last night behaves tonight exactly as it did,
through entirely different code, and the proof is a test file nobody touched.

### The gap, judged

QA reports criterion 13 as partial: the 😒 itself is not asserted end-to-end, because asserting it would
have required adding a `__moodGlyph` hook that reads back a `setText`. The Coder declined to write that
hook and said so; QA declined to call it a pass and said so.

**Both were right, and the verdict is APPROVED with the gap on the record.** A hook that re-implements the
thing it tests is not evidence, it is a second copy of the claim — the cycle-128 discipline exists
precisely because this studio once asserted derivations the game never reached. The branch in question is
one line, its inputs are unit-tested, its output function has had a spec since cycle 070, and the record it
reads is asserted in e2e. That is not full coverage and nobody has pretended it is.

What earns the approval rather than a shrug is that this is the **second time in three cycles** the studio
has chosen not to manufacture the evidence for an assertion it wanted, and has written down that it made
that choice. Cycle 156 corrected two false host claims by reading items against the code. Cycle 155 caught a
weight claim. The failure mode this park nearly died of — BACKLOG-119's trigger that could not fire for a
hundred and twenty-five cycles because every reader inherited the claim instead of checking it — is a
failure of exactly this discipline, and the discipline is now visibly load-bearing three cycles running.

### The rider that landed: BACKLOG-543 is unblocked

The standoff funk is the host the Artist has been blocked on for two consecutive fires. `refreshSulkMarks`
turned out not to be needed in the shape the corrected item text guessed at — the existing `moodFidget`
`sulk` path already carries the mood, and the funk record is what it now reads from — but the substance is
delivered: there is a durable, minute-long sulk state with a live visual host, where last night there was a
one-frame flash. **No `sulk` rig was added**, correctly: `cycle-145-reachability.test.ts` is 8/8 and
`unplacedRigs()` is empty. The Artist may draw it at cycle 158, and its item text should be corrected once
more to name the real host rather than the one the seed imagined.

---

## Milestone 19

Both of tonight's items are Milestone 19 arcs, and both close.

- Lore: *What a dino just ate reaches its mouth* — **[x]** (BACKLOG-066)
- Structure: *States end by a named rule instead of four bespoke ones* — **[x]** (BACKLOG-544)

**Milestone 19 stands at 4 of 6.** Two arcs remain: BACKLOG-067 (the keeper chooses what goes in the hatch)
and BACKLOG-545 (a greeting happens once a sitting). Both are unblocked. 067 is now the better item than it
was this morning — a hatch selector matters more once dinos have opinions about what comes out of it, which
is a dependency that emerged from tonight's work rather than being planned into it.

## The flake, escalated

BACKLOG-538's cold-Vite boot flake logged its **fourth consecutive instance** tonight, with the same
signature it has had every time: the `__ready` wait times out on a parallel cold start, never an assertion,
always green isolated and green in a full run. Four cycles is no longer a curiosity. It is the longest-lived
known defect in the suite, it costs a re-run every cycle it appears, and — more seriously — it is a failure
mode that trains readers to discount a red board, which is the habit that makes a real regression invisible.

**Validator's ruling: BACKLOG-538 moves to the top of the Structure Track**, above BACKLOG-533. 533 has now
been passed over three times for an entry condition that depends on a founding-constant move nobody has
scheduled, and its cycle-158 deadline arrives next cycle; this ruling does not dismiss it, but an item
waiting on evidence that is not being generated should not outrank an item generating evidence every single
cycle. If 533's condition is still unmet at cycle 158, next cycle's Structure-smith must rewrite the entry
condition or take the item — that deadline stands, unchanged, and is now one cycle away.

---

## Verdict summary

| track | item | verdict |
|---|---|---|
| Lore | BACKLOG-066 — Taste talk | **APPROVED** |
| Structure | BACKLOG-544 — The state that ends | **APPROVED** |

Gates: build clean; **2683 unit across 253 files**; **713/713 e2e, full run**; web-llm boundary intact;
reachability register 8/8; save format unchanged. Milestone 19 at **4 of 6**.

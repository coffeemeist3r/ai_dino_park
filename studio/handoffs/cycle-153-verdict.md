# Cycle 153 — Verdict

Two tracks. Both **APPROVED**.

Tonight's cycle has a shape worth naming before the tracks are judged separately, because both of them are
about the same thing from opposite ends: **the park has been throwing away the only two things it says
about the keeper's own investment.** One is the paragraph it writes about your absence, which lived in a
modal until the next keypress. The other is whether anybody is keeping a ground up, which was a number the
park computed every in-game day and never showed anybody. Neither smith read the other's brainstorm.

---

## Lore track — BACKLOG-114: **APPROVED**

### The reachability bar

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Step away for five minutes, come back, dismiss the digest without reading it, and press V. The paragraph
you just threw away is at the head of the book — above the cast, because it is the one thing in there that
is about you. Reload the page and it is still there.**

### What the item was actually for, which the last three cycles built without noticing

The Validator wants this recorded because it is the strongest argument for the item and it is not in the
item's own text. BACKLOG-114 was seeded at cycle 29, when the digest was one line about time passing.
Since then **four separate authors** have moved into it:

- the warm pairs (106),
- the cold pairs (113, shipped **last night**),
- the spoilage and upkeep tail (462/480),
- and the per-dino accounts that hang over heads on return (116, cycle 150).

Every one of those was written into `dialog.show('While you were away…')` and destroyed by the next
keypress. Milestone 18 is *the park knows you were gone*; three of its five arcs have been spent teaching
the park to say something about an absence, and none of them noticed that the park had nowhere to say it
twice. That is the milestone finding its own gap, one arc from the end.

### The judgement calls, and why the Validator agrees with them

**Three entries rather than one.** The item says "the last digest". The Designer overrode it in the handoff
and the reason is right: the digest's *content* now varies with the gap, so a one-slot log is the modal
with extra steps. And the refusal is the better half of that decision — `keepAwayLog` **will not store an
entry with no lines**, so an absence the park had no news about cannot push a real one out of a three-slot
log. That is the kind of rule that only gets written by somebody who imagined the log full.

**The block is a default parameter.** `bookLines(rows, away = [])`. The book has two render sites and on
the order of a hundred test literals across this suite; criterion 4 asked for byte-identical output without
the argument, and the implementation satisfies it *by construction* rather than by a test that hopes. Not
one existing book literal was edited. That is the correct shape for a change to a function this many things
call.

### The deviation, which is a reuse call and the right one

The code plan opened with a reuse audit whose first row said: *do not write a second span formatter, export
the existing `fmtSpan`.* The Coder did not, and the reason is that the plan's own doctrine pointed the
other way once the code was in front of it:

1. The span is **already the digest's first line**, in `away.ts`'s own words. A stamp would be that fact
   written down twice — the exact defect BACKLOG-495 exists over.
2. **`fmtSpan` divides by an in-game day. `at` is wall-clock.** The stamp would have printed a real
   half-hour in in-game units, and QA's note on this is the sharpest sentence in tonight's handoffs: *it
   would have looked correct in any test that used a round number.*

A reuse rule that gets applied without reading what the thing measures is how a codebase acquires a
plausible bug. `at` and `minutes` are still carried in the entry and in the save, so the numbers a later
stamp would need are banked; what was declined was borrowing the wrong ruler for them.

### Milestone 18

Arc closed: *you can re-read what the bowl got up to without having caught the digest live.* **Two lore
arcs remain** — 119 (the goodbye glance) and 122 (the homecoming streak). The Lore-smith passed over both
this cycle and wrote down why for each, which is the practice CHARTER v6 wanted and rarely gets: 119's beat
fires on a frame the tab has stopped drawing, and 122 needs a dev seam that can move the real-world date
without lying about it. Neither reason is scope. Both are *this item wants a cycle designed around it*, and
the next Lore-smith inherits an argument rather than a shrug.

---

## Structure track — BACKLOG-535: **APPROVED**

### The reachability bar

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Walk one edge east into the Grove. The founder's stake is the plain set post. Within a minute a resident
walks to the fallen cairn and puts it back up — and the stake changes, in that same moment, to the mark of
a ground somebody is keeping up.**

The founder's-stake family has had three states since cycle 145 and **every one of them is a thing the
player finds already set**: who founded this ground, and whether they are still here. This is the first one
the player watches *change*. No clock turns, no day boundary is involved, and the thing that changes it is
an errand the park has shipped on every fresh save since CHARTER v7.

### The decision, which is the item

The item's whole content was *pick one, and write down why the other two lost*. It picked the **upkeep
ledger** — `standing > 0 && derelict === 0` — and the losing arguments are in `stake.ts`'s own header,
which is where they belong rather than only in a handoff.

The Validator's view is that the rejection of `pileStep` is the load-bearing half, and it is the one three
consecutive chronicles had been drifting toward accepting. It lost on a map argument nobody had made:
**BACKLOG-504 already draws that number as a heap standing on the same ground.** A bank-keyed stake would
have put two props on one screen saying one number in two alphabets — and the entire case for the stake
family is that it is the park's *cheapest health read*. A read that duplicates the heap is not a second
read. It is the same read twice, which is worse than no read, because it looks like more information.

And the second sentence of that rejection is the one to keep: *a ground can be piled high because nobody
has spent anything, which is nearer neglect than care.* The obvious driver was measuring the opposite of
what the fourth state means.

### `standing > 0`, which is the whole item in three characters

The code plan flagged it as blocker-if-wrong #1 and it deserves the emphasis it got. Drop that clause and a
ground with **nothing raised at all** reads as *looked after* — so the bare Bowl, where the player wakes
up, would claim to be better kept than the Grove, which ships a ruin somebody is about to fix. **Nothing is
not the same as nothing broken.** Every founded and played register claim would still have passed. It is
pinned by a unit test and by an e2e spec that stands in the Bowl and asserts the negative.

### The half that would have shipped dead, found by an audit rather than by a bug report

The Structure-smith's handoff predicted it in one line — *"the mend's resolve path has to reach the sync,
or the state changes on the next zone cross instead of on the mend"* — and the Code-planner turned it into
an audit of all five paths that change a ground's skyline. Four reach `syncStakes` through
`applyObjectVisibility`. **Raising a landmark does not**: `buildOnGather`'s two exit branches call
`refreshPlaque()` and nothing else.

That is a defect with a specific and nasty signature. The bar answer — the mend — goes through the path
that already works, so the e2e spec would have passed, the register would have been green, and the item
would have looked finished. The failure would have been a player raising a cairn on a bare ground, watching
nothing happen, walking east and back, and finding the stake had quietly changed while they were away. The
repair is two lines at the dispatcher rather than five in the `place*` functions, because one dispatcher is
where all five route through.

### Seven fires

BACKLOG-518 has been held out of the Artist's hands since cycle 145, for a reason that was never an art
reason. The art queue has been reported at 1 in three consecutive chronicles. **It is drawable tonight.**
The Structure-smith's read that this was a structural blockage presenting as an art shortage is confirmed.

### The pass-over, which the Validator is explicitly endorsing

BACKLOG-530 was top of the Structure Track and was passed over. The reason recorded — *its honest bar
answer is nothing a player sees, which disqualifies it as a **track** and not as **work**; ship it as a
rider, per BACKLOG-515 at cycle 148* — is correct constitutional reading and the entry now carries it, so
the next Structure-smith inherits the argument instead of re-deriving it for a fourth time. QA has now
declared 530's absence as a gap in two consecutive cycles. It should ride the next track that lands early.

---

## The suite, which is tonight's third finding and belongs to nobody's track

Two full e2e runs, two failures, **a different spec each time** — `cycle-082-comfort-food` then
`cycle-121-yearning` — both timing out inside `helpers.boot`, before either spec's own subject exists, and
both green when re-run isolated (3/3 and 7/7). Under the routine's rule that is the known parallel-load
flake and it is **not a regression**, and no track is being marked down for it.

The reason it is in the verdict rather than in a footnote is the record. Cycle 148 shipped BACKLOG-515/430
and recorded **649/649 in both directions, this project's first all-green run**. Cycle 152 ran **670/670**.
Tonight the suite is **675 specs** and dropped one on each of two consecutive runs, with the victim moving
— which is the precise signature `helpers.ts` documents in its own comment, and the one 515's verdict said
had been *exhausted*.

QA declined to diagnose it in a QA handoff and asked for it to be filed. That is the right call and it is
what 515's own history argues for: that item was re-diagnosed across four cycles by four routines that each
had ten minutes for it, and it was only solved when somebody could reproduce it on demand and watch the
victim move. So it is seeded as **BACKLOG-538**, with tonight's two data points attached, and with the
instruction that the first deliverable is a *reproduction*, not a fix. Five specs were added tonight and
that is the only variable anybody can name; it is a weak one, and guessing at it is how the last four
cycles of this were spent.

---

## Housekeeping and state

- CHANGELOG: cycle 153 entry, both items.
- BACKLOG: 114 and 535 closed; 538 seeded to the Structure Track (which lands at 4 open against X=4, so
  the next Structure-smith drains rather than brainstorms, with **530 on top and a written reason to make
  it a rider**).
- MILESTONE 18: the away-log arc closed. Two lore arcs left, both with a recorded reason for waiting.
- The Artist fires next with **518 finally drawable** and **537** behind it.

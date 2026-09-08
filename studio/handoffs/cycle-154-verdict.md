# Cycle 154 — Verdict

Two tracks. Both **APPROVED**.

Tonight's cycle has an accidental rhyme worth naming before the tracks are judged apart, because the
two smiths did not read each other and picked the same defect anyway. **Both items are about a number
the park has been computing faithfully, every day, for months, and never showing to anyone.** One is
the keeper's own attendance, which the park could not count because it did not know what day it was
where the player lives — until cycle 152 built it a seam and then nobody used it. The other is the
upkeep bill, which the park has been drawing out of the Grove's pile every in-game day since cycle 152
and which reached the player only as a stores line that was quietly one lower than it had been.

Neither is a new system. Both are a system finally saying something out loud.

---

## Lore track — BACKLOG-122: **APPROVED**

### The reachability bar

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Press P. The plaque has a line it has never had, and it is the only line on the brass that is about
you: `Keeper · first day`. Come back tomorrow and it says `2 days running`.**

### QA raised the weak reading against its own criterion, and the Validator agrees with QA

This is the part of the verdict worth reading, because a lazier QA handoff would have ticked the box.
QA wrote down that day one is *the weak reading of this item and a true one*: what a player sees
tonight is the word "first", and every interesting state of a visit streak costs a real day to reach.
It then argued the distinction that makes it pass, and the argument is right.

CHARTER v7's corollary is about **thresholds tuned so the founding park sits under them** — the
council that could never be reached, `TILES_PER_HEAD` documented in its own source as a virtue for
being dormant. There is no threshold here. The park is not sitting below a floor waiting for a
condition; it is telling the truth about a first visit on the first frame, and it will tell a
different truth on the second. A streak that reads "1" on day one is not a system calibrated dormant.
It is a system that is correct.

The Validator will hold a future cycle to the other half of that, though, and records it here so the
next reader can: **this item's second day is not shipped until somebody has actually had one.** The
e2e proves it through `recordVisit`, which is the same function a real reload calls, so the mechanism
is as pinned as it can be without waiting twenty-four hours. But the first *human* who sees
`2 days running` will see it tomorrow, not tonight, and if it is wrong the register will not catch it.
That is a known and accepted edge of what this park can assert about itself.

### The seam that was built for this and sat unused for two cycles

`keeperclock.ts` shipped at cycle 152 with `keeperDay()` in it, built out of the local getters rather
than `toISOString`, carrying a comment that names BACKLOG-122 by number and says: *no consumer yet —
122 is the next arc.* Two cycles passed. The Lore-smith's case for picking this was essentially "the
cheapest real arc on the queue is the one whose foundation somebody already poured", and the fire bore
that out — the item is a 40-line pure module, and the hard part of it (what is a day, where does the
player live, what happens in March and October) had been solved in advance by somebody who knew what
they were solving it for.

There is a studio lesson under that and it is not "142 was easy." It is that the cycle-152
Structure-smith wrote a seam with a named future consumer, and the naming is what made the pickup
free. A foundation item that says which item it is for is worth more than one that says it is
foundational.

### The one subtle line, which the design flagged in advance and the code got right

Adjacency across a DST boundary. `nextDay` adds 24 hours to the *local* midnight of the previous day
and asks `keeperDay` to name where that landed — not `Date.parse` (UTC, the same bug one function
later), not string arithmetic on the components (needs a month table and a leap rule `Date` already
has). A local day is 23, 24 or 25 hours long and adding 24 hours lands strictly inside the following
day in all three cases.

The test for it is better than the design asked for. Rather than naming a DST date and hoping CI runs
in a zone that has one, it **searches the year for transitions in the runner's own zone** and asserts
across every one it finds, warning and skipping only in a zone that genuinely has none. So on a
machine in Europe or North America this claim is exercised rather than announced.

### Milestone 18

Arc closed: *returning on consecutive real days is a thing the park counts and shows you, because it
finally knows what day it is where you live.* **One lore arc remains: 119, the goodbye glance** — and
its blocker is unchanged and honest, written down two cycles running now: the beat fires on a frame
the tab has stopped drawing. The structure arcs closed at cycle 152. The next Structure-smith inherits
a milestone with one item left in a lane that is not its own, which is a real question for the smiths
and not a formality — either the spine is declared finished or the next milestone gets drafted around
it.

---

## Structure track — BACKLOG-536 (+ BACKLOG-530 riding): **APPROVED**

### The reachability bar

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Cross to the Grove and press P. Before the mend the plaque says nothing about upkeep, because one
landmark is under the bill's floor. Watch somebody walk over and put the fallen cairn back up, press P
again, and the brass has grown a line: `Upkeep · 🛠️ 1/day`.** The e2e asserts the silence as well as
the line, which is the right shape — the silence is the world the player lived in permanently before
cycle 152.

### The item asked a question and the answer was "no", and the Coder shipped that

This deserves the most space in tonight's verdict, because it is the outcome a studio is worst at.

BACKLOG-536 asks whether the park's economy balances, and its own text ends *"and — if one is — the
tuning that fixes it."* The Structure-smith's handoff predicted, in advance and in writing, that no
ground would be insolvent, and instructed the chain not to invent a tuning pass to make the result
feel like something. The Designer repeated the instruction. The numbers came back:

| | |
|---|---|
| sim pumps per in-game day | **480** |
| pumps to regrow one gather | **17** |
| gather ceiling | **~28.2 units / in-game day** |
| the Grove's post-mend bill | **1 unit / in-game day** |
| largest affordable skyline | **57 landmarks** |

Twenty-eight to one. `upkeep.ts` has promised convergence in its header since cycle 480, and the
promise is true with a very large margin. **No constant was touched.** The deliverable is a
measurement, a register claim, and a line on the plaque — and a cycle that resists making the park
punishing so it has something dramatic to report is a cycle doing the harder thing.

### The finding that is not in the item's text, which is the more useful half

**The yield regrowth binds; the spawn chance does not.**

A ground gets 480 chances at a resource per in-game day and can only cash one per 17 pumps, because
`YIELD_DEPLETE` comes off with every pickup and only `YIELD_REGROW` goes back on. `RESOURCE_SPAWN_CHANCE`
is not the constraint and has not been for some time. A future cycle that wants a ground to gather
faster and reaches for the spawn chance will be turning a knob that is not attached to anything.

That sentence is in `groundBalance.ts`'s header rather than only in this verdict, which is the right
place for it — a finding filed in a handoff is a finding nobody reads again.

The header also states the thing that keeps the number honest: **`inflow` is a ceiling, not a
forecast.** Real inflow is further gated by the spawn roll, by whether anyone is awake, by whether a
dino walks over, and by the stockpile cap. So the claim is one-directional — a skyline over the
ceiling is insolvent no matter how the dice fall, and one under it is *not thereby* solvent in
practice. A module that reported a number without that paragraph would be handing the next reader a
forecast, and they would believe it.

### The rider, and the deviation the Validator considers the finding of the night

BACKLOG-530 rode, as its own entry has been asking to since cycle 153, and closed. `__marks()` reads
`.visible` off the production mark objects, which satisfies "not a parallel calculation" by
construction rather than by discipline. Three precedence claims that had lived only in source comments
are now specs. The mark family got the sixth member it was missing.

**And then there is `plaqueStats()`, which nobody planned.**

Adding two lines to the plaque surfaced that `__plaque` — the dev hook that every plaque spec in this
suite reads — was a **hand-copied duplicate** of `refreshPlaque`'s six fields. Not a wrapper: a second
copy. So the brass would have grown two lines tonight and the hook would have gone on reporting the
pre-154 plaque, forever, silently, with the entire suite green. That is BACKLOG-495's exact thesis — a
fact written down twice goes stale in one of the two places — **living inside the test seam itself**,
which is the last place anyone would look for it, because the test seam is what you look *with*.

Both now read one object. Three lines net.

There is a second, smaller version of the same joke in the same fire: `__marks()`'s first spec run
failed on a resting dino wearing nothing, because he was on another ground and every mark in the
family is `inView`-gated — so returning `[]` for him made *not shown* and *not here* the same answer.
That is the exact ambiguity BACKLOG-530 exists over, reproduced inside 530's own hook on its first
day. It now reports `offscreen`.

### The behavior change, stated because the code plan required it to be

`refreshMissedMarks`' precedence gained a fourth term: **a dino on a mend errand no longer shows a
missed-you thought.** It is the family's own stated rule applied — what a dino is doing beats what it
is thinking — and it is a real change to something BACKLOG-116 shipped four cycles ago. No existing
spec covered the overlap, which is exactly the gap 530 was filed over, found by the item that closes
it.

### What this unblocks

`MEND_ART_KEY` exists and `refreshMendMarks` hangs it over the fixer for the whole walk. **BACKLOG-537
has a host.** It has sat in the art queue since cycle 145 and was correctly declined last night with
the reason written into its entry: the errand was live and reachable, the host was not. The Artist may
draw it tonight.

---

## Gates

Build clean. **2573 unit green** across 245 files. **684/685 e2e**, and the one is the BACKLOG-538
signature precisely — `cycle-123-wandering` down at `boot`, not at an assertion, green 6/6 isolated.
That is the **third consecutive cycle** with exactly one boot-time casualty and a different victim
each time. 538 is queued with "produce a reproduction" as its first deliverable, which was the right
call to file and is looking righter each cycle: the pattern is now stable enough to describe and still
not stable enough to catch.

`@mlc-ai/web-llm` stays inside `game/src/ai/` (grep, zero hits). The save change is additive —
`streak?` absent means `NO_STREAK`, so every pre-154 save restores and starts counting on its next
boot.

---

## Both tracks APPROVED.

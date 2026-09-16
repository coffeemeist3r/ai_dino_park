# Cycle 162 — Verdict

Two tracks, both **APPROVED**. Build clean, **2840 unit**, **771 e2e**, zero failed, no flake and no
isolated re-run. `reworkCount` empty for both items.

**And Milestone 20 is SHIPPED** — see the bottom of this file.

---

## Lore track — APPROVED

**Item:** BACKLOG-126 — Eavesdropping envy.

### Rationale

Fifteen acceptance criteria, all PASS. The item has been open since **cycle 31** — a hundred and
thirty-one cycles — and it ships tonight doing the thing its one-line entry promised and one thing more.

**The scoping call is the best decision in the cycle, and it was made in the Lore-smith's handoff before
anybody had opened a file.** The backlog text offers "a homecoming/favorite beat", and the homecoming
half is *already built*: BACKLOG-120's near-tied runner-up has sulked at exactly that moment since cycle
31, and 123, 125 and 544 have since hung a whole funk seam off it. Building a second slight there would
have been a second idiom for one job — the debt 544 was filed to stop, re-incurred by the item that
watched it happen. The favorite half is un-built, is what the milestone headline names, and reads a
record (`palate`, `foodReaction`) the 120 seam cannot see. One paragraph in a handoff saved a cycle.

**"The good dinner" is `favorite || cameRound`, and that `||` is the milestone paying itself back.** The
cycle-161 Validator argued that 126 was better off for having waited, because its watcher would then have
two things to be envious of: what a dino was *born* loving, and what the keeper *made* it love. That was
a prediction about an item nobody had designed. It came true as a single boolean at the feeding site —
which is the cheapest possible form the prediction could have taken, and the reason it is worth recording
that arcs ordered deliberately cost less than arcs ordered by convenience.

**The gate that is a sentence rather than a filter.** `enviousWitness` requires `points < eaterPoints`,
and the module says why: that comparison *is* "the keeper likes them more", written as arithmetic.
Without it the park's own favourite could be jealous of a stranger, which is not insecurity, it is
bookkeeping. The unit suite pins all three positions — ahead, level, behind — so the sentence cannot be
loosened into a filter by a later edit.

### The defect the reachability bar caught, at implementation time

The design ordered the greet bubbles repair → warm → loner → envy, envy last. **Under that order envy
could never have been said on a fresh save at all**, and the e2e found it within a minute of being
written: every founding dino is friendless, `lonely` is therefore true on every hello, and the perk-up
ate the line every single time. A player could have caused the slight, seen the 🥺, read the ticker, and
then walked over and got the ordinary greeting, forever.

That is precisely CHARTER v7's defect — a system calibrated so the founding park sits beneath it — and it
had arrived in a *precedence table* rather than in a constant, which is a shape the bar's own text does
not describe. The shipped order keeps repair (125) and warm (184) above envy, because both are one-shot
beats **caused by this greet**, and puts envy above the loner perk-up, because the perk-up fires on every
hello to a friendless dino and will fire again on the next one, while envy fires **once ever**. The rule
generalises: *a beat that recurs yields to a beat that does not.*

**This is the second consecutive cycle where the bar bit during implementation instead of at verdict.**
That is the bar working as intended, and it is worth saying plainly, because for seven cycles before v7
it bit at neither.

### Three criteria moved in flight, and all three were argued rather than quietly re-scored

Criterion 8 said the memory is "readable in the book"; the book prints quirks, dreams, plans and the menu,
not raw memories, so the spec reads the memory store the murmur and the dialogue actually read. The
criterion named the wrong reader; nothing about the feature moved. Criterion 12 is the precedence change
above. (The third is on the structure track.) A QA pass that re-scores a criterion silently is worth
nothing; one that prints the amendment and its argument is worth more than a pass.

### Harness discipline

Two traps met and written down for the next reader. `__bubbleTexts` is the **live** list, so "said once"
had to be asserted as a *count of one* after two greets — an absence check passes for the wrong reason
while the first bubble is still on screen. And `E` on a dino opens the **tone menu**; `recordGreet` is
reachable only from a dev hook, so the spec drives **both** doors rather than assuming they agree. Cycle
161's `__setTrait` favorite-mover was sidestepped entirely by asking `__favoriteFood` what the favorite
already is.

### Reachability, answered

*Drop the satchel's food next to two dinos on a fresh save. One eats it; the other pulls a 🥺, the ticker
says it watched, and the next time you walk over to say hello it does not say the ordinary thing — it
says* "Oh — hello. ...you gave Rex the good one." *Five minutes later, if you never came back, it has let
it go.* No refill, no day boundary, no population floor, no founding constant moved. Every part of that
was unreachable before tonight.

---

## Structure track — APPROVED

**Item:** BACKLOG-551 — Two marks that are not in the mark family.

### Rationale

Seven criteria, all PASS. The defect was real and precisely stated: every floating mark in this park goes
through `makeHourMark`, which swaps a glyph for a rig the moment one exists — and two did not, so **no rig
could ever be shown over a hungry dino**. That is why BACKLOG-550 was seeded blocked and why the Artist
no-op'd twice.

The fix is not a new pattern. `refreshMissedMarks` already swaps two rigs onto one sprite; this is that
shape, applied to `pressingNeed`.

**The criterion that could not be met, and the honest rule that replaced it.** The design asked that with
one rig drawn and one missing, the drawn need draw and the undrawn one fall back to its glyph. It cannot:
this is **one** sprite with two keys and, unlike `missed`/`missed_aloof`, no base rig to fall back on — an
`Image` asked for the undrawn need would keep wearing the *other* need's picture, which is strictly worse
than the glyph it replaced. The shipped rule is **both keys or neither**. That is the right call and the
Coder was right to make it in flight rather than build the half-state the design had asked for.

### The reachability answer, which the design made conditional and QA correctly refused to score

The design wrote this track's reachability answer down in advance and made it a condition rather than a
claim: **the host alone changes nothing a player sees** — with no rig drawn the mark is the same `Text`
showing the same glyph, which is the design's own words for a REWORK — *unless the rig ships in the same
cycle*, which is the bar's own remedy.

QA flagged that it could not score that, because the Artist fires after the Validator in the routine
order and the answer did not yet exist. **So the Artist was run before this verdict rather than after it**,
and the verdict is written against evidence instead of against an intention. That reordering is recorded
here as a deviation from routine 0's numeric order, made for one reason: a verdict that approves a host on
the promise of a rig is the CHARTER v7 defect one layer up — work reported as shipped that is not.

**The rig shipped.** BACKLOG-550 is closed, the mark family stands at nine, and the two that joined it are
the most-seen marks in the park. So the answer is: *a hungry dino now wears a drawn hollow and a thirsty
one a drawn droplet, where both wore raw system font from cycle 80 until tonight — and every dino carries
a need, so a player sees this within a minute of booting, on any ground, without doing anything at all.*

That is the strongest reachability answer any structure track has given in months, and it is worth being
clear about **why**: the item was chosen for it. The cycle-162 Structure-smith passed over a queue-top
item (533, deferred by its own entry condition to cycle 165) and two others to take the one whose
completion ended an Artist no-op. The pick was made for the reachability of its consequence rather than
for its own size, and the consequence arrived in the same session.

### The cadence, now three for three

The cycle-145 amendment asks that a rig be drawn the cycle its host exists. Cycle 153 did it (518, host in
the morning, rig at night). Cycle 155 did it (540, host and seed in the same cycle). Tonight makes three,
and it is the **first time the studio has aimed at it**: 551 was picked *because* it was a host, by a
Structure-smith that said so in its handoff. The cadence has stopped being luck.

**One detail worth keeping.** The e2e that proves the drawn rigs was written by the structure track in the
morning, before the rigs existed, and authored to pass in **either** state. The same spec proved the glyph
fallback at lunchtime and the drawn rigs at night **without a line changing**. A spec that only holds in
one of two states cannot prove a degradation — it can only photograph a moment.

### Solo cycle, declined and correctly

`cycle - lastSoloCycle` was 11, so a declaration was mechanically legal for the first time since cycle 151
and the Structure-smith did not make one — 551 is ten lines of glue and has never been passed over for
scope. **BACKLOG-553 remains the candidate**, unchanged and stronger: fixing a boot that hangs may well
mean moving the ceiling, the worker count and the fixture seam together.

---

## Milestone 20 — SHIPPED

**"What you feed them is a decision — the park has an opinion about it, and a memory of it."**
Opened cycle 159, closed cycle 162. **Four cycles, six arcs, no REWORK and no ABANDON** — which ties
Milestone 19 for the fastest this studio has closed, and beats it by an arc.

The milestone was opened on a single observation: as of cycle 158 the keeper chose which food went in the
hatch, and for a hundred and thirty cycles before that the choice had been `Math.floor(rand() *
FOODS.length)` — but **a choice that nothing pushes back on is not yet a decision.**

Four cycles later, in order:

- **070** — the park can say no. A prickly palate leaves the wrong food lying on the ground.
- **069** — the book fills in the menu as you discover it, and the arc turned out to be about the keeper
  roster as much as the palate: LUMEN-3's scan had printed the favorite since cycle 37 and nobody had
  thought to **keep** it.
- **068** — a palate is not fixed forever. Three meals of the same wrong dinner and a dino comes round —
  shipped as a **threshold** rather than the drift the item asked for, because a drift of 0.05 a meal is a
  number nobody can see and a dino that comes round on the third greens is a moment with a sound.
- **126** — somebody is always watching the good dinner.
- **546** — the hatch draws on a supply, so choosing a food is choosing *between foods you have*.
- **547** — the phone keeper can reach the selector.

**What actually changed, stated as a player would state it.** Four cycles ago the keeper pressed `H` and
food appeared and a dino ate it. Tonight the keeper opens a satchel that can run out, picks a dish, and
watches one of four things happen: it is refused and left on the ground; it is eaten and written into the
book; it is eaten for the third time and the animal's mind is changed; or it is eaten and **somebody else
is standing there watching, and mentions it the next time you say hello.** One verb, four outcomes, and
the keeper caused all of them.

**The arc ordering is the lesson worth keeping.** 126 was queued from cycle 31 and could have been taken
at any point in the milestone. It went last, on the cycle-161 Lore-smith's argument that envy needs a
legible menu underneath it — and because 068 landed first, tonight's watcher can be envious of a food the
keeper *manufactured the desire for*, at the cost of one `||`. Ordered the other way the same feature
would have needed a second system, or would have shipped thinner. Sequencing was worth real code.

The Structure-smith drafts Milestone 21's spine and the Lore-smith its headline, next cycle.

---

## Bookkeeping

- `lastVerdict = APPROVED`, `currentItem = null`.
- `structureVerdict = APPROVED`, `structureItem = null`.
- `phase = "lore-pending"` — the cycle closes; the Lore-smith bumps to 163.
- BACKLOG-126, BACKLOG-551 and BACKLOG-550 closed `[x]` and moved to `BACKLOG-archive.md`.
- MILESTONE.md: last lore arc checked, **Milestone 20 marked SHIPPED** and moved to the shipped list.
  No milestone is ACTIVE — the cycle-163 smiths draft Milestone 21 before picking items.
- Structure Track at **3** (533, 552, 553) — below X=4, so the next Structure-smith **brainstorms**.
- Art queue at **2** (543, 539), both still host-blocked.
- CHANGELOG entry added.
- CI: the last run before this cycle was **success** (run 34973297731, cycle 161). Two green in a row.
- **Routine deviation, recorded:** routine 7 (Artist) was run *before* routine 6 (Validator) this cycle,
  because the structure track's reachability answer was the Artist's output and a verdict written before
  it would have been a verdict written on a promise. Numeric order resumes next cycle.

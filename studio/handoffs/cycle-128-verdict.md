# Cycle 128 — Verdict

**Lore track (BACKLOG-401): APPROVED.**
**Structure track (BACKLOG-480): APPROVED.**
**Milestone 12: SHIPPED.**

---

## Lore track — BACKLOG-401, the hatch remembers who

The contested drop was built across four cycles (375 yield, 387 gobble, 390 stand, 394 slink-off) and
closed last night with 402, which folded every one of those beats into a single character note. Tonight's
item asks the question 402's own success exposes: those beats have always been filed **with a name in
them**, and in four cycles nothing read the name. `standsGround(bravery)` decided every contest, the same
against every dino in the park, forever.

The build is small and the design call inside it is not. The spec asked for a dead band — a disposition
below a threshold reads null — and the Coder found in the writing that a single *stand* already weighs
that threshold, so the band alone could not deliver the item's own first criterion. The fix was to split
the rule in two: `PECKING_BAR` for how strongly a history reads, `PECKING_MIN_BEATS` for how often the
two have met. That is one more constant than the spec wanted and one *fewer* judgement call, because the
alternative — tuning weights until a single number happened to satisfy both a "one beat is never enough"
rule and a "two slinks outweigh a stand" rule — is a number nobody could later explain. Two rules, each
statable in a sentence, beats one tuned to a coincidence. APPROVED with the deviation on the record.

Three things this got right and are worth keeping as habits.

`holdsAgainst(bravery, null)` **calls** `standsGround` rather than restating its constant, and a spec
sweeps the whole bravery range to prove the two agree. The compatibility seam is the load-bearing part of
any feature that shims itself into an existing decision — 463's `null` priority and 479's empty council
are the precedents — and this is the cheapest way yet seen in this project to pin one: not "the old path
still works", but "the old path *is* the old function."

The yield weighs least. A dino that steps back for a hungrier friend (375) is being generous, not being
cowed, and if generosity had accumulated into wariness the kindest dino in the park would slowly have
read as the most frightened. That is the same judgement 402 made when it put `timid` last in its
precedence list, made again in a different register, and it is beginning to look like this park's house
rule: **a tally is not a character until someone decides what it means.**

And the item stayed on its own side of the table. 397 (the gobbler learns who not to push) is still open
and un-poached; only the winner's stand/cede call reads history. Two items, two halves, neither one
half-shipped.

**The finding is in the refactor, not the feature.** For two cycles running the chronicle has recorded
the same complaint — the suite can prove every derivation this park builds and cannot stage the moment
that produces one. 126 said it of the pacing trace, 127 of a hatch scuffle. Tonight the Coder pulled the
gobble branch of `checkFeeding` out into `resolveContest` and pointed the new dev hook at it, so the e2e
drives the **production** decision and asserts its actual outcome. That is the first repayment against a
debt the studio had named twice and paid nothing on, and the shape generalizes: the reason these moments
are unstageable is that they live *inline* in a 6600-line scene method, not that they are inherently
un-drivable. Extract the branch, hook the branch.

## Structure track — BACKLOG-480, a landmark that has to be kept up

Since the gathering spine shipped at cycle 146, a raised structure has been permanent and free. Every
other economy in this park acquired a cost — food spoils at cap (455), a yield can be worked flat
(384/473), a pile drains as it builds — and the skyline never did, which is why a zone's structure count
was the one number in the park that could only climb, and why the prosperity index (428) had a term that
could never fall. It falls now.

The Structure-smith named the trap before a line was written and it was exactly where it said it would
be: `hasGranary` was answering two different questions with one call — *does this ground get the +3 cap?*
and *has it already used its one granary slot?* — and those answers diverge the instant a granary can
rot. A maintained-only read would have let a ground raise a second granary beside its own ruin. The split
(`hasGranary` maintained for the cap lift, `granaryRaised` for the build gate) is four lines and would
have been a genuinely nasty bug. Worth naming *why* the smith saw it: it wrote down the list of
consumers first and decided per consumer, out loud, which count each one wanted. Five consumers, and they
do not all want the same answer — that is the whole item, and the code is the easy part.

The two calibrations that make this an economy rather than a punishment both hold, and both are asserted
rather than asserted-about. A ground with a single landmark owes nothing, so a fresh park cannot feel
this feature exists (the inertness bar, run over a day *and* a week). And **a derelict landmark owes no
upkeep**, so a struggling ground's bill falls as it lapses: the unit test walks five passes and settles
at one standing landmark, and the in-game test reaches the same floor. That is the difference between a
system with a floor and a death spiral, and this park has been deathless by design for 128 cycles — it
would have been a poor cycle to introduce a ratchet running the other way.

QA's observation is accepted and recorded rather than reworked: the lapse order is array order across the
four structure arrays, so the granary — always raised last — always rots first. It is a defensible
reading of "newest first" and it makes the consequence immediate and visible, but it is an emergent
property of concatenation rather than a rule anyone chose, and a fifth structure kind will inherit it
silently. Noted for 482, which is already queued to fold these derivations into one place.

## The suite

Two full e2e runs, 486 passed / 2 failed each, and a **different** second spec red each time
(grass-tiles, then shared-meal) with BACKLOG-430 the only constant; all green isolated. The wandering is
the catalogued parallel-load flake's signature and is the evidence, not the excuse. QA gave the
shared-meal red the hard look it deserved — it lives in the file this cycle refactored — and cleared it
on the right grounds: it passed under full load in run 1 on the same binary. Unit 1694/1694, build clean,
no save-shape break, the web-llm boundary intact.

One standing red and one standing gap, both unchanged: BACKLOG-430 stays open on principle (fifth
consecutive isolated green, still red under load), and criterion 7 is **partial** — only one of the four
hatch memory strings has an exported builder, so both `manner.ts` and `pecking.ts` still parse three
strings that live as template literals inside `checkFeeding`. A reword empties both silently. That is now
two modules deep and deserves an item.

## Milestone 12 — SHIPPED

Four structure arcs and three lore arcs, cycles 125 through 128. Declared shipped; the smiths draft
Milestone 13 next fire.

## Backlog

- **BACKLOG-401** closed `[x]`, archived.
- **BACKLOG-480** closed `[x]`, archived; removed from the Structure Track pointer list (3 open: 466 /
  482 / 481 — below cap X=4, so the next Structure-smith may refill).
- **BACKLOG-483** seeded `[infra]`: export the four hatch memory strings as builders, so the two modules
  that parse them fail a test instead of emptying silently. The Validator's own recommendation, twice
  deferred to a note.

state: `lastVerdict` APPROVED / `structureVerdict` APPROVED · phase → artist-pending · cycle 129 next.

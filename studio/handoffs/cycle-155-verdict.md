# Cycle 155 — Verdict

## Lore track — BACKLOG-119: **APPROVED**
## Structure track — BACKLOG-541: **APPROVED**

## Milestone 18 — **SHIPPED**

---

Two smiths who did not read each other picked the two halves of the same door. The Lore-smith took
the last unchecked arc of a milestone about the keeper's absence; the Structure-smith, firing after
it and choosing independently, took the seam that had been measuring that absence from the wrong
moment for the milestone's entire life. Neither of them said "leaving" to the other first.

## BACKLOG-541 — the park learns when you left

`savedAt` is the number every one of Milestone 18's five shipped arcs reads from. It was stamped by
whichever of twenty-odd scattered `void this.saveGame()` calls happened to fire last, and every one
of those fires on an **interaction** — a greet, a feed, a gift, a mend. So the park's record of when
the keeper left was in fact a record of when the keeper last *did* something.

In the units a player lives in: `AWAY_SCALE` is 1, so an in-game minute away is a real minute, and
`MISSED_MIN_MINUTES` is 5. Sit with the bowl for six minutes and touch nothing, step away for one,
come back — and the park computed a **seven-minute absence**, filed missed-you traces, drifted a
pair apart, and printed a digest line about a gap that never happened. A milestone whose headline is
*the park knows you were gone* did not know when you went, and was **counting the time you spent
watching it as time you spent away from it.**

`departure.ts` is eighty lines and imports nothing at all. The half worth keeping is not the fix but
the **shape** of it: leaving is two facts, not one. `leaving` is focus lost while the canvas still
paints; `gone` is hidden, and nobody is looking. That split is not tidiness — it is the entire reason
the other track is shippable, and the Validator wants it on record that this is what a structure item
earning its lane looks like. The spine made the beat possible; it was not groundwork for a later
cycle.

## BACKLOG-119 — one dino looks up as you go

The goodbye glance was seeded at cycle 30 and its text has named `visibilitychange → hidden` as the
trigger ever since. **It could never have worked.** That is precisely the one moment in the whole
feature at which the canvas, by definition, is not being looked at — a glance drawn to a hidden tab
is CHARTER v7's failure mode in its purest form, and it sat in the item's own text for a hundred and
twenty-five cycles, through every smith and designer who read the backlog, without anyone reading it
out loud. The Lore-smith read it out loud this morning, in writing, and told the Designer to answer
it before the item could pass the bar. **That paragraph is the most valuable thing produced in this
cycle**, and it cost nothing but reading the item instead of trusting it.

So the glance fires on `leaving`, and `gone` draws nothing because there is nothing to draw to.

The second correction came a stage later and is smaller and just as real. The item asks for 👀. That
glyph has been `VIGIL_GLYPH` since cycle 149 and 👁 has been `ROUSE_GLYPH` since 109 — two of the
five existing marks were already eyes, and a third would have made the family unreadable at 12px.
That is the cycle-154 Artist's mallet argument, applied a stage earlier and before a pixel was
drawn, which is the cheapest place to apply it. The replacement is not a free slot: the five existing
marks are all facts about a dino's **interior**, and this is the only one **addressed to the
player** — so it borrows the one symbol this park already has for addressing the player, BACKLOG-112's
welcome-back wave, told from the other end. *A living bookend to 112* is what the item literally asked
to be; it got there by a route the item did not anticipate. BACKLOG-540's art text was amended to match
rather than left to drift.

## The finding of the night belongs to the e2e suite

The Coder's first full run went red — three of this cycle's own specs, and **two `controls-help`
specs that touch none of this cycle's files.** The cause was in the code plan, not the code: the plan
reasoned that `document.hasFocus()` inside the handler beats a hand-tracked flag, and `hasFocus()`
still reports true inside a `blur` handler. The stage computed `here`, `shouldStamp` declined, and
**the keeper could never leave.**

Both tracks were entirely non-functional. `npm run build` was clean. Two thousand six hundred and two
unit tests were green. Only the e2e could tell.

This studio is currently carrying **BACKLOG-538** in its structure queue — an item about e2e
trustworthiness, filed after three consecutive cycles each dropped one spec at `boot`. Tonight that
same layer caught a defect that made two shipped features do nothing, behind two green gates. The
verdict records both facts in the same paragraph on purpose.

And the two `controls-help` specs are the sharper half. The tempting move was available and named by
QA: *my three specs are mine; those two are the 538 flake.* Taking it would have meant loosening three
assertions, leaving two specs red, and going out to hunt a second, imaginary bug. The one-line
root-cause fix turned all five green with neither of the outsiders touched. **A red spec in a file you
did not edit is evidence, not noise** — and this cycle's context made believing otherwise easier than
usual.

## Reachability (CHARTER v7)

*In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**119:** open a fresh park, greet one dino, let the sitting reach twenty seconds, then click another
window. Before the bowl goes quiet, the dino that likes you best looks up, wears the wave over its
head for two and a half seconds, and says something graded by how well it knows you. Nothing in this
park has ever reacted to the player **leaving**; the only thing it has ever noticed is the player
arriving. Frame-observable, inside the window, no threshold.

**541:** a changed number rather than a new pixel, and QA flagged it as the weaker of the two. The
digest on your next return describes the absence that actually happened rather than one inflated by
however long you sat watching. It passes because v7's corollary is about **thresholds calibrated so
the park sits inert beneath them** — and there is no threshold here. This is a reading that was
already firing on every return, and firing wrong. Correcting a live lie is not groundwork.

The Validator agrees with QA's grading and records the disagreement it would take to overturn it: if
a future reader thinks "the number is now right" is too thin for the bar, the honest counter-argument
is that the *player-facing* half of 541 is the glance, and the two tracks were one item wearing two
numbers. That reading is defensible. It is not the one taken.

## Gates

- `npm run build` — clean.
- `npx vitest run` — **2602 passed**, 3 skipped, 248 files.
- `npx playwright test` — **696 / 696. A full-green run**, no flake, no isolated re-run needed.
- `@mlc-ai/web-llm` outside `game/src/ai/` — no hits.
- Save shape — unchanged. This cycle alters *when* `savedAt` is written, not the schema, and a
  pre-155 `savedAt` is still a valid duration input.

Fourth consecutive fire in which the BACKLOG-538 signature either appeared or did not, and tonight it
did not. The pattern remains what it was filed as: intermittent.

---

## Milestone 18 — *The park knows you were gone* — SHIPPED

Six cycles, seven items, and a headline that turned out to be a claim the park could not honestly
make until its last night.

The milestone opened at cycle 150 on a real complaint: the keeper's absence was a **number the
catch-up printed**, and nothing more. It closes with the absence being something each dino formed
its own account of (116), something that costs a neglected pair a little distance (113), something
you can re-read after the modal is gone (114), something counted in the days of the player's own
life (122) — and, tonight, something the park **notices beginning** (119, 541).

The through-line the Validator wants recorded is not the feature list. It is that **five of these
seven arcs were about the return, and the milestone did not notice** until the Structure-smith went
looking for a spine and found that the door only had a handle on one side. Cycle 153's arc found a
version of the same gap — three cycles teaching the park to say something about an absence and none
noticing it had nowhere to say it twice. Cycle 155 found the deeper one: the whole milestone was
measuring from a moment it had never defined.

Two lessons the studio should carry forward, both cheap:

1. **A foundation item that names its future consumer is worth more than one that only says it is
   foundational.** Cycle 154 learned this from `keeperDay()`; cycle 155 spent it again on
   `SESSION_MIN_MS`, which is exported from `departure.ts` rather than `parting.ts` precisely so the
   stamp and the glance can never disagree.
2. **Read the backlog item, do not trust it.** 119 carried a trigger that could not work for a
   hundred and twenty-five cycles because it was easier to inherit than to check.

The structure arcs closed at cycle 152 and the lane sat empty for three cycles, which the cycle-154
housekeeping flagged as a thing to decide out loud rather than by silence. The cycle-155
Structure-smith decided it out loud, picked off-checklist and on-subject, and the pick turned out to
be the milestone's missing half. That is the amendment working.

**Next cycle's smiths draft Milestone 19.** The Lore-smith writes the headline and the feel arcs, the
Structure-smith the spine arcs, per CHARTER v6.

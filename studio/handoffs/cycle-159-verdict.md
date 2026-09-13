# Cycle 159 — Verdict

**Lore track — BACKLOG-070: APPROVED**
**Structure track — BACKLOG-546: APPROVED**

Gates: `npm run build` clean, **2729 unit** green (257 files, 3 skipped), **743 e2e** green, WebLLM
boundary held, save additive, tree clean. QA reports 20 of 20 criteria pass with three disclosures, all
three of which are load-bearing and are taken up below.

---

## The reachability answer, both tracks

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Lore track.** Drop a food that is not Rex's favorite. Rex — agreeableness 0.019, standing three tiles
from the hatch, first to almost every drop this park has ever made — arrives, looks at it, and walks
away. The food stays on the ground. Sunny comes over and eats it. In a hundred and thirty-four cycles of
this park, **no dino has ever reached a piece of food and not eaten it.** Every feeding branch built
since cycle 59 — the rush, the escort, the yield, the mercy, the gobble, the stand — decides *who* eats.
None of them could decide *whether*.

**Structure track.** The brass reads `Satchel · 🌿 4 · 🍓 3 · 🍖 2 · 🐟 1` from the first frame, and the
HUD's feed line carries the count of whatever is loaded. Every `H` takes one off it. Load meat, press `H`
twice, press it a third time, and the park tells you that you are out of meat — while you are still
holding three greens and looking at a dino that does not eat greens. **That is two keystrokes from a
fresh save**, and it is the exact state BACKLOG-546's own text named as the interesting one.

Both answers are unqualified. Neither track needs six residents, a day boundary, or a later item.

---

## What earns the approval, beyond the criteria

### The ordering bug the suite found, and what it says about the design step

The Designer specified the refusal check ahead of `yieldFoodTo`, with a reason that sounded right in
prose: *a dino that will not eat is not a winner, and must not be the subject of a yield, a mercy or a
stand.* It was wrong, and it was wrong arithmetically rather than aesthetically. `WELL_FED` is 0.3 and
`PICKY_HUNGER` is 0.5, so **every candidate for the generous yield is inside the refusal window** — the
branch as specified would have silently disabled BACKLOG-375, -385 and -386 for every prickly dino in
the park. Three existing specs went red in the first full run and the Coder moved the branch.

Two things about that are worth the record. The first is that **the park's own history caught its
designer**: 375 shipped at cycle 83, 385 and 386 at 98, and the only thing standing between a
plausible-sounding ordering and six cycles of quietly dead beats was that somebody had written specs for
them at the time. The second is that the new ordering is *better prose as well as better code* — the
Coder's comment at the seam says it in one line: generosity and grace are about giving the meal away, and
a dino that does not want it is the most willing giver in the park; the contest is about keeping it, and
a refuser has no stake in a fight over food it will not eat. The refuser gives first, then leaves, and
the hungry gobbler beside it reaches the piece on the next step and eats it anyway. **The gobble outcome
is preserved, one step later, arrived at honestly.**

### The one edited spec, and why it is not a loosened one

`cycle-083-generous.spec.ts`'s passthrough case staged `names[0]` — Rex — as a well-fed winner and
asserted it eats. That assertion is precisely what BACKLOG-070 makes conditional, so the staging now
forces the winner warm and a comment names the branch the test is about. **No assertion was removed or
weakened**; one line of staging was added, and QA checked for exactly that failure mode before signing
it off. This studio has now spent several cycles learning that a green board can prove nothing; the
matching discipline on the other side is that a red board is sometimes the suite doing its job, and the
correct response is to name the case rather than to widen the assertion until it stops complaining.

### Two reuse decisions that kept this cycle inside one fire

The satchel is a `FoodPile` — the same `food id → count` map the zones have banked into since
BACKLOG-446 — so it inherited the cap, the glyph readout (`foodPileLine`, which is what the plaque line
renders) and the save-validator shape for free. The day refill is `checkSpoilage` copied, day-guard and
both arming points included. And `PICKY_AGREE` is **declared** at 0.4 rather than imported from
`ai/brain.ts`'s `PRICKLY_MAX`, because `brain.ts` pulls in `WebLLMBrain` and the CHARTER's hard boundary
does not let the inference backend cross into a pure world module — with a unit test asserting the two
values are equal, so the pin is enforced rather than hoped for. That is the right shape for a boundary
you cannot cross: not a comment, a test.

### The founding stock is uneven on purpose, and the register now says so

CHARTER v7's corollary says a founding constant must not be tuned to sit below its system's floor. The
inverse failure is available here and was avoided: a satchel generous in every food is a satchel you
never notice. The register entry for 546 does not assert that the stock exists — it asserts that the
counts are **uneven** and that **at least one food is at two or fewer**, so a future "let us be kinder
to the player" pass that flattens the founding stock reddens `cycle-145-reachability.test.ts` instead of
quietly deleting the point of the item. The 070 entry does the same job from the other side: it is keyed
on the *roster*, so a trait re-seed that leaves nobody prickly enough to ever refuse goes red, even
though every one of refusal's own tests would stay green.

---

## The disclosure that is not a defect, stated plainly

**The satchel's day-boundary refill is unreachable in a sitting.** At the shipping 1× clock its first
fire is 24 real hours away. The design declared this in advance rather than claiming it, and QA
confirmed the implementation matches the disclosure.

It is approved on those terms, and the terms matter: **it is not the track's reachable half and was
never offered as one.** The reachable half is the founding stock, the per-drop spend, the HUD countdown,
the plaque line and the empty-handed drop — five things, all verified. The refill is the same shape and
the same unreachability as upkeep (480), spoilage (455) and the council term (484), and it belongs to
the same open item they do: **BACKLOG-493, the clock.** This is now the fourth day-gated system shipped
since v7 was written, and each one has honestly said so and been approved on the reachable remainder.
That is the bar working. It is also, at four, a number the operator should see, and it appears in the
chronicle for that reason.

One live constraint QA flagged and this verdict endorses: the no-argument `__dropFood()` hook now spends
the satchel, because it drives the production keeper path rather than a parallel one (the cycle-128
discipline). The full suite is green because no spec drops more than a handful of times. A future spec
that drops a dozen times through the auto slot will run the satchel dry; the out is `__setSatchel`, and
it is named here so the next author finds it rather than debugging it.

---

## Ruling — BACKLOG-538 and the reachability bar for infra

The cycle-158 Structure-smith asked the Validator to rule on a gap in CHARTER v7 and was not answered;
the cycle-159 Structure-smith asked again, more narrowly, noting that an un-takeable item now sits
permanently at the top of a queue whose entire operating rule is *drain the top*. The question:

> Does CHARTER v7's reachability bar have a reading for an `[infra]` item whose whole value is to the
> studio rather than to the player?

**Ruling: yes — infra answers a substituted question, not an exempted one.** An `[infra]` track is
APPROVED against this, in place of the ten-minute question:

> *What can the next cycle do that it could not do before — and what is the evidence, produced in this
> cycle, that it works?*

With one condition that is not negotiable and that does the same job the original bar does: **the
deliverable must be run and demonstrated inside the cycle that ships it, not described.** A harness that
reproduces the boot flake on demand, with the verdict carrying the run and the victim it caught,
satisfies this. A harness that *would let a future cycle investigate* does not — that is "groundwork for
a later item" wearing a lab coat, and it is the exact sentence v7 makes a REWORK.

The reasoning. v7 was written against seven cycles of governance that shipped into a park where the
feature could not fire; its target was **work whose value was asserted rather than demonstrated**, and
the ten-minute question is the *instrument*, not the principle. For a test harness the honest instrument
is a different one, and the principle survives the substitution intact — a reproduction you have run is
demonstrated, a reproduction you have designed is asserted. Read the other way, the bar would tell this
studio that it may never again repair its own test infrastructure, which is not a rule v7 was written to
create and is one that would, given enough cycles, cost the player far more than a dormant council did.

**Scope, recorded honestly.** CHARTER v7 grants the studio authority over routine rules; this is an
interpretation of how an existing bar applies to a tag, not a new exemption and not a constitutional
amendment, so it is recorded in this verdict and in BACKLOG-538's own text rather than in CHARTER.md.
**The operator can overturn it with one line in the Idea Box or the CHARTER, and should if they read it
differently** — it is flagged in tonight's chronicle for exactly that reason. Until then:

- **BACKLOG-538 is unblocked** and remains top of the Structure Track. The next Structure-smith may take
  it, and if it does, its first deliverable is still the reproduction its own text demands — now with a
  stated bar for what "shipped" means for one.
- The substituted question applies to `[infra]` only. Every `[core]`, `[social]`, `[emergent]`,
  `[pokemon]` and `[ai]` item answers the ten-minute question, unchanged.

---

## Milestone 20

Two arcs check tonight, one per track, out of six: *a dino can refuse what you put in front of it* (070)
and *the hatch draws on something* (546). Milestone 20 opened this cycle and is **2 of 6** after one.

## Verdict

**APPROVED / APPROVED.** Both items close. BACKLOG-070 and BACKLOG-546 move to the archive.

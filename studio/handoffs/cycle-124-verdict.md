# Cycle 124 — Verdict

Both tracks are Milestone 11's last arcs. Both APPROVED. **Milestone 11 SHIPPED.**

---

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-360 — Pond pilgrimage (two who go together)

**Rationale.** All 13 acceptance criteria pass; build clean, unit 1602/1602, no pinned migration spec
amended. The item is small in code and large in kind: for 124 cycles every crossing mechanism this park has
built — ambient (334), homesick (340), scarcity (450), hearsay (458), longing (362) — moves exactly one
body, and the bond graph has never had a say in *who travels with whom*. This is the first time it does.

Three things make it a good build rather than merely a working one. It **reads a record that already
existed**: 346 has been filing `🌿 traded pond stories with <name>` into the memory ring since cycle 76, a
durable per-pair record of two dinos who bonded over a place, and nothing had ever asked it a question. It
is a **companion pull, not a second decision** — the companion rides the destination its friend already
chose, so `pickMigrant` and all four destination reads are untouched, which is why a feature that hooks the
migration seam moved no pinned migration spec. And the pair pick is **positional, not random**, with a test
that calls it twenty times: BACKLOG-456 catalogues `Math.random` in a pickable set as the flake shape, and
this cycle declined to add a fifth noun to that item.

The seam placement deserves a note. `tryTogether` is called from `tryHomesick` and `scarcityMigrate` rather
than `maybeMigrate`, because the dev hooks enter through those two — so there is no test-only path anywhere
in this feature; the e2e drives the identical method production does.

**One honest limitation, recorded rather than papered over.** The pull fires only when a crossing is already
bound for the grove, so a bonded pair can go a long while without ever travelling together. That is the
arc's own reading — they go back *when one of them was going anyway* — and it is what keeps the feature from
touching the destination logic. But it does make the beat rare in ordinary play, and rare-by-design is worth
saying out loud rather than discovering later and calling it a bug. It is reachable, not unreachable: the
precondition is a shipped state and the e2e drives the whole path.

**Milestone arc:** completes lore arc 3 — *Two who go together*.

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-477 — Both of the ground's calls, on the lens

**Rationale.** All 14 acceptance criteria pass. This is the rare item whose success is measured by what the
diff *removes*: the lens box's prosperity line went from five accreted reads to three, and the two that came
off are now behind one table, one derivation and one legend. 468 hung 🍽️/🏦 on the end of that line because
at the time there was one governance call; 473 added 🧺/🧱 by copying it; a third would have copied it again,
and nothing anywhere in the game ever told the player what any of the four glyphs meant. `GOVERNANCE_CALLS`
makes the next call a literal new entry — and the legend is generated from the same descriptors the row is,
so the two cannot drift.

Two judgement calls I want on the record. The **placeholder** (`▫` for a call a ground hasn't made) is the
right shape: without it, a ground with only a spend policy renders a bare glyph the player would read as
position one of two, and a half-decided ground becomes indistinguishable from a fully-decided one. And the
placeholder character had to change, which is the cycle's sharpest small finding: `·` — the obvious pick —
is *already drawn in this very box* by 474's `'· unsettled ·'` badge, on three of four grounds in a fresh
park. A new glyph colliding with an existing read on the same panel is worse than no glyph. It surfaced only
because the spec asserts a fresh park contains **none** of the row's glyphs — a negative assertion that
usually feels redundant and this time did the work.

The Coder also suppressed the row for an **unsettled** ground, which was not in the criteria. Confirmed
correct: 474's rule is that an unsettled box replaces its read rather than annotating it, and a governance
row on a ground nobody has ever lived on would contradict that.

**Milestone arc:** completes structure arc 3 — *Both of the ground's calls, on the lens*.

---

## On the two e2e failures

Neither full run was all-green, and I am approving anyway. The reasoning, so a future cycle can check it:

- The failures are `cycle-121-work-priority > persists across a reload` (both runs) and `cycle-077-carry`
  (second run). Isolated: 5/5 and 1/1 against this build.
- Both are **named nouns on BACKLOG-456** — the first and the fourth.
- **This exact pair failed on the cycle-123 run, off a completely different diff.** That is the load-bearing
  fact. An isolated pass alone only says "not deterministic"; the same two specs failing across two
  unrelated diffs says the cause is the suite's parallel load, not either night's code.
- Neither track can reach them. 477 lives in the lens draw and the `[?]` panel. 360 does touch the crossing
  seam that `cycle-077-carry` drives — so QA checked it properly rather than waving it off: that spec runs
  under `__pauseAmbient`, no meeting fires, no pond-swap memory exists, and the pull returns `null` on both
  crossings.

**Standing note for the next Structure-smith.** BACKLOG-456 has now surfaced in **three consecutive cycles**
and cost two full suite runs this cycle alone. It sits mid-queue behind 466 and the three items seeded last
night. A flake that fires every cycle is not infra hygiene any more; it is a standing red that hides real
regressions, which is the exact harm the item's own text predicted. Recommend it be weighed as a genuine
contender for the next pick now that the milestone rule no longer applies.

---

## Milestone 11 — SHIPPED

Both tracks closed their third and final arc tonight. Moved to Shipped milestones with the closing cycle;
the smiths draft Milestone 12 at the next cycle open.

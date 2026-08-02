# Cycle 119 — Verdict

Milestone 10 opens. Both tracks resolve on their first attempt.

## Lore track

**Verdict: APPROVED**
**Item: BACKLOG-343 — First across (pioneer in the book)**

All six acceptance criteria pass. The item is small on the surface — one persisted map, one optional book
field, one ticker line — and the Validator's attention went to the two places it could have gone wrong, both
of which were handled by construction rather than by a special case. The bowl has no pioneer because nothing
records one at *spawn*, only at *arrival*: the exclusion is a property of where the call sites are, not an
`if (zone === BOWL_ID)` sitting in a helper waiting to be forgotten. And the founding is recorded at **both**
zone-entry seams (`crossDino` and `relocate`), which matters more than it looks — the instant path is the one
the dev hooks and the away catch-up use, and recording only the visible crossing would have left a route into
a ground that founds nothing. `recordPioneer`'s single first-write-wins guard collapses "never overwrite" and
"never re-fire" into one line, so there is no second rule to drift from the first. Additive save with no
back-fill, correctly: the park did not record this before and inventing a plausible pioneer for the grove
would be fiction in a save file.

## Structure track

**Verdict: APPROVED**
**Item: BACKLOG-472 — The fourth ground**

All ten acceptance criteria pass, including S10, which is the one that made this item worth doing. The
Validator read the diff specifically looking for a cross-zone system that had been quietly edited to
accommodate the Hollow, and there is none: prosperity, harvest, demand, the pantry, the ferry, the provider,
migration, decline and governance are untouched, and the Hollow appears on the zone chain, the map lens, the
plaque tally and the edge indicators through code written before it existed. 449's cheque cleared.

Three points of judgement, all argued in the open rather than smuggled:

**The season.** The design predicted a clean 4×4 rotation and the arithmetic does not permit one. With the
founding three already holding fall/winter/summer as their lean seasons, spring is the only free slot on
both the good and the lean side, and one crop cannot take both. The alternative — moving roots' lean to
spring — would have squared the table by changing what a *fresh boot* banks from a ground that has existed
for a hundred cycles. The coder chose the hinge over the symmetry and wrote the reasoning into the source
where the next reader will hit it. The Validator agrees with the call and, more to the point, agrees with the
*form* of it: the cycle-118 test was amended to state the new shape precisely (one thriving per season; every
season but spring has thin crops; the founding three still neutral in spring) rather than loosened into
something vague enough to pass. A test that says less is how a rotation quietly stops rotating. The
`seasonCropLine` widening rides along honestly — a season that thins two crops now names both, so the ticker
cannot under-report the year.

**The seams left alone.** The Hollow has no `ZONE_BIAS` entry and builds the default cairn. That is not an
omission, it is the two documented back-compat seams doing their job, and pulling a fourth resource kind
into this item would have dragged recipes, barter, craft escalation and an art rig behind it. Stated in the
source at the table where a future reader will look.

**The finding nobody predicted.** Nine test files hard-coded "the chain is three long" — six unit, three
e2e — and every one of them failed on the fourth row. Not one production dispatcher did. That asymmetry is
the cleanest possible answer to the question this item asked: the *code* generalized and the *assertions*
did not, which is exactly the right way round, and it is only visible because someone finally added the
fourth row. Amending nine files of assertions is the price of learning that, and it was worth paying.

## Quality gates

- `npm run build` — clean.
- `npx vitest run` — **1448/1448** (+25 over cycle 118).
- `npx --yes kill-port 5173 && npx playwright test` — **412/412** (+3), full parallel run, all green.
- `@mlc-ai/web-llm` imported only under `game/src/ai/` — verified by grep, no hits elsewhere.
- Save additive on both tracks (`hollowPlot`, `pioneers`); old saves load clean, pinned by test.
- One catalogued flake during QA (`cycle-039-inspect`, parallel-load; 4/4 isolated and green on the clean
  re-run). Not a regression.

## Milestone

**Milestone 10 — "A fourth ground, and the first feet on it"** opened this cycle and takes its first arc on
each track: lore arc 1 (343) and structure arc 1 (472). Three arcs remain (364, 362, 474).

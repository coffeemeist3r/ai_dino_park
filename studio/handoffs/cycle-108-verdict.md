# Cycle 108 — Verdict

Milestone 6 ("No zone stands alone"), lore arc 3 and structure arc 4. One rework loop on the lore track,
resolved. Both tracks close APPROVED.

---

## Lore track

**Verdict: APPROVED** (after 1 rework loop of a permitted 2)
**Item:** BACKLOG-453 — Word of the provider

**Rationale.** All 11 acceptance criteria pass on automated evidence (QA rework pass), build clean, suite
green, CHARTER boundary verified — `ai/roles.ts` and `world/providerword.ts` are pure, and no
`@mlc-ai/web-llm` import exists outside `game/src/ai/`. The arc does what it promised: the park's first
economic standing (448) is now something residents *say*, in two registers, and the deterministic floor
carries it with the model only ever colouring on top.

Two decisions in this build deserve to survive into the record. First, **the no-self-praise rule lives in
the pure layer** — `spreadProviderWord` refuses when `speaker === provider`, so no future caller can
accidentally have a provider talk up its own pantry. Putting the rule where it cannot be skipped, rather
than at the one call site that exists today, is the right instinct and matches how this codebase has treated
its other hard rules. Second, **the temperament split carries one identical fact in three voices** — the
262 principle ("temperament colours the words, never the debt") applied to reputation. Sunny gets credited
generously by a warm dino and grudgingly by a prickly one, and the park's read on who feeds it does not
change either way.

**On the rework.** QA failed criterion 9 for a single template string: the 🧺 ticker named the listener and
the zone but dropped the speaker, where both sibling rungs in the same cascade name both parties and the
written criterion asked for it. That is a cosmetic miss, and it was still the right REWORK — the ticker is
the keeper's only read on who carried word to whom, and a bar that bends for cosmetics is not a bar. The
loop cost one line of production code and produced something better than the fix: the tightened assertion
immediately caught a *second*, older defect nobody had noticed. `🧺` is shared with 448's haul line, so the
spec's `.find(e => e.includes('🧺'))` had been selecting `🧺 Sunny put the harvest away…` rather than the
gossip event, and the original weak assertion had masked it by matching a phrase fragment instead of a whole
line. **The spec had been reading the wrong event since it was written.** Production was correct throughout.
That is the argument for exact assertions, made by the codebase rather than by anyone's opinion, and it is
the most useful thing this cycle produced.

`reworkCount[BACKLOG-453]` cleared on close.

---

## Structure track

**Verdict: APPROVED**
**Item:** BACKLOG-449 — One terrain per zone, as data

**Rationale.** 9/9 criteria pass. The three `if` chains that encoded a zone's ground — `zoneTileAt`,
`zoneWaterTile`, and `zoneTint`, the third of which the item text had not even counted — are one
`ZONE_TERRAIN` table, and the three dispatchers are one-line lookups that kept their exact signatures.

The evidence that the generalization is real rather than asserted is that **`WorldScene.ts` needed zero
edits** — not the one import line the plan budgeted. The only consumer of all three dispatchers never
noticed they had been rewritten underneath it. Alongside that, a test-only fourth zone gets ground, tint, a
landmark and working `atWater` with no production change, and the four pre-existing terrain/pond test files
are byte-unmodified in `git status`. A refactor that forces its callers to churn has merely moved the cost;
this one didn't.

**On the criterion the Designer overruled.** The Structure-smith asked for the water landmark to be
*derived* from the tile rule, so it could never drift. The Designer ruled that impossible without breaking
the higher bar: the three existing landmarks are not reproducible by any single scan-and-centre rule — the
grove's pond centre rounds up from its x-range, the Fernreach's creek rounds down — so deriving would have
silently moved two of three landmark tiles. It took the handoff's own stated fallback (an explicit field,
one authoring site per zone instead of two) and delivered the anti-drift as a **mechanism** rather than a
derivation: a table-driven invariant asserting every declared landmark reports `'water'` under its own
zone's rule, iterating `Object.entries(ZONE_TERRAIN)` so a fourth row is covered the day it is added. The
hand-maintained *"kept in sync with the water block in `groveTileAt`"* comments — which cycle 105's own
verdict had already flagged as a hazard — are now a test that fails CI. **This is the correct way for a
downstream stage to disagree with an upstream one:** honour the intent, refuse the letter that breaks a
higher bar, say so in writing, and ship the mechanism anyway.

Milestone 6's promise that "a fourth zone is a table row, not three new code branches" is now literally
true and has a test proving it.

---

## Cycle notes

**The flake, diagnosed rather than labelled.** The first confirming full run came back 367/368 —
`cycle-076-news-pull` picked `Sunny` where it expects `Mossback`. QA worked the diagnosis in the right
order: isolated re-run green (792ms); 12/12 under 4-worker parallelism; then the code argument — `Sunny`
means `pickMigrant` took its **homesick** first branch, which reads `bonds` and `tenure` and short-circuits
before the grove-pull logic the spec is about, while this cycle's diff writes only `roles` and `memory`.
Disjoint. And decisively: the *previous* full run was 368/368 green with the entire provider rung already
shipped, so the only delta between green and red was a log template and a test predicate — neither of which
touches simulation state. A fresh full run returned **368/368**. Routine 0's test (passes isolated **and** a
fresh full run green) holds both ways. Not a regression.

It is, however, a new member of a catalogued family, and it is being written down rather than shrugged at:
the spec drives two crossings over ~40 `__stepWorld` calls, `__stepWorld` bypasses `__pauseAmbient` by
design, so ambient meetings mutate `bonds` mid-drive and any dino turning homesick flips an exact-identity
assert. That is the BACKLOG-456 shape with bonds in place of pile arithmetic — and it is latently
nondeterministic independent of load, since the homesick pool is picked with `Math.random()`.
**BACKLOG-456 updated** to name it as a third instance so the eventual `__pauseAmbient`-one-level-down fix
is scoped to cover it.

**BACKLOG-430 watch.** `mobile-minds` "long dialogs page GBA-style" — the standing red — passed in all
three full runs this cycle. Not declaring it fixed (it has passed intermittently before, and nothing this
cycle went near the dialog input path), but three-for-three is worth recording against the day someone
re-diagnoses it.

**Milestone 6 status: 6 of 7 arcs closed.** All three lore arcs are done (451, 452, 453). Three of four
structure arcs are done (447, 448, 449). **Only BACKLOG-450 — "scarcity moves the herd" — remains**, and it
is the natural next structure pick: it is the last thing standing between this milestone and its headline.
The next Structure-smith should take it unless something is genuinely blocking.

**Next cycle:** cycle bumps to 109 (both tracks resolved). Lore track has no Milestone 6 arc left to serve —
the Lore-smith will need to pick from the general queue and justify it, or the milestone closes on 450 and
the smiths draft Milestone 7.

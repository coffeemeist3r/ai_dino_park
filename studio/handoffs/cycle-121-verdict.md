# Cycle 121 — Verdict

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-362 — *A ground you come to miss*

**Rationale.** All 13 acceptance criteria pass, build and both suites green on a single run, and the item
does the thing the milestone arc promised rather than a smaller thing wearing its name. The park's
migration machinery has been a pure push system for a hundred and twenty cycles — scarcity, hollowing, a dry
pantry, a friend a zone away — and this is the first bias that says *go there* rather than *leave here*. The
implementation earns the approval on discipline as much as on behaviour: `yearnedZone` is deterministic by
construction (longest-away wins, chain order breaks ties, no `Math.random()` anywhere in the read), the new
migrant tier sits strictly below plenty-primed and strictly above the scarcity fallback so every pinned pick
above it is byte-identical, and `seedYearning` rides inside the `ambientPaused` guard so BACKLOG-456's seam
still holds still. The record is its own small map rather than a widened `SeenZones`, which was the right
call: folding a `leftDay` into 364's record would have touched a shipped parse guard and every 364 spec to
buy nothing.

The `relocate` ordering bug the Coder caught and fixed in-fire is worth naming in the approval rather than
burying: the departure clock was stamped *after* `setZone`, so it recorded the ground the dino had just
arrived in and then cleared it — a perfect no-op that no unit test could have found, because the defect was
in the order of two calls in the scene and not in the pure read. The e2e caught it on the first run. That is
the two-layer test discipline paying for itself, and it is the argument for why this studio writes both.

One criterion the QA adapted (the granary gate, proven at the unit layer through the exact composition the
scene uses instead of via three stacked dev-hook seams) — reviewed and accepted. The reasoning was written
out rather than the criterion quietly dropped, which is the behaviour the bar is meant to produce.

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-473 — *The ground's second decision*

**Rationale.** All 14 acceptance criteria pass. Governance stops being a single switch: a provider now makes
two orthogonal calls, off two different axes of its temperament, and the second one changes what the player
can *see* on the ground — a gather-first ground banks a visibly fatter pile before it spends, a build-first
one raises its landmarks sooner and works its ground harder for it. The `null` seam is honoured at both
hooks, `workRegrowth(null, y)` is bit-identical to `regrowYield(y)` and pinned by a test that says so, and
the policy was added *to* `governance.ts` rather than forked into a second module — the right instinct, since
a `workPriority.ts` would have been this file with a different name.

The finding the code plan predicted turned out to be real and is the best thing in the diff:
`canBuildGranary` re-checks `GRANARY_AFTER_STRUCTURES` internally, so shaving only `buildOnGather`'s outer
`if` would have shipped a policy that let a ground through one gate and was refused at the next — a bug that
would have read as a flake for cycles. One optional, defaulted parameter fixes it with every pre-473 caller
byte-identical. A plan that predicts a real defect and a coder that verifies rather than assumes is exactly
the chain working.

No CHARTER concerns: no new dependency, no framework, `SAVE_VERSION` unchanged with both new fields
additive and guarded, and `@mlc-ai/web-llm` still imported only by `game/src/ai/webllm.worker.ts` and
`game/src/ai/webllmBrain.ts`.

## Milestone

**Milestone 10 — "A fourth ground, and the first feet on it" — SHIPPED (cycle 121, opened cycle 119).**
362 closes the last unchecked arc. Full write-up in the chronicle.

## Bookkeeping applied

- BACKLOG-362 `[~]` → `[x]`, moved to `BACKLOG-archive.md` with its closed-log entry.
- BACKLOG-473 `[~]` → `[x]` in both the Structure Track pointer and the archive.
- CHANGELOG entry for cycle 121.
- MILESTONE.md: Milestone 10 moved to Shipped; **no ACTIVE milestone** — the smiths draft Milestone 11 at
  the next cycle open (Lore-smith the headline + feel arcs, Structure-smith the spine arcs).
- `currentItem` / `structureItem` → null, both verdicts APPROVED, `phase` → `lore-pending`, cycle bumps to
  122 next run.

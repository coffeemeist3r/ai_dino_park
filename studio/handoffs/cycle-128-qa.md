# Cycle 128 — QA

**Build:** `npm run build` clean (tsc -b + vite build; one pre-existing chunk-size warning, unchanged).
**Unit:** `npx vitest run` — **1694/1694 green**, 179 files (1664 → 1694; +30 from the two new modules).
**E2e:** run 1 — 486 passed / 2 failed. Both failures green on isolated re-run; second full run below.
**Boundary:** `grep -rn "@mlc-ai/web-llm" game/src` outside `game/src/ai/` → no hits.
**Save:** additive only — `derelict?: boolean` on the four structure arrays, absent → maintained.

---

## Lore track — BACKLOG-401 · 10/10 criteria pass

| # | criterion | verdict |
|---|---|---|
| 1 | null on an empty ring and on a single beat | **pass** — `dispositionToward` unit tests |
| 2 | two stands → confident, one slink → null, two slinks → wary | **pass** |
| 3 | scores are per opponent | **pass** — `keeps opponents apart`, and the three-way roster test |
| 4 | a yield weighs less than a slink; the three nets | **pass** — all three assertions in one test |
| 5 | `holdsAgainst(b, null) === standsGround(b)` across the range | **pass** — swept 0→1 in 0.05 steps |
| 6 | confident holds below the bar, wary cedes above it | **pass** |
| 7 | specs import the string builders | **pass** — `slunkOffMemory` imported; see the note below |
| 8 | `peckingLine` null / both sides / capped at two | **pass**, plus a roster-only guard |
| 9 | in-game: a wary winner cedes and the line says why | **pass** — e2e via `__forceContest` |
| 10 | a fresh park is unchanged | **pass** — e2e asserts one outcome, no because-clause, no book line |

**Design change during the build, flagged for the Validator.** The spec asked for one dead band
(|score| < 2). That is *not sufficient* for criterion 1: a stand weighs 2, so a single stand would have
been a disposition. The Coder split the rule in two — `PECKING_BAR` (how strongly) and
`PECKING_MIN_BEATS` (how often) — rather than re-tuning weights until one number happened to satisfy
both. QA's read: this is the better shape, and criterion 4's third case (two slinks + one stand → wary)
is only satisfiable *with* the split. Named here rather than buried because it is a spec deviation.

**Partial on criterion 7.** Only `slunkOffMemory` has an exported builder; the other three memories are
still template literals inside `checkFeeding`, so the spec re-declares three of the four strings (as
local builders, at the top of the file, matching `manner.test.ts`). The exposure the cycle-127 finding
warned about is therefore **reduced, not closed** — a reword of the yield/snatch/stand strings still
empties both `manner.ts` and `pecking.ts` silently. Worth an infra item; not a blocker for this ship.

---

## Structure track — BACKLOG-480 · 14/14 criteria pass

| # | criterion | verdict |
|---|---|---|
| 1 | `upkeepDue` 0/0/1/1/2/2 | **pass** |
| 2 | full payment, pile down by exactly the due | **pass** |
| 3 | largest kind drains first (`{branch:1,stone:4}` → `{branch:1,stone:2}`) | **pass** |
| 4 | empty pile: 0 paid, 2 lapsed, nothing negative | **pass** |
| 5 | partial pile: 1 paid, 1 lapsed | **pass** |
| 6 | a lapsed ground owes less — converges, never cascades | **pass** — five-pass unit test settles at 1 standing / 3 derelict, and the e2e reaches the same floor in-game |
| 7 | repair only with a met bill, a spare unit, and a derelict | **pass** — three negative cases |
| 8 | same pile reference when nothing happens | **pass** |
| 9 | N away days == N live passes; early break | **pass** — compared against a hand-rolled live loop |
| 10 | a derelict granary loses the cap but keeps the slot | **pass** — e2e: `__hasGranary` false, `__foodCap` down, `__granaryRaised` still true |
| 11 | prosperity counts maintained only | **pass** — `zoneSignals.structures` is now `standingIn`; the e2e proves the count falls |
| 12 | an old save restores everything maintained | **pass** — `derelict` optional through the validator; absent → falsy |
| 13 | in-game lapse is visible + patched back up | **pass** — e2e reads the 🛠️ lines and the standing count both ways; the sprite alpha rides the existing visibility pass |
| 14 | a fresh park loses no landmark over a day (or a week) | **pass** — the inertness test runs both `__runUpkeep()` and `__runUpkeep(7)` and expects an empty digest |

**Observation for the Validator, not a failure.** The lapse order is array order across the four
structure arrays, so the granary — always raised last — is always the first thing to rot. That is a
defensible reading of "newest first" and makes the consequence sharp and immediately visible, but it is
an emergent property of how the arrays are concatenated rather than a rule anyone wrote down. If a fifth
structure kind ever lands, whoever adds it inherits this ordering silently.

---

## E2e detail

Run 1 (full, 8.1m): **486 passed, 2 failed** — `cycle-048-grass-tiles.spec.ts` ("the grass floor bakes on
boot") and `mobile-minds.spec.ts` ("long dialogs page GBA-style"). Isolated re-runs: grass-tiles **2/2
green in 2.5s**, mobile-minds **5/5 green in 4.8s**.

Run 2 (full, 8.4m): **486 passed, 2 failed** — grass-tiles now **green**, and in its place
`cycle-103-shared-meal-foodbank.spec.ts` ("two different dinos eating within the window share a meal")
went red; mobile-minds red again. Isolated: shared-meal **3/3 green in 3.6s**.

So across two full runs the same count fails and the *cast* changes: grass-tiles, then shared-meal, with
BACKLOG-430 the only constant. That wandering is the catalogued parallel-load flake's signature, and it
is what rules out a regression. The shared-meal spec deserved a harder look because it sits in the file
this cycle refactored — but it **passed under full load in run 1**, on the same binary, and the
refactored branch is behaviour-identical with no disposition present (criterion 5's sweep is the proof).
BACKLOG-430 has now gone green on its fifth consecutive isolated run while still surfacing red under
full parallel load.

New specs: `cycle-128-pecking.spec.ts` (3) and `cycle-128-upkeep.spec.ts` (3) — all six green on their
first run, no console errors.

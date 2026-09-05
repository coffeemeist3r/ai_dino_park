# Cycle 151 — QA

> Solo cycle (CHARTER v8). One track, one verdict to inform.

## Structure track — BACKLOG-495

**Result: 14/14 acceptance criteria pass.**

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | `foundingState(page, name)` exported, exactly four names | **PASS** | `tests/e2e/helpers.ts` — `FoundingFixtureName = 'as-shipped' \| 'all-bowl' \| 'empty-grounds' \| 'bare'`; the union is the parameter type, so a fifth name is a compile error, and `foundingState` still throws `unknown founding fixture '<name>'` at runtime for a cast-away call |
| 2 | Each `verify` throws naming the fixture and a concrete reason | **PASS** | one throw site, one shape: `` founding fixture '${name}' did not hold: ${reason} ``. Exercised live by `cycle-151-founding-fixture.spec.ts:60` — reason contains `Bramble` and `grove` |
| 3 | `'all-bowl'` leaves every `__homeZone` at `bowl` | **PASS** | `cycle-151-founding-fixture.spec.ts:22` — `new Set(zones)` is `{'bowl'}` |
| 4 | `'empty-grounds'` empties every pile and removes the founding cairn | **PASS** | `…:31` — every `__pilesByZone()` total is 0, no cairn on `FOUNDING_RUIN`'s tile |
| 5 | `'bare'` satisfies both in one call | **PASS** | `…:48` — both fixtures' `verify` return `null` afterwards |
| 6 | `'as-shipped'` passes on a fresh boot, exercised by a spec | **PASS** | `…:17` |
| 7 | `gatherToBowl` / `emptyGrounds` still exported, now delegate, **no call-site edits** | **PASS** | both are one-liners onto the seam. **39 spec files call them; zero were edited.** `git diff` over the coder commit's `tests/e2e/` shows no `gatherToBowl`/`emptyGrounds` line in any spec |
| 8 | `FOUNDING_PILES` stocks bowl/grove/ridge; saltpan and hollow absent | **PASS** | `cycle-151-founding-piles.test.ts` — two separate pins |
| 9 | `bankStep` over the stocked grounds yields `{1, 2, 3}` | **PASS** | same file; also pinned as *derived*, not restated |
| 10 | Grove still covers `REPAIR_COST` (BACKLOG-488 unchanged) | **PASS** | same file, and `cycle-141-bank.spec.ts:82` still watches the founding mend knock a step off |
| 11 | Every founding total under `STOCKPILE_SOFT_CAP` | **PASS** | same file — max total is the Ridge's 4, cap is 7 |
| 12 | `BACKLOG-495/504` register entry exists, `darkEntries()` empty | **PASS** | same file |
| 13 | An e2e walks a fresh park across the three stocked grounds and sees a heap on each, none on the frontier | **PASS** | `cycle-151-founding-fixture.spec.ts:78` — steps read from `FOUNDING_PILE_STEPS`, frontier asserted `step 0 / visible false` |
| 14 | Build clean, vitest green, playwright green | **PASS** | see gates below |

## Gates

- `npm run build` — **clean**, built in 9.24s.
- `npx vitest run` (repo root) — **2458 passed**, 3 skipped, **236 files**.
- `npx --yes kill-port 5173 && npx playwright test` — **665/665 passed** (5.7m). The suite grew from
  659 by the six new specs.
- `@mlc-ai/web-llm` imported only by `game/src/ai/webllm.worker.ts` and `game/src/ai/webllmBrain.ts`.
- Save format untouched — `FOUNDING_PILES` seeds on the `!save` branch and round-trips through the
  existing `stockpileByZone` field. No version bump, old saves unaffected.

## The first e2e run, and what it proves

The first full e2e run after the pile move was **4 failed / 661 passed**, and QA is recording it
rather than only the green one, because the shape of those four failures is the item's own thesis
under test:

- `cycle-141-bank.spec.ts` ×2 and `cycle-065-gather-grace.spec.ts` — three specs that had been
  asserting *"the bowl's pile is empty"* without ever saying they depended on it. Exactly the class
  BACKLOG-495 was opened over, surfaced by exactly the operation that surfaced it the first three
  times, and repaired by the Code-planner's pre-written priority order: two whose subject **is** the
  founding state had their expectations updated with the reasoning written into the file, two whose
  subject is something else now **name a fixture**. `FOUNDING_PILES` was never re-flattened and no
  twelfth ad-hoc helper was written.
- `cycle-011-movement.spec.ts` — the **known parallel-load flake**. Passed isolated (2/2 in 3.4s) and
  passed again on the full re-run. Noted, not chased, per the routine's own rule.

**Sixteen reddened in cycle 136 and three reddened here** is the delta worth reading. The difference
is not that this move was smaller — it stocked two grounds where 136 stocked one — but that nine of
the twelve scattered instalments were already paid, and everything still assuming the old shape now
had one named place to move to.

## Notes for the Validator

- **The reachability answer is first-hand, not argued.** `cycle-151-founding-fixture.spec.ts:78`
  walks a fresh park and watches heap sprites at three sizes on three grounds. Before this cycle that
  walk found one, and `pile_3` had never rendered on a first frame in the park's history.
- The seam's own guard is real: criterion 2's test breaks the fixture *after* it applied, which is
  the shape of every real failure, and the message names both the fixture and the offender.
- Nothing was descoped. Every out-of-scope line in the design (`__seedGranaryReady`, deleting the
  aliases, a spec-must-name-a-fixture lint) was out of scope before the fire, not abandoned during it.

# Cycle 130 — QA

**Gates:** `npm run build` clean (built in 10.2s, no type errors). `npx vitest run` **1732/1732 green,
180 files** (1709 → 1732: +23 this cycle — 10 mercy, 13 dry season). `npx playwright test` run twice at
full parallelism: **498 passed / 1 failed** both times, with a **different victim each run**
(`cycle-110-plenty` then `cycle-123-wandering`), each green in isolation. Boundary check:
`grep -rn "web-llm" game/src --include=*.ts` outside `game/src/ai/` returns nothing.

---

## Lore track — BACKLOG-403 — Victor's mercy

| # | Criterion | Verdict |
|---|---|---|
| 1 | `showsMercyTo` pure, exported from `pecking.ts`, unit-tested | **PASS** — `pecking.test.ts`, 10 cases |
| 2 | null on each of: hungry victor / no confident read / rival not hungry / petty victor | **PASS** — one case per gate, each pinned at the bar *and* one step past it (`WELL_FED` itself still yields; `WELL_FED + 0.01` does not) |
| 3 | null on a single contested beat (`PECKING_MIN_BEATS`) | **PASS** — the case asserts `peckingScore === PECKING_BAR` first, so it is testing the *beats* rule and not accidentally the score rule |
| 4 | several rivals → highest confidence, ties by hunger, then lexicographic | **PASS** — all three tiers exercised in one case |
| 5 | two exported memory builders beside `slunkOffMemory` | **PASS** — `mercyMemory` / `sparedMemory` in `pecking.ts`; both specs match through them |
| 6 | neither memory is matched by `WEIGHTS` — `peckingRead` unchanged | **PASS** — asserted for both dinos, plus the consequence (a second mercy is still reachable from the polluted ring) |
| 7 | e2e: the rival eats, not the victor | **PASS** — `cycle-130-mercy.spec.ts` test 1 |
| 8 | e2e: a petty victor resolves through the existing path | **PASS with a note** — the spec asserts `__mercy()` is null, the rival stayed at 0.9 hunger, and no mercy line was logged. It does **not** assert `__standFood()` is set. In this staging the rival *is* a gobbler and the victor reads `confident`, so the drop resolves 390/401 — but the spec proves "the mercy branch was not taken", not "the stand branch was". The 128/129 specs already own that branch; the gap is a shared-coverage argument, not an untested path. |
| 9 | ticker carries victor, rival, and the because-clause | **PASS** — both substrings asserted separately |
| 10 | a fresh park shows no mercy at any drop | **PASS** — test 3, with the disposition asserted null first so a boot change can't make it vacuous |
| 11 | build / unit / e2e | **PASS** (see gates) |

**Out-of-scope kept:** no book line, no bond change between victor and rival, no 404 voice work, and
BACKLOG-483's other three literals untouched.

**Observations.**

- The branch order is load-bearing and now proven by construction: in the passing test the rival satisfies
  `gobblerAmong` (hunger 0.9, agreeableness at the roster default), so had the mercy been placed after the
  gobble check, `resolveContest` would have run first and this spec would fail. The petty test is the same
  staging with one trait moved, and it *does* reach the contest — the pair brackets the ordering.
- The victor is `confident` toward the rival both before and after. Verified live in the e2e, not only in
  the unit: the disposition re-read after the meal is still `confident`.

---

## Structure track — BACKLOG-466 — The dry season

| # | Criterion | Verdict |
|---|---|---|
| 1 | `seasonThirst` / `slakeFloor` pure, exported, unit-tested for all four seasons | **PASS** — `dry-season.test.ts` |
| 2 | spring and fall exactly 1; summer > 1 > winter | **PASS** — `toBe(1)` on the hinges, comparisons on the others |
| 3 | `advanceNeeds` with no new argument identical to pre-466 | **PASS** — asserted as `run() === run(1)` on the whole map, plus `thirstRate(traits) === thirstRate(traits, 1)` |
| 4 | summer crosses the thirst bar in fewer steps than winter | **PASS in substance, restated** — the unit asserts `summer > spring > winter` thirst after an identical run rather than counting steps to `NEED_THRESHOLD`. Same fact, and it does not silently depend on 20 steps being enough to cross a bar 0.6 away (they are not — see the codeplan's own warning). |
| 5 | `satisfy` with no `to` is exactly 0; with the floor it is the floor | **PASS** — both, plus a case that the *other* need is untouched whatever the floor |
| 6 | hunger untouched in every season | **PASS** — unit (identical across three seasons) and e2e (`toBeCloseTo`, 10 places) |
| 7 | e2e: summer thirstier than winter over the same steps | **PASS** — `cycle-130-dry-season.spec.ts` test 1, a strict inequality on three seasons, driving `__advanceNeeds` (which is now threaded, so the hook exercises the production rate) |
| 8 | e2e: a summer drink lands on the floor, a spring drink on 0 | **PASS** — test 2, at the bowl's own waterhole tile (445) |
| 9 | the turn ticker carries the line on the summer and winter turns, nothing on the hinges | **PASS with a note** — the e2e proves the **summer** turn announces itself and the **fall** turn does not, and asserts the line appeared exactly once across both. The **winter** turn's line is pinned at the unit level (`seasonThirstLine('winter') !== ''`) rather than driven through a live boundary crossing. Reaching winter live costs three more wall-clock crossings for a string the unit already owns. |
| 10 | build / unit / e2e | **PASS** (see gates) |

**Deviation from the codeplan.** The plan asked for one added case in `needs.test.ts` pinning
`thirstRate(traits)`. It lives in `dry-season.test.ts` instead, beside the `advanceNeeds` default pin it
belongs with — one file to read when the default-argument question comes up again, rather than the same
guarantee split across two.

**Out-of-scope kept:** no waterhole sprite, no per-zone water variation, no seasonal effect on the 436
need-pull, park still deathless.

---

## The e2e flake

Two consecutive full runs, one failure each, **different spec each time**, both green in isolation on
re-run. Neither victim is near this cycle's diff: `cycle-110-plenty` is migration hearsay,
`cycle-123-wandering` is the crossings standing and a reload. This is the catalogued parallel-load flake
(the cycle-0 quality bar's own escape clause), not a regression. Recorded, not chased.

Worth putting on the record for the Validator, though: the suite is at **499 specs** and the flake now
lands on a *different* spec on consecutive runs, which is a change in character from "four catalogued
specs" (456, cycle 125). It is no longer a property of particular specs; it is a property of the run.

**Recommendation: APPROVE both tracks.**

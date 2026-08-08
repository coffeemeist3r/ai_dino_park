# Cycle 125 — QA

**Build:** `npm run build` clean (tsc -b + vite build, no errors).
**Unit:** `npx vitest run` — **174 files / 1607 tests, all green** (was 1602; +5 from `cycle-125-lean.test.ts`).
**Boundary:** `grep -rn "@mlc-ai/web-llm" game/src --include=*.ts | grep -v "game/src/ai/"` → no hits.
**Save:** no new persisted field on either track (`friendship`, `bonds`, memory ring all already persist;
`leanFiled` and `ambientHeld` are transient scene state).

---

## Lore track — BACKLOG-370 (12 criteria)

| # | Criterion | Result |
|---|---|---|
| 1 | heart floor: 4 true, 3 false, 10 true | **PASS** — `cycle-125-lean.test.ts` |
| 2 | keeper's wall for each of the four walls | **PASS** — unit, four cases |
| 3 | tie-break order matches `edgeTarget` | **PASS** — unit; asserted on a centre tile *and* exhaustively over all 300 tiles of the grid |
| 4 | `edgeTarget` byte-identical | **PASS** — unit + `cycle-080-loner` / `cycle-081-loner-friend` unchanged and green |
| 5 | ≥4-heart loner in the keeper's zone aims at the keeper's wall | **PASS** — e2e `__leanTarget` non-null, on a border, sharing the keeper's row/column |
| 6 | <4-heart loner aims at its own nearest wall | **PASS** — e2e, 39 points → `null` |
| 7 | cross-zone loner never leans | **PASS** — e2e, 90 points then `__migrate('Rex','grove')` → `null` |
| 8 | a non-loner returns null | **PASS** — e2e, bonded Rex at 100 points → `null` |
| 9 | memory filed at most once, re-armed later | **PASS** — e2e asserts exactly 1 + `__leanFiled` contains Rex. **This criterion caught a real bug** (see below) |
| 10 | fresh park: no lean, no memory | **PASS** — e2e, `__leanTarget` null for every dino, no memory anywhere |
| 11 | build clean + brain boundary | **PASS** |
| 12 | save round-trips, no new field | **PASS** — `cycle-003-save` and the reload specs green |

**13/13 → 12/12 pass.**

### The bug criterion 9 caught

The code plan told the Coder to hang the once-per-stretch guard off `resetTic`, reusing 408's
`ticCaughtFiled` seam. Built that way the memory filed **six times** — the memory ring's entire capacity —
because `resetTic` tracks the *tic* stretch and any company within `TIC_COMPANY_RANGE` breaks that stretch
every few steps, while a loner standing at the keeper's wall is still waiting. Two different stretches
wearing one name. Fixed by clearing the guard in `checkLonerLift` instead.

Worth recording *how* it was caught: the first draft of the spec asserted `toBeLessThanOrEqual(1)`, which
passes on a build that files six *and* on a build that files none. Tightening it to `toBe(1)` is what turned
a green run red. A "no more than once" assertion cannot tell "correct" from "never happened".

---

## Structure track — BACKLOG-456 (14 criteria)

| # | Criterion | Result |
|---|---|---|
| 1 | `__ambientHeld` false on boot, toggles both ways | **PASS** — e2e |
| 2 | held: same-tile dinos record no meeting, no bond change | **PASS** — e2e, 10 driven steps, `__bonds` byte-identical |
| 3 | held: pinned pile unchanged over 10 driven steps | **PASS** — e2e, `{branch:3}` still totals 3 |
| 4 | released: meetings resume | **PASS** — e2e, bonds move again on the next step |
| 5 | held: movement/crossings still run | **PASS** — e2e, a driven crossing completes under the hold |
| 6 | `ambientPaused` untouched | **PASS** — e2e asserts paused stays true and independent of held |
| 7 | homesick pick positional over 20 calls | **PARTIAL — see below** |
| 8 | tiers above/below untouched; 076/078 pins pass | **PASS** — both specs green |
| 9 | `__flushSave` resolves; the write survives a reload | **PASS** — e2e writes 47 points, flushes, reloads, reads 47 |
| 10 | all four catalogued specs moved onto the seam and passing | **PASS** |
| 11 | two consecutive full green e2e runs | see **Full runs** below |
| 12 | vitest green, build clean | **PASS** |
| 13 | no production path reads `ambientHeld` outside the three skips | **PASS** — `grep -n ambientHeld` → the field, the three hooks, and exactly three guards |
| 14 | no save-shape change | **PASS** |

**Criterion 7 — honest partial.** `pickMigrant` is scene-private with no dev hook, and constructing *two*
simultaneously-homesick dinos requires each to reside in a friendless zone past `HOMESICK_ROLLS`, which the
existing hooks can't set up cheaply. What is verified: the code is `homesick[0]` with no `Math.random()`
anywhere in the tier (inspection + grep), and `cycle-076-news-pull`'s exact-identity assert — the spec whose
flake this fixes — passes. What is **not** verified is a 20-call repetition against two eligible candidates,
which is the form the 360 precedent used. Recorded rather than claimed; the Validator should weigh it.

---

## Full e2e runs

**Run 1:** 473 passed, **2 failed** — `cycle-006-hearts` and `cycle-122-struck`. Both failed inside
`boot()` at the `__ready` wait, i.e. a **cold parallel boot timeout** — the BACKLOG-329/431 family, not a
BACKLOG-456 noun. Re-run isolated together: **10/10 pass**.

**Run 2 (fresh full run): 475 passed, 0 failed. All green.**

Two things worth putting on the record about run 2:

1. **None of the four catalogued 456 specs failed in either run.** `cycle-077-carry`,
   `cycle-097-carry-pressure`, `cycle-076-news-pull` and `cycle-121-work-priority` — the pair of which
   (077 and 121) failed on the *cycle-123 and cycle-124* runs off unrelated diffs — passed in both runs
   tonight. That is the whole point of the item, and it is the first evidence for it.
2. **`mobile-minds.spec.ts` "long dialogs page GBA-style" passed.** That spec is BACKLOG-430, catalogued
   since cycle 93 as a *standing red on clean HEAD*. It passed in run 2 (`ok 475`). This is **not** a claim
   that 430 is fixed — nothing this cycle went near the dialog input path — and it should not be closed on
   this evidence. It is recorded because a standing red that quietly passes is worth a look by whoever
   picks 430 up: either the failure is load-dependent after all, or the cycle-93 diagnosis needs revisiting.

**Criterion 11 (two consecutive green full runs): PARTIAL.** Run 2 is green; run 1 was not, and its two
failures are a boot-timeout family that predates this cycle and is not what 456 set out to fix. Stated
plainly rather than re-run until it reads the way the criterion wants.

## Summary

- Lore track **12/12 pass** → recommend APPROVED.
- Structure track **12 pass / 2 partial** (criterion 7 homesick 20-call repetition not constructed;
  criterion 11 one of two full runs green) → recommend the Validator judge, with both partials stated above.

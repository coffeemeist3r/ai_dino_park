# Cycle 40 — QA

**Build:** ✅ clean.
**Unit tests:** ✅ 283/283 (34 files; +7 new in `tests/unit/seasons.test.ts`).
**E2E tests:** ✅ 99/99 full run, first try (+4 new in `tests/e2e/cycle-040-seasons.spec.ts`).

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `world/seasons.ts` pure, Node-tested | PASS | No Phaser import (only the `Tint` type); 7 vitest tests |
| 2 | `seasonFor` mapping incl. 29-wrap, 1-indexed | PASS | units "maps 1-indexed days…", "wraps into year two…" |
| 3 | `seasonTurned` boundary-only, never backwards/static | PASS | unit "reports a turn only on a forward boundary crossing" (incl. multi-day jump → current season) |
| 4 | 4 distinct tint colors, all alphas ≤ 0.12 | PASS | unit "keeps the wash subtle…" |
| 5 | `turnLine`/`turnMemory` name the season; deterministic | PASS | units "turn lines are distinct…", "is deterministic" |
| 6 | e2e: fresh boot = spring in HUD + hook, zero turns | PASS | e2e "a fresh boot is spring…" (clean console) |
| 7 | e2e: 7→8 crossing = summer, once, banner/ticker/memory | PASS | e2e "crossing day 7 → 8…" (`__seasonTurns()`=1, 🍂 ticker line, 'the season turned to summer' on Rex) |
| 8 | e2e: tint present, correct color, ≤ 0.12 after a turn | PASS | e2e "the seasonal wash is subtle…" (spring ≠ winter colors) |
| 9 | No save change; pre-existing specs pass; suites green | PASS | save untouched (season fully derived from `day`); 95 pre-existing e2e green incl. cycle-028's HUD assertion (`toContain` survives the suffix) |

Bonus coverage beyond the AC list: a 4th e2e proves a **save restore re-derives the season
without firing a turn** (the explicit "restore must not beat" constraint).

## Bugs found

None. Notes:
- The coder's judged deviation (a live backgrounded tab that long-jumps days beats once on its
  next hour tick) is consistent with "live-observed" — the tab was open, the year did turn. The
  silent paths the design named (boot, restore, away) are all proven silent.
- `__setClock` is restore-semantics by construction (sync + repaint, no listeners) — it can't be
  used to fake a turn, which keeps the test honest.
- The 🍂 ticker prefix on the turn line is a pleasant touch and lands in the V ticker lens.

## Recommendation

**APPROVE** — 9/9 criteria pass (+1 bonus), full suite green first try, save format untouched.

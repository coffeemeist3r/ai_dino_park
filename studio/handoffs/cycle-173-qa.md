# Cycle 173 — QA

**Build:** ✅ clean (`tsc -b && vite build`).
**Unit tests:** ✅ 3144 passed, 3 skipped (pre-existing).
**E2E tests:** ✅ 852 passed, 1 skipped, 0 failed on the final full run (after two coder fix-ups).
Run history, disclosed: run 1 — 852/853, lone `cycle-110-granary` timeout, green isolated. Run 2 — 852/853, and
the failure was **ours**: the new close-friend spec, 1 in 17 under load (the sore dino wandered off and outran
the budget). Fix-up 1 held the sulker still with a `continue`; run 3 then failed `cycle-132-soothing-tic`
(real regression — the `continue` skipped the solitary-tic count) and `cycle-138-haunt` (green isolated).
Fix-up 2 holds only the wander pick. Run 4: all green. Comfort + funk specs 64/64 on 8 repeats × 6 workers.
Boundary: `@mlc-ai/web-llm` imported only under `game/src/ai/` (grep clean). Save format untouched.

## Lore track — BACKLOG-136

| criterion | status | evidence |
|---|---|---|
| `comforter` with `CLOSE_BOND`: 24 refused, 25 comes; default floor 8 intact; reciprocity ignores floor | PASS | `world/cycle-173-comfort.test.ts` (3 tests) |
| `friendLine` unchanged at 24/25/59/60 | PASS | same file |
| `unconsoledLine` both forms name both dinos | PASS | same file |
| `COMFORT_ART_KEY` in `worldPlacedProps()` | PASS | same file |
| close friend: heading-over ticker, walks, adjacent, funk gone inside window, memory, bond up, talked-round ticker | PASS | e2e `a close friend walks over and talks the sore dino round` |
| founding graph: Glade (Mossback 24) — nobody comes, ticker names Mossback, funk holds | PASS | e2e `on the founding graph a merely friendly dino does not come` |
| keeper greet mid-walk ends funk + errand, keeper credited, no comfort memory | PASS | e2e `the keeper getting there first…` |
| full suite green, no save change | PASS | above |

**Bugs found:** the regression fix-up 2 closed (tic count skipped for a held sulker). Note, not a defect: the
bond assertion is `>` rather than `+COMFORT_BOND`, because the pair also meets on arrival and drifts each step.

**Recommendation:** APPROVE.

## Structure track — BACKLOG-552

| criterion | status | evidence |
|---|---|---|
| 14 rows; first ten byte-identical | PASS | `tests/unit/touch.test.ts` first-column identity test |
| pairwise disjoint, on canvas, no row on the cluster/stick | PASS (second column) / NOTED (first) | unit; see below |
| rows 11–14 share one x, left of column one | PASS | unit |
| e2e: `room` row opens Read the Room; `help` row opens help | PASS | `cycle-173-sheet-columns.spec.ts` |
| e2e: `next entry` row moves the book cursor | PASS | same |
| touch-controls spec unchanged and green | PASS | full run |

**Found, pre-existing:** the first column's tenth row (`export`, y 373–403) overlaps the top of the Talk circle
(from y 366). Buttons dispatch first, so the overlapping sliver of that row is Talk. This predates the cycle
(it is the row the old comment said was "clear of the ⋯ button" — it is, but not of Talk). The criterion was
scoped to the new column so the old one could stay byte-identical; the overlap is named, not fixed.

**Recommendation:** APPROVE.

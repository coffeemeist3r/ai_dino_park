# Cycle 6 — QA

BACKLOG-016 (friendship hearts) vs the cycle-006 acceptance criteria.

- **Build:** ✅ exit 0 (pre-existing chunk-size warning only)
- **Unit tests:** ✅ 37/37 (2 brain + 6 clock + 6 dayNight + 6 saveGame + 6 personality + 4 roster + 7 friendship)
- **E2E tests:** ✅ 18/18 (default config)

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `heartsFromPoints`: 0→0, 35→3, 100→10, 105→10, −5→0 | ✅ PASS | unit `maps points to 0..10 hearts and clamps` |
| 2 | `bumpPoints` clamps [0,100], no input mutation | ✅ PASS | unit `clamps to [0,100] and does not mutate the input` |
| 3 | `heartString(h)` length 10, exactly `h` filled | ✅ PASS | unit `is always length 10 with exactly h filled hearts` |
| 4 | `greetGain`: base w/o traits; warm+social > prickly+solitary; ≤10 | ✅ PASS | unit `greetGain` block |
| 5 | Save round-trips affinity; v1 w/o field → `{}` (back-compat) | ✅ PASS | unit `round-trips the affinity map` + `defaults a v1 save with no friendship field to an empty map`; `saveGame.test.ts` still 6/6 |
| 6 | `__greet('Rex')` raises hearts; survives reload | ✅ PASS | e2e `greeting a dino raises its hearts and persists across reload` (5 greets → ≥1 heart, reload, still ≥1) |
| 7 | **C** toggles `__heartsPanelVisible()` false↔true | ✅ PASS | e2e `pressing C toggles the hearts panel` |
| 8 | No regression: Z dialog, clock, day/night, save-restore, roster | ✅ PASS | cycle-2/3/4/5 suites all green (incl. cycle-3 save restoring with the new field present) |
| 9 | Build clean; unit + e2e green | ✅ PASS | header |

## Bugs found
None. Affinity math is pure and Node-tested. The save change is strictly additive — `SAVE_VERSION` unchanged, absent field defaults to `{}`, and the cycle-3 save e2e still restores time/player with `friendship` now riding along. Greet hooks into the existing flow rather than forking it; the panel lives in `WorldScene` at depth 11 (above the HUD). Reuses ROSTER + traits; no NPCBrain change; no new dependencies.

One design note for the Validator: a single greet adds ~3 of the 100 points, so hearts tick up roughly every 3 greets — intentional Stardew-style grind, not a stuck counter. The persistence e2e greets 5× to cross the first heart.

## Recommendation
**APPROVE.**

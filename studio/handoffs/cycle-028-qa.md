# Cycle 28 — QA

**Item:** BACKLOG-105 [core] Wall-clock-anchored time + configurable scale.

- **Build:** ✅ `tsc -b && vite build` clean.
- **Unit tests:** ✅ 157/157 (was 148; +7 clock, +2 saveGame).
- **E2E tests:** ✅ 56/56 on a single clean full run (was 54; +2 cycle-028). **No flake this run.**

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | +60 000 ms wall time at 1× ⇒ +1 in-game minute | PASS | `clock.test.ts` "defaults to 1×…"; e2e cycle-028 "advances at default 1× rate" (delta=1) |
| 2 | +60 000 ms at 60× ⇒ +60 minutes | PASS | `clock.test.ts` "at 60×…"; e2e cycle-028 "T toggles…" (delta=60) |
| 3 | `tick()` still +1 minute, fires onTick/onHour as before | PASS | Original `clock.test.ts` block unchanged + green; "tick() remains scale-independent" |
| 4 | Wall advance crossing hours fires onHour once per crossed hour | PASS | `clock.test.ts` "update() crossing hour boundaries…" → `[9,10,11]` |
| 5 | Gap > cap jumps without flooding onTick (no freeze) | PASS | `clock.test.ts` "a gap larger than the catch-up cap…" → lands Day 3 08:00, 0 tick fires |
| 6 | T toggles 1×⇄60×; `__clockScale()` + HUD reflect it | PASS | e2e cycle-028 "T toggles…": `__clockScale()===60`, `__clockHudText()` contains `60×` |
| 7 | Toggling scale does not jump displayed time | PASS | `clock.test.ts` "setScale does not jump the displayed time" |
| 8 | serialize/deserialize round-trip savedAt+scale; missing ⇒ scale defaults 1 | PASS | `saveGame.test.ts` round-trip + "loads an older save…" + "non-numeric scale ⇒ null" |
| 9 | Build clean; full suites green | PASS | see above |

## Regression handled (QA test fix)
`smoke.spec.ts` "world clock ticks in real time" encoded the *old* 60× rate (1 real sec = 1 game min) and failed under the new 1× default. Updated it to toggle to 60× (the active-watching rate) before polling — it still exercises the **real** Phaser pump + wall-clock derivation, not the `__advanceWall` hook. Now green. This is the only behavioral change to a prior test; it reflects the approved design's new default, not a code defect.

## Bugs found
- During development the new cycle-028 spec read `__clockNow` and `__advanceWall` in two separate `page.evaluate` calls; at 60× the live 500 ms pump slipped an extra in-game minute between them (got 61, expected 60). Fixed in the spec by folding the read+advance into one synchronous `evaluate`. No production bug — it's a test-timing artifact of realtime itself, and a good reminder that callers reading time twice must expect it to move.

## Boundary / charter checks
- `@mlc-ai/web-llm` import boundary: ✅ still only under `game/src/ai/` (grep clean; AI code untouched this cycle).
- Save: additive only — `SAVE_VERSION` stays 1; old saves without `savedAt`/`scale` still load (test-proven). No save break.
- Diff = the 6 planned files + the smoke-spec regression fix. No scope creep, no new deps.

## Note on the parallel-load flake
The first full run had cycle-002/003 boot `__ready` timeouts — caused by the old 20s smoke-clock timeout holding a worker and starving parallel boots. All passed isolated (`--workers=1`, 7/7), and the final full run after the smoke fix was 56/56 clean with no flake. The documented flake, now also relieved.

**Recommendation:** APPROVE.

# Cycle 42 — QA

**Item** — BACKLOG-171 [emergent] Winter huddle pull

**Build:** ✅ `tsc -b && vite build` clean.
**Unit tests:** ✅ 309/309 (36 files; +6 new in `tests/unit/huddle.test.ts`).
**E2E tests:** ✅ 111 total — 110 green first run + `cycle-003-save.spec.ts` boot timeout (the catalogued cold-boot parallel-load flake at `helpers.ts:22`; whole spec green isolated in 8.4s, fresh-boot test 3.4s). Nothing in this diff touches the boot/save path — not a regression. All 4 new `cycle-042-winter-huddle` tests green in the full parallel run.

## Acceptance criteria

| Criterion | Status | Evidence |
|---|---|---|
| Season omitted = legacy (threshold 8, window = dayPhase night, all 24h) | PASS | unit "season omitted is the legacy cycle-18 verdict for every hour" |
| Winter: threshold 4, window 19..23 ∪ 0..6 | PASS | unit "winter lowers the bar to 4 and opens the den from dusk past dawn" |
| Summer: threshold 8, window 23 ∪ 0..3, hours 21/22 excluded | PASS | unit "summer keeps the bar at 8 but waits until late" |
| Fall: threshold 6, window = spring | PASS | unit "fall lowers the bar to 6 on the unchanged spring window" |
| Spring = exact legacy verdict | PASS | unit "spring is byte-identical to the legacy verdict" |
| E2E winter dusk pull (19:30, bonded pair reaches den) | PASS | e2e "winter dusk pulls bonded dinos to the den at 19:30" — `__huddleInfo` {winter, 4, true}, Rex+Mossback in `__huddlers()` after 45 steps |
| E2E winter admits bond-4 pair (below old bar) | PASS | e2e "winter admits a loosely-bonded pair the old threshold would leave out" — Sunny+Glade at bond 4 huddle |
| E2E summer scatter (21:30, window closed, `__huddlers` empty) | PASS | e2e "a summer night at 21:30 stays scattered" — structural assert, inWindow false |
| Regression: cycle-018 spec + full suites green untouched | PASS | cycle-018-huddle green in full run (spring day-1 byte-identical by construction); spring-night e2e green; 309 unit |

**9/9 PASS.**

## Bugs found

None. Spot-checks beyond the criteria: `__bondPair` bare calls (cycle-018/029/033/034 specs) all green — default amount unchanged; cycle-040 seasons + cycle-041 palates specs green (season threading untouched); no new pageerror in any spec; no save-format change anywhere in the diff.

**Recommendation:** APPROVE

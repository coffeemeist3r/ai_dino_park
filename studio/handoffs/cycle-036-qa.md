# Cycle 36 — QA — BACKLOG-144 world-scale night event

**Build:** ✅ `npm --prefix game run build` clean (tsc -b + vite build; only the pre-existing
6 MB worker chunk-size warning, not new).

**Unit tests:** ✅ 254/254 (`npm run test:unit`) — +7 new in `tests/unit/skyEvent.test.ts`.

**E2E tests:** ✅ 83/83 (`npx playwright test`, clean port) — +4 new in `cycle-036-sky.spec.ts`.
First full run flagged a regression (see below); green after the in-session fix.

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `rollSkyEvent` → null on a non-clear-night | ✅ PASS | unit "never fires during the day" |
| 2 | `rollSkyEvent` → null when one is already active | ✅ PASS | unit "never fires while already active" |
| 3 | Fires iff clear night + inactive + roll < chance; `pickSkyEvent` spans all events | ✅ PASS | unit "fires only when … under the chance" + "maps a 0..1 roll across every event" |
| 4 | `__triggerSky()` activates: `__skyEvent()` returns the id, shimmer overlay visible (α>0) | ✅ PASS | e2e "triggering … activates the shimmer"; `startSky` sets overlay α 0.18 + `setVisible(true)` |
| 5 | World pumped → whole cast drifts to the gather tile; `__skyGazers()` = entire cast | ✅ PASS | e2e "the whole cast gathers …" (`skyGazers.length === dinoCount`) |
| 6 | Every gazer files the **same** shared memory, present in the exported save | ✅ PASS | e2e asserts `memory.Rex` and `save.memory.Rex` contain the meteor line |
| 7 | Ends on duration-elapse **or** night→dawn: `__skyEvent()` null, overlay hidden, dinos resume | ✅ PASS | e2e "ends when night passes into day" (dawn path); `skyExpired` boundary unit-tested (duration path) |
| 8 | No regression: tone menu (142), feeding (059), huddle (041), homecoming (112), boot clean | ✅ PASS | full suite 83/83 incl. cycle-018-huddle, cycle-035-tones, cycle-030-homecoming; sky specs boot console-error-clean |
| 9 | Boundary + additive: `skyEvent.ts` imports no web-llm; `SAVE_VERSION` unchanged, no `SaveData` field | ✅ PASS | grep: `@mlc-ai/web-llm` only in `ai/webllmBrain.ts` + `ai/webllm.worker.ts`; `saveGame.ts` untouched; e2e asserts `save.version === 1` |

## Bugs found

- **cycle-018-huddle regression (fixed in-session).** The first full e2e run failed
  `cycle-018-huddle` ("bonded dinos huddle at the den at night"): the sky auto-roll was wired to
  `onHour`, so the huddle test's 840-minute night advance rolled the (then 0.18) chance ~14× and a
  random spectacle pulled the cast to the gather tile instead of the den. This was also a frequency
  bug (≈1.4 events/night ≠ "rare"). Corrected by moving the roll to a real-time Phaser timer
  (`SKY_ROLL_INTERVAL_MS` 45s, so per-minute clock advances and offline catch-up never trigger it) +
  a one-per-in-game-day cap + `SKY_CHANCE` 0.05. Re-ran full suite → 83/83. No other regressions.

## Recommendation

**APPROVE.** All 9 acceptance criteria pass; build + full unit + full e2e green; NPCBrain boundary
intact; save format untouched. The auto-trigger's random path is real-time + capped by design (not
directly e2e-driveable), but its pure decision core (`rollSkyEvent`/`pickSkyEvent`) is unit-tested
and the forced `__triggerSky` path is e2e-covered end-to-end.

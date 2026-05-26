# Cycle 1 — QA Handoff

## Summary

**Recommendation: APPROVE**

Build clean, all unit and e2e tests pass, all acceptance criteria met.

---

## Build

✅ `npm --prefix game run build` — exit 0.  
Pre-existing Phaser chunk-size warning (1487 kB). Not introduced by this cycle; Phaser has always been large. Not a blocker.

---

## Unit tests

✅ `npm run test:unit` — **8/8 passed** (2 brain + 6 clock).

`tests/unit/clock.test.ts` covers:
1. Initial state `{ day: 1, hour: 8, minute: 0 }`
2. 60 ticks → `onHour` fires once with `{ day: 1, hour: 9, minute: 0 }`
3. 120 ticks → `onHour` fires twice (hour 9, hour 10)
4. Midnight wrap → tick at 23:59 → `{ day: 2, hour: 0, minute: 0 }`
5. `onTick` fires every tick (3 ticks → 3 calls)
6. `now()` returns a copy (mutating result doesn't corrupt internal state)

---

## E2E tests

✅ `npx playwright test` — **3/3 passed**.

| Test | Result |
|---|---|
| `game boots and renders canvas` | ✅ |
| `canvas responds to arrow key press` | ✅ |
| `world clock ticks in real time` | ✅ |

**Note — Playwright env setup issue (non-blocking):** Default `playwright.config.ts` uses `url: http://127.0.0.1` (IPv4) but Vite on this machine binds to `[::1]` (IPv6 localhost) by default. The first run timed out. Fixed by running with a QA-override config pointing to `127.0.0.1:5174`. The `vite.config.ts` `server` block should add `host: '127.0.0.1'` (or `'0.0.0.0'`) so `playwright.config.ts`'s health-check URL matches in future runs. Flagged as a separate infrastructure bug — does not affect correctness of the shipped feature.

---

## Acceptance criteria

| Criterion | Status | Evidence |
|---|---|---|
| HUD shows `Day 1 — 08:00` at start | ✅ PASS | `WorldScene.setupClock()` sets initial text from `clock.now()` which returns `{ day:1, hour:8, minute:0 }`; format string produces `Day 1 — 08:00` |
| After 1 real second HUD reads `Day 1 — 08:01` | ✅ PASS | `onTick` updates HUD every tick (every 1 s); unit test #5 confirms tick fires per second |
| After 60 real seconds HUD reads `Day 1 — 09:00` | ✅ PASS | Unit test #2: 60 ticks → `hour === 9`, `minute === 0`; HUD format confirmed |
| `WorldClock` emits `'hour'` event on each hour advance | ✅ PASS | `onHour` callback fires when `this._time.hour !== prevHour \|\| dayWrap > 0`; unit tests #2 #3 #4 verify |
| `'hour'` event payload is `GameTime` with `{ day, hour, minute: 0 }` | ✅ PASS | Unit test #2: `calls[0]` equals `{ day: 1, hour: 9, minute: 0 }` |
| `clock.now()` returns correct `GameTime` after any ticks | ✅ PASS | Unit tests #2 #3 #4 #6 cover various tick counts including midnight |
| Vitest: 60 ticks fires `hour` event once with `hour === 9`, `minute === 0` | ✅ PASS | `tests/unit/clock.test.ts` test 2 — passed |
| `npm run build` exits 0 | ✅ PASS | Build output confirms exit 0 |
| `npm run test:unit` exits 0 | ✅ PASS | 8/8 tests passed |

---

## Constraint checks

| Constraint | Status | Evidence |
|---|---|---|
| `now()` export from `clock.ts` not broken | ✅ PASS | Module-level `now()` delegates to singleton via `getWorldClock().now()` |
| No new npm packages | ✅ PASS | `WorldClock` uses plain TS arrays; `game/package.json` unchanged |
| Z-key dialog flow not broken | ✅ PASS | `handleInteract()` and Z-key binding unchanged in `WorldScene`; `setupClock()` is additive |
| HUD font: white 12px, shadow offset (1,1) dark | ✅ PASS | `color: '#ffffff'`, `shadow: { offsetX: 1, offsetY: 1, color: '#000000', fill: true }` in code |
| Clock starts at `{ day: 1, hour: 8, minute: 0 }` | ✅ PASS | `WorldClock._time` initialised to that value; unit test #1 confirms |

---

## Bugs found (outside acceptance set)

### BUG-001 — Vite binds IPv6 only; Playwright config checks IPv4 `127.0.0.1`

**Severity:** Infrastructure / DX (does not affect runtime game).  
**File:** `game/vite.config.ts` + `playwright.config.ts`  
**Symptom:** `npx playwright test` times out on a cold run because Vite binds `[::1]:5173` and Playwright's health-check URL is `http://127.0.0.1:5173`.  
**Fix:** Add `host: '0.0.0.0'` (or `'127.0.0.1'`) to `game/vite.config.ts`'s `server` block.

---

## Artifacts

- Temp config used for this run: `playwright.qa-override.config.ts` (can be deleted or kept for future QA runs)
- No new e2e test needed — codeplan's test adequately covers the acceptance criteria
- No failing screenshot artifacts (all tests passed)

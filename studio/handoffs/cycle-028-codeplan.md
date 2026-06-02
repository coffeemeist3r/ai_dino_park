# Cycle 28 — Code Plan

## Item
BACKLOG-105 [core] Wall-clock-anchored time + configurable scale.

## Files to create
- `tests/e2e/cycle-028-realtime.spec.ts` — e2e for scale toggle + wall-clock advance.

## Files to modify
- `game/src/world/clock.ts`
  - Add module consts `MINUTES_PER_DAY = 1440`, `MS_PER_REAL_MINUTE = 60_000`, `MAX_CATCHUP_TICKS = MINUTES_PER_DAY`.
  - Add pure helpers `timeToAbs(t)` / `absToTime(abs)` (absolute minute since Day 1 00:00 ⇄ GameTime), reusing the existing day-wrap arithmetic shape.
  - `WorldClock`: add fields `_scale = 1`, `_nowSource: () => number = () => Date.now()`, `_anchorEpochMs`, `_anchorAbsMin`; constructor calls private `reanchor()`.
  - `reanchor()` — `_anchorEpochMs = _nowSource()`, `_anchorAbsMin = timeToAbs(_time)`.
  - `setNowSource(fn)` — test/dev hook; sets source then `reanchor()`.
  - `getScale()` / `setScale(s)` — ignore non-positive; `reanchor()` (no jump).
  - `update()` — derive target absolute minute from `(_nowSource() - _anchorEpochMs) * _scale / MS_PER_REAL_MINUTE`; compute minutes behind; if `> MAX_CATCHUP_TICKS` call `set(absToTime(target))` (jump, no flood); else `tick()` that many times.
  - `set(t)` — keep overwrite, then `reanchor()` so flow continues from `t`.
  - `start(scene)` — `reanchor()`, then add a **500 ms** loop timer calling `() => this.update()` (replaces the old 1000 ms tick-loop).
  - **Preserve unchanged:** `tick()`, `now()`, `onTick`, `onHour`, `getWorldClock()`, `resetClockForTest()`, top-level `now()`.
- `game/src/world/saveGame.ts`
  - `SaveData`: add `savedAt?: number`, `scale?: number`.
  - `deserialize`: if `savedAt`/`scale` present, require numeric (else `return null`); default `scale` absent → `1`, `savedAt` absent → omit. Keep `SAVE_VERSION = 1`.
- `game/src/scenes/WorldScene.ts`
  - `setupClock()`: install a dev wall-offset `now()` source — `let wallOffset = 0; clock.setNowSource(() => Date.now() + wallOffset)`; expose `__advanceWall(ms)` (adds to offset, pumps `update()`, returns `now()`) and `__clockScale()`. Add **T** key → `toggleScale()`. HUD text via `fmtClock` now appends scale.
  - `fmtClock(t)`: append ` ·${clock.getScale()}×`.
  - Add `toggleScale()` — `clock.setScale(clock.getScale() === 1 ? 60 : 1)`, refresh `clockHud` text.
  - `currentSaveData()`: set `savedAt: Date.now()`, `scale: getWorldClock().getScale()`.
  - Keep `__advanceMinutes` (tick loop) and `__clockNow` as-is.

## Reuse list
- `WorldClock.tick()` — reused verbatim as the minute boundary primitive; `update()` and the 500 ms pump call it. Do NOT reinvent minute/day-wrap math.
- `getWorldClock()` singleton + `resetClockForTest()` — existing lifecycle, untouched.
- `fmtClock` / `clockHud` / existing `onTick`/`onHour` wiring in WorldScene — extend, don't duplicate.
- Save additive-field pattern from `friendship`/`memory`/`bonds`/`eggs` parsing in `saveGame.ts` — mirror it for `savedAt`/`scale`.
- e2e `boot()` helper (`tests/e2e/helpers.ts`) + `__clockNow` hook — reuse for the new spec.

## New dependencies
none.

## Test plan
- Unit (`tests/unit/clock.test.ts`, extend):
  - existing `tick()` tests stay (assert `tick()` semantics unchanged).
  - injected `now()` source: at scale 1, +60 000 ms ⇒ +1 minute; at scale 60, +60 000 ms ⇒ +60 minutes.
  - `update()` crossing an hour boundary fires `onHour` once per crossed hour.
  - elapsed > cap ⇒ `now()` jumps to target, `onTick` fired ≤ cap (no flood).
  - `setScale` re-anchors: `now()` identical immediately before/after toggle.
  - `set(t)` re-anchors: a subsequent same-instant `update()` is a no-op.
- Unit (`tests/unit/saveGame.test.ts`, extend):
  - round-trip `savedAt` + `scale`.
  - JSON lacking `savedAt`/`scale` deserializes; `scale` defaults to 1.
  - present-but-non-numeric `scale` ⇒ `null`.
- E2E (`tests/e2e/cycle-028-realtime.spec.ts`):
  - boot ⇒ `__clockScale()` === 1.
  - `__advanceWall(60000)` ⇒ in-game minute +1 from start.
  - press **T** ⇒ `__clockScale()` === 60 and clock HUD text contains `60×`.
  - at 60×, `__advanceWall(60000)` ⇒ +60 minutes.

## Risks
- A spec that relied on the live 1000 ms tick cadence would break — but all time-driven specs use the `__advanceMinutes` (tick) hook, which is preserved, so risk is low. QA confirms full suite.
- Default 1× means the live clock barely moves during an e2e run; tests must drive time via `__advanceWall`/`__advanceMinutes`, never by waiting real seconds.
- `now()` returning the last-pumped `_time` (not a live float) is intentional — keeps `now()` consistent with `tick()` and existing tests; the 500 ms pump keeps it fresh.

## Estimated touch count
~5 files (clock.ts, saveGame.ts, WorldScene.ts, clock.test.ts, saveGame.test.ts) + 1 new e2e = 6. At the cap; no split needed.

## Shipped

**Files touched:**
- `game/src/world/clock.ts` — wall-clock anchor (epoch + absMin), injectable `_nowSource`, `_scale`; `update()` pump (capped catch-up, jump past `MAX_CATCHUP_TICKS`); `getScale`/`setScale`/`setNowSource`; `set()` & `start()` re-anchor; `tick()`/`now()`/listeners/singleton preserved; `timeToAbs`/`absToTime` helpers.
- `game/src/world/saveGame.ts` — additive `savedAt?`/`scale?` on `SaveData`; lenient numeric parse, `scale` defaults to 1. `SAVE_VERSION` unchanged (1).
- `game/src/scenes/WorldScene.ts` — `fmtClock` appends `·N×`; `toggleScale()` on **T**; offset wall-clock now-source; `__clockScale`/`__clockHudText`/`__advanceWall` dev hooks; `savedAt`/`scale` written in `currentSaveData()`. `__advanceMinutes`/`__clockNow` kept.
- `tests/unit/clock.test.ts` — +7 wall-clock tests (scale derivation, hour-boundary fires, cap/jump, setScale/set re-anchor, tick scale-independence). Original tick tests unchanged.
- `tests/unit/saveGame.test.ts` — fixture gains `savedAt`/`scale`; +2 tests (old-save default, non-numeric scale rejected).
- `tests/e2e/cycle-028-realtime.spec.ts` — new: 1× advance, T→60× + HUD readout, 60× advance.

**Deviations:** added a `__clockHudText` hook (not in the original plan) so the e2e can honestly verify the canvas-rendered HUD shows the scale, rather than re-checking the scale hook.

**Build:** ✅ `tsc -b && vite build` clean. **Unit:** ✅ 157/157 (was 148; +9). E2E deferred to QA stage.

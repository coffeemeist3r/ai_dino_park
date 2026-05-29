# Cycle 2 — Code-plan

## Item
BACKLOG-008 [core] Day/night palette shift — tint overlay based on in-game hour.

## Files to create
- `game/src/world/dayNight.ts` — pure tint math, no Phaser import (mirrors `clock.ts` shape).
  - `export interface Tint { color: number; alpha: number }`
  - `export function tintFor(t: GameTime): Tint` — piecewise-linear lerp of color + alpha across keyframes over the 24h day, wrapping at midnight.
  - `export function dayPhase(hour: number): 'night' | 'dawn' | 'day' | 'dusk'` — coarse label for future hour-keyed features and tests.
  - private `lerpColor(a, b, f)` + `lerp(a, b, f)` helpers.
- `tests/unit/dayNight.test.ts` — unit tests (see Test plan).
- `tests/e2e/cycle-002-daynight.spec.ts` — e2e via dev hooks.

## Files to modify
- `game/src/scenes/WorldScene.ts`
  - Add field `private nightOverlay!: Phaser.GameObjects.Rectangle`.
  - In `create()`, after `drawGrassMap()` and before/around `setupClock()`, create the overlay rectangle (full map, depth 5 — grass is depth 0, HUD is depth 10).
  - New private `setupDayNight()`: create overlay, apply `tintFor(clock.now())`, subscribe `clock.onTick(t => applyTint(t))`, and expose dev hooks `window.__readTint` and `window.__forceHour`.
  - `setupClock()` stays as-is; call `setupDayNight()` from `create()` after `setupClock()` so the clock singleton exists.
- `studio/handoffs/cycle-002-codeplan.md` — this file (Shipped section appended by Coder).

## Reuse list (CHARTER demands reuse)
- `getWorldClock()`, `WorldClock.onTick`, `WorldClock.now()`, and the `GameTime` type from `game/src/world/clock.ts` — MUST reuse. Do not add a second timer or re-read time independently.
- The existing dev-hook pattern in `WorldScene.setupClock()` (`(window as any).__clockNow`) — mirror it exactly for `__readTint` / `__forceHour`, including the `// any: dev-only` comment.
- Phaser `this.add.rectangle(...).setDepth(...)` + `rect.setFillStyle(color, alpha)` — already used for the player rectangle in `create()`; same API for the overlay.
- HUD depth 10 is already set on `clockHud`; overlay depth 5 slots cleanly beneath it.

## New dependencies
none — feature is built from Phaser primitives + existing clock.

## Test plan
### Unit (vitest) — `tests/unit/dayNight.test.ts`
- `tintFor({day:1,hour:12,minute:0})` → alpha ≤ 0.05 (noon clear).
- `tintFor({day:1,hour:0,minute:0})` → alpha ≥ 0.45 and `(color & 0xff) > (color >> 16 & 0xff)` (blue > red at midnight).
- `tintFor` at 07:00 and 19:00 → red channel > blue channel, 0.1 ≤ alpha ≤ 0.45 (warm dawn/dusk).
- Continuity: iterate all 1440 minutes of the day; assert `|alpha(m+1) - alpha(m)| ≤ 0.05` for every adjacent pair (no pops, including the midnight wrap).
- `dayPhase()` returns expected labels for sample hours (2→night, 6→dawn, 12→day, 19→dusk).

### E2E (playwright) — `tests/e2e/cycle-002-daynight.spec.ts`
- Boot, wait for canvas, `window.__readTint()` is an object with numeric `color`/`alpha`.
- `window.__forceHour(0)` → `__readTint().alpha >= 0.45`; `window.__forceHour(12)` → `__readTint().alpha <= 0.05`. Exercises the live overlay object through the scene.
- Regression: existing `smoke.spec.ts` (boot, arrow key, clock tick) must still pass.

## Risks
- **Color-channel assertions**: keep keyframe colors unambiguous (midnight clearly blue-dominant, dawn/dusk clearly red-dominant) so channel-comparison tests aren't brittle. Documented in dayNight.ts keyframe comments.
- **Continuity across midnight wrap**: the keyframe table must include an explicit 1440-minute endpoint equal to the 0-minute night value, or the wrap pair will pop. Test covers it.
- **Dev hook in prod**: same theoretical concern as `__clockNow` (cycle 1 shipped it as-is). Match existing pattern; not expanding the boundary this cycle.
- **Overlay eating input**: Phaser rectangles are non-interactive unless `setInteractive()` is called — we don't call it, so the overlay won't intercept the Z key. Note for QA: confirm dialog still opens.

## Estimated touch count
~5 files (1 new src, 1 modified src, 2 new tests, 1 handoff). Under the 6-file ceiling. No split needed.

## Shipped
**Files touched:**
- `game/src/world/dayNight.ts` (new) — `tintFor(GameTime)`, `dayPhase(hour)`, pure, no Phaser. 8-keyframe table with explicit 1440 wrap endpoint.
- `game/src/scenes/WorldScene.ts` (modified) — added `nightOverlay` rectangle at depth 5, `setupDayNight()` subscribing to `clock.onTick`, dev hooks `__readTint`/`__forceHour`.
- `tests/unit/dayNight.test.ts` (new) — 6 tests.
- `tests/e2e/cycle-002-daynight.spec.ts` (new) — 2 tests.

**Deviations from plan:** none. Touched exactly the planned files.

**Build + test status:**
- `npm run build` — ✅ exit 0 (pre-existing Phaser chunk-size warning only, not new).
- `npm run test:unit` — ✅ 14/14 (2 brain + 6 clock + 6 dayNight).
- `npx playwright test` — ✅ 5/5 on the **default** `playwright.config.ts` (the vite `host: true` fix from BACKLOG-046 means the `.qa-override` config is no longer needed).

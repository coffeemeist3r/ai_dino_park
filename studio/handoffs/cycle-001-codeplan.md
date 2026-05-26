# Cycle 1 — Code Plan

## Item

**BACKLOG-007 [core] World tick clock** — in-game minute every real second, hour event broadcast

---

## Files to create

### `tests/unit/clock.test.ts`

New unit test file. Four cases:
1. `WorldClock` initializes at day 1, hour 8, minute 0.
2. Calling `tick()` 60 times fires the hour listener exactly once with `{ day: 1, hour: 9, minute: 0 }`.
3. Calling `tick()` a further 60 times fires the listener again at hour 10.
4. Ticking through midnight (e.g., start at `{ day: 1, hour: 23, minute: 0 }`, tick 60 times) fires with `{ day: 2, hour: 0, minute: 0 }`.

---

## Files to modify

### `game/src/world/clock.ts` — full rewrite (stub → `WorldClock` class)

**Rewrite, keep `GameTime` interface and `now()` export. Add:**

- `WorldClock` class (no Phaser import — pure TS for testability):
  - Private `_time: GameTime` — starts at `{ day: 1, hour: 8, minute: 0 }`.
  - Private `_hourListeners: Array<(t: GameTime) => void>` — starts empty.
  - `tick(): void` — advances `_time` by exactly 1 minute using the arithmetic already in the stub's `advanceMinutes(1)`. On hour change (or day wrap), calls each listener with a copy of `_time`.
  - `onHour(fn: (t: GameTime) => void): void` — registers a listener.
  - `now(): GameTime` — returns `{ ..._time }` (copy, not reference).
  - `start(scene: Phaser.Scene): void` — registers `scene.time.addEvent({ delay: 1000, callback: this.tick, callbackScope: this, loop: true })`. This is the **only** method that imports/uses Phaser types.
  
- Remove module-level `_time`, `advanceMinutes()`. Keep `now()` as a top-level re-export pointing at the singleton (see below) for backward compat.

- Module-level singleton helpers (no export of the instance — only through `getWorldClock()`):
  ```
  let _instance: WorldClock | null = null;
  export function getWorldClock(): WorldClock { ... lazy init ... }
  export function now(): GameTime { return getWorldClock().now(); }
  ```

**Type import note:** `Phaser.Scene` is used only in `start()` parameter type. Use `import type Phaser from 'phaser'` at top of file — tree-shakeable, doesn't pull in Phaser runtime for unit tests that never call `start()`.

### `game/src/scenes/WorldScene.ts` — three changes

1. **Import:** add `import { getWorldClock } from '../world/clock';`
2. **`create()` method:** after existing setup, add:
   ```
   const clock = getWorldClock();
   this.clockHud = this.add.text(6, 4, 'Day 1 — 08:00', {
     fontFamily: 'monospace',
     fontSize: '12px',
     color: '#ffffff',
     shadow: { offsetX: 1, offsetY: 1, color: '#000000', fill: true },
   }).setDepth(10);
   clock.onHour((t) => {
     this.clockHud.setText(`Day ${t.day} — ${String(t.hour).padStart(2,'0')}:00`);
   });
   clock.start(this);
   // Dev hook — Playwright reads this
   (window as any).__clockTime = clock.now();
   clock.onHour((t) => { (window as any).__clockTime = t; });
   ```
3. **Class field:** add `private clockHud!: Phaser.GameObjects.Text;`

**HUD format:** `Day N — HH:00` on hour change. Between hours the HUD shows the last full-hour text (minute granularity is a future QoL item).

> **Design AC mismatch — noted:** The acceptance criteria want `08:01` after 1 second, implying per-minute HUD updates. The HUD update above only fires on hour boundaries. This means `08:00` stays on screen for 60 real seconds. Options:
>
> a) Subscribe to tick-level updates (update HUD every second) — trivial to add, slightly more draw calls.  
> b) Keep hour-only updates — simpler, matches BACKLOG-008 (day/night) which only needs hourly.
>
> **Decision:** Update HUD every tick (every second) for the correct AC behavior. Add a second tick listener that updates the HUD text. This is minor overhead at 1 update/second.

**Revised WorldScene.create() clock block:**
```
const clock = getWorldClock();
const fmt = (t: GameTime) =>
  `Day ${t.day} — ${String(t.hour).padStart(2,'0')}:${String(t.minute).padStart(2,'0')}`;

this.clockHud = this.add.text(6, 4, fmt(clock.now()), {
  fontFamily: 'monospace',
  fontSize: '12px',
  color: '#ffffff',
  shadow: { offsetX: 1, offsetY: 1, color: '#000000', fill: true },
}).setDepth(10);

clock.onHour((t) => { (window as any).__clockTime = t; });

// tick-level HUD update (fires every second via WorldClock.start)
// We expose a public tickListeners hook OR add a second public method.
```

**Simplification:** Rather than separate `onHour` and `onTick` arrays, `WorldClock` gets ONE more method: `onTick(fn: (t: GameTime) => void): void`. The HUD subscribes to `onTick`; the `__clockTime` window hook subscribes to `onHour`.

**Final WorldClock API:**
```
tick(): void
onTick(fn): void   // fires every in-game minute (= every real second)
onHour(fn): void   // fires only on hour boundaries
now(): GameTime
start(scene): void
```

### `tests/e2e/smoke.spec.ts` — add one test

```typescript
test('clock advances after 2 real seconds', async ({ page }) => {
  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForTimeout(2_200);  // >2 ticks
  const t = await page.evaluate(() => (window as any).__clockTime);
  // __clockTime updates on hour boundary only; at 08:xx we won't hit an hour
  // boundary in 2s. Check HUD text via accessibility snapshot instead.
});
```

**E2E strategy note:** Phaser renders to `<canvas>`; DOM text is not queryable. The `window.__clockTime` hook updates on hour (not per tick). For a 2-second test, no hour will pass. Two viable approaches:

1. Set initial time to `23:58` in a test/dev environment → crosses midnight in 2s → `__clockTime` updates → Playwright can read.
2. Expose `window.__clockNow()` as a function that returns `clock.now()` every tick.

**Decision:** Expose `window.__clockNow = () => clock.now()` in `WorldScene.create()` (dev always, or `import.meta.env.DEV` guard). Playwright test calls `page.evaluate(() => window.__clockNow())` after 2.2 seconds and asserts `minute >= 2`.

**Revised e2e test:**
```typescript
test('world clock ticks in real time', async ({ page }) => {
  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForTimeout(2_500);
  const t = await page.evaluate(() => (window as any).__clockNow());
  expect(t.minute).toBeGreaterThanOrEqual(2);
});
```

---

## Reuse list

| New symbol | Prior art in `game/src/` | Decision |
|---|---|---|
| `GameTime` interface | `clock.ts` lines 6-10 | **Reuse as-is** |
| `advanceMinutes` arithmetic | `clock.ts` lines 19-27 | **Absorb into `WorldClock.tick()`** |
| HUD text style | `Dino.label` in `entities/dino.ts` lines 30-36 | **Copy style**, `monospace` + white + shadow |
| Phaser timer | Not yet used | **New** — `scene.time.addEvent` |
| EventEmitter | Phaser includes `EventEmitter3` | **Not used** — custom listener arrays instead (zero new deps, simpler, testable in Node) |

---

## New dependencies

**None.** `WorldClock` uses plain TS arrays for listeners. Phaser's `scene.time.addEvent` drives the tick.

---

## Test plan

### Unit tests — `tests/unit/clock.test.ts`

| # | Test | Asserts |
|---|---|---|
| 1 | Initial state | `now()` returns `{ day: 1, hour: 8, minute: 0 }` |
| 2 | 60 ticks → onHour fires | listener called exactly once; payload `{ day: 1, hour: 9, minute: 0 }` |
| 3 | 120 ticks → onHour fires twice | second call payload `{ day: 1, hour: 10, minute: 0 }` |
| 4 | Midnight wrap | start at 23:59, 1 tick → listener with `{ day: 2, hour: 0, minute: 0 }` |
| 5 | onTick fires every tick | tick 3× → onTick callback called 3 times |
| 6 | now() returns copy | mutating result doesn't affect internal state |

### E2E tests — `tests/e2e/smoke.spec.ts`

| # | Test | Asserts |
|---|---|---|
| + | `world clock ticks in real time` | after 2.5s, `window.__clockNow().minute >= 2` |

---

## Risks

1. **Phaser import in test env:** `import type Phaser from 'phaser'` is used only as a type reference in `start(scene: Phaser.Scene)`. Vitest runs in Node. If Vitest resolves the type import at runtime, it may error. **Mitigation:** use `type` import keyword; Vitest strips type-only imports. If it still fails, define a local `interface PhaserScene { time: { addEvent: (cfg: object) => void } }` instead and cast.

2. **Singleton reset between tests:** `getWorldClock()` returns a module-level singleton. If multiple test files import it, they share state. **Mitigation:** add `export function resetClockForTest(): void` that resets `_instance = null` and call it in `beforeEach` in the clock test. Flag it clearly as test-only.

3. **`window` not defined in Node/Vitest:** `WorldScene` references `window` for dev hook. Unit tests don't run `WorldScene` — no issue. E2E runs in browser — fine. **No action needed.**

4. **HUD depth:** `setDepth(10)` puts the HUD above tiles. If future UI layers exceed depth 10, HUD may be obscured. Future concern; depth 10 is safe for now.

5. **`callbackScope`:** Phaser `addEvent({ callback: this.tick, callbackScope: this })` — `tick` must be a regular method, not arrow. If Coder uses an arrow property (`tick = () => { ... }`), `callbackScope` is ignored. Either is fine; just be consistent.

---

## Estimated touch count

**~4 files** (well under the 6-file split threshold):
- `game/src/world/clock.ts` — rewrite
- `game/src/scenes/WorldScene.ts` — 3 additions
- `tests/unit/clock.test.ts` — new
- `tests/e2e/smoke.spec.ts` — 1 new test

---

## Shipped

**Files actually touched (4):**
- `game/src/world/clock.ts` — rewrote stub to `WorldClock` class per plan
- `game/src/scenes/WorldScene.ts` — added `clockHud` field, `setupClock()` method, clock import
- `tests/unit/clock.test.ts` — created; 6 unit tests
- `tests/e2e/smoke.spec.ts` — added `world clock ticks in real time` test

**Deviations from plan:**
- Used `SceneTimer` local interface instead of `import type Phaser` — eliminates Vitest/Node risk entirely (risk #1 in plan).
- `window.__clockNow` set immediately in `setupClock()` and updated on each `onTick` — plan said `onHour` but per-tick is correct for the e2e test.
- No `callbackScope` needed; used arrow function `() => this.tick()` in `start()` — cleaner, avoids Phaser-specific context quirk.

**Build status:** `npm --prefix game run build` — ✅ exit 0 (chunk-size warning from Phaser is pre-existing, not new).

**Unit tests:** `npm run test:unit` — ✅ 8/8 passed (2 brain + 6 clock).

**Dev server smoke:** HTTP 200 on `localhost:5173` — ✅.

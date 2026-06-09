# Cycle 36 — Code Plan

**Item** — BACKLOG-144 [emergent] World-scale night event

## Files to create

- `game/src/world/skyEvent.ts` — pure (no Phaser, no WebLLM), mirrors `world/comfort.ts` /
  `social/tones.ts` shape:
  - `export interface SkyEvent { id: 'meteors' | 'aurora'; label: string; color: number; bubble: string; memory: string; durationMin: number; }`
  - `export const SKY_EVENTS: ReadonlyArray<SkyEvent>` — meteors (bluish) + aurora (greenish), each
    with a ✨ bubble line and a shared "we all watched together" memory line, `durationMin: 90`.
  - `export const SKY_GATHER_TILE = { tileX: 10, tileY: 7 }` — open centre, distinct from the den (10,11).
  - `export const SKY_CHANCE = 0.18` — per-in-game-hour chance on a clear night.
  - `export function pickSkyEvent(roll: number): SkyEvent` — maps a clamped 0..1 roll across `SKY_EVENTS`.
  - `export function rollSkyEvent(opts: { isClearNight: boolean; active: boolean; chanceRoll: number; pickRoll: number; chance?: number }): SkyEvent | null`
    — returns null when `!isClearNight` or `active` or `chanceRoll >= chance`; else `pickSkyEvent(pickRoll)`.
  - `export function atGather(tile: {tileX:number;tileY:number}, gather = SKY_GATHER_TILE, radius = 1): boolean`
    — chebyshev/manhattan distance ≤ radius (a dino has "arrived").
  - `export function skyExpired(elapsedMin: number, event: SkyEvent): boolean` — `elapsedMin >= durationMin`.

- `tests/unit/skyEvent.test.ts` — pure-module unit tests (see Test plan).
- `tests/e2e/cycle-036-sky.spec.ts` — Playwright flow (see Test plan).

## Files to modify

- `game/src/scenes/WorldScene.ts`:
  - Import the new module + reuse `stepToward` (already imported), `remember` (already imported),
    `dayPhase`/`getWorldClock` (already imported).
  - New fields: `private activeSky: SkyEvent | null = null;`, `private skyStartAbsMin = 0;`,
    `private skyGazers = new Set<string>();`, `private skyOverlay!: Phaser.GameObjects.Rectangle;`,
    `private skyTween?: Phaser.Tweens.Tween;`.
  - `setupSkyEvent()` — create the shimmer overlay (full map, depth 7: above night tint depth 5 / bond
    lines depth 6, below glass depth 8), `setVisible(false)`; register `getWorldClock().onHour(t => this.maybeStartSky())`;
    attach `__skyEvent` / `__triggerSky` / `__skyGazers` hooks. Call it from `create()` after `setupFeeding()`.
  - `maybeStartSky()` — if `activeSky` return; roll `rollSkyEvent({ isClearNight: this.isClearNight(),
    active: false, chanceRoll: Math.random(), pickRoll: Math.random() })`; if non-null → `startSky(ev)`.
  - `startSky(ev)` — set `activeSky`, `skyStartAbsMin = absMinNow()`, clear `skyGazers`, show overlay
    tinted `ev.color`, start a yoyo alpha pulse tween, `logEvent(...)`. (No save — transient; the gather
    memories save as dinos arrive.)
  - `endSky()` — null `activeSky`, stop tween, hide overlay, `void this.saveGame()` (persist filed memories).
  - In `forceStep()` — add a **top-priority** branch before the food/huddle/wander block: if `activeSky`,
    first check `skyExpired(absMinNow() - this.skyStartAbsMin, activeSky)` OR `!this.isNight()` → `endSky()`;
    otherwise for each dino `stepToward(cur, SKY_GATHER_TILE, …)`, and on `atGather(next)` and not yet a
    gazer → add to `skyGazers`, `this.memory = remember(memory, name, activeSky.memory)`, `showBubble(d, activeSky.bubble)`.
    Keep the existing meeting/bond loop after (clustering at the gather spot is on-theme).
  - Small private helper `absMinNow()` (`const t = clock.now(); return ((t.day-1)*1440)+t.hour*60+t.minute`)
    — or inline; only used by sky timing.

## Reuse list (MUST reuse — do not reinvent)

- `world/movement.ts` `stepToward` — the per-tile pull toward the gather tile (already used by huddle/feeding).
- `ai/memory.ts` `remember` — file the shared sky memory (already imported in WorldScene).
- `world/dayNight.ts` `dayPhase` + existing `this.isNight()` / `this.isClearNight()` — night/clear gating.
- `world/clock.ts` `getWorldClock().onHour` / `.now()` — the rare per-hour roll + event timing.
- `WorldScene.showBubble` / `logEvent` / `tileOf` / `saveGame` — existing glue, unchanged signatures.
- Overlay pattern mirrors `setupDayNight()`'s `nightOverlay` rectangle; pulse tween mirrors `enterAmbient()`.

## New dependencies

none — greenfield logic over existing utilities.

## Test plan

**Unit — `tests/unit/skyEvent.test.ts`** (vitest):
- `rollSkyEvent` returns null when `isClearNight: false` (any rolls).
- `rollSkyEvent` returns null when `active: true`.
- `rollSkyEvent` returns null when `chanceRoll >= chance`, an event when `chanceRoll < chance`.
- `pickSkyEvent(0)` and `pickSkyEvent(0.99)` reach different events → every `SKY_EVENTS` entry reachable;
  output is always a valid event for rolls across [0,1].
- `atGather` true at the gather tile and within radius, false beyond it.
- `skyExpired` false below `durationMin`, true at/after it.
- Each `SKY_EVENTS` entry has a ✨ bubble and a non-empty shared memory; `SKY_CHANCE` in (0,1).

**E2E — `tests/e2e/cycle-036-sky.spec.ts`** (Playwright, headless = canned brain; sky logic is pure):
- `__triggerSky()` → `__skyEvent()` returns a valid id; overlay alpha > 0 (read via a hook or
  `__skyEvent` truthiness). Boot console-error-clean.
- After `__triggerSky()`, loop `__stepWorld()` ~20× → `__skyGazers()` length === `__dinoCount()`
  (whole cast gathered).
- The shared memory line appears in `__memory()` for a gathered dino **and** in `__exportSave()`'s
  `memory` store (persists; no `version` bump — assert `JSON.parse(exported).version === 1`).
- Advance past the duration (`__advanceMinutes(95)` then `__stepWorld()`), or force dawn
  (`__forceHour`/advance) → `__skyEvent()` === null and gazers can wander again.
- Regression: the tone menu still opens (`__openToneMenu('Rex')` contains `[1] Warm`).

## Risks

- **Timing source.** `skyStartAbsMin` must read the same clock the e2e advances via `__advanceMinutes`
  (which calls `clock.tick()`), so derive elapsed from `getWorldClock().now()`, not `Date.now()`.
- **Override ordering.** The sky branch must precede the food/huddle branches in `forceStep` and
  `continue`/return per-dino so the spectacle isn't fought by the feeding pull. End-check runs once at
  the top of the step, before moving dinos.
- **Gather tile occupancy.** Five dinos converging on one tile is fine (positions overlap, like the den
  huddle); `atGather` uses a radius so they don't need the exact tile to count as gathered.
- **Overlay depth.** Depth 7 keeps the shimmer above the night tint/bond lines but under the glass rim
  and HUD — verify nothing else claims depth 7.
- **No save schema touch.** Do NOT add a `SaveData` field; the only persisted trace is the memory line.
  Keeps `deserialize` and every old-save test untouched.

## Estimated touch count

~4 files (1 new module, 1 WorldScene edit, 2 test files). Under the 6-file ceiling.

---

## Shipped

**Files touched (exactly the plan):**
- `game/src/world/skyEvent.ts` (new) — `SkyEvent`/`SKY_EVENTS` (meteors + aurora), `SKY_GATHER_TILE`
  (10,7), `SKY_CHANCE` 0.18, `pickSkyEvent`, `rollSkyEvent`, `atGather`, `skyExpired`. Pure, no imports.
- `game/src/scenes/WorldScene.ts` (modified) — added the skyEvent import; fields `activeSky`,
  `skyStartAbsMin`, `skyGazers`, `skyOverlay`, `skyTween`; `setupSkyEvent()` (overlay depth 7 + onHour
  roll + `__skyEvent`/`__triggerSky`/`__skyGazers` hooks), `maybeStartSky`, `startSky`, `endSky`,
  `stepSky`, `absMinNow`; a top-priority `stepSky()` branch in `forceStep` that early-returns while an
  event runs. `create()` calls `setupSkyEvent()` after `setupFeeding()`.
- `tests/unit/skyEvent.test.ts` (new) — 7 tests.
- `tests/e2e/cycle-036-sky.spec.ts` (new) — 4 tests.

**Deviations:** none. No save-schema change (the shared memory rides the existing persisted memory
store), no new dependency, NPCBrain boundary untouched (skyEvent.ts imports nothing).

**Status:**
- `npm --prefix game run build` — ✅ clean (tsc -b + vite build; only the pre-existing chunk-size warning).
- `npm run test:unit` — ✅ 254/254 (was 247; +7 skyEvent).
- New e2e `cycle-036-sky` — ✅ 4/4 (first run hit the known cold-server boot flake; green on a clean
  port). Page boots + renders (e2e boot waits on `__ready`).

**QA-surfaced fix (regression, corrected in-session):** the first full e2e run failed
`cycle-018-huddle`. Root cause: the auto-roll was wired to `getWorldClock().onHour`, so any test
that advances the clock per-minute across night hours (huddle/context/egg) rolled the 0.18/hour
chance many times and a random spectacle yanked the cast off the den. This was *also* a design bug —
~1.4 events/night is not "rare". Corrected by driving the roll off a **real-time Phaser timer**
(`SKY_ROLL_INTERVAL_MS` 45s) instead of in-game hours — offline catch-up / `__advanceMinutes` no
longer trigger it, and a short headless test never waits 45s — plus a **one-per-in-game-day cap**
(`skyFiredDay`) and a lower `SKY_CHANCE` (0.05). `__triggerSky` (the forced e2e path) is unchanged.
Re-ran the **full** suite: ✅ 83/83 e2e, 254/254 unit, build clean.

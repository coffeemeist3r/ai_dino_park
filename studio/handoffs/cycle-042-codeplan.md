# Cycle 42 — Code Plan

**Item** — BACKLOG-171 [emergent] Winter huddle pull — cold seasons lower the night-huddle bond threshold and lengthen the huddle window, so winter visibly packs the den while summer nights stay scattered.

## Files to create

- `game/src/world/huddle.ts` — pure, no Phaser. Exports:
  - `HUDDLE_THRESHOLD = 8` (the legacy base, moved here from WorldScene)
  - `SEASON_HUDDLE: Record<Season, { threshold: number; start: number; end: number }>` —
    spring `{8, 21, 5}` / summer `{8, 23, 4}` / fall `{6, 21, 5}` / winter `{4, 19, 7}`
  - `huddleThreshold(season?: Season): number` — omitted → `HUDDLE_THRESHOLD`
  - `inHuddleWindow(hour: number, season?: Season): boolean` — omitted → `dayPhase(hour) === 'night'`
    (import `dayPhase` from `./dayNight`); with season: wrap-aware `hour >= start || hour < end`
- `tests/unit/huddle.test.ts`
- `tests/e2e/cycle-042-winter-huddle.spec.ts`

## Files to modify

- `game/src/scenes/WorldScene.ts`
  - delete the local `const HUDDLE_THRESHOLD = 8`; import `HUDDLE_THRESHOLD`, `huddleThreshold`, `inHuddleWindow` from `../world/huddle`
  - `forceStep()` movement gate: compute `const season = this.currentSeason()` and `const hour = getWorldClock().now().hour` once before the dino loop; replace `night && this.maxBond(d.name) >= HUDDLE_THRESHOLD` with `inHuddleWindow(hour, season) && this.maxBond(d.name) >= huddleThreshold(season)` (the `const night = this.isNight()` line is then unused by the gate — remove if nothing else in the loop reads it)
  - `isHuddling(d)`: `this.isNight()` → `inHuddleWindow(getWorldClock().now().hour, this.currentSeason())` (feeds 💤 marks + `__huddlers`)
  - `__bondPair(a, b, amount?)`: optional third arg, default `HUDDLE_THRESHOLD` (existing bare calls unchanged)
  - new dev hook `__huddleInfo()` → `{ season, threshold, inWindow }` off the live clock (place beside `__huddlers`)
- `studio/state.json`, `studio/chronicle.md`, this file (Shipped section) — per routine.

## Reuse list

- `seasonFor` / `Season` — `game/src/world/seasons.ts` (the season verdict; do NOT re-derive)
- `currentSeason()` — already on WorldScene (cycle 41); thread it, don't duplicate
- `dayPhase` — `game/src/world/dayNight.ts` (the legacy window fallback — guarantees byte-identical no-season behaviour)
- `getWorldClock` — `game/src/world/clock.ts`
- e2e staging hooks already shipped: `__setClock` (restore-semantics, cycle 40), `__stepWorld`, `__huddlers`, `__bondPair`, `boot` helper (`tests/e2e/helpers.ts`)
- Optional-season signature discipline — copy `favoriteFood(traits, season?)` in `world/foods.ts` exactly (cycle-41 pattern)

## New dependencies

none.

## Test plan

**Unit (`tests/unit/huddle.test.ts`)** — mirror `seasons.test.ts` style:
1. season omitted: `huddleThreshold()` is 8; `inHuddleWindow(h)` === (`dayPhase(h) === 'night'`) for h in 0..23
2. spring === legacy: threshold 8; window matches `dayPhase` night for all 24 hours
3. winter: threshold 4; window true for 19..23 ∪ 0..6, false for 7..18
4. summer: threshold 8; window true only for 23 ∪ 0..3; hours 21 and 22 explicitly false
5. fall: threshold 6; window identical to spring
6. config sanity: every season's threshold ≤ 8 and winter's window is the longest (guards accidental table edits)

**E2E (`tests/e2e/cycle-042-winter-huddle.spec.ts`)** — boot → stage → step, cycle-018 shape:
1. *winter dusk pull*: `__bondPair('Rex','Mossback')` (=8), `__setClock(22, 19, 30)`; 45 × `__stepWorld()`; expect `__huddlers()` to contain both — 19:30 never huddled in any prior build
2. *winter admits the loosely-bonded*: `__bondPair('Sunny','Glade', 4)`, `__setClock(22, 22, 0)`; expect `__huddleInfo()` = `{season:'winter', threshold:4, inWindow:true}`; 45 steps; `__huddlers()` contains Sunny + Glade
3. *summer scatter*: `__bondPair('Rex','Mossback')`, `__setClock(10, 21, 30)`; expect `__huddleInfo().inWindow === false`; 10 steps; `__huddlers()` stays empty
4. *spring unchanged*: `__setClock(3, 22, 0)` + bonded pair huddles (legacy night) — plus the untouched cycle-018 spec re-run green

## Risks

- **`isHuddling` now reads the clock per call** — it's called per dino per step + in `maybeLayEggs`; trivial cost, but pull `now()` once per `forceStep` and pass nothing extra: keep `isHuddling` self-contained (it's also called from `refreshSleepMarks` outside the loop). Fine as-is; do not memoize.
- **Eggs**: `maybeLayEggs` scans `isHuddling` pairs gated by `isClearNight()` (= plain night). Winter dusk (19–21h) huddlers are NOT clear-night, so no new egg window opens — this is the designed behaviour; don't "fix" it.
- **Sky event vs winter dusk**: `stepSky` only runs when `isNight()`; a sky event can't fire at 19:30, so no priority clash — the gather override remains night-only.
- **`__bondPair` default**: cycle-029-away comments rely on bare call = 8; keep the default expression literally `HUDDLE_THRESHOLD`.
- **Summer scatter test flake**: `__huddlers()` could in principle pick up a dino that *wandered* near the den — but `isHuddling` requires `inHuddleWindow` true, which is false at 21:30 summer, so the assert is structural, not positional. No flake surface.
- The cycle-018 spec stages day 1 (spring) via `__advanceMinutes` — spring config is byte-identical, so it must pass untouched; if it doesn't, the table is wrong, not the spec.

## Estimated touch count

~5 files (1 new module, 1 scene glue, 2 test files, + studio bookkeeping). Well under the split bar.

## Shipped

**Files touched:**
- `game/src/world/huddle.ts` (new) — `HUDDLE_THRESHOLD`, `SEASON_HUDDLE`, `huddleThreshold(season?)`, `inHuddleWindow(hour, season?)`; pure, no Phaser; legacy fallback via `dayPhase`
- `game/src/scenes/WorldScene.ts` — local `HUDDLE_THRESHOLD` const removed in favour of the import; den-seek gate reads `inHuddleWindow(hour, season)` + `huddleThreshold(season)` (season/hour hoisted once per `forceStep`); `isHuddling` window-aware; `__bondPair` grew optional `amount` (default exactly `HUDDLE_THRESHOLD`); new `__huddleInfo` hook
- `tests/unit/huddle.test.ts` (new) — 6 tests
- `tests/e2e/cycle-042-winter-huddle.spec.ts` (new) — 4 tests

**Deviations from plan:** none. `const night` was only read by the huddle gate, so it's gone; `isNight()` itself stays (sky event + clear-night breeding still use it, untouched per design).

**Build:** ✅ clean (`tsc -b && vite build`).
**Unit:** ✅ 309/309 green (+6 new).
**Dev server:** ✅ HTTP 200 on 5173.
E2E left to QA per routine.

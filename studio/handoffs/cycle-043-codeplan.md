# Cycle 43 — Code Plan

## Item

BACKLOG-179 [emergent] Cold-night shiver — a dino that never huddled on a winter night shivers
(🥶) at morning and files a "slept cold" memory that colours its next greeting.

## Files to create

- `game/src/world/cold.ts` — pure logic (no Phaser):
  - `export const COLD_SEASON: Season = 'winter'` (import `Season` from `./seasons`).
  - `export function sleptCold(huddledTonight: boolean, season: Season): boolean` →
    `season === COLD_SEASON && !huddledTonight`.
  - `export function coldShiver(): string` → the floated bubble, e.g.
    `'🥶 brr… a cold night, slept alone'`.
  - `export function coldMemory(): string` → the stored/greet-woven memory, distinct from the
    bubble, e.g. `'shivered through a cold night, slept alone 🥶'`.
- `tests/unit/cold.test.ts` — unit tests (see Test plan).
- `tests/e2e/cycle-043-cold-shiver.spec.ts` — e2e (see Test plan).

## Files to modify

- `game/src/scenes/WorldScene.ts`:
  - **Import:** add `import { sleptCold, coldShiver, coldMemory } from '../world/cold';`.
  - **Fields:** add
    - `private huddledTonight = new Set<string>();` — names that huddled at any point in the
      current night window.
    - `private wasInHuddleWindow = false;` — window state at the previous `forceStep`.
    - `private nightSeason: Season = 'spring';` — the season captured while the window was open
      (so the morning resolution judges the night by the season the night belonged to).
    - `private lastColdSleepers: string[] = [];` — names that shivered at the last resolution
      (for the dev hook).
  - **`forceStep()`** — after the existing movement + meeting loops (near the bottom, before/around
    `this.refreshSleepMarks()`), add window-transition bookkeeping:
    - Compute `const hour = getWorldClock().now().hour;` and
      `const inWindow = inHuddleWindow(hour, season);` (reuse the `season` already computed at the
      top of `forceStep`).
    - While `inWindow`: capture `this.nightSeason = season;` and add every currently-huddling dino
      to the set: `for (const d of this.dinos) if (this.isHuddling(d)) this.huddledTonight.add(d.name);`.
    - On the **true→false** edge (`this.wasInHuddleWindow && !inWindow`): call
      `this.resolveColdMorning();`.
    - Set `this.wasInHuddleWindow = inWindow;`.
    - Guard: do this bookkeeping only when **not** short-circuited by `stepSky()` (the sky branch
      returns early — that's fine, a sky event holds the window; bookkeeping resumes next step).
  - **New method `private resolveColdMorning(): void`:**
    - `const cold: string[] = [];`
    - For each dino `d`: `if (sleptCold(this.huddledTonight.has(d.name), this.nightSeason)) { this.showBubble(d, coldShiver()); this.memory = remember(this.memory, d.name, coldMemory()); cold.push(d.name); }`
    - `this.lastColdSleepers = cold;`
    - `this.huddledTonight.clear();`
    - `if (cold.length) void this.saveGame();` (persist the new memories, mirroring the dawn
      reflection's `saveGame`).
  - **Dev hooks** (in `setupHuddle`, beside `__huddleInfo`):
    - `(window as any).__coldSleepers = () => [...this.lastColdSleepers];`
    - `(window as any).__huddledTonight = () => [...this.huddledTonight];` (inspection aid).

## Reuse list

- `game/src/world/cold.ts` consumes `Season` from `game/src/world/seasons.ts` — no new types.
- `inHuddleWindow` / `huddleThreshold` / `isHuddling` (`game/src/world/huddle.ts` +
  `WorldScene.isHuddling`) — the shiver is a *read* of the same window/participation, never a
  second copy of the rule.
- `currentSeason()` (WorldScene) — the live season off the clock day.
- `remember` / `recall` (`game/src/ai/memory.ts`) — the cold memory rides the existing per-dino
  store, already persisted and already woven into `__greetPrompt`'s `recentMemory`. No new
  persistence.
- `showBubble` (WorldScene) — the same float used by homecoming/sky/inspection beats.
- `getWorldClock()` / `__setClock` / `__stepWorld` — existing time + e2e drivers.

## New dependencies

none.

## Test plan

### Unit — `tests/unit/cold.test.ts`
- `sleptCold(false, 'winter')` is `true`; `sleptCold(true, 'winter')` is `false`.
- `sleptCold(false, s)` is `false` for each of `spring`, `summer`, `fall` (loop the warm seasons).
- `sleptCold(true, s)` is `false` for all four seasons (huddled is never cold).
- `coldShiver()` and `coldMemory()` are non-empty, each contains `'🥶'`, and
  `coldShiver() !== coldMemory()`.
- `COLD_SEASON === 'winter'`.

### E2E — `tests/e2e/cycle-043-cold-shiver.spec.ts`
Helper: set a winter clock inside the window via `__setClock` (restore-semantics, no turn beat),
`__bondPair` one pair high so they huddle, then `__stepWorld` ~45× so the bonded pair reaches the
den (accumulates into `huddledTonight`) while an unbonded dino wanders. Then `__setClock` to a
morning hour **past** the winter window end (hour 8) and `__stepWorld` once to cross the
true→false edge and fire `resolveColdMorning`.
1. **Cold sleeper read** — after the winter morning crossing, `__coldSleepers()` contains the
   never-huddled dino and excludes a dino that huddled.
2. **Memory + greet colour** — `__memory()` for the cold sleeper contains a `🥶` entry, and
   `__greetPrompt(coldSleeper)` contains the cold-memory text; the huddler's memory has no `🥶`.
3. **Summer is inert** — staged on a summer night (window never opens), crossing into morning
   leaves `__coldSleepers()` empty and no dino gains a `🥶` memory.

(Use the cycle-042 spec's `stage`/`stepAndHuddlers` pattern; bonded dinos reliably reach the den
within ~45 steps as that spec already proves.)

## Risks

- **Edge-firing depends on `forceStep` crossing the window boundary.** Mitigated: the throttled
  game tick calls `forceStep` continuously so it always crosses; the e2e crosses explicitly with
  two `__setClock` calls + a `__stepWorld`. The transition guard fires exactly once per crossing.
- **`stepSky()` early-return skips bookkeeping.** Acceptable: a sky event only runs at night
  *inside* the window, so it never coincides with the morning close edge; bookkeeping resumes the
  next ordinary step. `wasInHuddleWindow` is not updated during a sky step, so the edge is still
  caught on the first non-sky step after the window closes.
- **First-boot bonds are 0**, so in winter the whole cast may shiver. That's correct, emergent
  behaviour ("nobody's bonded yet, everybody sleeps cold"), not a bug; the e2e stages bonds to get
  a mixed result.
- **`nightSeason` capture across a midnight season boundary** (night spans day d→d+1, season is
  per day). Negligible — seasons are 7 days, so only ~1 night/year wraps a boundary, and capturing
  the season *while the window is open* (last in-window step) is a sane, stable choice. Not worth
  special-casing.
- Summer-inert assertion is structural (the window never opens → `huddledTonight` stays empty →
  `sleptCold` is false for summer regardless), so it is flake-proof.

## Estimated touch count

~5 files (1 new module + 1 modified scene + 2 new tests + BACKLOG/state/chronicle housekeeping).
Under the 6-file ceiling. No split needed.

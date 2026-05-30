# Cycle 11 — Code-plan

## Item
BACKLOG-018 — movement + meeting spine.

## Files to create
- `game/src/world/movement.ts` — pure.
  - `export interface Tile { tileX: number; tileY: number }`
  - `export const WANDER_DIRS = [[0,0],[1,0],[-1,0],[0,1],[0,-1]] as const`
  - `export function wanderStep(t, dirIndex, cols, rows): Tile` — apply `WANDER_DIRS[dir mod len]`, clamp to `[0,cols-1]×[0,rows-1]`.
- `game/src/social/meetings.ts` — pure.
  - `export type Meetings = Record<string, number>`
  - `export function pairKey(a, b): string` → `[a,b].sort().join('|')`
  - `export function recordMeet(m, a, b): Meetings` → new map, `+1` on `pairKey`, no-op if `a===b`.
- `tests/unit/movement.test.ts` (covers movement + meetings).
- `tests/e2e/cycle-011-movement.spec.ts`.

## Files to modify
- `game/src/entities/dino.ts` — add `setPosition(x, y)` that moves both `sprite` and `label` (label stays at `y - TILE`).
- `game/src/scenes/WorldScene.ts`
  - Fields `private meetings: Meetings = {}` + `private moveTicks = 0`.
  - `setupMovement()` from `create()`: `getWorldClock().onTick(() => this.stepWorld())`.
  - `stepWorld()`: `if (++this.moveTicks % 5) return;` then for each dino compute current tile from pixel, `wanderStep` with `Math.floor(Math.random()*WANDER_DIRS.length)`, `dino.setPosition(...)`; then pairwise adjacency check (Chebyshev ≤ ~1 tile) → `this.meetings = recordMeet(...)` + `flashMeet(a,b)`.
  - `flashMeet(a,b)`: tint both labels (e.g. `setColor('#ffe066')`) and a `this.time.delayedCall(400, ...)` back to white.
  - Dev hooks: `__dinoPositions`, `__meetings`, `__stepWorld` (calls `stepWorld()` ignoring the throttle — i.e. force a move+meet; implement by resetting `moveTicks` so `%5===0`, or factor the body into `forceStep()` that `__stepWorld` and the throttled tick both call).

## Reuse list
- `WorldClock.onTick` (cycle 1) for cadence — no new timer.
- `Dino` + its sprite/label — extend with `setPosition`.
- `nearestDino()` already reads live sprite positions — works unchanged as dinos move.
- `TILE/COLS/ROWS` for tile↔pixel math.

## New dependencies
none.

## Test plan
### Unit — `tests/unit/movement.test.ts`
- `wanderStep` at every corner/edge with each direction stays in `[0,cols)×[0,rows)`; never moves >1 on an axis.
- `wanderStep(stay)` returns same tile.
- `pairKey` symmetric; `recordMeet` increments + symmetric + ignores self.
### E2E — `tests/e2e/cycle-011-movement.spec.ts`
- record positions, call `__stepWorld()` ~20×, assert ≥1 dino moved and all positions in-bounds.
- `__meetings()` is an object; greeting still records a reply source after movement.
- prior suites green.

## Risks
- **Throttle vs force:** factor the step body so `__stepWorld()` forces it regardless of the `%5` throttle (tests shouldn't wait 5 real seconds).
- **Tile rounding:** compute tile as `Math.round((px - TILE/2)/TILE)`; spawns are tile-centered so this round-trips exactly.
- **Greet during motion:** `nearestDino` uses live positions — fine; the dino may have wandered out of the 2-tile range, which is correct behavior.
- **No persistence:** positions/meetings reset on reload — intentional, documented.

## Estimated touch count
6 files (2 new src, 2 modified src, 1 new unit, 1 new e2e). At the ceiling.

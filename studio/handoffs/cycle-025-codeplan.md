# Cycle 25 — Code plan — BACKLOG-059 Feeding hatch

**Goal:** a hatch in the bowl's lid — press **H**, food falls, the cast swarms it, first to reach eats. All decisions in a pure module; WorldScene does glue. Mirrors `world/startle.ts` (cycle 23).

## Files to create
- `game/src/world/feeding.ts` — pure, no Phaser, Node-tested. Exports:
  - `FEED_RANGE = 7` (tiles; beyond this a food drop goes unnoticed).
  - `FEED_GAIN = 5` (friendship points a fed dino gains — keeping reframed; sits between greet ≈ small and a "liked" gift = 6).
  - `type FeedReaction = 'rush' | 'ignore'`.
  - `reactionToFood(energy: number, distTiles: number): FeedReaction` — `ignore` if `distTiles > FEED_RANGE`; else `energy >= EAGER (0.4)` → `rush`, else `ignore`. (Parallel to `startle.reactionFor`.)
  - `feedStep(from: Tile, food: Tile, cols, rows): Tile` — one tile toward food; **reuses `stepToward`** from `movement.ts`.
  - `reachedFood(at: Tile, food: Tile): boolean` — same or adjacent tile (Chebyshev ≤ 1).
  - `foodLanding(cols, rows, col?: number, rand = Math.random): Tile` — landing tile; `tileX` = clamped `col` when given, else `floor(rand()*cols)`; `tileY = floor(rows * 0.45)` (upper-middle feeding zone). Injectable `rand` for deterministic tests.
- `tests/unit/feeding.test.ts`
- `tests/e2e/cycle-025-feeding.spec.ts`

## Files to modify
- `game/src/scenes/WorldScene.ts`:
  - Import `reactionToFood, feedStep, reachedFood, foodLanding, FEED_RANGE, FEED_GAIN, type FeedReaction` (FEED_RANGE/FeedReaction only if referenced) — actually import `reactionToFood, feedStep, reachedFood, foodLanding, FEED_GAIN`.
  - New fields: `private food: { tileX: number; tileY: number } | null = null;`, `private foodLanded = false;`, `private foodSprite: Phaser.GameObjects.Text | null = null;`.
  - `create()`: add `this.setupFeeding();` after `this.setupTap();`.
  - `setupFeeding()`: bind **H** key → `this.dropFood()`; attach dev hooks `__dropFood(col?)` (drops + sets `foodLanded=true` so tests skip the fall tween; returns the landing tile) and `__food()` (returns `{...this.food}` or null).
  - `dropFood(col?)`: no-op-return if `this.food` already set (one at a time); compute `foodLanding(COLS, ROWS, col)`; set `this.food`, `foodLanded=false`; spawn 🍖 Text at top-center-ish (x = landing px, y = `TILE*0.4`) depth 2; tween y → landing px over 600ms ease `Quad.easeIn`, `onComplete` sets `foodLanded=true`; `logEvent('🍖 food dropped from the hatch')`; return landing tile.
  - `forceStep()`: at the **top** of the per-dino loop, before the night/day/wander branch — if `this.food && this.foodLanded` and `reactionToFood(d.traits.energy, hypotTileDist(cur, food)) === 'rush'`, set next = `feedStep(cur, this.food, COLS, ROWS)` and skip the rest for that dino (`continue` after `setPosition`). After the existing meeting loop, call `this.checkFeeding()`.
  - `checkFeeding()`: if food landed, `const eater = this.dinos.find(d => reachedFood(this.tileOf(d), this.food!))`; if eater, `this.eatFood(eater)`.
  - `eatFood(d)`: destroy sprite, null out `food`/`foodSprite`/`foodLanded`; `this.friendship = bumpPoints(this.friendship, d.name, FEED_GAIN)`; `this.memory = remember(this.memory, d.name, 'you scrambled to the hatch and snapped up the food')`; flash 😋 over the dino (reuse the `flashStartle` pattern — small standalone `flashFeed`); `logEvent('🍖 ' + d.name + ' snapped up the food at the hatch')`; `this.refreshHeartsPanel()`; `void this.saveGame()`.
  - `addControlsHint()`: insert `H feed` into the hint string after `F give`.

## Reuse list (CHARTER demands reuse — audited)
- `stepToward` (`game/src/world/movement.ts`) — the rush step. Do NOT write new pathing.
- `bumpPoints` (`game/src/social/friendship.ts`) — apply FEED_GAIN. Same call shape as gifts/greets.
- `remember` (`game/src/ai/memory.ts`) — the feed memory (so it can gossip, exactly like the startle memory in cycle 23).
- `logEvent` / `eventLog` (already in WorldScene) — drop + eat post to the Park News ticker for free.
- `tileOf` (already in WorldScene) — pixel→tile, same as tap-the-glass uses.
- `Tile` type (`movement.ts`) — reused by feeding.ts, exactly as `startle.ts` does.
- Pattern source: `world/startle.ts` + `setupTap`/`tapGlass`/`flashStartle` in WorldScene — feeding is the symmetric "attract" to startle's "repel".

## New dependencies
none.

## Test plan
### Unit — `tests/unit/feeding.test.ts` (target ~7)
- `reactionToFood`: out-of-range (`FEED_RANGE+1`) → ignore for any energy; in range, `energy 0.9` → rush, `energy 0.1` → ignore (too calm); boundary `energy === 0.4` → rush.
- `feedStep`: steps one tile and the tile distance to food strictly decreases (e.g. from {2,2} toward {10,2} → {3,2}); reuses stepToward semantics (dominant axis).
- `reachedFood`: same tile → true; orthogonally/diagonally adjacent → true; two tiles away → false.
- `foodLanding`: explicit `col` is honored and clamped (`-3 → 0`, `999 → cols-1`); omitted `col` uses injected `rand` (e.g. `rand = () => 0.5` → tileX `floor(0.5*cols)`); `tileY === floor(rows*0.45)` always.

### E2E — `tests/e2e/cycle-025-feeding.spec.ts` (target 2)
- "dropped food gets swarmed and eaten, and feeds a dino": boot; read `__dinoPositions`, drop food at a dino's column via `__dropFood(col)`; assert `__food()` non-null immediately; loop `__stepWorld()` up to ~12 times until `__food()` === null; assert eaten, and that across `__hearts()`/`__memory()` **some** dino shows a 'scrambled'/'snapped up the food' memory; assert `__events()` contains a 🍖 drop line and a 🍖 eat line. No page errors.
- "a far/calm dino doesn't rush, and a second H while food is pending is ignored": boot; `__dropFood(0)` (corner column); assert second `__dropFood(0)` returns the same tile / `__food()` still one piece (count via a single non-null); assert `reactionToFood` ignore path indirectly: a dino across the bowl from column 0 keeps wandering (its distance to food does not monotonically shrink to 0 within 1 step) — kept simple: assert at least one dino's tile is still > 1 from the food after a single step (someone didn't teleport). Primary assertion: the dedupe (one piece at a time).

## Risks
- **Timing seam:** the fall is a real-time tween but the swarm runs on world-clock ticks (`__stepWorld`/onTick). The `__dropFood` hook sets `foodLanded=true` immediately so e2e is deterministic without waiting on the tween; the real **H** press uses the tween. Single code path for the swarm/eat (forceStep), only the landing flag differs.
- **Eat-before-step:** if food lands on/adjacent to a dino, `checkFeeding` eats it on the first `forceStep` — fine and intended; the e2e loops a few steps so it's robust regardless.
- Food is intentionally **not** persisted (ephemeral event) → save format unchanged, no migration, old saves load untouched. Additive-only honored trivially.
- web-llm boundary untouched (no `ai/` imports added in feeding.ts).

## Estimated touch count
~4 files (1 new module + 1 WorldScene + 2 test files). Under the 6-file split threshold.

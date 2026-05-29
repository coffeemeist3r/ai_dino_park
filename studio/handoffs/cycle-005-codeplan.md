# Cycle 5 — Code-plan

## Item
BACKLOG-017 [core] Spawn 5 NPCs with distinct species + names + personalities.

## Files to create
- `game/src/entities/roster.ts` — pure data, no Phaser.
  - `export interface DinoSpawn { name: string; species: string; personality: string; color: number; tileX: number; tileY: number }`
  - `export const ROSTER: ReadonlyArray<DinoSpawn>` — 5 entries, Rex first (anchor), spread across the map.
- `tests/unit/roster.test.ts` — roster invariants.
- `tests/e2e/cycle-005-roster.spec.ts` — count + names + greet regression.

## Files to modify
- `game/src/entities/dino.ts`
  - `DinoConfig` gains `color?: number`; sprite uses `cfg.color ?? 0x8a4a3a` (current default = Rex's brown).
- `game/src/scenes/WorldScene.ts`
  - Replace the single hardcoded `this.dinos.push(new Dino(...Rex...))` with a loop over `ROSTER`, mapping `tileX/tileY` → pixel center (`tile*TILE + TILE/2`) and passing `name/species/personality/color/brain`. Rex is `ROSTER[0]` so `dinos[0]` stays Rex.
  - Dev hooks: `window.__dinoCount = () => this.dinos.length`; `window.__dinoNames = () => this.dinos.map(d => d.name)`.

## Reuse list
- `Dino` class + its name-seeded `traits` (cycle 4) — reuse as-is; roster supplies only name/species/position/color, no personality re-implementation.
- `makeBrain('stub')` — reuse per dino (each gets its own stub instance, same as Rex did).
- `TILE`/`COLS`/`ROWS` constants already in `WorldScene` for the tile→pixel math.
- `nearestDino()` already iterates `this.dinos` — works unchanged for 5.
- `__clockNow` dev-hook pattern — mirror for `__dinoCount`/`__dinoNames`.

## New dependencies
none.

## Test plan
### Unit (vitest) — `tests/unit/roster.test.ts`
- `ROSTER.length === 5`; names all distinct; species all distinct.
- All spawn tiles distinct, in-bounds (0 ≤ tileX < 20, 0 ≤ tileY < 15), none equals (3,3) player start.
- `ROSTER[0].name === 'Rex'` (anchor).
- `seededPersonality` over the 5 names: every pair differs on ≥1 axis (import from `ai/personality`).
### E2E (playwright) — `tests/e2e/cycle-005-roster.spec.ts`
- boot → `__dinoCount()` === 5.
- `__dinoNames()` has length 5 and 5 unique values.
- `__dinoTraits()` (dinos[0]) still returns a 5-axis object (Rex anchor intact).
- regression: walk + press Z near a dino, `__clockNow` still live (dialog flow didn't throw).
- cycle-2/3/4 suites stay green.

## Risks
- **Rex anchoring:** the cycle-3 save tests and cycle-4 `__dinoTraits` assume `dinos[0]` is Rex. Keep Rex at `ROSTER[0]`. Covered by the unit anchor test + e2e traits check.
- **Overlap / out-of-bounds spawns:** hand-pick tiles, assert distinct + in-bounds in unit so a future roster edit can't silently stack two dinos or push one off-map.
- **Color is not art:** per-dino `color` is a rectangle fill for distinction only; it does not pre-empt the Artist's sprite items (033–036). Noted so the Validator doesn't read it as scope creep.

## Estimated touch count
5 files (1 new src, 2 modified src, 1 new unit, 1 new e2e). Under the ceiling.

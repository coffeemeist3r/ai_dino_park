# Cycle 103 — Code Plan

Both tracks. Reuse-first; logic in pure modules, thin Phaser glue.

## Lore track — BACKLOG-373 (shared meal)

**Files**
1. `game/src/world/feeding.ts` — add:
   - `export const SHARED_MEAL_MS = 4000;`
   - `export const SHARED_MEAL_BOND = 3;`
   - `export function sharedMeal(prev, name, at, windowMs = SHARED_MEAL_MS): boolean` — `!!prev && prev.name !== name && at - prev.at <= windowMs`
2. `game/src/world/feeding.test.ts` — **new** file (feeding.ts had no test): pair / self / stale / null-prev.
3. `game/src/scenes/WorldScene.ts`:
   - field `private lastMeal: { name: string; at: number } | null = null;`
   - in `eatFood(d)` (near the top, before the meal is consumed is fine — order-independent): compute
     `const now = Date.now();` then
     ```
     if (sharedMeal(this.lastMeal, d.name, now)) {
       const other = this.lastMeal!.name;
       this.bonds = strengthen(this.bonds, other, d.name, SHARED_MEAL_BOND);
       this.memory = remember(this.memory, d.name, `you ate alongside ${other}`);
       this.memory = remember(this.memory, other, `you ate alongside ${d.name}`);
       this.flashFeed(d, '🍽');
       this.logEvent(`🍽 ${other} and ${d.name} ate together`);
     }
     this.lastMeal = { name: d.name, at: now };
     ```
     Place this block just before the existing `this.refreshHeartsPanel(); void this.saveGame();` tail so the
     bond change is saved.
   - debug hook in the `__`-setup block: `(window as any).__lastMeal = () => this.lastMeal;`

**Reuse:** `strengthen` (social/bonds), `remember` (ai/memory), `flashFeed`, `logEvent` — all already imported/used in WorldScene. `Date.now()` window idiom matches `liftedUntil`.

## Structure track — BACKLOG-446 (a zone banks its harvest)

**Files**
1. `game/src/world/foodstore.ts` — **new** pure module:
   - `import { FOODS } from './foods';`
   - `export type FoodPile = Partial<Record<string, number>>;`
   - `export const FOOD_STOCKPILE_CAP = 6;`
   - `foodAtCap(pile, id)`, `bankFood(pile, id)` (clamped, non-mutating — mirror `resource.ts` `atCap`/`bankResource`), `foodPileTotal(pile)`, `foodPileLine(pile)` (FOODS-order glyph readout, `''` empty).
2. `game/src/world/foodstore.test.ts` — **new**: bank increments; cap stalls; non-mutation; line format + empty.
3. `game/src/scenes/WorldScene.ts`:
   - import `{ FoodPile, bankFood, foodPileLine }` from `../world/foodstore` (foodPileLine used only if the lens computes in-scene — but lens owns it, so import just `bankFood`, `FoodPile`).
   - field `private foodPileByZone: Record<string, FoodPile> = {};` + `private foodStoreFor(zone: string): FoodPile { return (this.foodPileByZone[zone] ??= {}); }`
   - in `harvest(zone)` after the `harvestedByZone` bump: `this.foodPileByZone[zone] = bankFood(this.foodStoreFor(zone), crop.food);`
   - `__zoneFoodPile` debug hook near `__zoneStockpile` (line ~862): `(window as any).__zoneFoodPile = (z: string) => ({ ...this.foodStoreFor(z) });`
   - save payload (line ~4563 area): add `foodPileByZone: this.foodPileByZone,`
   - restore (line ~4627 area): add `this.foodPileByZone = (save.foodPileByZone as Record<string, FoodPile>) ?? {};`
   - `zoneMapEntries()` (line ~2162): pass `this.foodPileByZone` as the new 6th arg to `zoneMapModel`.
   - `drawZoneMap()` (line ~2203): append `if (e.banked) txt += \`\n${e.banked}\`;` after the want line; bump `boxH` 78 → 92.
4. `game/src/ui/lenses.ts`:
   - import `{ FoodPile, foodPileLine }` from `../world/foodstore`
   - `ZoneMapEntry` gains `banked: string;`
   - `zoneMapModel(chain, populations, keeperZone, tiers = {}, harvests = {}, foodPiles: Record<string, FoodPile> = {})` — set `banked: foodPileLine(foodPiles[id] ?? {})`
5. `game/src/ui/lenses.test.ts` — extend a zoneMapModel case to assert `banked`.
6. `game/src/world/saveGame.ts` — add to `SaveData`: `foodPileByZone?: Record<string, Record<string, number>>;` (additive-optional, near `stockpileByZone`).

**Reuse:** `resource.ts` shape (atCap/bankResource/stockpileLine) is the exact template for foodstore. `FOODS` for glyphs. Save is additive-optional per the existing `stockpileByZone` pattern; no migration step needed (fields are additive → v2 stays).

## Test plan
- Unit: `feeding.test.ts` (sharedMeal), `foodstore.test.ts` (bank/cap/line). Existing suites unaffected; `lenses.test.ts` extended for `banked`.
- Build: `npm run build` (tsc). Unit: `npx vitest run`. E2E: `npx --yes kill-port 5173 && npx playwright test`.
  - New e2e (or extend an existing feeding/lens spec): (a) two `__`-driven feeds within the window → `__lastMeal` + a bond/ticker assertion; (b) `__harvestPlot` a ripe plot → `__zoneFoodPile(zone)` shows 1, and the map lens shows the banked glyph.

## Boundary / safety
- `@mlc-ai/web-llm` untouched. Save additive-only (old saves load, `foodPileByZone` → `{}`). No leftover red.

phase → coder-pending.

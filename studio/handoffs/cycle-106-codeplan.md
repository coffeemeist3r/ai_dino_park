# Cycle 106 — Code Plan

One code seam (`crossDino`) + one pure module (`foodstore.ts`) + specs. No save-shape change (the
`foodPileByZone` persistence is already live from 446).

## Files

**`game/src/world/foodstore.ts`** (add ~3 pure helpers, reuse `FOODS`, `foodAtCap`):
- `pickFoodCarry(src: FoodPile, dest: FoodPile, wantId?: string): string | null` — 447. Directed branch
  (wantId banked in src, not at cap in dest, `dest<src`), else most-stocked src id with `dest<src` &
  `!foodAtCap(dest,id)`, FOODS-order stable sort; else null.
- `courierMemory(zoneName: string, foodEmoji: string): string` — 451, twin of `storesFedMemory`.
- `courierLine(): string` → `'📦'` — 451 pride bubble.

**`game/src/world/foodstore.test.ts`** (extend): specs for `pickFoodCarry` (directed pick / glut→lighter
fallback / null cases / no-mutation / determinism) and `courierMemory`/`courierLine`.

**`game/src/scenes/WorldScene.ts`** (`crossDino`, after the resource-carry `if (carried.length)` block):
- Add `zoneWant` to the existing `../ui/lenses` import.
- Compute `wantId = zoneWant(dest, this.harvestedByZone)?.food`.
- `const foodCarry = pickFoodCarry(this.foodStoreFor(home), this.foodStoreFor(dest), wantId)`.
- If non-null: `takeFood`/`bankFood` the two piles; `const emoji = FOODS.find(f => f.id === foodCarry)?.emoji ?? ''`;
  `logEvent(\`${emoji} ${d.name} carried food to ${zoneById(dest).name}\`)`; **451:** `remember(... courierMemory(zoneById(dest).name, emoji))` + `showBubble(d, courierLine())`.
- `takeFood`/`bankFood` already imported (line 85); `pickFoodCarry`/`courierMemory`/`courierLine` add to that import.
- `refreshPlaque()` + `saveGame()` already fire at the end of `crossDino` — no extra persistence code.

**`tests/e2e/cycle-106-food-flow.spec.ts`** (new): boot; `__setZoneFoodPile('bowl', {berries:3})` &
`__setZoneFoodPile('grove', {})`; `__startMigration('Rex')`; step until crossed; assert
`__zoneFoodPile('bowl').berries === 2`, `__zoneFoodPile('grove').berries === 1`; assert a 📦/🍓 ticker line
(`__events()` or the ticker hook) names the carry (451 pride beat proxy). Second case: bowl empty → no move.

## Reuse (no new util)
- Resource-carry structure (`pickCarry`/`pressuredCarry` in resource.ts) is the exact template for `pickFoodCarry`.
- `foodAtCap`, `takeFood`, `bankFood`, `FOODS` — all already exist in foodstore.ts.
- `zoneWant` (ui/lenses.ts, 438) — the demand read, reused as the carry aim.
- `remember`, `showBubble`, `logEvent`, `zoneById` — all already used inside `crossDino`.
- The grove-arrival beat (339) in `crossDino` is the pattern for the 451 memory+bubble.

## Test plan
- `npm run build` clean.
- `npx vitest run` — foodstore specs green.
- `npx --yes kill-port 5173 && npx playwright test` — new food-flow spec green; full suite green (lone
  parallel-load flake re-run isolated, per routine 0).

## Blockers
None anticipated. Only risk: `zoneWant` needs `harvestedByZone` populated to give a directed pick, but the
fallback branch moves food with zero harvest history, so the e2e needs no harvest setup.

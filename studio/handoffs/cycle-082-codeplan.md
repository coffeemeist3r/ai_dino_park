# Cycle 82 — Code Plan

## Lore track — BACKLOG-374 (comfort food)

**Files**
- `game/src/world/loner.ts` — add `COMFORT_FOOD_GLYPH`, `comfortsLoner`, `comfortFoodMemory`, `comfortFoodLine`.
- `game/src/scenes/WorldScene.ts` — in `eatFood` (~889), after the existing memory/flash, file the comfort
  beat; import the new symbols; add `__lastComfortFood` dev hook + a `lastComfortFood` transient field.
- `game/test/loner.test.ts` (existing) — add comfort-food unit cases.
- `game/e2e/cycle-082-comfort-food.spec.ts` (new) — drive an all-unbonded bowl, drop the loner's favorite, assert the memory + 😌.

**Reuse (no new prior art):** `isLoner`/`LONER_FLOOR` (loner.ts), `foodReaction`/`favoriteFood` (foods.ts),
`remember` (memory), `showBubble` + `flashFeed` (WorldScene), `this.dinoNames()`, `this.bonds`.

**Test plan (unit):** `comfortsLoner(fav, loner)` truth table — only `true && true` → true. `comfortFoodMemory`
contains the food label + is distinct from the plain favorite memory string. `comfortFoodLine` = `"<name> 😌"`.

**Test plan (e2e):** force all bonds to 0 (loner), set `__loadFood`/drop the dino's favorite via the existing
food hooks, step until eaten, assert `__lastComfortFood` = `{name, food}` and the dino's memory includes the
comfort line; a control non-favorite drop leaves `__lastComfortFood` null.

## Structure track — BACKLOG-357 (both-zone stores readout)

**Files**
- `game/src/ui/plaque.ts` — add `zoneStoresLine(stores, activeZoneId)` (mirrors `zoneTallyLine`).
- `game/src/scenes/WorldScene.ts` — both plaque-stats sites (~516, ~546): build the per-zone `stores` map
  (`stockpileLine(this.pileFor(BOWL_ID/GROVE_ID))`) and pass `stockpile: zoneStoresLine(stores, this.zoneId)`.
  Import `GROVE_ID` (already imported), `BOWL_ID` (imported), `zoneStoresLine`.
- `game/test/plaque.test.ts` (existing) — add `zoneStoresLine` cases.
- `game/e2e/cycle-082-both-stores.spec.ts` (new) — bank into both zones, assert the plaque shows both + ▸.

**Reuse:** `ZONES` (zones.ts, already imported in plaque.ts), `stockpileLine` (resource.ts), `pileFor`,
`__zoneStockpile`/`__stockpile` hooks, the existing plaque text node.

**Test plan (unit):** both-full → `▸Bowl <glyphs> · Grove <glyphs>` (▸ on active); one-empty → only the
non-empty zone shown; both-empty → `''`; ▸ follows `activeZoneId`.

**Test plan (e2e):** use `__bankResource`/gather hooks (or `__zoneStockpile`) to stock both zones, read the
plaque text, assert it contains both zone names + their glyph counts and the ▸ sits on the active zone.

## Notes
- No `SAVE_VERSION` bump, no new save fields either track.
- web-llm boundary untouched (no `ai/` edits).
- Disjoint: loner.ts/eatFood vs plaque.ts/plaque-stats builder.

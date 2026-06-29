# Cycle 85 — Code Plan

Both tracks share `WorldScene.ts` but touch disjoint methods (`checkFeeding` vs migration/`drawFloor`/`zoneStores`).
**Risks** flags the one cross-file test (`cycle-084-zone-adjacency.test.ts`) the structure track legitimately updates.

---

## Lore track — BACKLOG-390 Standing up to the gobbler

### Item
A bold winner (high bravery) shouldered at by a gobbler (387) holds its ground; the gobbler backs down (😠).

### Files to create
- `tests/e2e/cycle-085-stand-up.spec.ts`

### Files to modify
- `game/src/world/feeding.ts` — add `export const STAND_BRAVERY = 0.65;` + pure `export function standsGround(winnerBravery: number): boolean { return winnerBravery >= STAND_BRAVERY; }`. Doc it as the third pole of the contested-drop trio (yield 375 / gobble 387 / stand 390). **Do not touch** `gobblesFood`/`gobblerAmong`/`yieldFoodTo`.
- `game/src/scenes/WorldScene.ts`:
  - import `standsGround` from `../world/feeding`.
  - add field `private lastStand: { winner: string; gobbler: string } | null = null;` (mirror `lastGobble`).
  - `checkFeeding()` no-yield branch (after `gobblerName` is found, before `eatFood(gobbler)`): if `gobblerName && standsGround(eater.traits.bravery)` → the **winner holds**: `this.lastStand = { winner: eater.name, gobbler: gobblerName }; this.lastGobble = null;` file `remember(this.memory, eater.name, \`you stood your ground and kept your food from ${gobblerName}\`)`; `this.flashFeed(eater, '😠'); this.logEvent(\`😠 ${eater.name} held its ground against ${gobblerName}\`); this.eatFood(eater); return;`. Else fall through to the existing gobble path (set `this.lastStand = null` on the non-stand branches, including the plain-eat else).
  - in `setupFeeding` (or wherever `__gobbleFood` is registered) add `(window as any).__standFood = () => this.lastStand;` mirroring `__gobbleFood`.

### Reuse list
- `gobblerAmong` / `gobblesFood` / `yieldFoodTo` — `game/src/world/feeding.ts` (consumed unchanged).
- `remember` — memory store; `flashFeed`, `logEvent`, `eatFood`, the swarm `candidates` array — all already in `checkFeeding`.
- `d.traits.bravery` — `game/src/ai/personality.ts` axis (0 timid .. 1 bold), already used by startle (`reactionFor`) / firstContact.
- e2e hooks `__setTrait`, `__placeDino`, `__gobbleFood`, `__feedYield`, `__forceDrop`/`H` — reuse from the cycle-083/084 feeding specs (don't invent new control hooks beyond `__standFood`).

### New dependencies
none.

### Test plan
- **Unit** (`tests/unit/feeding.test.ts`, append a `describe('standsGround (BACKLOG-390)')`): true at/above `STAND_BRAVERY`, false below, boundary at exactly `STAND_BRAVERY` (≥ → true). Assert `gobblesFood`/`gobblerAmong` outputs unchanged for a sample (guard against accidental edits).
- **E2E** (`tests/e2e/cycle-085-stand-up.spec.ts`): place a **bold** winner (bravery ≥ 0.65) on the food tile + a **hungry prickly** dino (hunger ≥ 0.5, agreeableness ≤ 0.35, hungrier by ≥ 0.25) in the swarm, drop food → assert `__standFood()` names the pair, the winner survived as eater (population/`__gobbleFood()` is null), 😠 path. Second case: a **timid** winner (bravery < 0.65) in the same setup → `__gobbleFood()` fires, `__standFood()` null (387 byte-identical).

### Risks
- The cycle-084 gobble e2e expects the winner to be **gobbled**. If that spec's winner has bravery ≥ `STAND_BRAVERY` it would now stand instead and the spec flips. **Mitigation:** `STAND_BRAVERY = 0.65` is high, and the cycle-084 spec pins traits via `__setTrait`; the Coder must confirm cycle-084-gobble's winner is timid (or set its bravery low in-fire, a 1-line isolation exactly like cycle 84 did to 375). Verify before commit.
- `standsGround` only ever *removes* a gobble (winner keeps its own food) — it can't create one — so it cannot disturb the 375 yield path (evaluated earlier and `return`s).

### Estimated touch count
~4 files (feeding.ts, WorldScene.ts, feeding.test.ts, new e2e) — within one track's budget.

---

## Structure track — BACKLOG-378 Third zone spine

### Item
The Fernreach: a third zone east of the grove; migration / occupancy / tally generalize past two.

### Files to create
- `tests/unit/cycle-085-third-zone.test.ts`
- `tests/e2e/cycle-085-third-zone.spec.ts`

### Files to modify
- `game/src/world/zones.ts`:
  - `export const FERNREACH_ID = 'fernreach';` + `ZONES` gains `{ id: FERNREACH_ID, name: 'The Fernreach' }`.
  - `ZONE_LINKS` **appends** (after the existing two rows, so `linkEdge(GROVE_ID)` / `otherZone(GROVE_ID)` keep returning the grove→bowl 'west'/bowl): `{ from: GROVE_ID, edge: 'east', to: FERNREACH_ID }`, `{ from: FERNREACH_ID, edge: 'west', to: GROVE_ID }`.
  - add `export function zoneNeighbors(zoneId: string): ZoneLink[] { return ZONE_LINKS.filter((l) => l.from === zoneId); }`.
  - `migrationStepTarget(homeZone, row, cols, edge: Edge = linkEdge(homeZone) ?? 'east')`, `atMigrationEdge(homeZone, tile, cols, edge = linkEdge(homeZone) ?? 'east')`, `crossEntryTile(homeZone, row, cols, edge = linkEdge(homeZone) ?? 'east')` — body keys on `edge`, not `linkEdge(homeZone)`. Default preserves the single-edge behavior byte-for-byte (existing call sites/tests unchanged).
  - terrain tint: `export const FERNREACH_TINT = 0xd9c98c;` (warm sunlit, vs grove's cool `GROVE_TINT 0x9fc0b8`) + `export function zoneTint(zoneId: string): number { return zoneId === GROVE_ID ? GROVE_TINT : zoneId === FERNREACH_ID ? FERNREACH_TINT : 0xffffff; }`.
- `game/src/scenes/WorldScene.ts`:
  - imports: `FERNREACH_ID`, `zoneNeighbors`, `zoneTint`, type `Edge` from `../world/zones`.
  - field `private migrationCross: Record<string, { dest: string; edge: Edge }> = {};` (companion to the `migrating` Set).
  - `startMigration(d, dest = otherZone(home))`: compute `home = zoneOf(...)`, look up the edge to `dest` via `zoneNeighbors(home).find(l => l.to === dest)?.edge` (fallback `linkEdge(home)`), store `this.migrationCross[d.name] = { dest, edge }`, then `this.migrating.add(d.name)`. **Default dest = `otherZone(home)`** so `__startMigration` and any existing caller stay byte-identical (grove→bowl); the *ambient* roll passes a random neighbour.
  - `maybeMigrate()`: after `pickMigrant()`, choose `dest` = a random element of `zoneNeighbors(home).map(l => l.to)` (single-neighbour zones → the only one; grove → bowl|fernreach), call `startMigration(d, dest)` — the emergent 3-zone spread.
  - forceStep migration branch (~2045): `const cross = this.migrationCross[d.name];` use `atMigrationEdge(home, cur, COLS, cross.edge)` + `migrationStepTarget(home, cur.tileY, COLS, cross.edge)`.
  - `crossDino(d)` (~3137): `const cross = this.migrationCross[d.name]; const dest = cross.dest;` use `crossEntryTile(home, row, COLS, cross.edge)`; `delete this.migrationCross[d.name];`; generalize the log line to `crossed into ${zoneById(dest).name}` (drop the bowl/grove ternary). Carry block unchanged (already `pileFor(dest)` + `structureRecipe(dest)`, both lazy/defaulting for a new zone).
  - `drawFloor()` (~4099): replace the `inGrove` tint ternary with `const tint = zoneTint(this.zoneId);` `this.floorImage.setTint(tint)`. Terrain: keep `bakeTerrainMap(groveTileAt)` for the grove, `bakeTileMap('grass')` for bowl **and** fernreach (spine = plain grass under the warm tint).
  - `zoneStores()` (~572): build the stores map over **all** `ZONES` ids (`Object.fromEntries(ZONES.map(z => [z.id, stockpileLine(this.pileFor(z.id))]))`) so a third zone's pile can show. `zoneStoresLine` already iterates `ZONES` + omits empties — no plaque change.
  - hooks (`setupMigration`, ~3087): keep `__startMigration(name)` (now byte-identical via the default dest); add `(window as any).__startMigrationTo = (name, dest) => { const d = this.dinoByName(name); if (d) this.startMigration(d, dest); return zoneOf(this.dinoZones, name, BOWL_ID); };` for the deterministic grove→fernreach e2e.
- `tests/unit/cycle-084-zone-adjacency.test.ts` — **update three now-false assertions** (the table genuinely grew): the `ZONE_LINKS` `toEqual` (now 4 rows), `neighborThrough(GROVE_ID,'east')` (was null → `FERNREACH_ID`), `linkedZone(GROVE_ID,'east',...)` (was null → the fernreach entry). **Leave every bowl↔grove byte-identity assertion (migration columns, linkEdge, otherZone) unchanged** — that's the guardrail.

### Reuse list
- `ZONE_LINKS` / `neighborThrough` / `linkEdge` / `linkedZone` / `otherZone` / `crossing` — `game/src/world/zones.ts` (the 383 adjacency table; extend by row + optional-edge param, do not rewrite).
- `zonePopulations` / `zoneTallyLine` (plaque) — already iterate `ZONES`; a third `ZONES` entry makes the tally 3-wide for free.
- `zoneStoresLine` (plaque) — already iterates `ZONES`; just feed it all zone ids.
- `pileFor` (lazy `??= {}`), `occupiedZones`, `directedCarry`/`structureRecipe`/`takeResource`/`bankResource` — all generalize to a new zone id unchanged.
- `bakeTileMap('grass')` / `bakeTerrainMap` — existing floor bake path.

### New dependencies
none.

### Test plan
- **Unit** (`tests/unit/cycle-085-third-zone.test.ts`): `ZONES` has the fernreach entry; `zoneNeighbors(GROVE_ID)` = both links (bowl west, fernreach east); `neighborThrough(GROVE_ID,'east')`=fernreach, `(FERNREACH_ID,'west')`=grove; the optional-edge generalization — `migrationStepTarget(GROVE_ID, r, cols, 'east')` = east column (`cols-1`), `crossEntryTile(GROVE_ID, r, cols, 'east')` = `{tileX:1}` (enters fernreach's west side), and **omitting** the edge still gives the grove→bowl west column (back-compat); `zoneTint(FERNREACH_ID)` ≠ `zoneTint(BOWL_ID)` and ≠ `GROVE_TINT`.
- **E2E** (`tests/e2e/cycle-085-third-zone.spec.ts`): (1) keeper crossing — from the grove, walk off the east edge → active zone is The Fernreach; walk west → back to the grove (drive via the existing keeper-move/`__zone` hooks used by cycle-073-crossing). (2) migration generalization — `__setZone(dino, 'grove')`, `__startMigrationTo(dino, 'fernreach')`, pump `forceStep` until `__migrating()` clears → the dino's `__dinoZone`/`zoneOf` is `fernreach` and it's at the west entry. (3) tally — `__plaque`/zone-tally readout shows three zones.

### Risks
- **Random neighbour for the ambient roll** must NOT leak into the existing crossing/carry specs: those drive `__startMigration`/`__migrate`, which keep the deterministic default dest (`otherZone(home)` → grove→bowl). Only `maybeMigrate` (cooldown-gated, not used by those specs) picks randomly. Confirm cycle-073-crossing / cycle-077-carry / cycle-081-directed-carry stay green.
- `cycle-073-migration-crossing.test.ts` / `cycle-059-zones.test.ts` must stay **unmodified** — they call the migration helpers with no edge arg (back-compat default). Verify (grep) they don't assert `ZONE_LINKS`/grove-east-null (only cycle-084 does).
- `linkEdge(GROVE_ID)` must keep returning `'west'` → append the fernreach rows **after** the grove→bowl row (first-match wins).

### Estimated touch count
~5 files (zones.ts, WorldScene.ts, cycle-084 test update, 2 new tests) — within one track's budget. Combined-cycle distinct files ≈ 8 (WorldScene + feeding shared).

---

## Shipped (Coder)

### Lore track — BACKLOG-390
**Files touched:** `game/src/world/feeding.ts` (+`STAND_BRAVERY`, +`standsGround`), `game/src/scenes/WorldScene.ts` (import; `lastStand` field; `checkFeeding` no-yield branch — bold winner holds → 😠 + "stood your ground" memory + `eatFood(winner)`, gobbler denied; `lastStand` reset on the yield + non-stand branches; `__standFood` hook), `tests/unit/feeding.test.ts` (+`standsGround` describe, 2 tests), `tests/e2e/cycle-085-stand-up.spec.ts` (new, 2 tests), `tests/e2e/cycle-084-gobble.spec.ts` (1-line isolation: winner bravery 0.1 so 387 stays the gobble path).
**Deviations:** none.

### Structure track — BACKLOG-378
**Files touched:** `game/src/world/zones.ts` (+`FERNREACH_ID`/ZONES entry; +2 `ZONE_LINKS` rows appended; +`zoneNeighbors`; optional `edge?` param on `migrationStepTarget`/`atMigrationEdge`/`crossEntryTile` defaulting to `linkEdge(home)`; +`FERNREACH_TINT`/`zoneTint`), `game/src/scenes/WorldScene.ts` (imports incl. `ZONES`/`Edge`/`zoneNeighbors`/`zoneTint`; `migrationCross` companion record; `startMigration(d, dest?)` fixes dest+edge; `maybeMigrate` picks a random neighbour; forceStep + `crossDino` read the chosen edge/dest; `crossDino` log generalized; `drawFloor` tint via `zoneTint`; `zoneStores` over all `ZONES`; `__startMigrationTo` hook), `tests/unit/cycle-085-third-zone.test.ts` (new, 9 tests), `tests/e2e/cycle-085-third-zone.spec.ts` (new, 3 tests).
**In-fire spec updates (the table genuinely grew a third zone):** `tests/unit/cycle-084-zone-adjacency.test.ts` (ZONE_LINKS now 4 rows; grove-east → Fernreach; bowl↔grove byte-identity assertions untouched), `tests/unit/cycle-059-zones.test.ts` (dropped the now-false "grove-east is unlinked" assertion), `tests/unit/plaque.test.ts` (zone tally now lists all three zones).
**Deviations:** none. Migrating stayed a `Set` + a companion `migrationCross` record (no Set→Map churn), so `__migrating`/`__startMigration` hooks are byte-identical and the existing crossing/carry specs needed no edit.

### Status (combined, both tracks)
- `npm run build` (game): **clean** (type-check passed).
- `npm run test:unit`: **883 passed / 883** (+9 net new).
- `npx playwright test` (full): **269 / 270**; the lone failure was `cycle-037-keeper` (observer-persists-across-reload) — the catalogued parallel-load flake, **green 4/4 isolated**, untouched by this diff (keeper persistence, not zones/feeding).
- `@mlc-ai/web-llm` boundary: **clean** (only under `game/src/ai/`).
- Save schema: **no change** either track (no `SAVE_VERSION` bump; `dinoZones` already persisted any zone id additively).

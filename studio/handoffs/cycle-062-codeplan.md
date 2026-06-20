# Cycle 62 — Code Plan

## Lore track — BACKLOG-278: Earned the nickname

**Item:** A maxed-out (10-heart) dino names the keeper by nickname; 8–9 hearts keeps the designation.

**Files to create:** none.

**Files to modify:**
- `game/src/keeper/keepers.ts`
  - Add `NICKNAME_MIN = 10` (hearts) constant.
  - Add `nicknameOf(keeper)` — the quoted part of `'AETHER-1 "Aki"'` → `'Aki'`; no quoted part → `designationOf(keeper)` (back-compat/safety).
  - Add `keeperAddress(keeper, hearts)` — `hearts >= NICKNAME_MIN ? nicknameOf(keeper) : designationOf(keeper)`.
- `game/src/scenes/WorldScene.ts`
  - Import `keeperAddress` (drop unused-import churn — keep `designationOf` only if still used elsewhere; it's used only at the two greet sites, so replace the import).
  - Greet site 1 (`__greetPrompt`, ~line 1714): `keeperName: keeperAddress(keeperById(this.keeperId), heartsFromPoints(this.friendship[d.name] ?? 0))`.
  - Greet site 2 (`pickTone`/the real greet, ~line 2234): same swap, using the `affection` hearts already computed there.

**Reuse list:** `designationOf` (keepers.ts) — `nicknameOf` is its sibling; `heartsFromPoints` (social/friendship) — already imported in WorldScene and used at both greet sites. `fondGreeting` (ai/brain.ts) — unchanged, renders the handed string.

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/cycle-062-nickname.test.ts`:
  - `nicknameOf` → `Aki`/`Vix`/`Lux` for the three keepers.
  - `nicknameOf` on a synthetic no-quote keeper → equals `designationOf`.
  - `keeperAddress` at hearts 10 → nickname; at 8 and 9 → designation.
- E2E `tests/e2e/cycle-062-nickname.spec.ts`:
  - Max a dino's hearts (`__setHearts`/`__bumpGreet` or existing hook), greet, assert the fond bubble contains `Aki` and not `AETHER-1`.
  - A dino at 8 hearts → bubble contains `AETHER-1` (cycle-61 preserved). *(Use whatever hearts-setting hook the cycle-60/61 specs use — check `tests/e2e/cycle-061-*`/`cycle-060-*`.)*

**Risks:** the two greet sites must both swap or the address is inconsistent. `designationOf` import may go unused → remove to keep build clean (strict). Confirm a hook exists to set hearts to exactly 10 for the e2e (else add `__setHearts` dev hook).

**Estimated touch count:** ~4 files (2 src, 2 test).

## Structure track — BACKLOG-146: Resource gathering spine

**Item:** A raw resource spawns; a curious dino walks to it and picks it up (per-dino tally, persisted).

**Files to create:**
- `game/src/world/resource.ts` (pure, no Phaser):
  - `export type ResourceKind = 'branch' | 'stone';`
  - `export const RESOURCE_GLYPH: Record<ResourceKind, string> = { branch: '🪵', stone: '🪨' };`
  - `export const RESOURCE_RANGE = 6;` (tiles — notice radius)
  - `const CURIOUS = 0.35;` (curiosity bar to bother fetching)
  - `export function noticeResource(curiosity, distTiles): 'fetch' | 'ignore'` — `distTiles > RESOURCE_RANGE` → ignore; else `curiosity >= CURIOUS ? 'fetch' : 'ignore'`.
  - `export function resourceLanding(cols, rows, rand = Math.random): Tile` — in-bounds, off the rim (mirror `foodLanding` clamps; x in `[1, cols-2]`, y in `[1, rows-2]`).
  - `export const RESOURCE_SPAWN_CHANCE = 0.05;` + `export function rollResource(rand = Math.random): boolean` — `rand() < RESOURCE_SPAWN_CHANCE`.
  - `export function pickKind(rand = Math.random): ResourceKind` — branch/stone 50/50.
  - Reuse `reachedFood` (rename-agnostic Chebyshev≤1) + `stepToward` from `world/movement` — import and re-export `reachedFood` as `reachedResource` OR just call `reachedFood` directly in WorldScene (cite reuse; do NOT reimplement).

**Files to modify:**
- `game/src/world/saveGame.ts`
  - `SaveData`: add `gathered?: Record<string, number>;` (additive; absent → {}).
  - `deserialize`: validate-or-default `gathered` exactly like `friendship` (name→number); include in the returned object.
- `game/src/scenes/WorldScene.ts`
  - Fields: `private resource: { kind: ResourceKind; tile: Tile } | null = null; private resourceSprite: Phaser.GameObjects.Text | null = null; private gathered: Record<string, number> = {};`
  - `maybeSpawnResource()` — if `!this.resource` and `rollResource()`, set `this.resource` via `resourceLanding(COLS, ROWS)` + `pickKind()`, draw the glyph sprite (mirror `foodSprite`, depth ~2).
  - `checkGather()` — the first dino with `reachedFood(tileOf(d), this.resource.tile)` picks it up: `this.gathered[d.name] = (this.gathered[d.name] ?? 0) + 1`, destroy sprite, `this.resource = null`, flash the glyph bubble (reuse `flashFeed(d, glyph)`), `logEvent`, `void this.saveGame()`.
  - In `forceStep` wander loop, **after** the food block (~line 1308) and before the huddle/cluster block: if `this.resource` and `noticeResource(d.traits.curiosity, hypot dist) === 'fetch'`, `stepToward` the resource tile and `continue`.
  - In `forceStep` tail (~line 1366, beside `checkFeeding()`): add `this.maybeSpawnResource(); this.checkGather();`.
  - Save builder (~2683): add `gathered: this.gathered`.
  - Load (~2742, beside `this.born = …`): add `this.gathered = save.gathered ?? {}`.
  - Dev hooks (beside `__food`): `__resource = () => this.resource`; `__gathered = () => ({ ...this.gathered })`; `__spawnResource = (kind, tileX, tileY) => { … set this.resource + sprite, deterministic for e2e … }`.

**Reuse list:** `stepToward` + `reachedFood` (`world/movement` / `world/feeding`) — movement + arrival, do NOT reimplement. `foodLanding`/`dropFood`/`flashFeed`/`foodSprite` (WorldScene) — pattern to mirror for the resource sprite + bubble. `friendship` deserialize block (saveGame) — copy for `gathered`. `d.traits.curiosity` (personality) — the notice driver.

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/cycle-062-resource.test.ts`:
  - `noticeResource`: in-range + curiosity ≥ bar → fetch; out of range → ignore; in-range + low curiosity → ignore.
  - `resourceLanding`: 100 seeded calls all in `[1,cols-2]×[1,rows-2]`.
  - `rollResource`/`pickKind`: deterministic for a seeded counter `rand`.
- Unit (extend `tests/unit/saveGame.test.ts` or new): a save with `gathered` round-trips; a save without it deserializes to `gathered: {}`.
- E2E `tests/e2e/cycle-062-resource.spec.ts`:
  - `__spawnResource('branch', tx, ty)` one tile from a dino placed via `__placeDino`/`__standOn`; advance ticks (`__forceStep`/existing tick hook); assert `__gathered()[name] === 1` and `__resource() === null`.
  - gather one, then drive a save+reload (mirror an existing persistence e2e) → tally still present. *(If no reload e2e harness exists, assert persistence at the unit level via saveGame round-trip and note it.)*

**Risks:**
- **Shared file with lore track:** both edit `WorldScene.ts`. Disjoint regions (greet sites vs. tick/spawn + fields + save). Apply lore swap first, then structure additions, build once. Flagged.
- Food priority: the resource block must sit **after** the food block so a hungry rush wins.
- `reachedFood` is in `feeding.ts` — importing it into `resource.ts` is fine (pure→pure); or call it from WorldScene (already imported there). Prefer the latter to avoid a feeding→resource coupling.
- e2e determinism: spawn via `__spawnResource` (not the random roll) so the test never flakes on `rollResource`.

**Estimated touch count:** ~6 files (3 src, 3 test). At the cap; no split needed.

---

## Shipped (Coder)

**Lore 278 — files touched:** `game/src/keeper/keepers.ts` (+`nicknameOf`, `NICKNAME_MIN=10`, `keeperAddress`); `game/src/scenes/WorldScene.ts` (import `keeperAddress` for `designationOf`; both greet sites pass `keeperAddress(keeper, heartsFromPoints(...))`; new `__setHearts` dev hook). Tests: `tests/unit/cycle-062-nickname.test.ts`, `tests/e2e/cycle-062-nickname.spec.ts`. In-fire fixup: `tests/e2e/cycle-061-keeper-name.spec.ts` pinned to 8 hearts via `__setHearts` (40 greets now caps at 10 → nickname; the cycle-61 spec tests the designation rung).

**Structure 146 — files touched:** `game/src/world/resource.ts` (new, pure — `noticeResource`/`resourceLanding`/`rollResource`/`pickKind`/`RESOURCE_GLYPH`/`RESOURCE_RANGE`); `game/src/world/saveGame.ts` (additive `gathered` field + validate/default block mirroring `friendship`); `game/src/scenes/WorldScene.ts` (`resource`/`resourceSprite`/`gathered` fields, `maybeSpawnResource`+`spawnResource`+`checkGather`, fetch step after the food block in `forceStep`, tick calls beside `checkFeeding`, save+load, `__resource`/`__gathered`/`__spawnResource` hooks). Tests: `tests/unit/cycle-062-resource.test.ts`, `tests/e2e/cycle-062-resource.spec.ts`. In-fire fixup: `gathered: {}` added to the `sample`/`validV2` baselines in `tests/unit/saveGame.test.ts` + `cycle-061-save-version.test.ts` (additive field now always present in deserialize output).

**Deviations:** reused `reachedFood` (feeding) for arrival from WorldScene rather than re-exporting it through `resource.ts` (avoids a feeding→resource coupling), as the plan's risk note preferred. No other deviations.

**Build:** ✅ clean (10s). **Unit:** ✅ 588 passed (+12). **Render/e2e spot-check:** ✅ cycle-062 (4) + cycle-061-keeper (1) green, 5/5.

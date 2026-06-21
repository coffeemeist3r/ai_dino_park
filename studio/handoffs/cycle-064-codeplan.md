# Cycle 64 — Code Plan (both tracks)

## Lore track — BACKLOG-288 Stargazing companions

**Item:** two gazers who settled adjacent during a sky event gain a one-time bond bump + a "watched the sky together" memory.

**Files to create:** none.

**Files to modify:**
- `game/src/world/skyEvent.ts`
  - add `export const SHARED_WONDER_BOND = 4;`
  - add pure `export function stargazingPairs(gazers: { name: string; tileX: number; tileY: number }[]): [string, string][]` — for every i<j with `Math.max(abs(dx),abs(dy)) <= 1`, push `[a.name, b.name]`. No self-pairs (i<j guarantees distinct entries; guard `a.name !== b.name` for safety). Returns each unordered pair once.
- `game/src/scenes/WorldScene.ts`
  - new field `private skyGazerTiles = new Map<string, { tileX: number; tileY: number }>();`
  - in `stepSky`, where a dino is added to `skyGazers` (the `!this.skyGazers.has(d.name)` block ~line 759), also `this.skyGazerTiles.set(d.name, next)`.
  - in `startSky`, clear it alongside `skyGazers.clear()`: `this.skyGazerTiles.clear();`
  - in `endSky` (before the existing `void this.saveGame()`), call a new `private knitStargazers()`: build the gazer list from `skyGazerTiles`, call `stargazingPairs`, and for each pair `this.bonds = strengthen(this.bonds, a, b, SHARED_WONDER_BOND)` + `this.memory = remember(this.memory, a, companionMemory(b))` and the symmetric `remember(... b, companionMemory(a))`. Guard one-time: `endSky` already nulls `activeSky` and only runs once per event; after knitting, `this.skyGazerTiles.clear()` so a second `endSky` no-ops.
  - small local `companionMemory(other) => `watched the sky together with ${other}`` (or inline).
  - dev hook (optional, aids e2e): none required — `__bondPair` (read) + `__skyGazers` already exist; add `__skyCompanions = () => stargazingPairs([...this.skyGazerTiles].map(([name,t]) => ({name, ...t})))` for a direct assert if convenient.

**Reuse list (MUST use, do not reinvent):**
- `strengthen(bonds, a, b, delta)` — `game/src/social/bonds.ts` (the bond bump).
- `remember(store, name, line)` — `game/src/ai/memory.ts` (memory append; already imported in WorldScene).
- `gazeRing` / `atGather` / settled-tile logic — already in `stepSky`; do not re-walk dinos.
- `pairKey` indirectly via `strengthen` (don't key bonds by hand).

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/cycle-064-stargazing.test.ts`:
  - `stargazingPairs` pairs two adjacent gazers once; leaves a 2-tile-apart gazer unpaired; never self-pairs; three mutually-adjacent gazers → 3 pairs.
  - `SHARED_WONDER_BOND` applied via `strengthen` raises `bondPoints` by exactly the constant.
- E2E `tests/e2e/cycle-064-stargazing.spec.ts`:
  - boot, `__triggerSky('meteors')`, step until `__skyGazers` fills, advance past duration / to dawn so the event ends, then assert `__bondPair(a,b)` rose for a pair that ended within 1 tile, and a lone edge gazer's bonds didn't rise from this; re-step and assert no further rise (one-time); export/reload preserves the bumped bond. `errors` console array empty.

**Risks:** ring-0 dinos stack on the gather tile (distance 0) → all pair (a clique); that's intended. Ensure `knitStargazers` runs *before* `saveGame()` in `endSky` so the bumped bonds persist. Keep `stargazingPairs` free of any ai/ import (it takes plain `{name,tileX,tileY}`).

**Estimated touch count:** ~2 files (+2 test files).

---

## Structure track — BACKLOG-286 First craft

**Item:** at a stockpile threshold a dino crafts a cairn (🗿) placed in the bowl; cairns persist.

**Files to create:** none.

**Files to modify:**
- `game/src/world/resource.ts`
  - add `export const CRAFT_RECIPE: Partial<Record<ResourceKind, number>> = { branch: 3, stone: 2 };`
  - add `export const CAIRN_GLYPH = '🗿';`
  - add pure `export function canCraft(pile: Stockpile): boolean` — every kind in `CRAFT_RECIPE` has `(pile[k] ?? 0) >= cost`.
  - add pure `export function craft(pile: Stockpile): Stockpile | null` — `null` if `!canCraft`; else return a new map with each recipe kind reduced by its cost (never below 0).
- `game/src/world/saveGame.ts`
  - `SaveData`: add `/** Crafted cairns placed in the bowl (BACKLOG-286). Additive over v2; absent → []. */ cairns?: { tileX: number; tileY: number }[];`
  - in `deserialize`, after the `stockpile` block, validate `cairns` (array of objects with numeric tileX/tileY, mirror the `eggs` validation but only the two coords); default `[]`; include in the returned object. **No `SAVE_VERSION` bump** (additive over v2).
- `game/src/scenes/WorldScene.ts`
  - import `CRAFT_RECIPE`(not needed at runtime), `canCraft`, `craft`, `CAIRN_GLYPH` from `../world/resource`.
  - new field `private cairns: { tileX: number; tileY: number }[] = [];` and `private cairnSprites: Phaser.GameObjects.Text[] = [];`
  - `private drawCairn(c)` — mirror `resourceSprite` creation (`this.add.text(... CAIRN_GLYPH ...).setOrigin(0.5).setDepth(2)`), push sprite.
  - `private placeCairn(tile, crafter)` — push to `this.cairns`, `drawCairn`, `flashFeed(crafter, CAIRN_GLYPH)`, `logEvent`, `remember` the crafter, `refreshPlaque()` not needed.
  - in `checkGather`, after `this.stockpile = bankResource(...)` and `refreshPlaque()`: `const np = craft(this.stockpile); if (np) { this.stockpile = np; this.placeCairn(this.tileOf(taker), taker); this.refreshPlaque(); }` then the existing `saveGame()` persists both the spend and the cairn. (One craft per pickup.)
  - `currentSaveData()` (~line 2771): add `cairns: this.cairns,`.
  - `setupSave` load (~after line 2818 `this.stockpile = ...`): `this.cairns = save.cairns ?? []; for (const c of this.cairns) this.drawCairn(c);` (mirror the `eggs` redraw at ~2824).
  - dev hooks (near `__stockpile` ~line 542): `(window as any).__cairns = () => this.cairns.map((c) => ({ ...c }));` and `(window as any).__canCraft = () => canCraft(this.stockpile);`

**Reuse list (MUST use):**
- `bankResource` / `Stockpile` / `RESOURCE_GLYPH` pattern — `game/src/world/resource.ts` (craft sits beside bank; `craft` mirrors `bankResource`'s pure new-map style).
- `flashFeed` / `logEvent` / `remember` / `tileOf` — existing WorldScene helpers (do not add new flash/log paths).
- the additive-save pattern of `stockpile` (validate, default `{}`/`[]`, no version bump) and the `eggs` array redraw-on-load loop — copy it for `cairns`.
- `resourceSprite` text-glyph creation — mirror for `drawCairn`.

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/cycle-064-craft.test.ts`:
  - `canCraft` false below either threshold, true at/above both; `craft` returns pile minus exactly `{branch:3,stone:2}`, never negative; `craft` of an unaffordable pile is `null`; `craft` is pure (input pile unchanged).
  - existing save round-trip test gains `cairns` (or a new case): a save with `cairns:[{tileX,tileY}]` round-trips; a save without `cairns` deserializes to `[]`; `version` stays 2.
- E2E `tests/e2e/cycle-064-craft.spec.ts`:
  - boot; repeatedly `__spawnResource('branch'|'stone', tx, ty)` on a dino + `__stepWorld` until the stockpile holds ≥3 branch / ≥2 stone; assert `__cairns` gained one entry on the threshold step and `__stockpile` dropped by the recipe; re-step without re-supplying and assert no second cairn; assert the cairn is in `__exportSave().cairns` and (reload) re-renders. `errors` empty.

**Risks:**
- **Cross-track collision:** both tracks modify `WorldScene.ts`. They touch **disjoint methods** (lore: `stepSky`/`endSky`/`startSky`; structure: `checkGather`/`currentSaveData`/`setupSave`/hooks). **Order:** apply the structure-track WorldScene edits and the lore-track edits independently, then `npm run build` once. The only shared files outside WorldScene are none (lore touches `skyEvent.ts`, structure touches `resource.ts` + `saveGame.ts`).
- Save round-trip test fixtures: any existing test asserting the full deserialized shape must add `cairns: []` (as `stockpile: {}` was added last cycle). Grep `tests/unit/saveGame.test.ts` + `cycle-061-save-version.test.ts` for shape baselines and update them in-fire.
- Keep `craft` returning a **new** map (don't mutate `this.stockpile` in place before assigning).

**Estimated touch count:** ~3 files (resource.ts, saveGame.ts, WorldScene.ts) + 2 test files. Lore adds ~2 (skyEvent.ts, WorldScene.ts) + 2 test files. Combined unique source files: skyEvent.ts, resource.ts, saveGame.ts, WorldScene.ts = **4 source + 4 test**.

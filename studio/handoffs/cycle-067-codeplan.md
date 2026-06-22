# Cycle 67 — Code Plan

Cross-track collision check: only `WorldScene.ts` is shared, in different methods (`bookRows()` for the
lore track, `drawFloor()`/`tryCrossZone()`/`__setZone` for the structure track). No ordering hazard;
build either first.

## Lore track — BACKLOG-303: Signature quirk in the dossier

**Item:** name each dino's idle fidget in the collection book.

**Files to create:** none.

**Files to modify:**
- `game/src/ui/lenses.ts` — add an optional `quirk?: string` field to `BookRow`; in `bookLines()`, when
  `r.quirk` is set, push a line `  · ${r.quirk}` under the heart/bond line. Optional so the existing
  `roles.test.ts` / `cycle-060` BookRow literals don't break; the live `bookRows()` always sets it, so
  the dossier always shows it. (Phaser-free preserved — it's a plain string.)
- `game/src/scenes/WorldScene.ts` — in `bookRows()` (~line 1260) add `quirk: fidget(d.traits).label` to
  each row. `fidget` is already imported (used at ~line 1045/1675).

**Reuse list (MUST use, do not reinvent):**
- `fidget()` from `game/src/world/fidget.ts` — already produces `{ glyph, label }`; use `.label`.
- `BookRow` / `bookLines()` in `game/src/ui/lenses.ts` — extend, don't fork.
- `__bookRows` hook (already exposes `bookRows()`) — the e2e reads it; no new hook needed for the data.

**New dependencies:** none.

**Test plan:**
- Unit (`tests/unit/lenses.test.ts`): extend the existing `bookLines` test — pass a row with
  `quirk: 'paces'`, assert the rendered text contains `· paces`; assert a row without `quirk` renders no
  quirk line (the optional contract).
- E2E (`tests/e2e/cycle-067-dossier.spec.ts`): boot, read `__bookRows()` and `__fidget(name)` for each
  row, assert every row's `quirk` equals `__fidget(name).label` and ≥3 distinct labels appear; open the
  📖 lens and assert the panel text contains one of those labels. Zero console errors.

**Risks:** `BookRow` is consumed by `__bookRows` (dev hook) and the three test files that build literals —
keeping `quirk` optional avoids touching them. None beyond that.

**Estimated touch count:** ~3 files (2 src + 1 unit + 1 e2e).

## Structure track — BACKLOG-294: Grove terrain

**Item:** distinct grove floor (tint) + path/water sub-regions defined in `zones.ts` + per-zone floor swap.

**Files to create:** none (rigs for path/water are the Artist's, 033).

**Files to modify:**
- `game/src/world/zones.ts` — add `export type TileKind = 'grass' | 'path' | 'water'` and a pure
  `export function groveTileAt(x, y, cols, rows): TileKind`: a horizontal worn **path** band across the
  vertical middle (the trail through the clearing) and a small **water** pond block in the NE corner;
  everything else grass. Also export `GROVE_TINT` (a cool multiplicative tint constant) for the scene.
- `game/src/art/bake.ts` — add `bakeTerrainMap(scene, key, cols, rows, tile, kindAt)`: like `bakeTileMap`
  but picks `TILE_RIGS[kindAt(cx,cy)] ?? TILE_RIGS.grass` per cell (so undrawn path/water bake as grass
  until the Artist ships their rigs); returns null only if even the grass rig is missing. Reuses the same
  per-pixel `fillRect` → `generateTexture` shape as `bakeTileMap`.
- `game/src/scenes/WorldScene.ts` —
  - rename/replace `drawGrassMap()` with `drawFloor()`: bowl → `bakeTileMap('grass', …)` untinted; grove
    → `bakeTerrainMap('terrain_grove_…', …, groveTileAt)` with `setTint(GROVE_TINT)`. Hold `this.floorImage`
    (and reuse it via `setTexture`/`setTint` rather than stacking images); keep the flat-checker fallback
    built once if no key. Call it from `create()` (replacing the `drawGrassMap()` call ~line 285), and
    after every zone change in `tryCrossZone()` (~line 2469) and `__setZone` (~line 447).
  - add dev hook `__floorInfo = () => ({ zone, key, tinted })`.

**Reuse list (MUST use, do not reinvent):**
- `bakeTileMap` + `TILE_RIGS` + `GRASS_RIG`/`baseChar` in `art/tileArt.ts` / `art/bake.ts` — the bowl path
  is unchanged; `bakeTerrainMap` mirrors `bakeTileMap`'s loop, it does not replace it.
- `zoneById`/`GROVE_ID`/`BOWL_ID` + `crossing`/`linkedZone` in `zones.ts` — the crossing logic is done;
  only the floor render is new.
- The existing `tryCrossZone`/`applyZoneVisibility`/`__setZone` plumbing — hook the floor swap into it.

**New dependencies:** none.

**Test plan:**
- Unit (`tests/unit/cycle-067-grove-terrain.test.ts`): `groveTileAt` returns `'water'` in the pond block,
  `'path'` on the path band, `'grass'` at a plain corner; the layout contains ≥1 path and ≥1 water tile;
  every returned value is a valid `TileKind`. (Pure, no Phaser.)
- E2E (`tests/e2e/cycle-067-grove-terrain.spec.ts`): boot (bowl) → `__floorInfo().tinted` is false and key
  is the grass tilemap; `__setZone('grove')` → `__floorInfo().tinted` is true and key contains
  `terrain_grove`; `__setZone('bowl')` → back to the untinted grass key. Zero console errors. (Robust to
  the Artist later adding path/water rigs — it asserts the swap + tint, not pixel colours.)

**Risks:**
- Swapping a single `floorImage` texture vs stacking images — must reuse the image (depth 0) so dinos/
  props stay above and we don't leak a texture per cross. Handled by holding `this.floorImage`.
- Bowl regression: `drawFloor()` in the bowl branch must be byte-identical to the old `drawGrassMap()`
  (same `bakeTileMap('grass', …)`, no tint). Pinned by the cycle-48 grass spec.
- Bowl props (cairns/plot) draw over the grove floor (cross-zone bleed) — **known, out of scope**, that's
  BACKLOG-308 next cycle; the grove draws empty of dinos so it's not visually alarming.

**Estimated touch count:** ~5 files (3 src + 1 unit + 1 e2e).

---

## Shipped (Coder)

**Lore track (303):**
- `game/src/ui/lenses.ts` — `BookRow.quirk?: string`; `bookLines` pushes `  · <quirk>` under the heart line when set.
- `game/src/scenes/WorldScene.ts` — `bookRows()` sets `quirk: fidget(d.traits).label`; added `__bookText` hook.
- `tests/unit/lenses.test.ts` — +2 (quirk line shown / omitted).
- `tests/e2e/cycle-067-dossier.spec.ts` — new (+2): book quirk matches live `__fidget`, ≥3 distinct, rendered line present, reload-deterministic.

**Structure track (294):**
- `game/src/world/zones.ts` — `TileKind`, `GROVE_TINT`, pure `groveTileAt(x,y,cols,rows)` (mid path band + NE pond, else grass).
- `game/src/art/bake.ts` — `bakeTerrainMap(scene,key,cols,rows,tile,kindAt)` — per-cell rig, grass fallback for undrawn kinds.
- `game/src/scenes/WorldScene.ts` — `drawGrassMap`→`drawFloor` (single held `floorImage`, bowl grass untinted / grove terrain tinted; flat-checker fallback once); called from `create` + `tryCrossZone` + `__setZone`; added `__floorInfo` hook + `floorImage`/`floorFallback` fields.
- `tests/unit/cycle-067-grove-terrain.test.ts` — new (+5): pond/path/grass placement, ≥1 of each kind, valid kinds, non-neutral tint.
- `tests/e2e/cycle-067-grove-terrain.spec.ts` — new (+1): floor swaps bowl(grass,untinted) → grove(terrain_grove,tinted) → bowl.

**Deviations from plan:** none. (The unit `omits quirk line` test uses a line-prefix check because the heart bar's empty pip is also `·`.)

**Build:** ✅ clean. **Unit:** ✅ 663/663. **Dev server:** ✅ HTTP 200.
**Known deferred (per plan):** bowl props (cairns/plot) still draw over the grove floor — that's BACKLOG-308.

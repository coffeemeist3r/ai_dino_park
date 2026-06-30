# Cycle 86 — Code Plan (two tracks)

## Lore track — BACKLOG-394 Backed-down gobbler slinks off

**Item:** BACKLOG-394 — the denied gobbler reacts to being stood up to (😖 + "<bold> wouldn't budge" memory).

**Files to create:** none (tests below extend existing patterns / add one spec).

**Files to modify:**
- `game/src/world/feeding.ts` — add a pure memory builder `slunkOffMemory(boldName: string): string` (sibling to `coldMemory`/`gratefulMemory` in cold.ts etc.), returning e.g. `` `${boldName} wouldn't budge — slunk off` ``. Place it next to `standsGround` (the 390 block).
- `game/src/scenes/WorldScene.ts` — in `checkFeeding`'s **stand branch** (currently lines ~970–978, `if (gobblerName && standsGround(eater.traits.bravery))`): after the winner's existing 😠 + "stood your ground" handling, also resolve the gobbler — `const gobbler = this.dinos.find((d) => d.name === gobblerName)!; this.memory = remember(this.memory, gobblerName, slunkOffMemory(eater.name)); this.flashFeed(gobbler, '😖'); this.logEvent(\`😖 ${gobblerName} slunk off — ${eater.name} wouldn't budge\`);`. Import `slunkOffMemory` from `../world/feeding`. Do **not** touch the timid-winner `else if (gobblerName)` gobble branch or the 375 yield branch.

**Reuse list (MUST use, do not reinvent):**
- `remember` (already imported in WorldScene) — file the gobbler memory.
- `flashFeed` (WorldScene private) — the 😖 mark, exactly as 😠/😤/🤝 use it.
- `logEvent` (WorldScene private) — the event-log line.
- `__standFood` hook (line 702) — already returns `{ winner, gobbler }` from `lastStand`; on a stand the `gobbler` IS the slunk dino, so **no hook change needed** — the e2e reads it + the gobbler's memory.
- `slunkOffMemory` mirrors the pure memory-builder convention in `world/cold.ts` / `world/arrival.ts`.

**New dependencies:** none.

**Test plan:**
- Unit (`tests/unit/cycle-086-slink.test.ts`): `slunkOffMemory('Rex')` returns a non-empty string containing `'Rex'`; two different bold names produce different strings.
- E2E (`tests/e2e/cycle-086-slink.spec.ts`, modeled on `cycle-085-stand-up.spec.ts`, same `setUp`): (1) **bold winner** (bravery 0.9) → after `__stepWorld`, the gobbler's `__memory()` contains a "wouldn't budge" + winner-name entry, and `__standFood()` = `{winner, gobbler}`; (2) **timid winner** (bravery 0.1, the 387 gobble path) → the gobbler's memory has **no** "wouldn't budge" entry and `__standFood()` is null (byte-identical to cycle 85). Assert zero console/page errors.

**Risks:** Shared file `WorldScene.ts` with the structure track (`checkFeeding` vs `drawFloor` — different methods, no overlap). The gobbler `find` is safe (gobblerName came from `gobblerAmong` over the live swarm). No save change, no bond change (395 owns the bond ripple).

**Estimated touch count:** ~4 files (feeding.ts, WorldScene.ts, 2 tests).

---

## Structure track — BACKLOG-399 Third-zone terrain identity

**Item:** BACKLOG-399 — The Fernreach gets its own ground layout (`fernreachTileAt` + per-zone dispatch).

**Files to create:** none (tests below).

**Files to modify:**
- `game/src/world/zones.ts`:
  - Extend the `TileKind` union: `'grass' | 'path' | 'water' | 'fern'` (the new scrub kind; comment that it bakes as grass-fallback until the Artist draws `FERN_RIG`, exactly as 294 left path/water).
  - Add `fernreachTileAt(x, y, cols, rows): TileKind` — the Fernreach's distinct layout: a **vertical water creek** down a west-ish column (reuses the already-drawn `'water'` rig, so a real feature shows this cycle) + **fern scrub bands** (`'fern'`) in a different region (e.g. the southern rows / east side), grass elsewhere. The layout MUST differ from `groveTileAt` (grove = central horizontal path + NE pond).
  - Add `zoneTileAt(zoneId: string, x: number, y: number, cols: number, rows: number): TileKind | null` — `GROVE_ID → groveTileAt`, `FERNREACH_ID → fernreachTileAt`, else `null` (bowl = plain grass). One dispatcher the floor render reads, so a 4th zone is another arm, not another `drawFloor` edit.
- `game/src/scenes/WorldScene.ts` — `drawFloor` (lines ~390+): replace the binary `const inGrove = this.zoneId === GROVE_ID; ... inGrove ? bakeTerrainMap(... groveTileAt ...) : bakeTileMap('grass')` with a dispatch on `zoneTileAt`: compute `const tileAt = zoneTileAt(this.zoneId, ...)`; if a layout exists, `bakeTerrainMap(this, \`terrain_${this.zoneId}_${COLS}x${ROWS}\`, COLS, ROWS, TILE, (x, y) => zoneTileAt(this.zoneId, x, y, COLS, ROWS)!)`; else `bakeTileMap('grass', ...)`. Tint/visible/fallback logic unchanged. Import `zoneTileAt` (add to the existing `../world/zones` import); `groveTileAt` import may be dropped if no longer referenced directly.

**Reuse list (MUST use):**
- `bakeTerrainMap` (`art/bake.ts`) — the per-cell terrain bake; its `TILE_RIGS[kind] ?? fallback` already grass-falls-back an undrawn `'fern'`, so **no bake.ts change**.
- `WATER_RIG` via `TILE_RIGS.water` (033) — the Fernreach creek renders with the existing water rig immediately.
- `zoneTint`/`FERNREACH_TINT` (zones.ts, shipped 378) — the warm tint stays.
- `__floorInfo` hook (line 549) — already returns `{ zone, key, tinted }`; the e2e reads `key` (no hook change).
- `bakeTileMap` (bowl grass path) — unchanged.

**New dependencies:** none.

**Test plan:**
- Unit (`tests/unit/cycle-086-fernreach-terrain.test.ts`, modeled on `cycle-067-grove-terrain.test.ts`): `fernreachTileAt` returns `'water'` at a creek tile, `'fern'` at a scrub tile, `'grass'` away from both; the grid contains ≥1 of each of its kinds and **only valid kinds**; the Fernreach layout differs from the grove (≥1 tile differs in kind across the grid); `zoneTileAt('grove',…) === groveTileAt(…)`, `zoneTileAt('fernreach',…) === fernreachTileAt(…)`, `zoneTileAt('bowl',…) === null`.
- E2E (`tests/e2e/cycle-086-fernreach-terrain.spec.ts`, using `__setZone` + `__floorInfo`): entering `fernreach` → `__floorInfo().key === 'terrain_fernreach_20x15'` and `tinted === true`; `bowl` → key `'grass'`; `grove` → key `'terrain_grove_20x15'` (cycle-85 byte-identity). Assert zero console/page errors.

**Risks:** Shared `WorldScene.ts` with the lore track (`drawFloor` vs `checkFeeding`). The new `'fern'` kind must not break any exhaustive `TileKind` switch — grep shows the only consumer is `bakeTerrainMap`'s `TILE_RIGS[kind] ?? fallback` (safe) and the unit terrain tests (which list kinds explicitly — the cycle-067 grove test pins `['grass','path','water']` for the *grove* and is unaffected; the new fernreach test owns `'fern'`). Confirm no `TileKind`-exhaustive `switch` exists before adding the union member. No save change.

**Estimated touch count:** ~4 files (zones.ts, WorldScene.ts, 2 tests).

---

## Cross-track collision check

Both tracks edit `WorldScene.ts` but in **different methods** (`checkFeeding` for 394, `drawFloor` for 399)
and different imports — no clobber. Suggested order: 399 first (drawFloor + zones.ts), then 394
(checkFeeding + feeding.ts), build + full suite once at the end. No shared logic file (feeding.ts vs
zones.ts). Neither track changes the save format or the `@mlc-ai/web-llm` boundary.

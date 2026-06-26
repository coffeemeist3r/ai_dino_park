# Cycle 79 — Code Plan

Two disjoint tracks. No shared files except `WorldScene.ts` (different methods) + `saveGame.ts`
(two independent additive fields). No deps, no SAVE_VERSION bump, NPCBrain boundary untouched.

## Lore track — 359 (pond-sight)

**`game/src/world/arrival.ts`** (extend):
- `import { GROVE_ID, groveTileAt } from './zones'` (already imports `GROVE_ID`).
- `export const POND_SIGHT_RADIUS = 2`.
- `nearPond(tile, cols, rows)` — double loop `-R..R`, in-bounds, `groveTileAt === 'water'`.
- `firstPondSight(pondSeen, name, zone, tile, cols, rows)` — zone===GROVE_ID && !seen && nearPond.
- `pondSightMemory()` / `pondSightLine()`.

**`game/src/scenes/WorldScene.ts`**:
- field `private pondSeen: string[] = []` (near `groveVisited`, line ~292).
- `checkPondSight()` — loop `this.dinos`, `firstPondSight(this.pondSeen, d.name, zoneOf(this.dinoZones,d.name,BOWL_ID), this.tileOf(d), COLS, ROWS)` → push, `remember`, `showBubble`, `saveGame`. Call after `this.checkPlot()` in the forceStep tail (line ~1919).
- hooks in `setupPlot` neighbourhood or the 339 hook block (line ~669): `__pondSeen`, `__seePond(name)` (migrate to grove via existing `setZone(this.dinoZones,...)`, set position to `GROVE_PLOT_TILE`-style pond-adjacent tile {16,5}, run `checkPondSight`, return `[...this.pondSeen]`).
- serialize `pondSeen` (line ~3469); restore `this.pondSeen = save.pondSeen ?? []` (line ~3528).

**`game/src/world/saveGame.ts`**: `pondSeen?: string[]` on `SaveData`; validate like `groveVisited`; add to return.

**Tests:** `arrival.pondsight.test.ts` — nearPond hit/miss, firstPondSight zone-gate + dedupe + not-near-pond. `saveGame` pondSeen round-trip + absent→[]. e2e `cycle-079-pondsight.spec.ts` — `__seePond('Rex')` once → memory + pondSeen; twice → no dupe.

## Structure track — 349 (grove plot)

**`game/src/world/plot.ts`** (extend): `import { BOWL_ID, GROVE_ID } from './zones'`;
`GROVE_PLOT_TILE = {4,10}`; `PLOT_TILE_BY_ZONE = { [BOWL_ID]: PLOT_TILE, [GROVE_ID]: GROVE_PLOT_TILE }`.

**`game/src/scenes/WorldScene.ts`** — replace single-plot state with per-zone maps; methods
`drawPlotSprite(zone,stage)`, `plant(zone)`, `harvest(zone)`, `handlePlot()` (active zone),
`refreshPlot()` (loop both, visible iff `zoneId===zone`), `checkPlot()`; hooks gain `zone?` arg
(default active). Update `applyObjectVisibility` plot line (~2813) + `__objVisible` plot line (~664)
to per-zone. Save: `plot = plotByZone[BOWL_ID]` + new `grovePlot = plotByZone[GROVE_ID]`; restore both.

**`game/src/world/saveGame.ts`**: `grovePlot?: { plantedDay: number } | null` on `SaveData`;
validate exactly like `plot`; add to return.

**Tests:** `plot` unit gains `PLOT_TILE_BY_ZONE`/`GROVE_PLOT_TILE` pins (grove tile is grass, not
path/pond). `saveGame` grovePlot round-trip + independence from `plot` + absent→null. e2e
`cycle-079-grove-plot.spec.ts` — plant in grove via `__plantPlot('grove')`, advance days, harvest;
bowl plot independent; cross-zone visibility.

## Reuse
`groveTileAt` (294), `zoneOf`/`setZone` (143/274), `remember`/`recall` (011), `showBubble`,
`tileOf`, `cropStage`/`plotAdjacent`/`dropFood`/`bakePropArt` (145/317), `groveVisited` validation
shape (339). Build: `npm run build` + `npx vitest run` + `npx --yes kill-port 5173 && npx playwright test`.

phase → coder-pending.

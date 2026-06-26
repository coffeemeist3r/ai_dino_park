# Cycle 79 — Design Handoff

Two tracks, file-disjoint. Lore = the pond-sight beat (`world/arrival.ts` + a per-step pass).
Structure = the grove plot (`world/plot.ts` + the plot glue in `WorldScene`). No shared methods.

---

## Lore track — BACKLOG-359: first sight of the pond

**Reframe (the non-duplication call):** 339 already ships the *first grove crossing* beat — a 🌿
"somewhere new" look-around fired by `crossDino` on a dino's first zone entry, at the grove's **west
edge**. 359 is a **different trigger**: the first time a dino comes within sight of the grove's **pond
water** (the NE block `groveTileAt(...) === 'water'`). A migrant enters at the west edge and must
wander across the clearing to reach the pond, so first-sight is a separate, later moment — finally
beholding the water every grove rumor (342/345/355) was about. New glyph (💧 not 🌿), new memory, new
once-ever set (`pondSeen`, **not** `groveVisited`).

**Pure logic (`world/arrival.ts`, extend — Node-testable, no Phaser/AI):**
- `POND_SIGHT_RADIUS = 2` (Chebyshev) — "within sight of" the water.
- `nearPond(tile, cols, rows): boolean` — scan the `±RADIUS` neighbourhood; true if any in-bounds
  tile is grove water (`groveTileAt(x,y,cols,rows) === 'water'`). Reuses the existing 294 terrain map.
- `firstPondSight(pondSeen, name, zone, tile, cols, rows): boolean` —
  `zone === GROVE_ID && !pondSeen.includes(name) && nearPond(tile, cols, rows)`.
- `pondSightMemory(): '💧 first saw the pond'` · `pondSightLine(): '💧 …the pond…'`.

**WorldScene glue:**
- New persisted `private pondSeen: string[] = []`.
- `checkPondSight()` at the `forceStep` tail (beside `checkPlot`): for each dino, read its home zone
  + tile; on `firstPondSight` → push `pondSeen`, `remember` the memory, `showBubble`, `saveGame`.
- Save: serialize `pondSeen`; restore `save.pondSeen ?? []`. Additive, **no SAVE_VERSION bump**.
- Hooks: `__pondSeen()` reports the set; `__seePond(name)` drives the beat (grove + pond-adjacent +
  run the check) for the e2e.

**Acceptance criteria**
1. A grove dino within `POND_SIGHT_RADIUS` of a water tile for the first time files `💧 first saw the
   pond` + floats `💧 …the pond…`. *(unit `nearPond`/`firstPondSight`; e2e via `__seePond`)*
2. Once per dino ever — a second sighting fires nothing (`pondSeen` dedupes). *(unit + e2e)*
3. Distinct from 339: a dino that has crossed into the grove but is **not** near the pond gets **no**
   pond memory (`firstPondSight` false). *(unit)*
4. A bowl dino never gets the pond beat (zone gate), regardless of its bowl-space tile. *(unit)*
5. `pondSeen` round-trips the save; absent in old saves → `[]`. *(unit `saveGame`)*
6. No SAVE_VERSION bump; the 339 grove-arrival path (`groveVisited`) is untouched and green. *(regression)*

---

## Structure track — BACKLOG-349: grove plot

**Goal:** the grove farms too. Generalize the single bowl `this.plot` to a **per-zone** plot so each
zone plants/grows/harvests/persists its own crop independently, zone-scoped (308) like every other
world object.

**Pure logic (`world/plot.ts`, extend):**
- `GROVE_PLOT_TILE: Tile = { tileX: 4, tileY: 10 }` — grove grass, clear of the path band (rows 6–7)
  and the NE pond (x 15–18 / y 2–4) and the edges.
- `PLOT_TILE_BY_ZONE: Record<string, Tile> = { [BOWL_ID]: PLOT_TILE, [GROVE_ID]: GROVE_PLOT_TILE }`
  (import `BOWL_ID`/`GROVE_ID` from `./zones` — no cycle; zones.ts imports nothing). `PLOT_TILE`
  stays the bowl alias, so 145/317 callers are byte-identical. `cropStage`/`plotAdjacent` unchanged
  (zone-agnostic, reused for both).

**WorldScene glue:** `this.plot/plotSprite/plotStageShown` → `plotByZone` / `plotSpriteByZone` /
`plotStageShownByZone`, each keyed by zone. `drawPlotSprite(zone,stage)`, `plant(zone)`,
`harvest(zone)`, `handlePlot()` (acts on the active zone's tile/plot), `refreshPlot()` (loops both
zones; each sprite visible only when `zoneId === zone`), `checkPlot()`. Hooks `__plot/__plantPlot/
__harvestPlot/__plotArt` gain an optional `zone?` arg defaulting to the active zone (bowl-default
calls byte-identical). Save: `plot` = bowl plot (back-compat) + new `grovePlot` = grove plot;
restore `plotByZone = { bowl: save.plot ?? null, grove: save.grovePlot ?? null }`. **No version bump.**

**Acceptance criteria**
1. The grove has its own plot tile (`GROVE_PLOT_TILE`), on grove grass, distinct from the bowl's.
2. In the grove, adjacent + P plants a seed; it grows seed→sprout→ripe on the realtime-day clock;
   adjacent + P once ripe harvests (food drop + `harvested++`). *(e2e via `__plantPlot('grove')` etc.)*
3. Each plot draws/works only in its own zone — the grove plot is invisible from the bowl and the
   bowl plot invisible from the grove; neither is workable from the other zone. *(e2e visibility)*
4. The bowl plot is behaviourally byte-identical — bowl plant/grow/harvest unchanged. *(145/317 regression)*
5. `grovePlot` round-trips additively alongside `plot`; old saves → grove-empty; the two plots are
   independent in the save. *(unit `saveGame`)*
6. No SAVE_VERSION bump; build clean; web-llm boundary intact.

phase → codeplan-pending.

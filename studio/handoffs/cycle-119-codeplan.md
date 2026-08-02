# Cycle 119 — Code Plan

## Structure track — BACKLOG-472: The fourth ground

### Files

| File | Change |
|---|---|
| `game/src/world/zones.ts` | `HOLLOW_ID`, `ZONES` row, two `ZONE_LINKS` rows (fernreach east ↔ hollow west), `HOLLOW_TINT`, `hollowTileAt`, `hollowPoolTile`, `ZONE_TERRAIN[hollow]` row |
| `game/src/world/foods.ts` | `mushrooms` 🍄 entry (plant), appeal tuned so no roster favorite flips |
| `game/src/world/plot.ts` | `HOLLOW_PLOT_TILE`, `CROP_BY_ZONE[hollow]`, `PLOT_TILE_BY_ZONE[hollow]` |
| `game/src/world/cropseason.ts` | `mushrooms: { good: 'spring', lean: 'fall' }` + header note on the 4×4 rotation |
| `game/src/world/saveGame.ts` | `hollowPlot?` field + `readPlot` line (**finding 2**, see below) |
| `game/src/scenes/WorldScene.ts` | `plotByZone` / `plotStageShownByZone` seeded from `PLOT_TILE_BY_ZONE` keys instead of three literals; save/load `hollowPlot` |
| `tests/unit/cycle-118-crop-season.test.ts` | amended for the 4-crop rotation (**finding 1**) |
| `tests/unit/cycle-119-fourth-ground.test.ts` | new |

### Reuse (nothing new invented)

`ZONE_TERRAIN` / `zoneTileAt` / `zoneWaterTile` / `zoneTint` (449) · `ZONE_LINKS` / `zoneChain` /
`edgeIndicators` / `neighborThrough` (383/398/425) · `CROP_BY_ZONE` / `cropOf` / `PLOT_TILE_BY_ZONE`
(418/432) · `cropYield` (465) · `zonePopulations` (316) · the lens model (425/428/468). The floor bake,
the lens, the pantry, the ferry, the provider, migration, decline and governance get **no edits**.

### Findings (the deliverable half of this item)

1. **`cropseason.ts` rotation was written for exactly three crops.** Its test asserted one good + one lean
   per *non-spring* season and no crop naming spring. A fourth crop cannot satisfy both. Resolved by giving
   the newcomer the empty season (`mushrooms` good in spring, lean in fall), yielding a clean 4×4 — every
   season one thriving, one thin. The spring hinge's *purpose* is intact: berries/greens/roots still name no
   spring, so a fresh boot banks exactly what it always banked. Test amended to say that (the founding three
   keep spring neutral) and to iterate all four seasons.
2. **Per-zone plot persistence is hand-written.** `plot` / `grovePlot` / `fernreachPlot` are three literal
   save fields with three literal parse branches; a fourth ground needs a fourth of each. Adding
   `hollowPlot` in the local idiom rather than refactoring the save shape — a generic `plotByZone` envelope
   is a save-format change and does not belong riding on this item. Logged for a future structure item.
3. **`ZONE_BIAS` / `structureOf` deliberately not extended.** The Hollow falls through the documented
   back-compat seams (uniform branch/stone gathering, default cairn). A fourth resource kind pulls in
   recipes, barter, craft escalation and an art rig. Not a rider on this item; stated in the source.

Everything else — ten cross-zone systems — needed **zero lines**. That is the finding this item existed to
produce, and the tests below assert it rather than claiming it.

### Tests (`cycle-119-fourth-ground.test.ts`)

- `zoneChain()` is `[bowl, grove, fernreach, hollow]`; the links round-trip both ways (S1).
- `edgeIndicators('fernreach')` includes `The Hollow ▸`; `edgeIndicators('hollow')` is `◂ The Fernreach` (S2).
- The Hollow's terrain: fen rim rows, pool block, grass elsewhere; the three old zones' grids are unchanged
  tile-for-tile against their own rules (S3) — the cycle-108 landmark invariant already covers S4 the moment
  the row is registered.
- `cropOf('hollow').food === 'mushrooms'`; `PLOT_TILE_BY_ZONE.hollow` is neither fen nor water nor an edge (S5).
- No roster dino's favorite flips: `favoriteFood` over the roster × four seasons, before/after mushrooms —
  asserted against the fixed expected set (S8).
- `zonePopulations` seeds the Hollow at 0 and the lens model yields four entries with no lens edit (S7).

### E2E (`tests/e2e/cycle-119-fourth-ground.spec.ts`)

Walk the keeper east from the Fernreach into the Hollow (the existing crossing path), assert the zone label
/ tint changed and the west edge indicator reads the Fernreach; open the map lens and assert four boxes.

---

## Lore track — BACKLOG-343: First across

### Files

| File | Change |
|---|---|
| `game/src/world/pioneer.ts` | new pure module: `recordPioneer`, `pioneerOf`, `pioneerLine` |
| `game/src/ui/lenses.ts` | `BookRow.pioneer?: string`; one render line after `home` |
| `game/src/world/saveGame.ts` | `pioneers?: Record<string, string>` (parse copied from `lastProviderByZone`, 467) |
| `game/src/scenes/WorldScene.ts` | `pioneers` field, record in `crossDino` + `relocate`, 🚩 ticker, `bookRows()` line, save/load, `__pioneers()` hook |
| `tests/unit/cycle-119-pioneer.test.ts` | new |

### Reuse

`logEvent` ticker channel · the `BookRow` optional-field precedent (303/393/012/443) · the `crossDino` /
`relocate` arrival seams already used by 339/342/452 · the additive-save parse shape from 467.

### Notes

- First write wins (`recordPioneer` returns false on a zone already founded), so L1's "does not overwrite"
  and "does not re-fire" are the same guard.
- The bowl is excluded by construction, not by a special case: nothing records a pioneer at spawn, only at
  arrival (L4).
- No back-fill on load — an old save's zones stay unfounded until someone next crosses (L5).

### Test plan

Unit: first write wins · second arrival no-ops · `pioneerOf` on an unfounded zone is undefined ·
`pioneerLine` names the zone · `bookLines` shows the line only for the pioneer · **L6**: `recordPioneer` on
`HOLLOW_ID` works with no Hollow-specific code (imports the id from `zones.ts`, asserts the rendered line
reads "The Hollow").
E2E: `__startMigration` a dino into a fresh zone, assert the 🚩 ticker line and that `__bookText()` carries
`first across into`.

### Blockers

None.

---

## Shipped (Coder, cycle 119)

Both tracks built. `npm run build` clean; `npx vitest run` **1448/1448** green (+25).

**472 — the fourth ground.** `zones.ts` gained `HOLLOW_ID`, a `ZONES` row, two `ZONE_LINKS` rows, a
`HOLLOW_TINT`, `hollowTileAt` + `hollowPoolTile`, and a `ZONE_TERRAIN` row. `plot.ts` gained a crop row and
a plot tile; `foods.ts` a mushrooms entry; `cropseason.ts` a season row. In `WorldScene` the only edits were
the two per-zone plot maps (now built from `PLOT_TILE_BY_ZONE`'s keys via `emptyPlots`/`emptyPlotStages`
instead of three zone-id literals) and the `hollowPlot` save field. **No cross-zone system was touched** —
prosperity, harvest, demand, pantry, ferry, provider, migration, decline and governance all met the fourth
ground unedited, and the Hollow appears on the lens, the plaque tally and the zone chain off code that
predates it.

**Findings, as promised.** Three anticipated (rotation, plot persistence, the bias/structure seams) plus a
fourth the build surfaced: **six older test files hard-coded "the chain is three long"** — the exact ZONE_LINKS
array, `ZONES.map(id)`, `zoneChain()`, `zoneNeighbors(fernreach)`, `edgeIndicators(fernreach)`, the plaque
tally string, and two save-shape samples. Every one of them failed on the fourth row and every one was a
*test* assumption, not a behaviour break — the production dispatchers all generalized. They are amended to
name the Hollow as the chain's new cold end. That six files of assertions and zero files of logic needed
editing is the cleanest possible answer to the question this item asked.

**343 — first across.** New pure `pioneer.ts` (record / read / render / event / `foundedBy`), wired into
both arrival seams (`crossDino` and `relocate`) through one private `foundZone`, an optional `BookRow.pioneer`,
an additive `pioneers` save field parsed on the 467 shape, and a `__pioneers()` dev hook.

New tests: `cycle-119-fourth-ground.test.ts` (16), `cycle-119-pioneer.test.ts` (9),
`tests/e2e/cycle-119-fourth-ground.spec.ts` (3, covering both tracks).

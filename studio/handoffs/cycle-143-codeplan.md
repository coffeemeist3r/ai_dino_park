# Cycle 143 — Code Plan

Reuse first. Both tracks are additions to tables that already exist and were built to be added to; nothing
here invents a mechanism the park does not already run.

---

## Lore track — BACKLOG-510

### Prior art (checked before writing anything)

| Need | Already exists | Where |
|---|---|---|
| A fixed per-park tile with a sprite on it | `BANK_TILE` + `syncBank` | `world/bank.ts`, `WorldScene.syncBank` |
| Rig-or-glyph per-item fallback | `hasPropArt` / `bakePropArt` / text fallback | `WorldScene.dropFood`, `syncBank`, `drawPlotSprite` |
| The landing roll | `foodLanding` | `world/feeding.ts:176` |
| The art key convention | `PROP_RIGS` string keys | `art/propArt.ts:1137` |

### New file — `game/src/world/hatch.ts`

Pure, no Phaser. Mirrors `world/bank.ts` in shape and in the discipline of stating *why* the tile is where
it is.

- `HATCH_TILE = { tileX: 13, tileY: 6 }`
- `HATCH_ART_KEY = 'hatch'`
- `HATCH_GLYPH` — the stand-in until 502
- `HATCH_SCATTER = 2`
- `hatchLanding(cols: number, rand = worldRand): number` — the landing column, clamped to `[0, cols-1]`.

### Edits

1. **`world/feeding.ts`** — `foodLanding`'s no-column branch calls `hatchLanding(cols, rand)`. Signature,
   row and explicit-column branch unchanged. One import.
2. **`scenes/WorldScene.ts`**
   - import `HATCH_TILE`, `HATCH_ART_KEY`, `HATCH_GLYPH`, `HATCH_SCATTER` from `world/hatch`.
   - `private hatchSprite?: Phaser.GameObjects.Text | Phaser.GameObjects.Image` and a `drawHatch()` that
     builds it once, at `HATCH_TILE`, rig-or-glyph, `setDepth(1)` (under food at 2 and under dinos).
     **One sprite, not one per zone** — unlike the bank, the hatch is the *same object in the same place*
     on every ground, so there is nothing to key by zone and nothing to show or hide on a crossing.
   - call `drawHatch()` in the same setup region that calls `syncBanks()`.
   - `dropFood`: spawn the piece at the hatch's pixel position and tween `{ x: px, y: landY }` instead of
     spawning at `y = TILE * 0.4` and tweening `y` alone.
   - dev hook `__hatch()` returning `{ tile, visible, art }` — the `__bank()` precedent, so the e2e can ask
     about the hatch without reaching into Phaser.

### Tests — lore track

- `game/src/world/hatch.test.ts` (new): the row-equals-`foodLanding`-row assertion; the not-water assertion
  across `zoneChain()`; the fixture-collision assertion (bank, huddle, ruin, every plot tile, every
  `zoneWaterTile`); `hatchLanding` band + clamp at both edges with a stub rand.
- `game/src/world/feeding.test.ts` (extend): no-column landing sits in the band; explicit column still
  exact.
- `tests/e2e/cycle-143-hatch.spec.ts` (new): `__hatch()` reports visible before any drop; after
  `__dropFood()` the landing is within `HATCH_SCATTER` columns of the hatch.

---

## Structure track — BACKLOG-505

### Prior art

449 tabled terrain into `ZONE_TERRAIN` and stated a fourth zone is a row; 472 and 478 each added one that
way. This is the third time and it costs the same.

### Edits

1. **`world/zones.ts`** — `SALTPAN_ID`, the `ZONES` row, the `ZONE_LINKS` pair (appended after the
   `hollow → fernreach` row), `'salt'` added to `TileKind`, `saltpanTileAt`, `saltpanSeepTile`,
   `SALTPAN_TINT`, the `ZONE_TERRAIN` row.
2. **`world/plot.ts`** — `SALTPAN_PLOT_TILE` + its `PLOT_TILE_BY_ZONE` row. `CROP_BY_ZONE` untouched.
3. **`scenes/WorldScene.ts`** — import the new id where the other five are imported. Expected to be the
   *only* scene edit: terrain, tint, plots, banks, councils, residents, lenses and the frontier all read
   `zoneChain()` / the tables. **If the scene needs a second edit, that is a finding** — it means something
   is keyed by zone id rather than by the table, and QA should hear about it.

### Tests — structure track

- `game/src/world/zones.test.ts` (extend): chain order and length; `saltpanTileAt`'s three regions;
  Hollow's primary neighbour unchanged.
- `game/src/world/founding.test.ts` (extend): saltpan present-and-empty in residents and councils.
- `tests/e2e/cycle-143-saltpan.spec.ts` (new): `__unsettled()` is exactly the Saltpan on a fresh boot; the
  map lens carries the badge; the floor bakes whole on the Saltpan with no salt rig.

### Risk register (written before the build, so QA can check the prediction)

- **Expected red:** founding-shaped specs that count grounds or enumerate `zoneChain()` —
  `cycle-136-founding`, `cycle-120-unsettled`, the zone-map lens specs, any `toHaveLength(5)`.
  These change because the park changed. Each edit must *update* an assertion, never weaken one.
- **Watched:** `hopDistances` / `hopToward` (475) now have a six-node graph with the branch and a longer
  line. No edit expected; the specs are the proof.
- **Watched:** the hatch scatter narrows the landing distribution. Feeding-adjacent specs must pass
  unmodified; any that needs editing is reported rather than quietly fixed.
- **Not in scope, deliberately:** no `ZONE_BIAS` row and no structure kind for the Saltpan (the two
  documented back-compat seams the Hollow and Ridge both left alone); no sixth crop; no hatch rig (that is
  BACKLOG-502, the Artist's); no salt rig (BACKLOG-511, the Artist's).

## Blockers

_(none at plan time)_

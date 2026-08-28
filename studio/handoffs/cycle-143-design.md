# Cycle 143 — Design

Two tracks. The lore track gives the park's most-used interaction a place to happen; the structure track
gives the park's frontier a ground to be. They share `WorldScene` and no function.

---

## Lore track — BACKLOG-510: the hatch gets a mouth

### The defect, precisely

`dropFood` (`WorldScene.ts:2026`) picks `foodLanding(COLS, ROWS, col)` — a **uniformly random column**
across the whole map at row `floor(rows * 0.45)` — spawns the piece at `y = TILE * 0.4`, which is *above
the top of the world*, and tweens it down. There is no hatch. The event line says "food dropped from the
hatch" and names a thing that has never existed. Everything downstream of the landing (`startEscort`,
the swarm, `yieldFoodTo`, `gobblerAmong`, the berth, the pecking order, four remembered beats and a Park
News line) reads a position that appears from nowhere and is marked by nothing.

### Spec

**New module `game/src/world/hatch.ts`** — pure, Node-testable, the `world/bank.ts` shape:

- `HATCH_TILE = { tileX: 13, tileY: 6 }`. **The same tile on every ground**, for the same reason the bank
  is: `H` is one key everywhere, so the hatch should be one place everywhere. `tileY = 6` is not a new
  number — it is exactly `floor(ROWS * 0.45)`, the row `foodLanding` has landed food on since cycle 59, so
  **the feeding row does not move** and every spec that pins it stays true.
- `HATCH_GLYPH` — a stand-in glyph until BACKLOG-502's rig exists.
- `HATCH_ART_KEY = 'hatch'` — the `PROP_RIGS` key 502 will claim.
- `HATCH_SCATTER = 2` and `hatchLanding(cols, rand)` returning a column within `HATCH_SCATTER` of
  `HATCH_TILE.tileX`, clamped to the map.

**The landing keeps its randomness.** A fixed landing tile would flatten `startEscort`'s distance read,
`reactionToFood`'s rush/amble split, the berth and the pecking order all at once — five systems made
duller to make one visible, which is the mistake the reachability bar exists to prevent, run backwards.
The piece now scatters *around the hatch* instead of across the map: it still lands somewhere different
each drop, and that somewhere is now within a couple of tiles of a thing you can see.

**`world/feeding.ts`** — `foodLanding` keeps its signature and all four call sites. Its no-column branch
delegates to `hatchLanding` instead of rolling the full width; the explicit-column branch (the crop
harvest at `WorldScene.ts:1816`, which drops a ripe crop at its *plot*) is untouched, and the row stays
`floor(rows * 0.45)`.

**`WorldScene`** —

1. **The hatch stands on the ground from the first frame.** A sprite at `HATCH_TILE` on zone entry and on
   zone change, on the per-item fallback 490/494/496/504 all ship: `bakePropArt` if `hasPropArt('hatch')`,
   the glyph text otherwise. Depth below food and dinos. Drawn for every ground, including the Saltpan.
2. **The drop comes out of it.** The tween starts at the hatch tile's pixel position instead of
   `y = TILE * 0.4`, and travels *along both axes* to the landing tile — food emerges from the hatch and
   settles a tile or two away rather than falling from off-screen. Duration and easing unchanged;
   `foodLanded` still flips on complete, so every timing-sensitive consumer is unmoved.
3. The event line stops lying: it already says "from the hatch" and now there is one.

### Acceptance criteria — lore track

1. `HATCH_TILE.tileY` equals `foodLanding(20, 15).tileY` — asserted, not commented, so the hatch and the
   feeding row cannot drift apart.
2. `zoneTileAt(z, HATCH_TILE.tileX, HATCH_TILE.tileY, 20, 15)` is **not water** for every `z` in
   `zoneChain()` — all six grounds, the Saltpan included. (The bank asserts *grass*; the hatch cannot,
   because the Grove's trail runs through row 6 and the Saltpan is bare crust — and a hatch on a trail or
   on crust is fine, a hatch underwater is not. The assertion is the one that means something.)
3. `HATCH_TILE` collides with no fixture the park pins: the bank `(16,11)`, the huddle `(10,11)`, the
   founding ruin `(4,10)`, every entry in `PLOT_TILE_BY_ZONE`, and every `zoneWaterTile`.
4. `hatchLanding` never returns a column outside the scatter band, and clamps at both map edges.
5. `foodLanding(20, 15)` with no column returns a tile within the scatter band; `foodLanding(20, 15, 2)`
   still returns column 2 exactly (the crop-harvest path is untouched).
6. **e2e:** on a fresh boot, something is rendered at the hatch tile before any food is dropped; after
   `__dropFood()`, the piece exists and comes to rest within `HATCH_SCATTER` columns of the hatch.
7. Full suite green; the feeding, escort, berth, gobble and pecking-order specs pass **unmodified** — if a
   spec has to be edited to accommodate the scatter, that is a finding for QA to report, not a licence.

### Reachability (v7) — what a player sees in a fresh ten-minute save

They press `H`, which is the first key anyone presses in this game, and food **comes up out of a hatch
standing on the ground** instead of dropping out of the sky onto blank grass. The hatch is there before
they press anything, on every ground they walk to. Nothing about this needs a second resident, a day
boundary, or a lens.

---

## Structure track — BACKLOG-505: the frontier gets a ground

### The defect, precisely

BACKLOG-474 built the unsettled ground: `isUnsettled` (no residents **and** no pioneer **and** not the
origin), the map lens's unsettled flag, `UNSETTLED_BADGE`, `unsettledNeighbor` as a migration tier above
the richest-neighbour pick, and `settleMemory` / `settleLine` / `settleEvent` for the arrival. BACKLOG-500
then obeyed CHARTER v7 and put a resident on every ground, so `__unsettled()` returns an empty list at
boot, the badge never lights, the tier never fires and the settling beat has never once played on a
shipping save.

### Spec — the sixth ground

**`world/zones.ts`:**

- `SALTPAN_ID = 'saltpan'`; `ZONES` gains `{ id: SALTPAN_ID, name: 'The Saltpan' }`.
- `ZONE_LINKS` gains the pair hollow-east-to-saltpan and saltpan-west-to-hollow, **appended after** the
  hollow-to-fernreach row so first-match keeps the Hollow's primary neighbour as the Fernreach — the
  discipline 378, 472 and 478 each used, and the reason every single-neighbour default path stays
  byte-identical.
- `TileKind` gains a `salt` kind. Like `fern` at 399 it has no entry in `TILE_RIGS`, so it bakes through
  the existing flat-checker fallback until BACKLOG-511 draws it — adding the kind cannot break the floor.
- `saltpanTileAt(x, y, cols, rows)` — laid out unlike all five others on purpose. Where they are grass with
  a feature cut into it, the Saltpan is **crust with grass only at its edge**:
  - a **brine seep**, a 2x2 block at columns `cols-5..cols-4`, rows 3..4;
  - a **grass fringe** on the west two columns, where the Hollow's fen drains in — the seam the player
    crosses from;
  - salt everywhere else.
- `saltpanSeepTile(cols)` returning the seep block's north-west tile, the zone's water landmark.
- `SALTPAN_TINT = 0xf2efe2` — pale and bleached, the only tint in the park lighter than the Ridge's.
- `ZONE_TERRAIN` gains its row. Note what is **not** in it, exactly as the Hollow and the Ridge noted it:
  no `ZONE_BIAS` entry and no structure kind. Those are documented back-compat seams, and a frontier that
  shipped its own resource would be a different item.

**`world/plot.ts`:** `SALTPAN_PLOT_TILE = { tileX: 3, tileY: 12 }` and its `PLOT_TILE_BY_ZONE` row.
`CROP_BY_ZONE` is left alone — its documented bowl fallback is the right answer for a ground nobody farms
yet, and inventing a sixth crop is not this item.

**Founding:** nothing. No roster entry, no `FOUNDING_PILES`, no `FOUNDING_BANKED`. The Saltpan boots empty,
which is the entire point — and `foundingResidents` / `foundingCouncils` must show it **present and empty**
rather than absent, the discipline 497 and 500 both set.

**On CHARTER v7's third change.** "Every ground the player can walk to has life on it at boot" is a rule
about the *cast being spread*, written against five grounds where four stood empty. This ground is life's
**destination**, not its omission: it is the one ground in the park that is supposed to be empty, for as
long as it takes somebody to walk there, and BACKLOG-505 — filed by the Validator, and naming a sixth
ground as its first honest candidate — is the authority for that. The park still ships with every
*settled* ground populated. The Saltpan is populated by the player watching it happen.

### Acceptance criteria — structure track

1. `zoneChain()` returns six grounds, in order bowl, grove, fernreach, hollow, saltpan, ridge — the
   Saltpan on the line's east end, the Ridge still appended as the branch.
2. Every pre-existing single-neighbour default is unchanged: `otherZone('hollow')` and `linkEdge('hollow')`
   still answer the Fernreach and west.
3. `saltpanTileAt` returns water exactly on the seep block, grass exactly on the west fringe, and salt on
   every other tile; `saltpanSeepTile` lands inside the water block (the table-driven invariant in
   `cycle-108-terrain-table.test.ts` covers this automatically once the row exists).
4. `zoneTileAt('saltpan', ...)` resolves through the table, and the floor bakes whole with no salt rig
   present — the flat-checker fallback, proven by a test rather than assumed.
5. **`__unsettled()` returns exactly the Saltpan on a fresh boot** — the assertion this whole item exists
   for. It returned nothing last night.
6. The map lens marks the Saltpan unsettled and carries `UNSETTLED_BADGE` on a fresh save.
7. `scarcityDestOf('hollow')` returns the Saltpan — the frontier tier outranks the richest neighbour, from
   the first tick, with no state set up by hand.
8. A Hollow resident who migrates to the Saltpan records a pioneer, files `settleMemory` and speaks
   `settleLine`; after that the ground reads settled forever (the "unsettled is stricter than empty"
   invariant 474 wrote).
9. `foundingResidents()` and `foundingCouncils()` both carry a saltpan key with an empty value.
10. Full suite green. The founding-shaped specs are the expected casualties (`cycle-136-founding`,
    `cycle-120-unsettled`, the zone-count and lens specs); each one that changes must change because the
    park changed, and QA reports any spec that had to be *weakened* rather than *updated*.

### Reachability (v7) — what a player sees in a fresh ten-minute save

Four things, none of which existed last night: the zone map shows a **sixth ground** and lights the
unsettled badge on it for the first time in the park's shipping history; the frontier migration tier has a
target from the first tick, so a Hollow resident sets out for a ground nobody has stood on and the ticker
narrates it; on arrival `settleLine` and `settleMemory` fire for the first time ever; and the player can
walk east until the grass stops and stand on bare crust under a bleached sky.

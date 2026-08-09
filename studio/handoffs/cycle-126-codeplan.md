# Cycle 126 — Code Plan

Land the **structure track first** (it owns `zones.ts` and five signature changes); the lore track is a new
module plus one isolated region of `WorldScene`.

---

## Structure track — BACKLOG-478 (The Sunward Ridge)

### Files

**`game/src/world/zones.ts`** (the bulk)
- `export const RIDGE_ID = 'ridge'`; `ZONES` row `{ id: RIDGE_ID, name: 'The Sunward Ridge' }`.
- `export type Edge = 'east' | 'west' | 'north' | 'south'`.
- `ZONE_LINKS` += `{ from: GROVE_ID, edge: 'north', to: RIDGE_ID }`, `{ from: RIDGE_ID, edge: 'south', to: GROVE_ID }`.
  **Append after** the grove's existing two rows so `linkEdge(GROVE_ID)`/`otherZone(GROVE_ID)` (first-match)
  still answer `'west'`/bowl — the same discipline 378 and 472 used.
- `crossing(px, py, cols, rows, tile)` — new signature. Order: east, west, south, north (any order is fine;
  the clamps are disjoint). Vertical: `py > rows*tile - tile/2 → 'south'`, `py < tile/2 → 'north'`.
- `linkedZone(zoneId, edge, px, py, cols, rows, tile)` — new signature (it previously took only `py`, since
  x was derived and y preserved). Horizontal: as today (`x` from edge, `y = py`). Vertical: `y = edge ===
  'south' ? tile*1.5 : rows*tile - tile*1.5`, `x = px`.
- `nearLinkEdge(zoneId, tile, cols, rows, band = 1)` — add `rows`; `'north' && tileY <= band`,
  `'south' && tileY >= rows - 1 - band`.
- `edgeIndicators` — `'north' → '▴ ' + name`, `'south' → name + ' ▾'`.
- `migrationStepTarget(homeZone, row, cols, edge, rows)` / `atMigrationEdge(homeZone, tile, cols, edge, rows)`
  / `crossEntryTile(homeZone, row, cols, edge, rows)` — these currently key on the *row* for horizontal
  edges. For vertical edges the preserved axis flips: the migrant keeps its **column** and targets row 0
  (north) / `rows-1` (south); entry is row `rows-2` (north crossing → enters destination's south side) /
  row `1` (south crossing). Simplest honest shape: have all three take the dino's **current tile** rather
  than a bare row. Do that — change the parameter to `tile: Tile` and derive. Three call sites, all in
  `WorldScene`.
- `zoneChain()` — **no logic change**. Rewrite the doc comment: trunk walk west→east plus unreached-append;
  it is an *iteration/drawing* order, never a distance or a direction. Callers wanting direction use
  `hopToward` + the link edge.
- New `ridgeTileAt(x, y, cols, rows)`: switchback trail = `path` at `x === Math.floor(cols/2)` or
  `x === Math.floor(cols/2)+1` for all y (a vertical trail — unlike the grove's horizontal one); tarn =
  `water` block `x∈[2,4], y∈[rows-4, rows-3]` (south-west; unlike every other zone's water). Everything else
  grass.
- `ridgeTarnTile(rows)` → `{ tileX: 3, tileY: rows - 4 }` (pinned by the cycle-108 terrain-table invariant).
- `RIDGE_TINT = 0xf0d2b4` (a high, sun-bleached warm wash; distinct from FERNREACH's 0xd9c98c sand and the
  grove's cool green).
- `ZONE_TERRAIN[RIDGE_ID] = { tileAt: ridgeTileAt, tint: RIDGE_TINT, water: (_c, rows) => ridgeTarnTile(rows) }`.
  **No `ZONE_BIAS` row** in `resource.ts` (the documented Hollow seam) — leave it out on purpose.

**`game/src/world/tic.ts`** — the called-in-advance finding.
- `griefEdge(dinoZone, friendZone)`: drop the `zoneChain()` index comparison. New body: `hopToward(dinoZone,
  friendZone)` → the next hop; find the `ZONE_LINKS` row `from === dinoZone && to === nextHop` → its `edge`.
  Same zone / unreachable / unknown → null. This preserves every existing east/west answer (a linear chain's
  next hop *is* in the chain direction) and is correct on a fork.
- `griefAnchor(edge, tile, cols, rows)` — takes the dino's tile + `rows`: west → col 0, east → col cols-1,
  north → row 0, south → row rows-1, with the *other* axis preserved from the dino's tile.
- Imports move from `zoneChain` to `hopToward` (`./distance`) + `ZONE_LINKS`. **Check for an import cycle:**
  `distance.ts` imports `zones.ts` only, so `tic.ts → distance.ts → zones.ts` is acyclic.

**`game/src/world/plot.ts`** — `RIDGE_PLOT_TILE: Tile = { tileX: 12, tileY: 3 }` (clear of the trail columns
and the tarn); `CROP_BY_ZONE[RIDGE_ID]`, `PLOT_TILE_BY_ZONE[RIDGE_ID]`. Crop: **`'seeds'` / 🌰** — the Coder
must confirm `seeds` exists in `world/foods.ts`; if it does not, add the food row (additive) or reuse an
existing id rather than inventing a dangling one.

**`game/src/world/cropseason.ts`** — the Ridge's season row (mirror the Hollow's shape).

**`game/src/world/struck.ts`** — `KEEPSAKE[RIDGE_ID]` glyph (a keepsake for the ground you came from; a
missing row silently degrades the 347 beat). Pick a glyph disjoint from the existing four.

**`game/src/scenes/WorldScene.ts`** — call sites only:
- `import { RIDGE_ID }` where the other zone ids are imported (only if referenced; the save key needs it).
- `tryCrossZone()` (≈4657): `crossing(this.player.x, this.player.y, COLS, ROWS, TILE)` and the new
  `linkedZone(…, this.player.x, this.player.y, COLS, ROWS, TILE)`.
- `nearLinkEdge(…, COLS, ROWS, 0)` (≈3646).
- migration trio (≈3369/3372/5167): pass the dino's current tile + `ROWS`.
- `griefAnchor` (≈3541): pass `cur` + `ROWS`.
- `drawEdgeLabels()` (≈6453): position by edge — west left/mid-height, east right/mid-height, north
  top-centre (`origin 0.5, 0`), south bottom-centre (`origin 0.5, 1`).
- Save: `ridgePlot: this.plotByZone[RIDGE_ID]` on write; `[RIDGE_ID]: save.ridgePlot ?? null` on read.
  Additive — old saves have no key and load.
- Dev hook check: `__setZone` must accept `'ridge'` (it takes an id string — verify no whitelist).

**`game/src/world/homesick.ts`** — uses `griefEdge`; signature unchanged, no edit expected. Verify.

### Tests

New: `tests/unit/cycle-126-fork.test.ts`
- `zoneNeighbors(GROVE_ID)` length 3, edges `['west','east','north']`.
- `hopDistances(BOWL_ID)` exact object incl. ridge 2; `hopsBetween` symmetry ridge↔hollow = 3.
- `hopToward` bowl→ridge = grove; grove→ridge = ridge; hollow→ridge walk terminates in ≤5 and equals
  `[hollow, fernreach, grove, ridge]`.
- `nearestQualifying(GROVE_ID, [HOLLOW_ID, RIDGE_ID], () => true) === RIDGE_ID`.
- `zoneChain()` has 5 unique ids incl. ridge.
- `crossing` north/south and unchanged east/west; `linkedZone` grove-north entry.
- `griefEdge(GROVE_ID, RIDGE_ID) === 'north'`, `griefEdge(RIDGE_ID, BOWL_ID) === 'south'`, and the four
  pre-478 pairs unchanged; `griefAnchor` vertical.
- `livableTiles`/`zoneCapacity` for the ridge, with no `capacity.ts` edit.
- Terrain-table invariant covers the ridge (extend `cycle-108-terrain-table.test.ts` if it enumerates ZONES).

Amend (expect these; **each amendment gets a line in the QA report**): `game/src/world/distance.test.ts`,
`game/src/ui/lenses.test.ts`, `game/src/world/frontier.test.ts`, `game/src/world/struck.test.ts`,
`tests/unit/cycle-084-zone-adjacency.test.ts`, `cycle-085-third-zone.test.ts`,
`cycle-090-edge-indicators.test.ts`, `cycle-091-zone-map.test.ts`, `cycle-108-terrain-table.test.ts`,
`cycle-119-fourth-ground.test.ts`, `cycle-122-distance.test.ts`, `plaque.test.ts`, plus any zone-count
assertion the run surfaces. Do **not** pre-emptively edit — run the suite and let it name them.

New e2e: `tests/e2e/cycle-126-fork.spec.ts` — `__setZone('grove')`, drive the keeper north off the top edge,
assert the plaque reads The Sunward Ridge; walk back south, assert the Grove. Assert the Grove shows 3 edge
labels and the Ridge 1. Use the 456 ambient hold.

---

## Lore track — BACKLOG-424 (Traces of your pacing)

### Files

**`game/src/world/traces.ts`** (new, pure)
```ts
export interface PaceTrace { zone: string; tileX: number; tileY: number; by: string; at: number }
export const TRACE_FRESH_STEPS = 40;   // calibration knob: ~2× TIC_AFTER_STEPS
export const TRACE_RADIUS = 1;
export function recordTrace(list: PaceTrace[], t: PaceTrace): PaceTrace[]  // drops any prior trace by `t.by`, appends
export function freshTraces(list: PaceTrace[], now: number): PaceTrace[]
export function traceNear(list, zone, tile, by, now): PaceTrace | null      // freshest, other-dino, in-zone, within radius
export function traceMemory(): string   // "the ground here is scuffed — someone was pacing this spot, not long ago"
export const TRACE_GLYPH = '👣';
export function traceKey(t: PaceTrace): string  // `${t.by}:${t.at}` — the once-per-trace-per-dino guard
```
Freshest wins on ties by later `at`, then by list order — no randomness.

**`game/src/scenes/WorldScene.ts`**
- Field `private paceTraces: PaceTrace[] = []` (transient, not saved) and
  `private noticedTraces = new Set<string>()` keyed `` `${dino}|${traceKey}` ``.
- At the existing `ticInvented.add(name)` site: `this.paceTraces = recordTrace(this.paceTraces, { zone,
  tileX, tileY (the tic anchor), by: name, at: this.stepCount })`. Reuse whatever monotonic step counter the
  scene already keeps for `soloSteps`/ambient; if none is directly usable, add one incremented in the same
  ambient step handler (do not add a timer).
- In the ambient wander step handler (after a dino's tile updates, gated by the same ambient pause):
  `traceNear(...)` → if hit and the guard key is unseen, mark seen, `floatGlyph(d, TRACE_GLYPH)` via the
  existing float helper, and file `traceMemory()` through the existing `remember(...)` path.
- Dev hooks: `__traces()`, `__leaveTrace(name)`, `__noticeTraces()` (returns `Array<{name, filed}>`).

### Tests

New `tests/unit/cycle-126-traces.test.ts` — every acceptance bullet: replace-own-trace, freshness expiry,
self-exclusion, radius 1 vs 2, zone scoping, freshest-wins, memory string contains "someone" and no cast name.

New `tests/e2e/cycle-126-traces.spec.ts` — `__leaveTrace('A')`; place `B` on that tile via the existing
positioning hook; `__noticeTraces()` → B filed; call again → no second file; `__leaveTrace('A')` +
`__noticeTraces()` → A files nothing.

---

## Reuse (prior art checked)

- Adjacency/hops: `zones.ts` + `distance.ts` — **no new distance table** (the 449/475 rule).
- Capacity, prosperity, harvest, demand, ferry, migration, decline, governance: untouched; the Ridge arrives
  through `ZONES`/`ZONE_TERRAIN`/`ZONE_LINKS` only. If any of them needs an edit, that is the finding.
- Floats/memory/ambient-pause: existing `WorldScene` helpers; no new UI primitive for 424.
- No new dependency. No `web-llm` import outside `game/src/ai/`.

## Order of work

1. `zones.ts` (ids, links, Edge, terrain, five signatures) → build.
2. `tic.ts` `griefEdge`/`griefAnchor` → build.
3. `plot.ts` / `cropseason.ts` / `struck.ts` rows.
4. `WorldScene` call sites + edge labels + save key.
5. Run `npx vitest run`; fix **assertions**, not behaviour; log each amendment.
6. `traces.ts` + `WorldScene` wiring + hooks.
7. New unit specs, then `npx --yes kill-port 5173 && npx playwright test`.

## Blockers

_(none at plan time)_

---

## Shipped (Coder, 2026-08-09)

**Source touched (8):** `world/zones.ts`, `world/tic.ts`, `world/traces.ts` (new), `world/plot.ts`,
`world/foods.ts`, `world/cropseason.ts`, `world/struck.ts`, `world/saveGame.ts`, plus
`scenes/WorldScene.ts` glue. New specs: `tests/unit/cycle-126-fork.test.ts`,
`tests/unit/cycle-126-traces.test.ts`, `tests/e2e/cycle-126-fork.spec.ts`,
`tests/e2e/cycle-126-traces.spec.ts`.

**Deviations from the plan, and why:**

1. **The Ridge's crop declares a season after all.** The plan said "no `CROP_SEASON` row — the Ridge is
   the one ground the year doesn't move", reasoning that all four seasons were already spoken for. The
   cycle-118 invariant (*a new crop must declare a year*) refused it, and was right to: that rule exists so
   a silent fall-through can never pass itself off as a design decision. Seeds now declare
   `{ good: 'summer', lean: 'winter' }` — the high sunward ground thrives under the same sun as the bowl's
   berries and gives nothing off a frozen summit.
2. **…which broke a different invariant, and that is the second finding.** Two specs asserted *every season
   has **exactly one** thriving crop*. With four crops and four seasons that is arithmetic, not design — a
   rotation of four cannot be anything else, so the assertion could never distinguish a rule from a counting
   coincidence. Five crops make it unsatisfiable. Relaxed to *every season has **a** thriving crop* (no
   season is barren), with the specific per-season winners still pinned, plus a new assertion naming summer
   as the doubled-up season.
3. **`zoneChain()` needed no logic change** — 425's append-the-unreached fallback, written for a
   hypothetical orphan zone, is exactly what carries a genuine branch onto the lens. Its doc comment and
   three specs now say out loud that it is an iteration order, never a direction.
4. `griefEdge` landed as planned (graph read via `hopToward`), and it was a real defect: on a forked map the
   old chain-index comparison would have sent a Grove dino grieving a Ridge friend to pace at the **east**
   wall.

**Blockers:** none.

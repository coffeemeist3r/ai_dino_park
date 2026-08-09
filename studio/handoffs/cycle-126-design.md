# Cycle 126 — Design

Two tracks, as ever. The lore track gives a private ritual a **residue**; the structure track puts the
first **fork** in a chain that has been a straight line for eleven milestones.

---

## Lore track — BACKLOG-424

**Item:** BACKLOG-424 [emergent] Traces of your pacing — a dino that arrives where another was *lately*
ticcing files a faint "someone was pacing here", so a ritual leaves a mark a friend can stumble on.

### Why this cycle

Milestone 12's lore half is about a dino being somebody in particular. Cycle 125 shipped arc 1 (370 — the
loner who leans on *you*). Arc 2 is the one that reaches sideways instead of at the keeper: since 405 every
dino has had a signature tic keyed to its most-pronounced trait, and since 414 that tic can even aim at the
edge a departed friend left by — and in every one of those cycles the ritual has been visible to exactly one
observer, the player. No dino has ever known another dino paces. 407 tried to fix that by having a dino
*watch* another mid-ritual and was found unbuildable: the tic is a solitary state by construction (405's
`undisturbed` requires no company within `TIC_COMPANY_RANGE`), so a witness ends the very thing it would
witness. 424 is the re-shape that respects that: nobody watches. The **ground** remembers. A dino paces a
spot, leaves, and some time later another dino wanders across the scuffed patch and files a faint,
*unnamed* trace. The anonymity is the design, not a shortcut — "someone was pacing here" is the read the
park can honestly support, and a named witness is the thing 407 proved impossible.

### What ships

- A new pure module `game/src/world/traces.ts`: a small ring of **pacing traces**, each a zone + tile + who
  left it + the world-step it was left on. Recording, expiry-by-freshness, and the proximity read all live
  here and are unit-tested with no Phaser and no clock.
- When a dino **invents its tic** (the existing `ticInvented` moment in `WorldScene`), it records a trace at
  its tic anchor, in its current zone. One live trace per dino: re-inventing replaces its own older mark
  rather than littering.
- When any *other* dino's wander step lands within `TRACE_RADIUS` (1 tile) of a trace that is still **fresh**
  (left within `TRACE_FRESH_STEPS` world steps), that dino floats a 👣 above itself and files one memory:
  *"the ground here is scuffed — someone was pacing this spot, not long ago"*. The pacer is deliberately
  unnamed.
- **Once per trace per dino.** A dino loitering on a scuffed tile does not re-file every step; the beat reads
  as a discovery, not a tic of its own.
- A dino never notices **its own** trace.
- The memory rides the existing per-dino memory ring, so it can surface later in the greeting/reflection path
  exactly like every other filed memory — which is the whole point: one dino's private habit becomes
  something another dino can eventually *mention*.
- Dev hooks for deterministic e2e: `__traces()` (the live ring), `__leaveTrace(name)` (force-record at the
  dino's current tile), `__noticeTraces()` (run the proximity scan once, returning who noticed what).

### Acceptance criteria

- [ ] `traces.ts` is pure — no Phaser, no `Math.random()`, no WebLLM import; unit-tested in Node.
- [ ] Recording a trace for a dino that already has one **replaces** it (ring holds at most one live trace per dino).
- [ ] A trace older than `TRACE_FRESH_STEPS` is not returned by the proximity read.
- [ ] The proximity read returns a trace only for a dino **other than** the one that left it.
- [ ] The proximity read matches within a 1-tile radius (8-neighbourhood + the tile itself) and not at 2 tiles.
- [ ] The proximity read is zone-scoped: the same tile coordinates in a different zone do not match.
- [ ] When two fresh traces are in range, the **freshest** is returned (deterministic, no tie randomness).
- [ ] The filed memory string names no dino (asserted: it contains "someone", and contains no cast name).
- [ ] E2E: `__leaveTrace('A')`, walk/place `B` on that tile, `__noticeTraces()` → `B` has the trace memory and a 👣 float; running `__noticeTraces()` again does **not** file a second copy for `B`.
- [ ] E2E: a dino does not notice its own trace (`__leaveTrace('A')` then `__noticeTraces()` files nothing for `A`).
- [ ] No save-format change (traces are transient, like all other 405 tic state).

### Out of scope

- Naming the pacer, or any read of *who* left the mark (that is 407's unbuildable shape; if a later item wants
  it, it needs a durable "who was here" record and a bond gate, not a witness).
- A visible ground decal / scuff texture. The beat reads through the 👣 float and the memory; a terrain overlay
  is an `[art]` ask and would need a tile kind.
- Gossip: a trace does not enter the rumor spine this cycle.
- Persisting traces across a save/load.

### Constraints

- Must not change `undisturbed`, `inventsTic`, or any existing tic threshold — 405/408/413/414 behaviour is
  byte-identical; this only *observes* the moment the tic is invented.
- Notice scan must respect the ambient pause (`__pauseAmbient`) like every other ambient beat, so the
  parallel-load e2e seam (456) still holds.
- File overlap with the structure track: **`WorldScene.ts` only**, and in a different region (the tic/step
  path vs. the zone/crossing path). No shared module. Coder should land the structure track first (it is the
  larger diff and touches `zones.ts`, which the lore track does not).

---

## Structure track — BACKLOG-478

**Item:** BACKLOG-478 [core] The chain forks — a fifth ground hanging off the *middle* of the chain, so a zone
genuinely has two onward neighbours and every general cross-zone read is finally exercised against a graph
rather than a line.

### Why this cycle

Everything cross-zone in this park is written to generalize and has never been *tested* generalizing.
`ZONE_LINKS` is called an adjacency graph and has only ever encoded a path: bowl↔grove↔fernreach↔hollow, one
east link each. `zoneChain()` derives the drawing order by literally following east links from the westmost
zone. `hopDistances()` (475) is a breadth-first search over data with no branch in it, and `hopToward()`
documents a deterministic tie-break for "a future branching map" that has never once had a tie to break. The
M10 finding was that the code generalizes and the *assertions* don't. Cycle 125 deliberately spent the
structure slot on the e2e seam (456) so this cycle could add a fork to a suite that can be trusted. This is
the item that finds out.

### What ships

**The Sunward Ridge** — a fifth ground reached by walking **north** out of the Grove, the first link in this
park's life that is not east/west. The Grove becomes the fork: west to the bowl, east to the Fernreach, north
to the Ridge.

1. **A vertical edge exists at all.** `Edge` gains `'north' | 'south'`. Every zone helper that assumed a
   horizontal edge learns the other axis:
   - `crossing()` takes the keeper's `py` and `rows` and can return `'north'`/`'south'`.
   - `linkedZone()` returns a vertical entry point (one tile in from the opposite edge, **x** preserved) for a
     vertical crossing, mirroring what it already does horizontally.
   - `nearLinkEdge()` reads `tileY` against `rows` for vertical links.
   - `migrationStepTarget()` / `atMigrationEdge()` / `crossEntryTile()` take `rows` and target row 0 / last
     row for north / south, so a *dino* can migrate across the fork on foot exactly as it crosses east.
   - `edgeIndicators()` labels a north link `▴ The Sunward Ridge` and a south link `The Grove ▾`, and
     `drawEdgeLabels` places vertical labels at top-centre / bottom-centre instead of the mid-height sides.
2. **The ground itself, as data** — the 449 promise, cashed a second time: a `ZONES` row, a `ZONE_TERRAIN`
   row (its own `ridgeTileAt` layout + `RIDGE_TINT` + its own water landmark), two `ZONE_LINKS` rows
   (grove→north→ridge, ridge→south→grove), a `PLOT_TILE_BY_ZONE` + `CROP_BY_ZONE` row, its `cropseason` row,
   and its keepsake glyph row. Layout must be **unlike** the other four (bowl NW waterhole; grove NE pond +
   mid trail; fernreach west creek + south scrub; hollow centre-south pool + north fen): the Ridge gets a
   **switchback trail running vertically down the centre** and a **small tarn in the south-west**, no scrub.
   Capacity, prosperity, harvest, demand, migration, decline, governance, the pantry and the ferry all get
   the Ridge for free or the item has failed.
3. **`griefEdge` stops reading the chain and reads the graph.** Today it compares `zoneChain()` indices and
   answers `'east'`/`'west'`. A branch zone is appended to the chain by the unreached-fallback, so on a
   forked map that comparison returns a direction that does not exist — a grieving Grove dino whose friend
   crossed north would pace at the *east* wall. It must instead take the link edge of `hopToward(dinoZone,
   friendZone)`, and `griefAnchor` must resolve a vertical edge to the top/bottom row. This is the expected
   shape of the finding, called in advance in the structure handoff; if the Coder finds more of them, each is
   a line in the QA report.
4. **`zoneChain()` keeps its contract, explicitly.** It stays the trunk walk plus the unreached-append, which
   already puts the Ridge on the lens and in every `for (const z of zoneChain())` park sweep in `WorldScene`.
   What changes is that its doc comment stops implying "the park is a line" and says what it now is: **trunk
   order first, branches appended** — a *drawing/iteration* order, never a distance or a direction. A unit
   test pins that the Ridge is present exactly once and that no caller uses chain adjacency for direction.

### Acceptance criteria

- [ ] `npm run build` clean; no `@mlc-ai/web-llm` import outside `game/src/ai/`.
- [ ] `zoneNeighbors(GROVE_ID)` returns **three** links (west→bowl, east→fernreach, north→ridge).
- [ ] `hopDistances(BOWL_ID)` = bowl 0, grove 1, fernreach 2, ridge 2, hollow 3 — a genuine branch at depth 1.
- [ ] `hopToward(BOWL_ID, RIDGE_ID) === GROVE_ID`; `hopToward(GROVE_ID, RIDGE_ID) === RIDGE_ID`; walking `hopToward` from the Hollow to the Ridge terminates in ≤ 5 steps and yields hollow→fernreach→grove→ridge.
- [ ] `hopsBetween(RIDGE_ID, HOLLOW_ID) === 3` and is symmetric.
- [ ] `nearestQualifying(GROVE_ID, [HOLLOW_ID, RIDGE_ID], ok)` picks the Ridge (1 hop) over the Hollow (2) — the first assertion in this repo where the nearest ground is not simply the next one east.
- [ ] `zoneChain()` contains all five ids, each exactly once, and includes the Ridge.
- [ ] `crossing()` returns `'north'` above the top clamp and `'south'` below the bottom one, and is unchanged for east/west.
- [ ] `linkedZone(GROVE_ID, 'north', …)` returns the Ridge with an entry one tile in from the Ridge's **south** edge, x preserved.
- [ ] `griefEdge(GROVE_ID, RIDGE_ID) === 'north'`, and `griefAnchor('north', col, rows)` is on row 0 — the pre-478 east/west cases are unchanged.
- [ ] `livableTiles(RIDGE_ID, …)` > 0 and `zoneCapacity(RIDGE_ID, …)` ≥ 1 with no edit to `capacity.ts` (derived, per 476).
- [ ] The Ridge has its own crop row, its own plot tile, its own water landmark, and its own tint; `zoneTileAt(RIDGE_ID, …)` is non-null.
- [ ] The Ridge appears as its own row/box on the zone-map lens with its population.
- [ ] E2E: from the Grove, walking off the **north** edge lands the keeper in The Sunward Ridge; walking back south returns to the Grove at the entry column.
- [ ] E2E: the Grove shows three edge indicators (two side, one top); the Ridge shows one (bottom).
- [ ] Save is additive: a pre-478 save loads with no Ridge plot and no error; a new save round-trips the Ridge plot.
- [ ] Every test file amended to accommodate a fifth/branching zone is **listed by name in the QA report**, with one line on what the old assertion assumed. That list is the deliverable, not a chore.

### Out of scope

- A resource kind / `ZONE_BIAS` row for the Ridge (it falls through the documented back-compat seam exactly
  as the Hollow does — a fourth resource kind drags in recipes, barter and an art rig).
- A new `TileKind`. The Ridge is built from `grass` / `path` / `water`; a rock kind is an `[art]` ask.
- Re-drawing the zone-map lens as a graph. The lens stays a list in `zoneChain()` order with the branch
  appended; a genuine branching lens layout is its own item and should be seeded if the Validator sees the
  need.
- Any second branch, or a fork with no way back (the Ridge is a proper two-way link).

### Constraints

- **Additive save only.** New plot key defaulted, old saves load.
- Behaviour on the four existing grounds must be byte-identical: every pre-478 unit assertion about
  bowl/grove/fernreach/hollow hops, crossings and migration still passes unchanged. Where one does not, that
  is a finding to report, not an assertion to quietly rewrite — the QA report must say why the old value was
  wrong rather than merely different.
- `crossing`, `nearLinkEdge`, `migrationStepTarget`, `atMigrationEdge` and `crossEntryTile` are signature
  changes; update every call site rather than adding a parallel vertical twin (the 449 lesson — one table,
  one helper, not two).
- File overlap with the lore track: `WorldScene.ts` only. Land this track first.

# Cycle 119 — Design

Two tracks. Structure lays the fourth ground (472); lore remembers who got to a ground first (343).
Milestone 10, arc 1 of each track.

---

## Structure track — BACKLOG-472: The fourth ground

### Intent

449 (cycle 108) folded three hand-written terrain functions into one `ZONE_TERRAIN` table and wrote the
promise in its own header: *a fourth zone is a row*. Ten cycles of chain economy have been built on top of
that claim without ever testing it. The deliverable is **the row plus the proof**: add a fourth zone as
data, and let prosperity (428), harvest (433), demand (438), the pantry (446), the ferry (447), the
provider (448), migration (450), decline (460) and governance (463/467/468) meet it with **zero lines
written for them**. Where a line *is* required, that line is the finding and must be called out in the
codeplan, not quietly patched.

### The ground

- **Id `hollow`, name "The Hollow"** — a damp, sunken fen east of the Fernreach, the cold end of the chain.
  Chain becomes bowl → grove → fernreach → hollow.
- **Adjacency:** two `ZONE_LINKS` rows (`fernreach` east → `hollow`, `hollow` west → `fernreach`). The
  Fernreach's existing west→grove row stays first so `linkEdge`/`otherZone` first-match behaviour for the
  Fernreach is unchanged.
- **Terrain** (`hollowTileAt`, deliberately unlike the other three): a **fen rim** of `fern` scrub across
  the northern band (y ∈ [1,2], full width) and a **standing pool** of `water` centre-south
  (x ∈ [7,11], y ∈ [rows−5, rows−4]). Everything else grass. No `path`.
- **Tint:** a cold slate-blue wash (`HOLLOW_TINT`), distinct from the grove's cool green and the
  Fernreach's warm sand.
- **Water landmark:** `hollowPoolTile(rows)` → the pool's centre, so thirst (371/436/445) resolves locally.
  Must satisfy the cycle-108 table-driven invariant (the landmark tile *is* a water tile of `tileAt`).
- **Crop:** a new food **`mushrooms` 🍄 "cave mushrooms"** (plant), `CROP_BY_ZONE[hollow] = { food:
  'mushrooms', ripe: '🍄' }`, plot tile clear of the rim and the pool.
- **Deliberately NOT added:** a fourth `ZONE_BIAS` resource kind and a fourth built structure. The Hollow
  falls through the documented back-compat seams — uniform branch/stone gathering, and it builds the
  default cairn. A fourth resource kind drags in recipes, barter, craft escalation and an art rig; that is
  its own item, not a rider on this one. State the deferral in the source.

### The finding this item was written to produce (call it out, don't hide it)

The per-crop seasonal rotation (465, cycle 118) was written for **exactly three** crops: its test asserts
every non-spring season has exactly one thriving and one thin crop, and that **spring is the hinge** — no
crop names it — so a fresh boot banks what it always banked. A fourth crop cannot satisfy both as written.

**Resolution:** the fourth crop takes the empty season. `mushrooms: { good: 'spring', lean: 'fall' }`,
giving a clean 4 crops × 4 seasons rotation — every season now has exactly one thriving ground and exactly
one thin one, spring included. The spring hinge's *purpose* is preserved exactly: it existed so the three
founding crops bank identically on a fresh boot, and berries/greens/roots still name no spring. The
cycle-118 test is amended to say what it always meant — the **founding three** keep spring neutral — and
its rotation assertion generalizes from the three non-spring seasons to all four. This is a genuine
generalization, not a fudge, and it must be argued in the codeplan and the verdict.

### Acceptance criteria (structure)

- **S1.** `ZONES` has four rows; `zoneChain()` returns `[bowl, grove, fernreach, hollow]` west→east.
- **S2.** The keeper can walk off the Fernreach's east edge into The Hollow and back west; edge indicators
  read `The Hollow ▸` in the Fernreach and `◂ The Fernreach` in the Hollow, with **no UI code changed**.
- **S3.** The Hollow's floor bakes its own terrain: fen rim north, pool centre-south, slate tint; a fresh
  boot's bowl/grove/Fernreach floors are byte-identical to before.
- **S4.** `zoneWaterTile('hollow', …)` returns a tile that `zoneTileAt` reports as `'water'` (the cycle-108
  table invariant passes for all four zones), so a thirsty Hollow resident drinks locally.
- **S5.** The Hollow farms mushrooms: `cropOf('hollow').food === 'mushrooms'`, its plot plants/ripens/
  harvests through the existing per-zone plot path, and the harvest banks into the Hollow's own store.
- **S6.** Every season has exactly one thriving and exactly one thin farmed crop, across all four seasons;
  `cropYield` for berries/greens/roots in spring is still `YIELD_BASE`.
- **S7.** The zone-map lens shows four boxes, with the Hollow's population, banked food, prosperity tier
  and spend-policy glyph rendered by the **existing** lens code (no per-zone branch added).
- **S8.** Adding `mushrooms` to `FOODS` flips **no** roster dino's favorite food in any season (the
  061/170/418/432 verdicts hold) — pinned by a test over the roster × four seasons.
- **S9.** Save is additive: an old save loads with no Hollow plot and no errors; a new save round-trips the
  Hollow's plot, store, and policy.
- **S10.** Any file that needed a line written *for the fourth zone specifically* is listed in the codeplan
  under "findings". The target is: zones.ts, plot.ts, foods.ts, cropseason.ts, and the WorldScene plot/save
  wiring — and nothing else.

---

## Lore track — BACKLOG-343: First across (pioneer in the book)

### Intent

The park is about to grow a ground nobody has ever stood on. Who gets there first should be remembered.
`groveVisited` (339) already records *everyone* who has been to the grove; this is the sharper, scarcer
fact — the **single first** name per zone, kept forever, surfaced in the collection book as a founding
standing. It costs nothing today (the three existing zones each get their pioneer as soon as anyone
crosses) and becomes live drama the moment the Hollow exists: an empty ground with a race for its name.

### Design

- New pure module `game/src/world/pioneer.ts`:
  - `recordPioneer(map, zoneId, name): boolean` — first write wins; returns whether this call founded it.
  - `pioneerOf(map, zoneId): string | undefined`.
  - `pioneerLine(zoneId): string` — the book line, `first across into The Hollow`.
- Recorded at **arrival**, in both zone-entry paths (`crossDino` — the visible crossing — and `relocate`,
  the instant path), so no route into a ground can slip past unrecorded.
- **The bowl is deliberately excluded.** The cast did not *arrive* in the bowl; it began there. A zone is
  founded only by being crossed into, so `pioneerOf(bowl)` stays undefined unless someone genuinely
  migrates back into it, which is exactly what "first across" means for the bowl too.
- A founding arrival posts one ticker line: `🚩 <name> is the first ever to set foot in <Zone>`.
- `BookRow` gains optional `pioneer?: string`; `bookLines` renders it after the `home` line. Optional, so
  every existing BookRow literal stays valid (the 303/393/012/443 precedent).
- Persisted additively as `pioneers: Record<zoneId, name>`; absent on an old save → `{}`, no back-fill
  (we did not record it then and must not invent it).
- Dev hook `__pioneers()` for the e2e.

### Acceptance criteria (lore)

- **L1.** The first dino ever to arrive in a zone is recorded; a later arrival in the same zone does not
  overwrite it, and the same dino re-entering does not re-fire the beat.
- **L2.** The founding arrival posts exactly one 🚩 ticker line naming the dino and the zone.
- **L3.** The collection book shows `first across into <Zone>` on that dino's block, and on no other dino's.
- **L4.** The bowl is not founded by the cast's initial spawn — a fresh save has no bowl pioneer.
- **L5.** Additive save: an old save loads with an empty pioneer map; new pioneers round-trip.
- **L6.** With both tracks shipped, a dino migrating into The Hollow is recorded as its pioneer with **no
  code written for the Hollow** — the generalization proof, asserted in a test.

---

## Cross-track notes

Both tracks land in `WorldScene.ts` but at different seams: 472 in the terrain/plot/save wiring, 343 in
`crossDino`/`relocate` and `bookRows()`. Neither reads the other's state. L6 is the only intentional
coupling and it is an assertion, not a dependency — if 472 were abandoned, L6 drops and 343 still ships
whole against the three existing zones.

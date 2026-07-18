# Cycle 105 — Code Plan

**Build order: structure track first, then lore track.** Both touch `WorldScene.ts`; the structure
diff is mechanical and lands in `checkNeeds` / `needTargetFor`, the lore diff adds new state and a
new branch to `stepDinos`. No shared function is rewritten by both.

---

## ⚠️ Design correction the plan must carry (lore track)

The design says "reuse `comforter()` from `world/comfort.ts`". **That pick is provably impossible
as specified**, and the Coder must not implement it literally:

- `isLoner()` (loner.ts) is true iff **every** pairwise bond is `< LONER_FLOOR` (8).
- `comforter()` returns the closest friend only if its bond is `>= COMFORT_BOND_FLOOR` (8).

So for any dino that is a loner, `comforter()` returns `null` by construction — the fetch could
never fire for anyone, and the "nobody comes" branch would be the *only* branch. Same class of
collision as cycle 104's `NEED_THRESHOLD` / `STARVING` band, caught at plan time again.

**Resolution:** the fetcher is picked by `closestFriend()` (`social/bonds.ts`), which is the
floor-parameterized primitive `comforter()` is itself built on — so this is still reuse, not a
second search — with a **new, lower** `FETCH_BOND_FLOOR = 4`, half a huddle, strictly below
`LONER_FLOOR`. Semantics improve: the dino that comes for a loner is not a close friend (a loner
has none, by definition) — it is *the closest thing this dino has to one*. If not even that
exists, nobody comes, and the loner stands at the edge while the park eats. The design's intent is
preserved exactly; only the mechanism changes.

**Pin the relation in a unit test** (`FETCH_BOND_FLOOR < LONER_FLOOR`), the way cycle 104 pinned
`STARVING > NEED_THRESHOLD`, so a future tuning pass can't silently re-close the window.

---

## Structure track — BACKLOG-445

**Item:** BACKLOG-445 [emergent] The waterhole — all three zones slake thirst locally.

### Files to create

- `tests/unit/cycle-105-waterhole.test.ts`
- `tests/e2e/cycle-105-waterhole.spec.ts`

### Files to modify

- `game/src/world/zones.ts`
  - **new** `bowlTileAt(x, y, cols, rows): TileKind` — a small waterhole block, everything else
    `'grass'`. Block: `x ∈ [2,4]`, `y ∈ [2,3]` (3×2). Verified clear of `HUDDLE_TILE` (10,11),
    `PLOT_TILE` (2,12), the `foodLanding` row (y = `floor(15*0.45)` = 6), and the east migration
    edge column (x=19).
  - **new** `BOWL_POND_TILE` — the block's centre `{ tileX: 3, tileY: 2 }` (the bowl's twin of
    `grovePondTile`).
  - **new** `FERNREACH_CREEK_TILE(rows)` — a point on the existing creek (`x ∈ [3,4]`,
    `y ∈ [2, rows-3]`); return `{ tileX: 3, tileY: Math.floor(rows / 2) }` (mid-creek, kept in
    sync with `fernreachTileAt` the way `grovePondTile` is with `groveTileAt`).
  - **modify** `zoneTileAt` — add the bowl arm: `if (zoneId === BOWL_ID) return bowlTileAt(...)`.
    ⚠️ This changes the bowl's return from `null` to non-null; see Risks.
  - **new** `zoneWaterTile(zoneId, cols, rows): Tile | null` — the drink target for a zone:
    bowl → `BOWL_POND_TILE`, grove → `grovePondTile(cols)` (delegate, do not inline), Fernreach →
    `FERNREACH_CREEK_TILE(rows)`, unknown → `null`.
  - **new** `atWater(zoneId, tile, cols, rows, radius?): boolean` — is any tile within `radius`
    (default 1, matching the existing pond-drink feel) a `'water'` tile of **that zone's** terrain.
    Structurally the same scan as `arrival.ts`'s `nearPond`, but zone-dispatched via `zoneTileAt`.
- `game/src/scenes/WorldScene.ts`
  - `checkNeeds()` (~line 1973) — replace `if (nearPond(this.tileOf(d), COLS, ROWS))` with
    `if (atWater(zoneOf(this.dinoZones, d.name, BOWL_ID), this.tileOf(d), COLS, ROWS))`.
  - `needTargetFor()` (~line 2014) — replace the thirst arm
    `zoneOf(...) === GROVE_ID ? grovePondTile(COLS) : null` with
    `zoneWaterTile(zoneOf(this.dinoZones, d.name, BOWL_ID), COLS, ROWS)`; update the comment (the
    "elsewhere thirst has no reachable water" note is now false and must not be left lying).
  - imports: add `atWater`, `zoneWaterTile` to the existing `../world/zones` import line.
  - `nearPond` import stays — `checkPondSight` still uses it (**do not remove**).

### Reuse list

- `zoneTileAt` / `groveTileAt` / `fernreachTileAt` / `grovePondTile` — `game/src/world/zones.ts`.
  The Fernreach creek and grove pond already exist as terrain; **author no new tile kinds**.
- `nearPond` scan shape — `game/src/world/arrival.ts:42`. Mirror its bounds-checked neighbourhood
  scan in `atWater`; do **not** modify `nearPond` itself.
- `satisfy` / `pressingNeed` / `NEED_THRESHOLD` — `game/src/world/needs.ts`, unchanged.
- `bakeTerrainMap` — already the path any non-null-terrain zone takes in `drawFloor` (~5047).
  The water rig it needs already exists (the grove pond renders through it today).
- `zoneOf` — `game/src/world/zones.ts`, for the dino's home zone.

### New dependencies

`none`.

### Test plan

**Unit — `tests/unit/cycle-105-waterhole.test.ts`**
- `bowlTileAt` returns `'water'` inside the block and `'grass'` at (0,0), the huddle tile (10,11),
  the plot tile (2,12), and every tile of the food-landing row y=6.
- `zoneTileAt(BOWL_ID, 0, 0, 20, 15)` is non-null (the `drawFloor` probe — pins the render path).
- `zoneWaterTile` returns a tile for each of the three zones, and for **each** the returned tile is
  itself `'water'` under that zone's `zoneTileAt` (this is the invariant that keeps the seek target
  and the terrain from drifting apart); returns `null` for an unknown zone id.
- `zoneWaterTile(GROVE_ID, 20, 15)` equals `grovePondTile(20)` exactly — grove unchanged.
- `atWater` is true at each zone's water tile, false at each zone's plot tile, and false for the
  bowl at the grove's pond coordinates (zone-scoped, not global).
- Bounds: `atWater` at (0,0) and (cols-1, rows-1) does not throw.

**Unit — extend `tests/unit/cycle-079-pondsight.test.ts` (guard test)**
- `nearPond` still keys on **grove** water only: a tile on the Fernreach creek and a tile in the
  bowl waterhole both return `false`. This is the regression fence for the 359/346 constraint.

**E2E — `tests/e2e/cycle-105-waterhole.spec.ts`**
- Bowl: `__placeDino('Rex', 3, 2)`, `__setNeed('Rex','thirst',0.8)`, `__checkNeeds()` → thirst 0.
- Fernreach: `__setZone('fernreach')` + place a resident on the creek → thirst resolves.
- Grass control: a thirsty dino at (10,10) in the bowl → `__checkNeeds()` leaves thirst > 0.
- Seek: with thirst pressing and hunger below threshold, `__needTarget(name)` is non-null in **all
  three** zones (the 436 no-op this item exists to fix).
- Render: `__floorInfo` / `__groundReady` shows the bowl floor present after boot; zero console
  errors.
- Guard: a dino at the bowl waterhole is **not** added to `__pondSeen()`.

### Risks

- **The bowl's floor render path changes.** `drawFloor` probes `tileAt(0,0) !== null` to choose
  `bakeTerrainMap` over `bakeTileMap('grass', …)`. Giving the bowl a layout flips the bowl onto the
  terrain path for the first time. Mitigated by the render e2e + the existing tile-art specs
  (`cycle-048-grass-tiles`, `cycle-067-path-water-art`) — **run those specifically** and check
  `__floorInfo`/`__hasTileArt` still read sane. If the bowl floor regresses visually, the fallback
  is to keep `bakeTileMap` for the bowl and blit water separately — but try the clean path first.
- **`nearPond` must not be touched.** Widening it retro-fires the once-ever 359 beat for every dino
  near the Fernreach creek and corrupts `pondSeen` in existing saves. The guard test above is the
  fence; the constraint is in the design.
- `FERNREACH_CREEK_TILE` and `BOWL_POND_TILE` are hand-synced to their `*TileAt` functions, the same
  latent drift `grovePondTile` already carries. The "the returned tile is itself water" unit test is
  the anti-drift check. (BACKLOG-449, seeded this cycle, is the real fix.)

### Estimated touch count

`~5 files`.

---

## Lore track — BACKLOG-381

**Item:** BACKLOG-381 [social] Brought to the hatch.

### Files to create

- `game/src/world/fetch.ts` — the pure module.
- `game/src/world/fetch.test.ts` (colocated; vitest includes `game/src/**/*.test.ts`).
- `tests/e2e/cycle-105-brought-to-hatch.spec.ts`

### `game/src/world/fetch.ts` — surface

```ts
export const FETCH_BOND_FLOOR = 4;   // < LONER_FLOOR (8) — see the design correction above
export const FETCH_STEPS = 14;       // step budget for the whole escort (walk out + walk back)
export const FETCH_GLYPH = '🤝';
export type FetchPhase = 'to-loner' | 'to-food';
export interface Escort { friend: string; loner: string; phase: FetchPhase; steps: number }

/** Is this dino missing the meal — a loner that did not rush the drop? Pure; WorldScene supplies both reads. */
export function missingTheMeal(lonerNow: boolean, rushed: boolean): boolean;

/** Who comes for it: the closest peer above FETCH_BOND_FLOOR, or null. Delegates to closestFriend(). */
export function fetcher(loner: string, bonds: Bonds, peers: string[]): string | null;

export function fetchLine(friend: string, loner: string): string;   // `${friend}: Come on, ${loner} — food. 🤝`
export function fetchedMemory(friend: string): string;              // `${friend} came and got me for the food`
export function fetcherMemory(loner: string): string;               // `you went and got ${loner} for the food`
export const FETCH_BOND = 2;                                        // matches COMFORT_BOND's scale
```

### Files to modify

- `game/src/scenes/WorldScene.ts`
  - **state**: `private escort: Escort | null = null;` beside `pendingRespond` (~line 340).
    Transient — **not** in `serialize()`, not in the load path.
  - **`dropFood()`** — after the drop resolves (just before `return landing`), call a new
    `private startEscort(landing)`:
    - bail if `this.escort` is already live (one at a time).
    - candidates: dinos in view; for each, `isLoner(this.bonds, name, this.dinoNames(), LONER_FLOOR)`
      **and** `reactionToFood(d.traits.energy, dist, isFav) === 'ignore'` — reuse the exact rush
      read from the `stepDinos` food branch (~2620) so the gate can't disagree with the rush.
    - pick the neediest deterministically: lexicographically-smallest qualifying name (the `topBy`
      convention used across the codebase) — **no `Math.random()`**, so the e2e is deterministic.
    - `fetcher(loner, this.bonds, <in-view peers except the loner>)`; null → no escort (this is the
      "nobody comes" branch, and it must genuinely leave `this.escort === null`).
    - set `this.escort = { friend, loner, phase: 'to-loner', steps: FETCH_STEPS }`.
  - **`stepDinos()`** — a new branch inside the per-dino loop, placed **immediately above** the
    "Food on the ground pulls eager, nearby dinos" block (~2619) and therefore above moping:
    - if `this.escort` and `d.name === escort.friend`:
      - phase `to-loner` → `stepToward(cur, this.tileOf(loner))`, `activityById = 'responding'`,
        `continue`.
      - phase `to-food` → `stepToward(cur, this.food)` (if food still down), `'feeding'`, `continue`.
    - if `this.escort?.phase === 'to-food'` and `d.name === escort.loner` → `stepToward(cur, this.food)`,
      `'feeding'`, `continue` (this is what suppresses its moping).
    - Placement is **below** the existing early-`continue` branches (sleeping / crossing / arriving /
      fleeing / stalking) per the design constraint.
  - **new `private stepEscort()`** — called from the world-step tail beside `this.stepResponder()`
    (~2795). Mirrors `stepResponder` exactly:
    - null-out if either dino is missing, or `!this.food` (the meal is over).
    - phase `to-loner` + adjacency (`TILE * 1.01` on both axes, the `stepResponder` test) → fire the
      beat **once**: `showBubble(friend, fetchLine(...))`, `logEvent`, `remember` both sides
      (`fetchedMemory` / `fetcherMemory`), `this.bonds = strengthen(..., FETCH_BOND)`,
      `flashFeed(loner, FETCH_GLYPH)`, then `phase = 'to-food'`.
    - phase `to-food` + `reachedFood(this.tileOf(loner), this.food)` → escort done, null.
    - always decrement `steps`; `<= 0` → null.
  - **`eatFood()` / wherever `this.food = null` (~1221)** — clear `this.escort` when the food goes.
    (Belt-and-braces: `stepEscort` also nulls on `!this.food`. Do both; the branch in `stepDinos`
    dereferences `this.food` and must never see a stale escort.)
  - **dev hook**: `(window as any).__escort = () => (this.escort ? { ...this.escort } : null);`
    beside `__distressResponder` (~1772).
  - imports: `fetch.ts` symbols; `closestFriend` is used *inside* `fetch.ts`, not here.

### Reuse list

- **`closestFriend`** — `game/src/social/bonds.ts:29`. The floor-parameterized closest-peer pick.
  **Do not write a second bond search.**
- `isLoner`, `LONER_FLOOR` — `game/src/world/loner.ts`, already imported by `WorldScene`.
- `reactionToFood`, `reachedFood`, `feedStep` — `game/src/world/feeding.ts`, already imported.
- `stepToward` — `game/src/world/movement.ts`.
- `strengthen`, `bondPoints` — `game/src/social/bonds.ts`.
- `remember` — the memory store; `showBubble` / `flashFeed` / `logEvent` — existing WorldScene glue.
- **`stepResponder` (WorldScene ~2993) is the structural template** for `stepEscort` — same
  null-outs, same adjacency test, same budget drain. Follow it; don't invent a new pattern.
- `favoriteFood` + `currentSeason` — for the `isFav` arm of the rush read (as at ~2622).

### New dependencies

`none`.

### Test plan

**Unit — `game/src/world/fetch.test.ts`**
- `FETCH_BOND_FLOOR < LONER_FLOOR` — the constants-relation pin (the cycle-104 discipline).
- `missingTheMeal(true, false)` true; `(true, true)`, `(false, false)`, `(false, true)` all false.
- `fetcher` picks the **highest-bond** peer above the floor, not the first or nearest.
- `fetcher` ties break lexicographically (the `topBy` convention).
- `fetcher` returns `null` when every peer is below `FETCH_BOND_FLOOR`.
- `fetcher` can return a peer whose bond is in `[FETCH_BOND_FLOOR, LONER_FLOOR)` — i.e. a fetch is
  actually reachable for a genuine loner. **This is the test that would have caught the design bug.**
- Line/memory helpers contain both names and the glyph.

**E2E — `tests/e2e/cycle-105-brought-to-hatch.spec.ts`** (boot → `__pauseAmbient` via `boot()`)
- *the fetch starts*: `__bondPair('Rex','Mossback', 5)` (above 4, below 8 — both stay loners),
  place Mossback at the far edge, `__dropFood(<col near Rex>)` → `__escort()` is
  `{ friend: 'Rex', loner: 'Mossback', phase: 'to-loner' }`.
- *nobody comes*: same setup with no bond ≥ 4 → `__escort()` is `null`, and `__isLoner` still true.
- *the friend detours*: with the escort live and Rex within rush range of the food, `__stepWorld()`
  moves Rex **toward Mossback**, not toward the food (compare `__dinoPositions` deltas).
- *the nudge fires once*: step until adjacent → exactly one `🤝` line in `__events()`; stepping
  further adds no second line; `__escort().phase === 'to-food'`; `__memory('Mossback')` names Rex;
  `__bond('Rex','Mossback')` rose by `FETCH_BOND`.
- *the loner walks in*: in `to-food`, `__stepWorld()` moves Mossback toward the food tile and
  `__activity('Mossback')` is not the moping/wander read.
- *it ends*: `__eat('Rex')` (food gone) → `__escort()` is `null`.
- *one at a time*: a second `__dropFood()` while an escort is live does not replace it.
- Zero console errors on the whole spec.

### Risks

- **Branch ordering in `stepDinos` is the whole feature.** Too high and the escort outranks a hunt
  or a migration (design says it must not); too low and the friend's own food rush wins and it never
  detours. Exact seam: immediately above the `if (this.food && this.foodLanded)` rush block.
- **`this.food` dereference.** The escort branch reads `this.food` in `to-food`; it must null-guard,
  because `checkFeeding` can clear the food between the escort step and the dino step within one
  world step.
- **The loner may stop being a loner mid-escort** (the pair meet → `strengthen` → bond may cross
  `LONER_FLOOR`). That's fine and thematic — the escort keys on the *stored* escort, not a live
  `isLoner` re-read. Do **not** re-check `isLoner` inside `stepEscort`, or the beat will cancel
  itself at the moment of contact. Worth a comment in the code.
- **`__bondPair` defaults to `HUDDLE_THRESHOLD`** — the e2e must pass an explicit amount (5) to land
  in the `[4, 8)` window, or the setup silently lifts Mossback out of loner status.
- Deterministic loner pick (lexicographic, no RNG) matters — an RNG pick makes the e2e flaky.

### Estimated touch count

`~4 files` (2 new source/test + WorldScene + 1 e2e). **Cycle total ~9 files** — comfortably inside
the v6 ~15-file arc budget.

### Cross-track collision

`WorldScene.ts` only. Structure track edits `checkNeeds` + `needTargetFor` + the zones import line;
lore track edits `dropFood`, `stepDinos`, the world-step tail, the state block, and the hooks block.
Disjoint regions, but **land the structure track and get it green first** so a `stepDinos` conflict
can't be confused with a thirst regression.

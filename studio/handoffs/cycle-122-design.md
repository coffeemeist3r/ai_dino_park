# Cycle 122 — Design

Milestone 11 ("A park you have to cross"), arc 1 of each track.

---

## Lore track

**Item:** BACKLOG-347 — *Grove-struck idle*, taken at its generalized reading: **still full of the place it left.**

### The beat

A dino that has just crossed out of one ground and into another carries the place it left with it for a
short while. It files a memory naming that ground the moment it arrives (which rides the existing
`recall → recentMemory → greet` path, so its next greeting is coloured by where it's been), and on the
next migration roll or two it floats that ground's **keepsake glyph** — a glance back the way it came —
before the place wears off and it settles into where it now is.

Written at cycle 75 the beat was grove-shaped ("freshly back from the grove … in the bowl"). At four
grounds that is one case of four, and hard-coding it would be the exact mistake Milestone 10 caught the
*tests* making. The beat keys on **whichever** ground the dino came from; a fifth ground is a row in one
glyph table.

### Design

New pure module `game/src/world/struck.ts` (no Phaser, Node-testable):

- `export type CameFrom = Record<string, string>` — dino → the ground it last crossed **out of**. Its own
  small record, the `LeftDays` precedent (362): not a widening of `SeenZones` or `roots`.
- `STRUCK_ROLLS = 2` — migration rolls the place stays with it. The calibration knob.
- `KEEPSAKE: Record<string, string>` + `keepsakeGlyph(zoneId)` — one glyph per ground, `'🌿'` for an
  unknown id (the "floor is always whole" seam every zone table in this project uses):
  bowl `🌾`, grove `🌿`, fernreach `🍂`, hollow `🌫`.
- `markCameFrom(map, name, zone)` / `clearCameFrom(map, name)`.
- `isStruck(rolls, from)` — `!!from && rolls < STRUCK_ROLLS`. **Tenure is the clock** (341's rolls-in-zone
  counter, already reset on every crossing) — no new counter, no new cadence.
- `STRUCK_MARK = '🍃 still full of '`, `struckMemory(zoneName)`, `struckLine(glyph)`,
  `struckEvent(name, zoneName, glyph)`, `struckFor(memories)` (most-recent wins, the `yearnedFor`
  precedent), `struckBookLine(zoneName)`.

Wiring in `WorldScene`:

- A persisted `cameFrom` map. **Additive save**, absent → `{}`, `SAVE_VERSION` unchanged.
- `crossDino`: record `cameFrom[name] = home` and file `struckMemory` — **no bubble at the crossing
  instant.** Four beats already contend for that instant (339 look-around, 451 courier, 452 homecoming,
  457 greener-ground); the glance back belongs *after* the arrival, not on top of it.
- `relocate` (the instant path): records `cameFrom` too, mirroring how 362 stamps its departure clock there.
- `bumpTenures` (the migration cadence, where tenure already lives): every struck dino floats its keepsake
  glyph; the first float is one roll after arrival, the last before `STRUCK_ROLLS` elapses.
- The collection book gains a `struck` line beside 362's `misses …`.
- Dev hook `__struck(name)` → `{ from, glyph } | null`.

**A homecoming is not struck.** 452 restores a returning dino's tenure to `SETTLE_ROLLS`, so `isStruck`
reads false for it — a dino walking back into the ground it belongs to is home, not visiting. Deliberate,
and pinned by a criterion so the two beats never both claim the moment.

### Acceptance criteria (lore)

1. `keepsakeGlyph` returns a distinct glyph for each of the four grounds, and `'🌿'` for an unknown id.
2. A dino that crossed out of X reads struck at tenure 0 and 1, and **not** struck at tenure ≥ `STRUCK_ROLLS`.
3. A dino with no `cameFrom` never reads struck, at any tenure.
4. `struckMemory` names the ground, carries `STRUCK_MARK`, and contains **neither** `PLENTY_TOKEN` nor the
   grove-news phrase — the re-spread hazard 362's header names, pinned as a test.
5. `struckLine` is the ground's keepsake glyph and `struckEvent` names both the dino and the ground it
   left. *(Revised at code-plan time: the book line reads the **live** `cameFrom` + tenure rather than
   parsing the memory ring — the ring keeps the memory long after the window, so a `struckFor` parse
   would strand the line on. See the code plan.)*
6. e2e: a driven crossing files the struck memory naming the ground the dino left.
7. The instant path (`__migrate`/`relocate`) records `cameFrom` as well as the walked crossing.
8. e2e: on the migration roll after arrival, `__struck(name)` returns the left ground and its glyph, and a
   keepsake bubble shows.
9. Past the window `__struck(name)` is `null`.
10. A homecoming crossing (452) leaves the dino **not** struck.
11. The collection book reads `just back from <Zone>` while struck, and drops the line after.
12. `cameFrom` survives save → reload; a save written before this cycle loads clean (absent → `{}`).
13. The ticker logs one line naming the ground when the beat first floats (not once per float).

---

## Structure track

**Item:** BACKLOG-475 — *Distance on the chain.*

### The gap

Every cross-zone read in this park is one hop deep. For the ferry (447) and the demand read (438) that is
*by construction* — they consult `zoneNeighbors` and nothing else. For the two migration **pulls** it is
by **discard**: `plentyDestOf` (458) and `yearnDestOf` (362) each compute what a dino wants and then throw
the answer away when it isn't adjacent. A dino standing in the bowl cannot miss the Hollow, and cannot act
on hearing the Hollow is thriving. Both were harmless at three grounds, where every zone bordered the
middle. The Hollow is the first ground that can be three hops from a mouth that wants it.

### Design

New pure module `game/src/world/distance.ts`, derived entirely from `ZONE_LINKS` (no second table to keep
in sync — the 449 lesson):

- `hopDistances(from): Record<string, number>` — breadth-first over the link graph, `from` → 0.
- `hopsBetween(a, b): number | null` — `null` for unreachable / unknown.
- `hopToward(from, to): string | null` — the neighbour of `from` on a shortest path to `to`. Deterministic:
  neighbours walked in `ZONE_LINKS` order, first one whose distance to `to` is one less wins. `null` for
  same zone / unreachable. **`hopToward(a, neighbourOfA) === neighbourOfA`** — that identity is what makes
  every pre-475 caller byte-identical.
- `nearestQualifying(from, candidates, ok): string | null` — fewest hops first, input order breaks a tie.

Named `hopToward`, not `stepToward`: `movement.stepToward` (tile stepping) is already imported into
`WorldScene`.

Wiring:

- `plentyDestOf`: a non-adjacent remembered target stops returning `null` and returns `hopToward(home, target)`.
- `yearnDestOf`: `yearnedZone` is handed **every** zone instead of only the home's neighbours, and its answer
  is mapped through `hopToward`.
- `zoneWant` (438): considers every zone growing a different crop and prefers the **nearest** qualifying
  grower; equal hops keeps 438's original rule (greater harvest wins), then link order. `ZoneWant` gains an
  optional `hops` field for 477's lens to read later.

The multi-hop walk needs **no path state and no persistence**: each migration roll re-reads the pull and
takes one more step, so a dino crossing the park is the existing per-roll decision applied repeatedly. If
what it wants changes en route, it changes course — which is the honest behaviour, not a compromise.

### Acceptance criteria (structure)

1. `hopDistances(bowl)` = `{bowl:0, grove:1, fernreach:2, hollow:3}`; from the Hollow, mirrored.
2. `hopsBetween` is symmetric across the chain and `null` for an unknown id.
3. `hopToward(bowl, hollow) === grove`; `hopToward(fernreach, bowl) === grove`; same zone → `null`;
   unknown → `null`.
4. `hopToward(a, b)` for an adjacent `b` returns `b` itself — the byte-identity pin.
5. No `Math.random()` anywhere in the module; repeated calls return identical results.
6. `nearestQualifying` picks fewest hops, breaks ties in input order, and returns `null` when nothing qualifies.
7. A dino primed by word of plenty about a **two-hop** ground now heads for the ground **in between**
   (previously: no pull at all) — unit + e2e through `__plentyDest` / `__maybeMigrate`.
8. A dino that misses a **two-hop** ground yearns toward the ground in between (`__yearnDest`).
9. Adjacent-target plenty and yearning picks are unchanged — the cycle-110 and cycle-121 specs stay green
   untouched.
10. `zoneWant` prefers a nearer qualifying grower over a farther one that has harvested more.
11. At equal hops the greater harvest still wins (438's rule intact where distance can't decide).
12. `zoneWant` still returns `null` until some other zone has actually grown a surplus.
13. Every destination handed to `startMigration` is still a **neighbour** of the home zone, so the crossing
    edge lookup never falls through to `neighbors[0]`.
14. Build clean; `@mlc-ai/web-llm` imported only under `game/src/ai/`; no save change on this track.

# Cycle 123 — Design

Two tracks, no shared file except `WorldScene.ts` (different methods) and `saveGame.ts` (lore track only).

---

## Lore track — BACKLOG-361: homebody or wanderer

**The beat.** Open the collection book and every dino now carries one line saying what kind of traveller it
is: `a homebody — never left the Pocket Cretaceous`, `a rambler — 3 crossings, 1 ground out`, `a wanderer —
7 crossings, 2 grounds out`. It is a **lifetime** standing that only ever grows, and it splits the cast in
two the way the food-web line (443) splits it into hunters and hunted.

**Two dimensions, deliberately.** A dino that has bounced bowl↔grove nine times has *moved* a lot and *gone*
nowhere; a dino that walked to the Hollow once and stayed has gone as far as this park allows. Neither
number alone is the read, so the standing takes both:

- **crossings** — how often. A new per-dino counter, incremented once per arrival at **both** seams.
- **reach** — how far. The greatest hop-distance from the ground it *began* on to any ground it has stood
  on. Derived every read from `seenZones` (already persisted) via 475's `hopsBetween` — never stored, so a
  fifth ground or a re-linked map re-reads correctly instead of carrying a stale number.

**Origin** is `seenZones[name][0]` — the ground it was first marked as seeing, which for a founder is its
spawn zone (`markSeen` fires at spawn, `WorldScene.ts:2095`) and for a hatchling is where it hatched. No new
record: the origin is already the first thing the park ever wrote about that dino.

**New module** `game/src/world/wandering.ts` (pure, Node-testable):

| export | contract |
|---|---|
| `Crossings = Record<string, number>` | dino → lifetime arrivals |
| `recordCrossing(map, name): number` | `++`, returns the new count; mutates in place (the `markCameFrom` precedent) |
| `crossingsOf(map, name): number` | 0 for a dino that has never crossed |
| `originOf(seen: string[] \| undefined): string \| undefined` | `seen?.[0]` — where it began |
| `reachOf(seen, origin): number` | max `hopsBetween(origin, z)` over `seen`; 0 for an unknown/absent origin or a dino that has only ever stood where it began. Unreachable ids (`null`) are skipped, never counted as 0 |
| `WANDERER_REACH = 2` | the knob: two grounds out is a wanderer. At a four-long chain that is genuinely most of the park |
| `wanderStanding(crossings, reach): 'homebody' \| 'rambler' \| 'wanderer'` | `crossings === 0` → homebody (**reach is not consulted** — a dino that has never left is a homebody however the map is drawn); else `reach >= WANDERER_REACH` → wanderer; else rambler |
| `wanderBookLine(standing, crossings, reach, originName)` | the rendered line; the homebody form names its ground, the other two carry both numbers |

**Wiring.**
- `WorldScene.crossings: Crossings = {}`, `recordCrossing` called in `crossDino` (the visible walk) and in
  the instant relocate path — the same two seams `markSeen`/`markCameFrom` already pair on.
- `saveGame.ts`: one **additive optional** field `crossings?: Record<string, number>`, validated with the
  same shape guard `harvestedByZone` uses (object of finite numbers). An old save loads with `{}` and every
  dino reads homebody until it next crosses — correct, and honest about what the save actually knows.
- `BookRow.wander?: string`, rendered by `bookLines` under the existing optional-line pattern.
- Dev hook `__crossings()` for the e2e.

**Explicitly not in scope:** no ticker beat, no bubble, no memory, no gossip. Every other travel item this
milestone has shipped is a *moment*; this one is a **standing**, and giving it a beat too would put a fifth
contender at the crossing instant where four already fight (339/451/452/457) — the exact hazard 347's
handoff called out last cycle.

### Acceptance criteria — lore

1. `recordCrossing` returns 1 on a dino's first call and increments monotonically thereafter.
2. `crossingsOf` returns 0 for an unknown name.
3. `originOf` returns `seen[0]`; `undefined` for an absent or empty list.
4. `reachOf` returns 0 for a dino that has only stood on its origin, 1 for an adjacent ground, and 3 for a
   bowl-origin dino that has stood in the Hollow.
5. `reachOf` skips an unreachable/unknown zone id in `seen` rather than counting it as 0 hops.
6. `wanderStanding(0, anything)` is `'homebody'` — including a fabricated high reach.
7. `wanderStanding` returns `'wanderer'` at `reach >= 2` and `'rambler'` for a crossed dino below it.
8. `wanderBookLine` names the origin ground for a homebody and carries both numbers for the other two.
9. A visible migration (`crossDino`) increments the crossing count by exactly 1.
10. The instant relocate path increments it by exactly 1 (both seams, never neither, never twice).
11. `crossings` round-trips the save; a save without the field loads clean and reads every dino homebody.
12. Every dino's book block shows exactly one wander line; a fresh boot shows all five as homebodies.
13. **e2e:** on a fresh boot the book reads a homebody line for Rex; after a driven crossing his line reads a
    non-homebody standing with a crossing count of at least 1.

---

## Structure track — BACKLOG-476: what a ground can hold

**The system.** Each ground gets a **carrying capacity** derived from its own terrain. A ground holding more
mouths than that reads *crowded*: it becomes less appealing to arrive at, and its own settled residents hold
onto it less tightly. The first ceiling in a park that has only ever had a floor.

**Derived, not tabled.** `ZONE_TERRAIN` already knows each ground's `tileAt`; how much open ground a zone has
is a fact the park contains and has never asked for. Capacity counts **grass** tiles only — water is not
standable, the grove's trail is trodden through, the Fernreach's and Hollow's scrub is thicket. That choice
is what gives the four grounds different capacities at all: counting *every* non-water tile makes all four
within 6% of each other and the feature uniform.

At the live 20×15 grid, grass tiles are bowl 294 / grove 248 / Fernreach 226 / Hollow 250, so with
`TILES_PER_HEAD = 60` and `Math.ceil` the capacities are **bowl 5, grove 5, Fernreach 4, Hollow 5**.

**The calibration is the design.** The founding state is five dinos in the bowl, which is *at* capacity and
not over — so on a fresh save this feature is dormant and every pinned migration spec is byte-identical.
It bites the first time the cast genuinely piles up: five into the Fernreach, or six anywhere else, both
reachable with the base roster and both far more reachable now that 475 lets a pull cross the whole chain.
Crowding is strictly `heads > capacity`, never `>=`.

**New module** `game/src/world/capacity.ts` (pure, Node-testable):

| export | contract |
|---|---|
| `TILES_PER_HEAD = 60` | the knob, tuned here and nowhere else |
| `CROWD_APPEAL_DAMP = 0.5` | how hard each surplus mouth divides appeal down |
| `CROWDED_MIGRATE_DAMP = 0.3` | a crowded ground's settled resident's resist rate (the 460 lever, same value) |
| `livableTiles(zoneId, cols, rows): number` | grass tiles over the grid, via `zoneTileAt`; 0 for an unknown zone |
| `zoneCapacity(zoneId, cols, rows): number` | `max(1, ceil(livable / TILES_PER_HEAD))` — floored at 1 so no ground is uninhabitable by arithmetic |
| `isCrowded(heads, capacity): boolean` | strictly `heads > capacity` |
| `crowdedAppeal(appeal, heads, capacity): number` | uncrowded → `appeal` **unchanged**; crowded → `appeal / (1 + excess × CROWD_APPEAL_DAMP)` where `excess = heads - capacity` |

`crowdedAppeal` folds into the appeal *number* rather than sitting above it as a tier — the opposite of
474's frontier call, and for a stated reason: `zoneAppeal` is read by `richestNeighbor` (*where do I go*) and
by `poorestResidents` (*who leaves*), and a crowded ground is genuinely both a worse place to arrive at and a
likelier place to leave. Both readings want the same sign, so the honest place for it is the number. The
frontier bonus had to be a tier precisely because its two readings wanted *opposite* signs.

Appeal stays monotonic in plenty at fixed head count (the divisor doesn't depend on prosperity or food) and
stays ≥ 0.

**Wiring.**
- `WorldScene.zoneCaps: Record<string, number>` computed once at `create` over `zoneChain()` — capacity is a
  function of terrain and grid size, neither of which changes at runtime, so a 300-tile scan per appeal read
  would be pure waste.
- `zoneAppeal(zoneId)` wraps its existing fold in `crowdedAppeal(..., heads, cap)`.
- `maybeMigrate`'s resist damp becomes the **weaker of the two holds**: `Math.min(declining ? DECLINING_MIGRATE_DAMP : SETTLED_MIGRATE_DAMP, crowded ? CROWDED_MIGRATE_DAMP : SETTLED_MIGRATE_DAMP)`.
- Dev hooks `__zoneCapacity()` and `__crowded()` for QA and the e2e.
- **No save change** — capacity is derived and crowding is read live off head counts.

**Explicitly not in scope:** the lens glyph. A crowded marker beside the prosperity tier and the ⬇ is exactly
what 477 exists to fold into one governance line, and adding a loose third icon this cycle is the redesign
477 is meant to prevent.

### Acceptance criteria — structure

1. `livableTiles` counts grass only — the bowl's 3×2 waterhole is excluded, the grove's trail rows and the
   Fernreach/Hollow scrub bands are excluded.
2. `zoneCapacity` returns bowl 5, grove 5, Fernreach 4, Hollow 5 at 20×15.
3. `zoneCapacity` never returns less than 1, including for an unknown zone id.
4. `isCrowded` is false at exactly capacity and true at capacity + 1.
5. `crowdedAppeal` returns its input **unchanged** when not crowded (identity, pinned).
6. `crowdedAppeal` strictly decreases as excess rises, and stays ≥ 0.
7. `crowdedAppeal` stays monotonic in plenty at a fixed head count.
8. A crowded zone's appeal is genuinely lower than the same zone's appeal at capacity with identical
   prosperity and food.
9. `richestNeighbor` picks an uncrowded neighbour over a crowded one whose raw appeal is higher, once the
   crowding penalty is applied.
10. A crowded zone's settled resident resists the ambient wander at `CROWDED_MIGRATE_DAMP`, not
    `SETTLED_MIGRATE_DAMP`.
11. A zone both crowded and declining takes the weaker hold (they are equal at 0.3; the `min` is pinned so a
    future divergence can't silently pick the stronger one).
12. **The founding state is not crowded** — five dinos in the bowl reads uncrowded, capacity 5.
13. No save field added; a save written this cycle loads on the previous cycle's parser shape unchanged.
14. **e2e:** with the cast driven onto one ground past its capacity, `__crowded()` reports that ground
    crowded and `__zoneAppeal()` for it is below its uncrowded value.

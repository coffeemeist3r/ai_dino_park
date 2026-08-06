# Cycle 123 — Code Plan

## Prior art checked (reuse before writing)

| need | existing thing | verdict |
|---|---|---|
| hop distance between grounds | `world/distance.ts` `hopsBetween` (475) | **reuse** — 361's reach is exactly this |
| the grounds a dino has stood on | `world/taught.ts` `SeenZones` (364) | **reuse**, read-only; no widening |
| a per-dino counter at both arrival seams | `markSeen` / `markCameFrom` pairing in `crossDino` + `relocate` | **reuse the seam pair**, add one call to each |
| per-zone terrain | `world/zones.ts` `zoneTileAt` / `ZONE_TERRAIN` (449) | **reuse** — capacity derives from it, no new table |
| a lower resist damp for a zone under stress | `world/decline.ts` `DECLINING_MIGRATE_DAMP` + the `damp` local in `maybeMigrate` (460) | **reuse the lever**, add a second source and take the `min` |
| a numeric-map save field | `harvestedByZone` guard in `saveGame.ts:504` | **copy that guard shape** for `crossings` |
| an optional book line | `BookRow.struck` / `pioneer` pattern in `lenses.ts` + `bookRows()` | **copy** |

No new dependency. Nothing under `game/src/ai/` is touched, so the `@mlc-ai/web-llm` boundary is untouched
by construction.

## Files

### New (4)

1. `game/src/world/wandering.ts` — 361. `Crossings`, `recordCrossing`, `crossingsOf`, `originOf`, `reachOf`,
   `WANDERER_REACH`, `wanderStanding`, `wanderBookLine`. Imports `hopsBetween` from `./distance` only.
2. `game/src/world/wandering.test.ts` — criteria L1–L8.
3. `game/src/world/capacity.ts` — 476. `TILES_PER_HEAD`, `CROWD_APPEAL_DAMP`, `CROWDED_MIGRATE_DAMP`,
   `livableTiles`, `zoneCapacity`, `isCrowded`, `crowdedAppeal`. Imports `zoneTileAt` from `./zones` only.
4. `game/src/world/capacity.test.ts` — criteria S1–S9, S11.

### Edited (5)

5. `game/src/scenes/WorldScene.ts`
   - imports: `wandering` (361), `capacity` (476).
   - field `private crossings: Crossings = {}` beside `cameFrom` (~line 511).
   - field `private zoneCaps: Record<string, number> = {}`, filled once in `create` after the zone chain is
     available: `for (const z of zoneChain()) this.zoneCaps[z] = zoneCapacity(z, COLS, ROWS)`.
   - `crossDino`: `recordCrossing(this.crossings, d.name)` next to the existing `markCameFrom` call
     (~line 4997). **After** `setZone`, so it counts arrivals not departures — matching `markSeen`.
   - `relocate`: same call, inside the existing `if (from !== destZoneId)` guard (~line 5128) so a
     same-zone relocate is not a crossing. *This asymmetry with `crossDino` is intentional and must be
     commented:* `crossDino` cannot be a same-zone move (the destination is a linked neighbour), `relocate`
     can (`__migrate` to the zone you are already in).
   - `zoneAppeal(zoneId)`: wrap the existing fold —
     `crowdedAppeal(zoneAppeal(prosperity, food), this.zoneHeads()[zoneId] ?? 0, this.zoneCaps[zoneId] ?? 1)`.
   - `maybeMigrate`: `const damp = Math.min(this.isZoneDeclining(home) ? DECLINING_MIGRATE_DAMP : SETTLED_MIGRATE_DAMP, this.isZoneCrowded(home) ? CROWDED_MIGRATE_DAMP : SETTLED_MIGRATE_DAMP)`.
   - private `isZoneCrowded(zone)` beside `isZoneDeclining`.
   - `bookRows()`: `wander:` entry built from `this.crossings`, `this.seenZones[d.name]`, `zoneById(origin).name`.
   - save/load: write `crossings`, restore it (default `{}`).
   - dev hooks: `__crossings()`, `__zoneCapacity()`, `__crowded()`.
6. `game/src/ui/lenses.ts` — `BookRow.wander?: string` + one `if (r.wander)` line in `bookLines`, placed
   **after** `struck` and before `parents` (the travel lines stay grouped: home → pioneer → taught → yearn →
   struck → wander).
7. `game/src/world/saveGame.ts` — `crossings?: Record<string, number>` on the state interface, the
   `harvestedByZone`-shaped guard, and the field in the returned object.
8. `tests/e2e/cycle-123-wandering.spec.ts` — criterion L13.
9. `tests/e2e/cycle-123-capacity.spec.ts` — criterion S14.

Also touched: `tests/unit/saveGame.test.ts` (round-trip, L11) and whichever book-render unit test asserts the
line set (L12) — locate by grepping for `struck` in `tests/unit`.

## Order of work

1. `capacity.ts` + its test → `npx vitest run capacity` green before any scene edit. It is the risk (the
   calibration), so it gets proven in isolation first.
2. `wandering.ts` + its test.
3. `saveGame.ts` field.
4. `WorldScene.ts` wiring, both tracks.
5. `lenses.ts` line.
6. e2e for each track.
7. Full `npm run build` → `npx vitest run` → `npx --yes kill-port 5173` → `npx playwright test`.

## Risks, and what pins them

- **The founding state must not read crowded.** Bowl capacity 5, roster 5, `isCrowded` strictly `>`.
  Pinned twice: unit criterion S12 asserts `isCrowded(5, 5) === false`, and the whole existing migration
  suite regresses loudly if this is wrong. If any pinned migration spec moves, the knob is wrong — **do not
  amend the spec**, re-tune `TILES_PER_HEAD`. (The M10 finding, and its inverse: the test suite moving is
  the signal, not the obstacle.)
- **`zoneAppeal` is read by two callers with different meanings.** `crowdedAppeal` must be an exact identity
  when uncrowded (criterion S5) or `poorestResidents` shifts on every roll for reasons unrelated to crowding.
- **Double-counting a crossing.** The two seams are mutually exclusive at runtime, but both fire on the
  `__migrate` path in some specs. Criteria L9/L10 assert **exactly** +1 per arrival on each seam separately.
- **A hop-distance read on a name with no `seenZones`.** `reachOf` must return 0 for `undefined`, not throw —
  the book renders for every dino on every open, including one that just hatched.
- **BACKLOG-456 rule:** no `Math.random()` in either new module. Both are pure reads.

## Blocker section

_(empty — the Coder fills this if build or tests fail)_

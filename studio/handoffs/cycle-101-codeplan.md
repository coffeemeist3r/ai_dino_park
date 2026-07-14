# Cycle 101 — Code plan

## BACKLOG-442 — the hunter's reputation

**`game/src/world/foodweb.ts`** (append below `recentHunter`):
- `WARY_CHASES = 2`, `WARY_RANGE = STALK_RANGE`.
- `chaseCount(memories, hunter)` — loop, `/slipped (.+?)'s hunt/.exec(m)`, count where capture === hunter.
- `fearsHunter(memories, hunter, threshold = WARY_CHASES)` → `chaseCount(...) >= threshold`.

**`game/src/scenes/WorldScene.ts`:**
- Field: `private lastFlee: Record<string, string> = {};` (beside `lastStalk`, L328).
- Import: add `WARY_RANGE, chaseCount, fearsHunter` to the `foodweb` import (L70) — `chaseCount` unused by
  scene but keep import minimal: import only `fearsHunter, WARY_RANGE`.
- `forceStep`, after `this.lastStalk = stalkTargets;` (L2442): wariness pass — for each `h` of `herbivores`
  with no `fleeFrom[h.name]`, `const mem = recall(this.memory, h.name)`, scan `this.dinos` for in-view
  carnivores `c` (`c.name !== h.name`), keep the nearest with `fearsHunter(mem, c.name)` &&
  `chebyTiles(tileOf(h), tileOf(c)) <= WARY_RANGE`; set `fleeFrom[h.name]` to it. Then `this.lastFlee = fleeFrom;`.
- Hook by `__stalkTargets` (L1689): `(window as any).__fleeFrom = () => ({ ...this.lastFlee });`.
- Existing flee branch (L2538) unchanged — it consumes the enriched `fleeFrom`.

**Reuse:** `recall`, `chebyTiles`, `tileOf`, `inView`, `isCarnivore`, the L2538 flee branch, `fleeStep`.

## BACKLOG-438 — a zone wants what it can't grow

**`game/src/ui/lenses.ts`:**
- Imports: `zoneNeighbors` from `../world/zones` (already imports `zoneById`); `cropOf` from `../world/plot`.
- `interface ZoneWant { food; glyph; from; fromName }`.
- `zoneWant(zone, harvests)` — iterate `zoneNeighbors(zone)`, skip `cropOf(to).food === cropOf(zone).food`,
  track max `harvests[to] ?? 0` with strict `>` from `bestOut = 0`; build `ZoneWant` from `cropOf(to)` +
  `zoneById(to)`. Return best or null.
- `ZoneMapEntry` += `want: ZoneWant | null`; in `zoneMapModel` set `want: zoneWant(id, harvests)`.

**`game/src/scenes/WorldScene.ts`:**
- `drawZoneMap` (L2166): after the base `setText`, if `e.want` append `\nwants ${e.want.glyph}◂${e.want.fromName}`.
  Build the text once: `let txt = `${e.name}\n${e.count} 🦕\n${prosperityBadge(e.tier)}  🌾${e.harvested}`; if (e.want) txt += `\nwants ${e.want.glyph}◂${e.want.fromName}`;`. Bump `boxH` 64→78 so four lines fit.

**Reuse:** `zoneNeighbors`, `cropOf`, `zoneById`, `harvestedByZone` (already passed as `harvests`).

## Tests

- `game/src/world/foodweb.test.ts` (extend): `chaseCount` (count/other-hunter/empty), `fearsHunter`
  (threshold boundary, independent hunters), `WARY_RANGE === STALK_RANGE`.
- `game/src/ui/lenses.test.ts` (extend, or `tests/unit` twin — match where lenses tests live): `zoneWant`
  null on all-zero; picks max-output neighbour; tie → link order; fields match `cropOf`/`zoneById`;
  `zoneMapModel` attaches `want`, 3/4-arg call → all null (back-compat).

## Blockers

None foreseen — pure additive + a `forceStep` pass reusing the flee branch and a lens read reusing the
harvest tally. phase → coder-pending.

---

## SHIPPED (coder)

- **442:** foodweb.ts += `chaseCount`/`fearsHunter`/`WARY_CHASES=2`/`WARY_RANGE=STALK_RANGE`. WorldScene:
  `lastFlee` field, `fearsHunter`/`WARY_RANGE` import, the wariness pass after `lastStalk` (nearest in-range
  feared carnivore → `fleeFrom` for a non-fleeing herbivore), `__fleeFrom` hook. Flee branch reused unchanged.
- **438:** lenses.ts += `ZoneWant`/`zoneWant`/`ZoneMapEntry.want` + `zoneMapModel` wiring. WorldScene
  `drawZoneMap` appends `wants <glyph>◂<neighbour>` when `want` set, `boxH` 64→78.
- Tests: foodweb.test.ts +8 (chaseCount/fearsHunter), lenses.test.ts +5 (zoneWant/model). Both files green.
- build clean, tsc clean, no save-schema change.

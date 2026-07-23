# Cycle 109 — Code Plan

Sequence: **structure first** (scarcity.ts + the `reason` field), **then lore** (the crossDino beat that reads it).

## New files

- `game/src/world/scarcity.ts` (structure) — `FOOD_APPEAL_WEIGHT`, `zoneAppeal(prosperity, food)`,
  `richestNeighbor(neighbors, appealOf)`, `poorestResidents(candidates, zoneOf, appealOf)`. Pure, no imports.
- `game/src/world/scarcity.test.ts` (structure) — unit: appeal monotonic; richestNeighbor highest/tie-first/`[]`→null;
  poorestResidents min-appeal subset / all-tie / ≤1 passthrough.
- `game/src/world/greenerground.ts` (lore) — `greenerGroundMemory(leftZoneName)`, `greenerGroundLine()`. Pure.
- `game/src/world/greenerground.test.ts` (lore) — unit: memory names the zone; line is `🍃`.
- `tests/e2e/cycle-109-scarcity.spec.ts` — 450 destination-toward-plenty + who-leaves-poorest, and 457 greener-ground beat.

## Edits to `game/src/scenes/WorldScene.ts`

Imports: add `zoneAppeal, richestNeighbor, poorestResidents` from `'../world/scarcity'`; `foodPileTotal` to the
existing foodstore import; `greenerGroundMemory, greenerGroundLine` from `'../world/greenerground'`.

- **L251** `migrationCross` type → `{ dest: string; edge: Edge; reason?: 'scarcity' }`.
- **New private `zoneAppeal(zoneId)`** — `zoneAppeal(zoneProsperity(this.zoneSignals(zoneId)), foodPileTotal(this.foodStoreFor(zoneId)))`.
- **New private `scarcityDestOf(home)`** — `richestNeighbor(zoneNeighbors(home).map(l=>l.to), z=>this.zoneAppeal(z)) ?? otherZone(home)`.
- **New private `scarcityMigrate(d)`** — home = zoneOf(...); dest = scarcityDestOf(home); `startMigration(d, dest, this.zoneAppeal(dest) > this.zoneAppeal(home) ? 'scarcity' : undefined)`.
- **`maybeMigrate`** — replace the uniform-random `dest`/`startMigration` (L4164-4167) with `this.scarcityMigrate(d)`.
- **`pickMigrant`** — restructure the `pool` tail: return from `told`/`curious` when non-empty (unchanged), then final tier draws from `poorestResidents(candidates, d=>zoneOf(this.dinoZones,d.name,BOWL_ID), z=>this.zoneAppeal(z))`.
- **`startMigration`** — add `reason?: 'scarcity'` param; store it in `migrationCross[d.name]`.
- **`crossDino`** — compute `const homecoming = isHomecoming(this.roots, d.name, home, dest)` once (reuse in the 452 block); after it, add the 457 block: `if (cross?.reason === 'scarcity' && !homecoming) { remember greenerGroundMemory(zoneById(home).name); showBubble 🍃; logEvent '🍃 <name> left <left> for greener ground in <dest>' }`.
- **`setupMigration` hooks** — `__maybeMigrate` routes through `scarcityMigrate`; add `__zoneAppeal(z)` and `__scarcityDest(name)`.

## Reuse (no new prior art)

`zoneProsperity`/`zoneSignals` (428), `foodPileTotal`/`foodStoreFor` (446), `zoneNeighbors`/`otherZone`/`zoneById`
(zones), `isHomecoming`/`remember`/`recall`/`showBubble`/`logEvent` (existing crossDino beats), `__setZoneFood`/
`__setZonePile`/`__migrating`/`__stepWorld` (existing e2e hooks). The 457 beat is the 451 courier beat's shape.

## Test plan

`npx vitest run` (root) green incl. the two new unit files; `npm run build` clean; `npx --yes kill-port 5173`
then `npx playwright test` green incl. cycle-109; cycle-076/078 unmodified + green. Grep `@mlc-ai/web-llm`
confined to `game/src/ai/`.

phase → coder-pending.

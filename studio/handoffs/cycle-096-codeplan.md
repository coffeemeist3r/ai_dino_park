# Cycle 96 — Code Plan

## Lore track — BACKLOG-410 Homesick sooner

**Files**
- `game/src/world/tic.ts` (edit) — add:
  - `TIC_AFTER_STEPS_HOMESICK = 12` (const, `< TIC_AFTER_STEPS`).
  - `aloneInStrangeZone(settled: boolean, hasFriendInZone: boolean): boolean` → `!settled && !hasFriendInZone`.
  - `strangeZoneTicMemory(label: string): string`.
- `game/src/scenes/WorldScene.ts` (edit) — in the `maybeWander` tic branch (~L2432–2436):
  - Compute `settled = isSettled(tenureOf(this.tenure, d.name))` (imports already present).
  - Compute `hasFriendInZone`: `const zoneNames = this.dinos.filter(x => x.name !== d.name && zoneOf(this.dinoZones, x.name, BOWL_ID) === zoneOf(this.dinoZones, d.name, BOWL_ID)).map(x => x.name); const hasFriendInZone = closestFriend(d.name, this.bonds, zoneNames, GRIEF_BOND_FLOOR) !== null;`
  - `let after = ticAfterFor(intent, TIC_AFTER_STEPS); if (aloneInStrangeZone(settled, hasFriendInZone)) after = Math.min(after, TIC_AFTER_STEPS_HOMESICK);` then `inventsTic(this.soloSteps[d.name] ?? 0, after)`.
  - Record the strange-zone condition for `performTic`: set a per-stretch marker `this.ticStrange[d.name] = aloneInStrangeZone(...)` (a `Record<string, boolean>` reset in `resetTic`, like `ticGrief`). In `performTic` (~L2308), when first inventing and there's **no** grief memory, file `strangeZoneTicMemory(tic.label)` iff `this.ticStrange[d.name]`, else the plain `ticMemory` (grief keeps priority, unchanged).
  - Extend `__tic(name)` hook (~L803) to also return `after`/`strange` so the e2e reads the live onset threshold.
  - Add import of `aloneInStrangeZone, TIC_AFTER_STEPS_HOMESICK, strangeZoneTicMemory` to the existing tic import line (81).

**Reuse (no new modules/deps):** `isSettled`/`tenureOf` (belonging), `closestFriend`/`GRIEF_BOND_FLOOR`/`bondPoints` (bonds+tic), `ticAfterFor` (intent), `inventsTic`/`signatureTic`/`ticMemory`/`griefTicMemory` (tic), `zoneOf`/`BOWL_ID` (zones), `remember` (memory), `resetTic`/`performTic` (existing WorldScene glue). No motion/anchor/glyph change — 414 grief aim path untouched.

**Tests**
- `tests/unit/cycle-096-homesick-tic.test.ts` — AC 1–3: `aloneInStrangeZone` truth table; `TIC_AFTER_STEPS_HOMESICK < TIC_AFTER_STEPS` + `inventsTic` at/below the homesick threshold; `strangeZoneTicMemory` distinct from `ticMemory`/`griefTicMemory` and names the label.
- `tests/e2e/cycle-096-homesick-tic.spec.ts` — AC 4–5: migrate a bonded pair apart (friend stays, alone crosses to grove), `__forceStep`/`__stepWorld` the lone dino and assert `__tic().invented` by step 12 + the strange-zone memory; control = a dino with an in-zone bonded friend (or settled) still needs the full 20. Zero console errors.

## Structure track — BACKLOG-428 Zone prosperity index

**Files**
- `game/src/world/prosperity.ts` (new, pure):
  - `interface ZoneSignals { stockpile: number; structures: number; heads: number; harvested: number }`.
  - `zoneProsperity(s): number` = `s.structures*3 + s.heads*2 + s.harvested + s.stockpile`.
  - `type ProsperityTier = 'quiet' | 'growing' | 'thriving'`; `PROSPERITY_QUIET_MAX = 3`, `PROSPERITY_GROWING_MAX = 9`.
  - `prosperityTier(score): ProsperityTier`.
  - `PROSPERITY_GLYPH: Record<ProsperityTier,string> = { quiet:'○', growing:'◐', thriving:'●' }`.
  - `prosperityBadge(tier): string` → `${glyph} ${tier}`.
- `game/src/ui/lenses.ts` (edit):
  - `ZoneMapEntry` gains `tier: ProsperityTier`.
  - `zoneMapModel(chain, populations, keeperZone, tiers: Record<string, ProsperityTier> = {})` sets `tier: tiers[id] ?? 'quiet'` (default keeps old 3-arg callers/tests valid).
  - import the type from `../world/prosperity`.
- `game/src/scenes/WorldScene.ts` (edit):
  - Field `harvestedByZone: Record<string, number> = {}`; at the harvest site (~L1007) `const hz = zoneOf(this.dinoZones,'keeper',...)` — use the plot's zone (the keeper's active `this.zoneId` at harvest, which is where the worked plot is): `this.harvestedByZone[this.zoneId] = (this.harvestedByZone[this.zoneId] ?? 0) + 1;` alongside the existing `this.harvested++`.
  - `private zoneSignals(id): ZoneSignals` — `stockpile` = sum of `pileFor(id)` values; `structures` = `[...cairns,...shelters,...thatches].filter(s=>s.zone===id).length`; `heads` = `zonePopulations(...)[id]`; `harvested` = `harvestedByZone[id] ?? 0`.
  - `zoneMapEntries()` passes a `tiers` map: for each zone in chain, `prosperityTier(zoneProsperity(this.zoneSignals(id)))`.
  - `drawZoneMap()`: append the badge as a third label line (`${e.name}\n${e.count} 🦕\n${prosperityBadge(e.tier)}`); bump `boxH` 52→64 and keep the keeper dot near the bottom.
  - `__zoneProsperity = (zone) => ({ signals, score, tier })` hook.
  - Save: add `harvestedByZone: this.harvestedByZone` to the save object (~L4336) and `this.harvestedByZone = save.harvestedByZone ?? {}` on load (~L4405). Additive.

**Reuse (no new deps):** `zonePopulations`/`zoneChain`/`zoneOf`/`BOWL_ID` (zones), `stockpileByZone`/`pileFor`, `cairns`/`shelters`/`thatches`, `zoneMapModel` (extended), the existing save round-trip + `__setZonePile` hook for the e2e.

**Tests**
- `tests/unit/cycle-096-prosperity.test.ts` — AC 1–3: `zoneProsperity(0,0,0,0)===0`, monotonic per field + weight ordering; `prosperityTier` both sides of 3 and 9; `PROSPERITY_GLYPH`/`prosperityBadge`; `zoneMapModel` sets tier from the passed map + defaults to `quiet`, keeper/counts unchanged.
- `tests/e2e/cycle-096-prosperity.spec.ts` — AC 4–5: open the map lens, assert each box shows a badge; `__setZonePile` + read `__zoneProsperity(zone)` tier climbs across a threshold; harvest from a zone plot bumps `__zoneProsperity(zone).signals.harvested`; save→reload (`__save`/`__load` or the existing persistence hook) preserves `harvestedByZone`. Zero console errors.

## Order & risk
1. `world/tic.ts` + `world/prosperity.ts` (pure, independent) → their unit tests.
2. `ui/lenses.ts` (+ update its existing unit test for the new arg/field).
3. `WorldScene.ts` both tracks (disjoint methods).
4. e2e both.

**Blocker check:** none. `harvested` global stays for existing readers; save additive; no WebLLM outside `ai/`. The only shared file (`WorldScene.ts`) is touched in disjoint methods.

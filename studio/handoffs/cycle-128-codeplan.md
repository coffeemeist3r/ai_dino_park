# Cycle 128 — Code Plan

## Lore track — BACKLOG-401

### New files
- `game/src/world/pecking.ts` — pure. Exports:
  - `PECKING_BAR = 2` (the dead band; the calibration knob)
  - `WEIGHTS` (stood +2, snatched +1, stepped-back −1, slunk −2) as one table, not a chain of ifs
  - `peckingScore(memories, other): number`
  - `dispositionToward(memories, other): 'confident' | 'wary' | null`
  - `holdsAgainst(bravery, disposition): boolean` — `standsGround(bravery)` when null
  - `peckingLine(memories, names): string | null` — the book line
- `game/src/world/pecking.test.ts` — criteria 1–8.

### Reuse (checked for prior art first)
- `standsGround` / `slunkOffMemory` from `world/feeding.ts` — imported, never re-implemented or
  re-typed. `holdsAgainst(b, null) === standsGround(b)` is a *test*, not a copied constant.
- The memory-regex shape from `world/manner.ts` (402), but with a capture group for the name. The two
  modules stay separate per the cycle-127 handoff note: manner is the fold-over-all, pecking is the
  per-opponent read.
- `recall` (memory ring) and `BookRow` / `bookLines` (ui/lenses.ts) as-is.

### Edited files
- `game/src/scenes/WorldScene.ts`
  - extract the gobble branch of `checkFeeding` into `private resolveContest(eater, gobblerName): void`
    — the stand path, the slink path and the gobble path, unchanged, in one place. `checkFeeding` calls
    it; the new dev hook calls it too, so the e2e drives **production** code (the standing complaint from
    cycles 126–127 that the suite proves derivations but never stages the moment).
  - inside it, `holdsAgainst(eater.traits.bravery, dispositionToward(recall(this.memory, eater.name),
    gobblerName))` replaces the bare `standsGround(...)`.
  - the two event lines gain a because-clause only when the disposition decided it.
  - `bookRows()` gains `pecking: peckingLine(recall(this.memory, d.name), this.dinos.map(d => d.name))
    ?? undefined`.
  - dev hook `__forceContest(winner, gobbler)` → runs `resolveContest`.
- `game/src/ui/lenses.ts` — `pecking?: string` on `BookRow`, rendered right after `manner`.
- `tests/e2e/cycle-128-pecking.spec.ts` — criteria 9, 10.

### Test plan (lore)
Unit: the eight pure criteria, with the memory strings built from the exported builders where they
exist. E2e: seed two slink memories against a named dino via `__remember`, `__forceContest` them, assert
the ceding outcome via `__gobbleFood`/`__standFood` and the because-clause via `__ticker`; then a fresh
pair with no history through the same hook to prove the unchanged path.

---

## Structure track — BACKLOG-480

### New files
- `game/src/world/upkeep.ts` — pure. Exports:
  - `STRUCTURES_PER_UPKEEP = 2`, `REPAIR_COST = 1`, `DERELICT_ALPHA = 0.45`
  - `UPKEEP_GLYPH = '🛠️'`, `lapsedLine(zoneName, glyph)`, `patchedLine(zoneName, glyph)`
  - `upkeepDue(standing): number`
  - `runUpkeep(pile, standing, derelict): UpkeepPlan` — same-reference no-op contract
  - `runUpkeepOverDays(pile, days, standing, derelict): UpkeepPlan` (accumulating; breaks on no-op)
- `game/src/world/upkeep.test.ts` — criteria 1–9, 12.

### Reuse
- `Stockpile` / `RESOURCE_GLYPH` from `world/resource.ts` (kind order = determinism).
- The `spoilFood` same-reference no-op contract and the `spoilFoodOverDays` early-break loop shape.
- `zoneChain()`, `zoneById`, `this.pileFor(zone)`, `this.logEvent`, `this.saveGame` — all existing.
- `granaryFoodCap` unchanged; only *what is passed to it* changes.

### Edited files
- `game/src/scenes/WorldScene.ts`
  - the four structure arrays gain `derelict?: boolean`.
  - `private standingIn(zone)` / `private derelictIn(zone)` — maintained / lapsed counts.
  - `baseLandmarks(zone)` → maintained only (documented at the call site).
  - `hasGranary(zone)` **splits**: `hasGranary` (maintained — feeds `granaryFoodCap`) and
    `granaryRaised(zone)` (any, incl. derelict — feeds the one-per-zone build gate at
    `tryBuildGranary` and the lens 🏛️ marker). This is the trap the Structure-smith named.
  - `zoneSignals` `structures` → maintained only.
  - `private runUpkeepPass(days = 1)`: per zone, call the pure fn, apply `lapsed` to the **newest**
    standing structure(s) and `repaired` to the **oldest** derelict, write back the pile, log a line per
    change, save once if anything changed.
  - a day hook beside `checkSpoilage` (`lastUpkeepDay`, live-only, same shape), and a call from the
    away catch-up with the day count.
  - `applyStructureVisibility` (or the sprite-visibility pass) sets `alpha` per structure record.
  - dev hooks `__runUpkeep(days?)`, `__derelicts()`, `__granaryRaised(z)`.
- `game/src/world/saveGame.ts` — `derelict?: boolean` accepted and passed through on all four arrays;
  absent → maintained. Additive, no version bump.
- `tests/e2e/cycle-128-upkeep.spec.ts` — criteria 10, 11, 13, 14.

### Test plan (structure)
Unit: the arithmetic, the largest-kind-first spend, the partial-pay lapse, the two-pass convergence, the
repair, the no-op reference, the days loop, and a save round-trip with and without the field. E2e:
`__seedGranaryReady` a zone, build up, strip the pile with `__setZonePile`, `__runUpkeep()`, assert
`__derelicts()`, the 🛠️ ticker line, the dropped `__foodCap`, that `__granaryRaised` still blocks a
second granary, and the prosperity tier falling; then restock and patch back up.

### Blockers
None known at plan time. Risk: the e2e boot is the slowest part of the suite and both specs boot twice —
kept to two tests each.

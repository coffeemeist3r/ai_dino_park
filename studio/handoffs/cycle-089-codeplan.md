# Cycle 89 — Code Plan (two tracks)

## Lore track — BACKLOG-413 Fond of being caught

**Item:** A dino caught mid-tic (408) that loves the keeper (hearts ≥ FOND_MIN) reads pleased 😊, not bashful 😳.

**Files to create:** none.

**Files to modify:**
- `game/src/world/tic.ts` — add three pure helpers beside `bashfulOpener`/`caughtMemory`:
  - `fondOfBeingCaught(hearts: number): boolean` → `hearts >= FOND_MIN` (import `FOND_MIN` from `../ai/brain`).
  - `fondOpener(): string` → the warm "delighted you caught me, don't mind with you" frame (twin of `bashfulOpener`).
  - `fondCaughtMemory(label: string): string` → the glad caught memory (twin of `caughtMemory`, distinct text).
- `game/src/scenes/WorldScene.ts`:
  - Import: add `fondOfBeingCaught, fondOpener, fondCaughtMemory` to the `../world/tic` import (line 76).
  - `openToneMenu` (~3440): when `caughtTic` is set, pick the startle glyph by fondness — `flashFeed(target, fond ? '😊' : '😳')`, where `fond = fondOfBeingCaught(heartsFromPoints(this.friendship[target.name] ?? 0))`.
  - `pickTone` (~3486): compute `fond` the same way; choose `opener = fond ? fondOpener() : bashfulOpener()`; the caught-once memory files `fond ? fondCaughtMemory(label) : caughtMemory(label)`. The `caught`/prefix/guard structure is otherwise unchanged.

**Reuse list (MUST use, do not reinvent):**
- `FOND_MIN` — `game/src/ai/brain.ts:97` (the close-friend hearts floor; already the fond-greeting threshold).
- `heartsFromPoints` — `game/src/social/friendship.ts` (already imported in WorldScene, used all over `pickTone`).
- `bashfulOpener`/`caughtMemory`/`signatureTic` — `game/src/world/tic.ts` (the 408 path; fond helpers are twins).
- `flashFeed`/`remember`/`ticCaughtFiled`/`caughtTic` — existing WorldScene 408 machinery, unchanged in shape.

**New dependencies:** none.

**Test plan:**
- Unit (`tests/unit/cycle-089-fond-caught.test.ts`): `fondOfBeingCaught` true at/above FOND_MIN and false below (boundary at 8); `fondOpener()` ≠ `bashfulOpener()` and is non-empty; `fondCaughtMemory(label)` ≠ `caughtMemory(label)`, contains the label, and reads glad (e.g. "glad").
- E2E (`tests/e2e/cycle-089-fond-caught.spec.ts`): boot; `__setHearts(name, 10)`; `__inventTic(name)`; `__pickTone(name,'warm')` → line contains the fond opener, NOT `caught mid-fidget`; memory contains the glad caught text. Then a second dino at `__setHearts(name,0)` + `__inventTic` → line contains `caught mid-fidget` (bashful path intact). Zero console errors.

**Risks:** `openToneMenu` and `pickTone` must compute `fond` from the same expression or the glyph and the opener could disagree — both use `heartsFromPoints(this.friendship[name] ?? 0)`. Importing `FOND_MIN` from `ai/brain` into `world/tic` is a world→ai import; `brain.ts` is the pure interface file (no Phaser, no web-llm) so the boundary stays clean.

**Estimated touch count:** ~2 files + 2 test files.

## Structure track — BACKLOG-384 Resource regrowth

**Item:** Per-zone yield that a pickup depletes and time regrows, scaling the spawn roll — the first renewable constraint.

**Files to create:**
- `game/src/world/regrowth.ts` — pure module:
  - Consts `YIELD_MAX = 1`, `YIELD_DEPLETE = 0.34`, `YIELD_REGROW = 0.02`.
  - `depleteYield(y)` → `clamp01(y - YIELD_DEPLETE)`.
  - `regrowYield(y)` → `clamp01(y + YIELD_REGROW)`.
  - `yieldSpawnChance(base, y)` → `base * clamp01(y)`.
  - `rollResourceAt(base, y, rand = Math.random)` → `rand() < yieldSpawnChance(base, y)`.

**Files to modify:**
- `game/src/scenes/WorldScene.ts`:
  - Import: add `RESOURCE_SPAWN_CHANCE` to the `../world/resource` import; drop `rollResource` from it (goes unused). Add `regrowYield, rollResourceAt, depleteYield, YIELD_MAX` from `../world/regrowth`.
  - New field: `private yieldByZone: Record<string, number> = {};` (default read via `?? YIELD_MAX`).
  - `maybeSpawnResource` (~1129): per resident zone, first `this.yieldByZone[zone] = regrowYield(this.yieldByZone[zone] ?? YIELD_MAX)` (regrow runs even when the slot is occupied); replace `!rollResource()` with `!rollResourceAt(RESOURCE_SPAWN_CHANCE, this.yieldByZone[zone])`.
  - `checkGather` (~1164): after the resource is removed from the active zone, `this.yieldByZone[this.zoneId] = depleteYield(this.yieldByZone[this.zoneId] ?? YIELD_MAX)`.
  - Dev hook (near `__resource`, ~753): `(window as any).__yield = (zone: string) => this.yieldByZone[zone] ?? YIELD_MAX;`

**Reuse list (MUST use, do not reinvent):**
- `RESOURCE_SPAWN_CHANCE` — `game/src/world/resource.ts:24` (the base rate; new module scales it, never hardcodes 0.12).
- `residentZones()` / `resourceByZone` / `resourceAgeByZone` — existing per-zone spawn machinery (314), untouched in shape.
- Existing `__spawnResource` + `__stepWorld` hooks drive the e2e gather (mirror `cycle-062-resource.spec.ts`).

**New dependencies:** none.

**Test plan:**
- Unit (`tests/unit/cycle-089-regrowth.test.ts`): `depleteYield` floors at 0 (deplete from 0.1 → 0, never negative); `regrowYield` caps at YIELD_MAX (regrow from 0.99 → 1, never above); `yieldSpawnChance(base,1)===base`, `(base,0)===0`, monotonic in y; `rollResourceAt` fires below the scaled chance and not above (seeded `rand`); a full→exhaust→regrow round trip (deplete ~3× to 0, regrow back toward 1).
- E2E (`tests/e2e/cycle-089-regrowth.spec.ts`): boot; `__yield('bowl')` === 1; spawn a resource on the first dino's tile via `__spawnResource`; one `__stepWorld` (pickup); `__yield('bowl')` < 1 and > 0.6 (one depletion). Zero console errors.

**Risks:** Step order in `forceStep` is `maybeSpawnResource` (regrow, capped) then `checkGather` (deplete) — the e2e's single step nets one depletion regardless of the cap-first regrow. `rollResource` becoming unused in WorldScene would fail the build (unused import) — must be dropped from the import; keep the export in `resource.ts` for its unit tests. Transient yield means no save change (a reload restarts fresh-full — intended).

**Estimated touch count:** 1 new + 1 modified file + 2 test files.

## Cross-track collision
`WorldScene.ts` is shared but the tracks touch different methods (413: `openToneMenu`/`pickTone`; 384:
`maybeSpawnResource`/`checkGather` + new field + hook + imports). No ordering constraint. Separate new/modified
modules otherwise (`tic.ts` vs `regrowth.ts`). ~4 files + 4 test files total.

---

## Shipped

**Lore track (BACKLOG-413):**
- `game/src/world/tic.ts` — added `fondOfBeingCaught(hearts)` (imported `FOND_MIN` from `ai/brain`), `fondOpener()`, `fondCaughtMemory(label)` beside the 408 bashful helpers.
- `game/src/scenes/WorldScene.ts` — tic import extended; `openToneMenu` picks 😊/😳 by fondness; `pickTone` picks the opener + memory by fondness (both compute from `heartsFromPoints(this.friendship[name])`).
- Tests: `tests/unit/cycle-089-fond-caught.test.ts` (3), `tests/e2e/cycle-089-fond-caught.spec.ts` (1).

**Structure track (BACKLOG-384):**
- `game/src/world/regrowth.ts` — new pure module (YIELD_MAX/DEPLETE/REGROW + depleteYield/regrowYield/yieldSpawnChance/rollResourceAt).
- `game/src/scenes/WorldScene.ts` — `RESOURCE_SPAWN_CHANCE` imported (dropped unused `rollResource`); `yieldByZone` field; `maybeSpawnResource` regrows + scales the roll; `checkGather` depletes the active zone; `__yield(zone)` hook.
- Tests: `tests/unit/cycle-089-regrowth.test.ts` (5), `tests/e2e/cycle-089-regrowth.spec.ts` (1).

**Deviations:** none — touched exactly the planned files.
**Build:** ✅ clean. **Unit:** ✅ 936 (+8). **Dev server:** ✅ HTTP 200. web-llm boundary untouched (`world/tic.ts` imports only `ai/brain` interface). No save-format change either track.

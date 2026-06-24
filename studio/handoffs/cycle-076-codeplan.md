# Cycle 76 — Code Plan

Both thin glue over pure helpers; one new pure module (345), one save-schema add (328). Shared file `WorldScene.ts`, disjoint regions.

---

## Lore track — BACKLOG-345: News pulls a newcomer

**Item:** Grove news biases the migration pick toward a curious, un-traveled bowl dino.

**Files to create:**
- `game/src/world/curiosity.ts` — pure:
  - `import { GROVE_NEWS_TOKEN } from './groveword'; import { BOWL_ID } from './zones';`
  - `export function groveCurious(events: readonly string[], visited: readonly string[], name: string, homeZone: string): boolean` → `homeZone === BOWL_ID && !visited.includes(name) && events.some((e) => e.includes(GROVE_NEWS_TOKEN))`.

**Files to modify:**
- `game/src/scenes/WorldScene.ts`:
  - import `{ groveCurious }` from `../world/curiosity` (`recall` from `../ai/memory` is already imported).
  - Extract a `private pickMigrant(): Dino | null` from `maybeMigrate`: build `candidates` (non-crossing) as today, then `const curious = candidates.filter((d) => groveCurious(recall(this.memory, d.name), this.groveVisited, d.name, zoneOf(this.dinoZones, d.name, BOWL_ID)))`; `const pool = curious.length ? curious : candidates`; return `pool[Math.floor(Math.random()*pool.length)] ?? null`.
  - `maybeMigrate`: keep the cooldown + `MIGRATE_CHANCE` gates, then `const d = this.pickMigrant(); if (!d) return; this.startMigration(d); this.lastMigrationMs = Date.now();`.
  - New hook beside `__startMigration` (~L2801): `(window as any).__maybeMigrate = () => { const d = this.pickMigrant(); if (d) this.startMigration(d); return d?.name ?? null; };` (runs the *pick* deterministically, bypassing cooldown/chance, for the e2e).

**Reuse list:**
- `game/src/world/groveword.ts` — `GROVE_NEWS_TOKEN` (don't redefine the token).
- `game/src/ai/memory.ts` — `recall` (already imported in WorldScene).
- `game/src/world/zones.ts` — `BOWL_ID`, `zoneOf` (already imported).
- The existing `maybeMigrate`/`startMigration`/`migrating` machinery.

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/curiosity.test.ts`: `groveCurious` true for bowl + unvisited + has-token; false for each failing condition (grove home, visited, no token); a *heard* rumor line (contains the token) qualifies, a visited dino with first-hand news does not.
- E2E `tests/e2e/cycle-076-news-pull.spec.ts`: drive Rex grove→bowl (now carries first-hand grove news, in `groveVisited`); `__spreadGroveWord('Rex','Mossback')` so Mossback (bowl, unvisited) hears it → grove-curious; `__maybeMigrate()` returns `'Mossback'` (the lone curious candidate) and Mossback is now migrating.

---

## Structure track — BACKLOG-328: Per-zone stockpile

**Item:** Split the shared stockpile into one pile per zone.

**Files to create:** none.

**Files to modify:**
- `game/src/scenes/WorldScene.ts`:
  - field: `private stockpile: Stockpile = {}` → `private stockpileByZone: Record<string, Stockpile> = {}`; add `private pileFor(zone: string): Stockpile { return (this.stockpileByZone[zone] ??= {}); }`.
  - `checkGather` (~L915–954): compute `const zone = zoneOf(this.dinoZones, taker.name, BOWL_ID)` once near the top of the bank section; replace every `this.stockpile` use with `this.pileFor(zone)` and assign results back to `this.stockpileByZone[zone]` (`atCap(this.pileFor(zone), kind)`; `this.stockpileByZone[zone] = bankResource(...)`; `buildShelter(this.pileFor(zone))` / `craft(this.pileFor(zone))` → assign to `this.stockpileByZone[zone]`). The existing `zone`/`zoneCairns`/`hasShelter` block already computes `zone` — reuse that single binding.
  - plaque (both sites ~L494 + ~L524): `stockpile: stockpileLine(this.pileFor(this.zoneId))` (the keeper's active zone).
  - hooks (~L645–652): `__stockpile = () => ({ ...this.pileFor(this.zoneId) })`; add `__zoneStockpile = (z: string) => ({ ...this.pileFor(z) })`; `__canCraft = () => canCraft(this.pileFor(this.zoneId))`; `__canBuildShelter = () => canBuildShelter(this.pileFor(this.zoneId))`.
  - save (~L3403): write `stockpile: this.pileFor(BOWL_ID)` (legacy = bowl pile) **and** `stockpileByZone: this.stockpileByZone`.
  - restore (~L3456): `this.stockpileByZone = save.stockpileByZone ?? (save.stockpile && Object.keys(save.stockpile).length ? { [BOWL_ID]: save.stockpile } : {})`.
- `game/src/world/saveGame.ts`:
  - `SaveData`: add `stockpileByZone?: Record<string, Record<string, number>>;` (additive, after `stockpile`).
  - deserialize: validate `o.stockpileByZone` if present — object whose every value is a valid stockpile (object of numbers); reject (null) otherwise; include in the returned object. Mirror the existing `stockpile` validation, one level deeper.

**Reuse list:**
- `game/src/world/resource.ts` — `atCap`, `bankResource`, `canCraft`, `craft`, `canBuildShelter`, `buildShelter`, `stockpileLine`, `Stockpile`, `STOCKPILE_CAP` — all already take/return a single pile; reuse unchanged per zone.
- The existing `stockpile` save validation in `saveGame.ts` as the template for the nested one.

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/saveGame.test.ts` (extend): round-trip `stockpileByZone: { bowl: {branch:2}, grove: {stone:1} }`; an old save with only `stockpile` (no `stockpileByZone`) still deserializes (the WorldScene migration to bowl is runtime, but assert deserialize keeps `stockpile` and leaves `stockpileByZone` undefined); a malformed `stockpileByZone` (e.g. `{ bowl: { branch: 'lots' } }`) → null.
- E2E `tests/e2e/cycle-076-zone-stockpile.spec.ts`: bank a branch in the bowl → `__zoneStockpile('bowl').branch === 1`, `__zoneStockpile('grove')` empty; `__migrate('Rex','grove')` + `__setZone('grove')`, bank on Rex in the grove → grove pile rises, bowl pile unchanged; `__stockpile()` (active) tracks the keeper's zone across a `__setZone`.

---

## Risks
- **Shared `WorldScene.ts`:** 345 edits `maybeMigrate`/`pickMigrant` (~L2812) + a hook (~L2801); 328 edits `checkGather` (~L915), the plaque sites (~L494/524), the stockpile hooks (~L645), and save/restore (~L3403/3456). No overlap.
- **328 save back-compat:** keep writing the legacy `stockpile` field (= bowl pile) so the existing saveGame round-trip tests (`withStock`) and any old reader stay valid; the new `stockpileByZone` is additive. No `SAVE_VERSION` bump.
- **`checkGather` zone timing:** `zone` must be computed *before* the cap/bank branch (today it's computed lower, for the cairn block) — move the single binding up and reuse it, don't introduce a second.
- **345 default behavior:** when no candidate is curious, `pool === candidates` → the pick is the old uniform random; the cycle-072 liveliness/cadence spec and the 073/074 migration specs (which drive `__startMigration`/`__migrate` directly, not the ambient pick) must stay green.

## Estimated touch count
~6 files: `curiosity.ts` (new), `saveGame.ts`, `WorldScene.ts`, `tests/unit/curiosity.test.ts` (new), `tests/unit/saveGame.test.ts` (extend), + 2 e2e specs. Production code 3 files; within one fire.

---

## Shipped

**Files touched:**
- `game/src/world/curiosity.ts` (new) — pure `groveCurious` (345).
- `game/src/scenes/WorldScene.ts` — `pickMigrant()` (curious-preferred) + `__maybeMigrate` hook; `maybeMigrate` uses it (345). `stockpile`→`stockpileByZone` + `pileFor`; `checkGather` banks/caps/crafts per gatherer-zone (one `zone` binding moved up); plaque Stores = active zone; `__stockpile`/`__zoneStockpile`/`__canCraft`/`__canBuildShelter` per active zone; save writes legacy `stockpile`=bowl + `stockpileByZone`; restore migrates old global pile → bowl (328).
- `game/src/world/saveGame.ts` — `SaveData.stockpileByZone?`, nested validation (zone→kind→count), included in output (328).
- `tests/unit/curiosity.test.ts` (new, 4) — `groveCurious` truth table.
- `tests/unit/saveGame.test.ts` (extend, +3) — per-zone round-trip, pre-328 load, malformed reject.
- `tests/e2e/cycle-076-news-pull.spec.ts` (new) — grove news pulls the curious newcomer.
- `tests/e2e/cycle-076-zone-stockpile.spec.ts` (new) — zones bank independently; readout follows the keeper.

**Deviations:** none. The pure resource.ts pile helpers were reused unchanged, as planned.

**Build:** ✅ clean. **Unit:** ✅ 775 passed (was 768; +7). **E2E (new specs):** ✅ both pass warm (first cold-server run hit the known `__ready` boot flake; green on warm re-run — QA to confirm on the full run).

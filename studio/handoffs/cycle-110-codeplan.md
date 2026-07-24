# Cycle 110 — Code Plan

## Lore track — BACKLOG-458 Word of plenty

**Item:** Word of plenty — hearsay of a thriving zone primes a dino to migrate there.

**Files to create:**
- `game/src/world/plentyword.ts` — pure module. Exports:
  - `PLENTY_TOKEN = 'is thriving'` (the tell a memory is plenty-word).
  - `plentyMemory(zoneName): string` → `🌾 ${zoneName} is thriving — saw it yourself` (first-hand, shareable, no `RUMOR_MARK`).
  - `plentyWordLine(speaker, zoneName): string` → `${speaker} ${RUMOR_MARK} ${zoneName} is thriving` (1-hop rumor).
  - `spreadPlentyWord(store, speaker, listener): {store, rumor}` — mirror of `spreadGroveWord`: if `speaker !== listener` and the speaker has a **shareable** event containing `PLENTY_TOKEN`, extract the zone name from it (match against `ZONES` names), plant `plentyWordLine` on the listener, return the rumor; else `{store, rumor:null}`.
  - `plentyTarget(events, currentZoneId): string | null` — newest→oldest scan for an event naming a `ZONES` zone followed by `PLENTY_TOKEN` whose id `!== currentZoneId`; return that id or null. Reused by the migrant pick + destination.
  - helper `plentyZoneNamed(event): {id,name} | null` — the ZONES entry whose `name` appears in `event` before `PLENTY_TOKEN` (shared by spread + target).
- `game/src/world/plentyword.test.ts` — unit tests (see Test plan).

**Files to modify:**
- `game/src/scenes/WorldScene.ts`
  - import the new `plentyword` symbols.
  - `seedPlentyWord()` (new private) — for each dino whose home-zone tier reads `'thriving'` and that does **not** already carry a first-hand plenty memory naming that zone, `remember(plentyMemory(zoneName))`. Called once at the top of `maybeMigrate()` (before the cooldown/roll gates) so plenty seeds on the migration cadence.
  - gossip cascade (~line 3250): add `plenty = pword.rumor ? pword : spreadPlentyWord(memory, a, b)` between the provider rung and generic `gossip`; `gossip = plenty.rumor ? plenty : spreadGossip(...)`; add the `else if (plenty.rumor) this.logEvent('🌾 ${b.name} heard ${zone} is thriving from ${a.name}')` rung in cascade order.
  - `plentyDestOf(d): string | null` (new private) — `plentyTarget(recall(memory,d.name), home)` filtered to a **neighbour** of home (`zoneNeighbors(home)`); else null.
  - `pickMigrant()` — after the grove `curious` tier and before the `poorestResidents` fallback, add a `primed = candidates.filter(d => this.plentyDestOf(d))` tier: `if (primed.length) return primed[Math.floor(Math.random()*primed.length)]`. (Grove tiers untouched — 076/078 stay byte-identical.)
  - `scarcityMigrate(d)` — if `plentyDestOf(d)` is non-null, use it as `dest` (still tag `'scarcity'` when `zoneAppeal(dest) > zoneAppeal(home)`); else the existing `scarcityDestOf(home)`.
  - dev hooks: `__spreadPlentyWord(a,b)`, `__plentyTarget(name)`, `__seedPlentyWord()` (mirror `__spreadProviderWord`).

**Reuse list:**
- `social/gossip.ts` — `RUMOR_MARK`, `isShareable` (do not re-declare the rumor mark).
- `ai/memory.ts` — `remember`, `recall`.
- `world/zones.ts` — `ZONES`, `zoneById`, `zoneNeighbors`, `zoneOf`, `BOWL_ID`.
- `world/prosperity.ts` — `prosperityTier` (via the existing `this.zoneSignals`/`zoneProsperity`) for the thriving read.
- Pattern twins: `world/groveword.ts` (`spreadGroveWord`), `world/curiosity.ts` (`grovePull` tiering), `world/providerword.ts`.

**New dependencies:** none.

**Test plan:**
- Unit `plentyword.test.ts`: `plentyMemory` shareable + `plentyWordLine` carries `RUMOR_MARK`; `spreadPlentyWord` plants only from a first-hand carrier, null for self/no-news/heard-only (1-hop); `plentyTarget` returns the newest non-current named zone, null when only the current zone or none.
- E2E (extend/new `tests/e2e/cycle-110-plenty.spec.ts` under the game e2e dir): via dev hooks — seed a thriving zone, `__spreadPlentyWord(A,B)`, assert `__plentyTarget(B)` is the zone id; then assert a primed dino is the `__maybeMigrate` pick and its `__scarcityDest` is that zone.

**Risks:**
- Zone-name extraction from a memory string is substring-matched against `ZONES` names — fine because names are distinct and fixed; keep `PLENTY_TOKEN` in the line so the scan is cheap.
- Must not disturb `pickMigrant` grove tiers (076/078). Insert strictly after them.
- Seeding must dedup (memory ring is 6 entries; re-adding would spam) — gate on "already carries first-hand plenty for this zone".

**Estimated touch count:** ~4 files (1 new module, 1 new test, WorldScene, 1 e2e).

---

## Structure track — BACKLOG-454 The granary

**Item:** The granary — a zone that has raised enough landmarks builds a granary; a standing granary lifts its food cap.

**Files to create:**
- `game/src/world/granary.ts` — pure module. Exports:
  - `GRANARY_GLYPH = '🏛️'`, `GRANARY_RECIPE = {branch:3, stone:3}` (typed `Partial<Record<ResourceKind,number>>`).
  - `GRANARY_AFTER_STRUCTURES = 3`, `GRANARY_FOOD_BONUS = 3`.
  - `canBuildGranary(pile, landmarks, hasGranary): boolean` — `!hasGranary && landmarks >= GRANARY_AFTER_STRUCTURES && affords(GRANARY_RECIPE)`.
  - `buildGranary(pile): Stockpile | null` — spend the recipe (twin of `buildStructureFor`), never mutates.
  - `granaryFoodCap(hasGranary): number` — `FOOD_STOCKPILE_CAP + (hasGranary ? GRANARY_FOOD_BONUS : 0)`.
- `game/src/world/granary.test.ts` — unit tests.

**Files to modify:**
- `game/src/world/foodstore.ts` — thread an optional cap (default `FOOD_STOCKPILE_CAP`) through `foodAtCap(pile,id,cap?)`, `bankFood(pile,id,cap?)`, `pickFoodCarry(src,dest,wantId?,destCap?)`. Every existing call omits the arg → byte-identical.
- `game/src/scenes/WorldScene.ts`
  - fields `granaries: {tileX,tileY,zone}[]` + `granarySprites` (mirror `thatches`/`thatchSprites`); `hasGranary(zone)` + `baseLandmarks(zone)` helpers.
  - gather-build path (~1492): before the bias `buildStructureFor`, if `canBuildGranary(pile, baseLandmarks(zone), hasGranary(zone))` → `buildGranary`, `placeGranary`, refresh; else the existing bias build. Once a granary stands the zone resumes bias builds.
  - `drawGranary` / `placeGranary` (mirror `drawThatch`/`placeThatch`), `applyZoneVisibility` line for granaries, save (`granaries: this.granaries`) + restore (`this.granaries = (save.granaries ?? []).map(... zone ?? BOWL_ID)`; draw each).
  - food-cap callers: `harvest` (~1096) and courier carry in `crossDino` (~4278) pass `granaryFoodCap(this.hasGranary(zone/dest))` to `foodAtCap`/`bankFood`/`pickFoodCarry`.
  - `zoneSignals` (~2381): include `...this.granaries` in the structures count (prosperity).
  - dev hooks: `__granaries`, `__hasGranary(z)`, `__foodCap(z)`.
- `game/src/world/saveGame.ts` — add `granaries?: {tileX,tileY,zone?}[]` to `SaveData`, validate like `thatches`, include in the returned object.
- `game/src/ui/lenses.ts` — `ZoneMapEntry.granary?: boolean`; `zoneMapModel(..., granaryZones: string[] = [])` sets it; WorldScene passes the set. (Optional lens marker; keep minimal.)

**Reuse list:**
- `world/resource.ts` — `ResourceKind`, `Stockpile`, the `buildStructureFor` spend pattern, `takeResource`/`bankResource`.
- `world/foodstore.ts` — `FOOD_STOCKPILE_CAP`.
- WorldScene structure pattern: `cairns`/`shelters`/`thatches` (arrays, sprites, place/draw/save/restore/visibility) — copy exactly for `granaries`.

**New dependencies:** none.

**Test plan:**
- Unit `granary.test.ts`: `canBuildGranary` truth table (gates on hasGranary, landmark count, affordability); `buildGranary` spends/returns null + no-mutate; `granaryFoodCap(true/false)`.
- Unit `foodstore.test.ts` (extend): `bankFood`/`foodAtCap` honour a raised cap (pile at 6 banks to 9 with cap 9); `pickFoodCarry` accepts into a dest below its raised cap. Existing default-arg calls unchanged.
- E2E (`tests/e2e/cycle-110-granary.spec.ts`): via dev hooks seed a zone with ≥3 landmarks + a `{branch:3,stone:3}` pile, trigger a build, assert `__granaries` shows one and `__foodCap(zone)===9`; assert the zone banks a harvest past 6; save/restore round-trip keeps the granary.

**Risks:**
- The granary gate must count **base** landmarks only (cairns+shelters+thatches), else a granary counts itself; `hasGranary` guards the once-only build.
- Cap threading: keep the default arg so `foodstore.test.ts` existing assertions and every other caller stay green — verify with a full `vitest run`.
- Fernreach (frond bias) accumulates branch/stone slowly; granary is *earnable* not *instant* — fine, QA drives via seeded pile.

**Estimated touch count:** ~7 files (2 new, foodstore, WorldScene, saveGame, lenses, 1 e2e). Arc-sized, under 15.

## Cross-track order
Land the structure track's pure modules + foodstore threading + WorldScene build/save/cap wiring first, then
the lore track's migration/gossip wiring. Different WorldScene methods; no shared edit region.

---

## Shipped (Coder)

**Structure track — BACKLOG-454 (granary):**
- Created `game/src/world/granary.ts` + `granary.test.ts` (7 unit tests).
- `game/src/world/foodstore.ts`: threaded an optional cap (default `FOOD_STOCKPILE_CAP`) through `foodAtCap`/`bankFood`/`pickFoodCarry`; extended `foodstore.test.ts` (raised-cap banking + carry-accept).
- `game/src/scenes/WorldScene.ts`: `granaries`/`granarySprites` fields; `buildOnGather` (extracted the on-gather build decision; granary gate before bias landmark); `drawGranary`/`placeGranary`; `baseLandmarks`/`hasGranary`/`granaryZones` helpers; granary in `zoneSignals` structures + `applyZoneVisibility` + save/restore; food-cap threaded at `harvest` + courier carry in `crossDino`; dev hooks `__granaries`/`__hasGranary`/`__foodCap`/`__seedGranaryReady`/`__runBuild`/`__bankFood`.
- `game/src/world/saveGame.ts`: additive `granaries` field (validated like `thatches`).
- `game/src/ui/lenses.ts`: `ZoneMapEntry.granary` + `granaryZones` param; WorldScene draws a 🏛️ marker.

**Lore track — BACKLOG-458 (word of plenty):**
- Created `game/src/world/plentyword.ts` + `plentyword.test.ts` (7 unit tests).
- `game/src/scenes/WorldScene.ts`: `seedPlentyWord` (thriving-zone residents seeded on the migrate cadence); plenty rung in the gossip cascade (below provider, above generic); `plentyDestOf`; a plenty tier in `pickMigrant` (after grove, before poorest — 076/078 untouched); named-neighbour destination in `scarcityMigrate`; dev hooks `__spreadPlentyWord`/`__plentyTarget`/`__seedPlentyWord`.

**Deviations:** none material. Extracted the inline gather-build block into `buildOnGather` (so the granary decision is testable via `__runBuild`) — a refactor, byte-identical for the pre-454 path. Updated `tests/e2e/cycle-074-shelter.spec.ts` to reflect 454's intended change (the bowl now saves for a granary after 3 landmarks instead of stacking a 4th cairn) — not a disabled test, a corrected expectation. Two save-shape unit tests + one save-version test gained the additive `granaries: []` field.

**Build + tests:** `npm run build` clean · `npx vitest run` 1295/1295 green · `npx playwright test` 377/377 green (cycle-074 fixed to match 454).

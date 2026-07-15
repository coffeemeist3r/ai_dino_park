# Cycle 102 — Code Plan (two tracks)

## Lore track — BACKLOG-443: Predator/prey in the book

### Item
Collection book reads each dino's food-web standing (carnivore catches / herbivore escapes).

### Files to create
- none.

### Files to modify
- `game/src/world/foodweb.ts` — add three pure functions:
  - `catchTally(memories)` → count of `you brought down a meal` lines (the 437 success memory).
  - `escapeTally(memories)` → count of `you slipped <hunter>'s hunt` lines (any hunter; reuse the existing `slipped (.+?)'s hunt` regex shape).
  - `foodwebStanding(diet, memories)` → `🦖 brought down N meal(s)` for a carnivore (catchTally), `💨 slipped N hunt(s)` for a herbivore (escapeTally); **null** when that tally is 0. Import `Diet` from `./diet`.
- `game/src/ui/lenses.ts` — add optional `foodweb?: string` to `BookRow`; in `bookLines`, push `  ${r.foodweb}` when present (place after the `rumorsHeard` line, keeping the block order stable).
- `game/src/scenes/WorldScene.ts` — in `bookRows()`, set `foodweb: foodwebStanding(dietOf(d.species, d.name), recall(this.memory, d.name))`; add `foodwebStanding` to the foodweb import and confirm `dietOf` is imported (it is, line 69).

### Reuse list
- `recall` (ai/memory) — already used in `bookRows` neighbours; the memory source.
- `dietOf` (world/diet) — already imported in WorldScene; the carnivore/herbivore switch.
- The `slipped (.+?)'s hunt` regex already in `recentHunter`/`chaseCount` — mirror it for `escapeTally`.
- `bookLines` render loop (ui/lenses) — extend, don't rewrite.

### New dependencies
none.

### Test plan
- Unit (`game/src/world/foodweb.test.ts`, extend): `catchTally` counts only `brought down a meal`; `escapeTally` counts all `slipped X's hunt` across hunters; `foodwebStanding` → carnivore catch string, herbivore escape string, null at 0, correct singular/plural.
- Unit (`game/src/ui/lenses.test.ts`, extend): `bookLines` emits the `foodweb` line when set and omits it when undefined.
- E2E (`tests/e2e/cycle-102-book-foodweb.spec.ts`): via `__remember`, file `you brought down a meal` on a carnivore and `you slipped X's hunt` on a herbivore, open the book (or read `__bookText`), assert both lines present with correct counts; assert a food-web-less dino has neither.

### Risks
- Recall caps at 6 slots shared with all memory, so tallies read *recent* standing, not lifetime — intended (design "Out of scope"). Don't add a persisted counter.
- Keep the exact memory strings in sync with the filing sites (`WorldScene.ts` ~2547/2552). If those strings change, the tallies break — pin them in the unit test literals.

### Estimated touch count
~5 files (3 source + 2 test source + 1 e2e). Well under 15.

---

## Structure track — BACKLOG-436: Need pulls the body

### Item
A pressing need leans the dino's wander toward relief (hatch/pond), gated, below every ritual, deathless.

### Files to create
- `tests/e2e/cycle-102-need-seek.spec.ts`.

### Files to modify
- `game/src/world/needs.ts` — add:
  - `NEED_PULL_CHANCE = 0.6` (a lean, not a compulsion).
  - `needSeeks(roll, chance = NEED_PULL_CHANCE)` → `roll < chance` (mirror `huntSucceeds`).
- `game/src/world/zones.ts` — add `grovePondTile(cols)` → the centre tile of the NE pond block (`groveTileAt` water: x∈[cols-5,cols-2], y∈[2,4]) → `{ tileX: cols - 3, tileY: 3 }`. Pure; keep beside `groveTileAt`.
- `game/src/scenes/WorldScene.ts`:
  - Import `needSeeks` from `../world/needs`, `grovePondTile` from `../world/zones`.
  - Add private `needTargetFor(d, need)`: hunger → `{ tileX: Math.floor(COLS/2), tileY: Math.floor(ROWS*0.45) }` (the feeding row, matching `foodLanding`); thirst → `zoneOf(this.dinoZones, d.name, BOWL_ID) === GROVE_ID ? grovePondTile(COLS) : null`.
  - In `forceStep`, near the other branch flags (~2597), compute `const need = pressingNeed(this.needs[d.name]); const seekTarget = (!huddling && !gathering && !moping && !socializing && need) ? this.needTargetFor(d, need) : null; const seeking = !!seekTarget && needSeeks(Math.random());`
  - Change the final `else` (plain wander) into `} else if (seeking) { next = stepToward(cur, seekTarget!, COLS, ROWS); } else { …existing wander… }`. Activity label unchanged (stays `wandering`; the 🍖/💧 mark is the tell).
  - Add dev hooks: `__needTarget(name)` → the seek target tile or null; `__needStep(name)` → apply one forced `stepToward` seek step (bypassing the chance) and return the new tile, for a deterministic movement e2e.

### Reuse list
- `pressingNeed` (world/needs) — already imported; the threshold read that also drives the mark.
- `stepToward` (world/movement) — already imported; the toward-target step.
- `zoneOf`, `GROVE_ID`, `BOWL_ID` (world/zones) — already imported; the thirst-in-grove gate.
- `foodLanding` row math (`Math.floor(rows*0.45)`, world/feeding) — the hatch anchor row; mirror the constant, don't re-derive a different one.
- `huntSucceeds` (world/foodweb) — the pattern `needSeeks` copies.

### New dependencies
none.

### Test plan
- Unit (`game/src/world/needs.test.ts` — create if absent, else extend): `needSeeks` boundary (`roll < chance`, strict); `NEED_PULL_CHANCE ∈ (0,1)`.
- Unit (`game/src/world/zones.test.ts` or the co-located zones test): `grovePondTile(cols)` lands on a `groveTileAt(...)==='water'` tile.
- E2E (`tests/e2e/cycle-102-need-seek.spec.ts`):
  - Isolate a dino; `__setNeed(name,'hunger',1)`; assert `__needTarget(name)` = the feeding-row tile; call `__needStep` repeatedly and assert distance to the row strictly decreases to 0.
  - Put a dino in the grove (`__seePond` positions it there, or set its zone), `__setNeed(name,'thirst',1)`; assert `__needTarget` = `grovePondTile`.
  - `__setNeed(name,'thirst',1)` on a bowl dino; assert `__needTarget` = null.
  - A dino with no pressing need → `__needTarget` null.

### Risks
- Ordering in the wander ladder: the seek branch must sit **below** `socializing` and the `ticcing` branch. A pressing need already makes `aloneNow`/`undisturbed` false, so `ticcing` won't co-fire — but keep the `else if (seeking)` strictly after the `socializing` branch so higher rituals win (AC).
- `needTargetFor` reads `COLS`/`ROWS` module constants — keep it a scene method (not a needs.ts pure fn) so the pond/hatch geometry stays with the scene; the *gate* is the pure part.
- Additive save: no new field. `needs` map already persisted (371). Confirm no save-shape change.

### Cross-track collision
None. Lore touches `foodweb.ts` + `lenses.ts` + `bookRows()`; structure touches `needs.ts` + `zones.ts` + `forceStep()` + new hooks. Both edit `WorldScene.ts` but **different methods** (`bookRows` vs `forceStep`/imports/hooks) — apply lore edits then structure edits; the import line is the only shared spot (add both `foodwebStanding` and `needSeeks`/`grovePondTile`), no clobber.

### Estimated touch count
~6 files. Under 15.

---

## Shipped (Coder)

**Lore track (443) — files touched:**
- `game/src/world/foodweb.ts` — added `catchTally`, `escapeTally`, `foodwebStanding` (+ `Diet` import).
- `game/src/ui/lenses.ts` — `BookRow.foodweb?` field + render line (after parents, before rumors).
- `game/src/scenes/WorldScene.ts` — `bookRows()` sets `foodweb` from `foodwebStanding(dietOf(...), recall(...))`; import updated.
- `game/src/world/foodweb.test.ts`, `game/src/ui/lenses.test.ts`, `tests/e2e/cycle-102-book-foodweb.spec.ts`.

**Structure track (436) — files touched:**
- `game/src/world/needs.ts` — `NEED_PULL_CHANCE` + `needSeeks` gate.
- `game/src/world/zones.ts` — `grovePondTile(cols)`.
- `game/src/scenes/WorldScene.ts` — `needTargetFor` method; `seeking` branch in `forceStep` (below socializing, above plain wander); imports; `__needTarget`/`__needStep` hooks.
- `tests/unit/cycle-102-need-seek.test.ts`, `tests/e2e/cycle-102-need-seek.spec.ts`.

**Deviations:** none. Only the gate is pure; target geometry stays a scene method (reads COLS/ROWS/zone) as planned.

**Build:** ✅ clean. **Unit:** ✅ 1153/1153 (+12). **E2E (new):** ✅ 4/4 warm; the parallel cold-first-boot `__ready` timeout is the documented boot flake (passes isolated/warm). **Dev smoke:** ✅ `/` → 200. **Boundary:** no web-llm outside `game/src/ai/`.

# Cycle 118 — Code Plan

**Build order: structure track first, then lore track.** Both land in `WorldScene.ts` but in disjoint
methods (`harvest` + `checkSeasonTurn` vs `feedFromStores`), so the only real coupling is the import block
and the dev-hook block — do the structure edits, then the lore edits, and the two never share a hunk.

---

## Structure track — BACKLOG-465 (per-crop seasonal yield)

**Item:** BACKLOG-465 [emergent] Per-crop seasonal yield — a per-crop season table the harvest hook reads,
so *which* ground thrives shifts with the year.

### Files to create

- `game/src/world/cropseason.ts` — pure module (no Phaser, no AI). Exports:
  - `export interface CropSeason { good: Season; lean: Season }`
  - `export const CROP_SEASON: Record<string, CropSeason>` — `berries {good:'summer', lean:'fall'}`,
    `greens {good:'fall', lean:'winter'}`, `roots {good:'winter', lean:'summer'}`. Keyed by FOODS id, the
    same key `CROP_BY_ZONE` yields, so a future crop is a row not a branch (the 449 discipline).
  - `export const YIELD_GOOD = 2`, `YIELD_LEAN = 0`, `YIELD_BASE = 1`.
  - `cropYield(food: string, season: Season): number` — `YIELD_GOOD` in the crop's good season,
    `YIELD_LEAN` in its lean one, else `YIELD_BASE`. An unknown food id has no row → `YIELD_BASE` in every
    season, which is also what makes spring neutral for everything (spring is nobody's good or lean season).
  - `harvestYieldLine(cropGlyph: string, food: string, season: Season): string` — `''` at base yield;
    `` `${cropGlyph} the ${label} came in thick — two for the stores` `` / `` `${cropGlyph} a lean year for
    the ${label} — nothing to bank` `` otherwise. Label from `FOODS` (`food.label`), falling back to the id.
  - `seasonCropLine(season: Season): string` — `''` in spring; else names the thriving crop and the thin
    one off the same table (e.g. `🌾 fall favours the leafy greens; the sweet berries come in thin`). Built
    by scanning `CROP_SEASON`, not hand-written per season, so the line can never drift from the table.
- `tests/unit/cycle-118-crop-season.test.ts`
- `tests/e2e/cycle-118-crop-season.spec.ts`

### Files to modify

- `game/src/scenes/WorldScene.ts`
  - import `cropYield`, `harvestYieldLine`, `seasonCropLine` from `../world/cropseason`.
  - `harvest(zone)` — replace the single `bankFood` call with a loop of `cropYield(crop.food,
    this.currentSeason())` attempts, each guarded by the existing `foodAtCap` check and each crediting
    `creditHauler(zone)` on success (so the cap still binds and a lean season banks/credits nothing). Log
    `harvestYieldLine(crop.ripe, crop.food, season)` when non-empty, after the existing harvest line.
  - `checkSeasonTurn(t)` — after the existing `seasonGripLine` log, log `seasonCropLine(turned)` when
    non-empty.
  - dev hooks — `__cropYield = (food, season?) => cropYield(food, season ?? this.currentSeason())` beside
    the existing `__foodCap` hook, so the e2e can assert the table the sim is actually running on rather
    than a hardcoded copy (the 468 precedent).

### Reuse list

- `game/src/world/seasons.ts` — `Season`, `SEASONS`. **Do not** add a fourth grip field to `seasonGrip`;
  465 is per-crop, 461 is park-wide, and the two compose at the call site.
- `game/src/world/plot.ts` — `cropOf(zone)` already yields `{ food, ripe }`; the yield keys off `crop.food`
  and the ticker glyph off `crop.ripe`. No new per-zone table.
- `game/src/world/foods.ts` — `FOODS` for the human label in the ticker lines.
- `game/src/world/foodstore.ts` — `bankFood` / `foodAtCap` unchanged; the loop calls them N times rather
  than teaching them a count.
- `WorldScene.foodCapFor` — the single cap read (454 granary + 461 season). The loop must call it once and
  reuse the value, and must re-check `foodAtCap` per unit.
- `WorldScene.creditHauler` — existing per-unit provider credit; called once per banked unit.

### New dependencies

`none`.

### Test plan

**Unit — `tests/unit/cycle-118-crop-season.test.ts`**
- `cropYield` returns 2 / 0 / 1 for each crop's good / lean / other seasons (three crops × four seasons,
  asserted against the table).
- `cropYield(food, 'spring') === 1` for every crop and for an unknown id — the hinge.
- Table shape: for each of summer/fall/winter, exactly one of the three farmed crops is at `YIELD_GOOD` and
  exactly one at `YIELD_LEAN` (a rotation invariant, so a fourth crop can't silently break it).
- Every `CROP_BY_ZONE` food has a `CROP_SEASON` row (a cross-module pin — a new zone crop must declare its
  year).
- `harvestYieldLine` is `''` at base yield and contains `thick` / `lean` at the extremes, and carries the
  crop glyph.
- `seasonCropLine('spring') === ''`; each other season's line names both that season's good crop label and
  its lean crop label.

**E2E — `tests/e2e/cycle-118-crop-season.spec.ts`**
- *summer banks double:* boot, `__setClock` into summer, plant + ripen + harvest the bowl plot, assert
  `__foodStore('bowl').berries` rose by 2 (or to cap) and the ticker carries the thick line.
- *fall banks nothing:* `__setClock` into fall, harvest the bowl plot, assert the berry count is unchanged,
  the ticker carries the lean line, the plot cleared, and the crop still dropped (a food piece in play).
- *spring is the hinge:* on a fresh boot (day 1) a bowl harvest banks exactly 1 and logs no yield line.
- *the cap still binds:* fill the bowl store to one below `__foodCap('bowl')` via `__bankFood`, harvest in
  summer, assert the pile lands exactly at cap (not cap + 1).
- *the turn announces it:* stage the clock to a season eve, advance across it, assert the ticker carries a
  line naming the incoming season's thriving crop.

### Risks

- **The harvest still has to drop food.** `dropFood` no-ops if a piece is already in play; the lean-season
  test must assert the drop separately from the bank, and must not assume the drop happened if a previous
  step left food on the ground.
- **Existing specs.** Every current harvest spec runs on a fresh boot (day 1 = spring) where yield is 1, so
  all of them should be byte-identical. If any spec stages the clock forward *and* asserts an exact banked
  total, it will move — check `cycle-095-crops`, `cycle-098-fernreach-farm`, `cycle-103-shared-meal-
  foodbank`, `cycle-107-provider`, `cycle-108-provider-word`, `cycle-115-governance`, `cycle-116-*`,
  `cycle-117-*`, all of which drive `__setClock(planted + 2, …)` to ripen the plot. **Two ripening days can
  cross a season boundary** (plant on day 6 → harvest on day 8 = summer). Those helpers all plant on day 1
  and harvest on day 3, safely inside spring, but a spec that harvests repeatedly walks the clock forward
  each time — re-read any that harvest more than twice and pin the season if they drift out of spring.
- Provider standing shifts with the year now (a double harvest is two credits). That is intended and
  called out in the design, but it means `cycle-107-provider` / `cycle-115-governance` emergence thresholds
  could be reached in fewer harvests if they ever run outside spring.

### Estimated touch count

`~4 files` (1 new module, 1 modified scene, 2 new test files).

---

## Lore track — BACKLOG-471 (the grumble reaches the keeper)

**Item:** BACKLOG-471 [emergent] The grumble reaches the keeper — a bank-first ground that has left a
resident short surfaces a faint discontent ticker, governance made a care signal.

### Files to create

- `game/src/world/discontent.ts` — pure module (no Phaser, no AI). Exports:
  - `export const SHORTS_BEFORE_WORD = 2` — mouths held short before the word reaches the glass.
  - `heldShort(pile: FoodPile, favoriteId: string | undefined, p: SpendPriority | null | undefined):
    boolean` — true iff `p === 'bank'` **and** `pickFoodToSpend(pile, favoriteId, feedReserve(p)) === null`
    **and** `pickFoodToSpend(pile, favoriteId, 0) !== null`. The double call is deliberate: it asks the
    *same function the spend site asks*, so the definition of "the reserve is why" can never drift from the
    definition of the reserve. An empty pantry fails the second clause — want is not a decision.
  - `soundsDiscontent(shorts: number, lastDay: number | null, day: number): boolean` — `shorts >=
    SHORTS_BEFORE_WORD && lastDay !== day`. The freshness gate (221/226 shape) as a pure predicate.
  - `discontentLine(zoneName: string): string` — `` `😟 ${zoneName}'s going hungry while the granary
    fills` ``. No leading article — the `storesFedLine` precedent ("The Grove" carries its own).
- `tests/unit/cycle-118-discontent.test.ts`
- `tests/e2e/cycle-118-discontent.spec.ts`

### Files to modify

- `game/src/scenes/WorldScene.ts`
  - import `heldShort`, `soundsDiscontent`, `discontentLine` from `../world/discontent`.
  - two new private fields beside the existing governance fields: `shortsByZone: Record<string, number> =
    {}` and `discontentDayByZone: Record<string, number> = {}`. **Not persisted** (no save-shape change) —
    a live read of a live situation, exactly like the policy it reports.
  - `feedFromStores()` — in the `if (!id) continue` branch, before continuing: if `heldShort(pile,
    favoriteId, priority)`, bump `shortsByZone[zone]`, and if `soundsDiscontent(...)` against
    `getWorldClock().now().day`, `logEvent(discontentLine(zoneName))` and stamp `discontentDayByZone[zone]`.
    The priority is already computed one line above for `feedReserve` — hoist it into a local so it is read
    once, not twice.
  - in the successful-spend branch: `this.shortsByZone[zone] = 0` — feeding clears the grievance.
  - dev hook `__discontent = () => ({ shorts: {...}, lastDay: {...} })` beside `__spendPriority`.

### Reuse list

- `game/src/world/foodstore.ts` — `pickFoodToSpend` (the exact spend decision; **must not** be
  re-implemented as a pile-total comparison, which would misread a pile whose only stocked id is below the
  reserve).
- `game/src/world/governance.ts` — `feedReserve`, `SpendPriority`. The reserve number lives there.
- `WorldScene.spendPriorityFor` — already the single policy read; call it once per dino in the loop.
- `WorldScene.logEvent` — the existing 12-line keeper ticker (221/239/460 all land here).
- `getWorldClock().now().day` — the in-game day the freshness gate keys on, the same clock 226's
  once-per-spell gates use.

### New dependencies

`none`.

### Test plan

**Unit — `tests/unit/cycle-118-discontent.test.ts`**
- `heldShort` true for `'bank'` with a pile stocked at exactly the reserve for the favourite; false for the
  same pile under `'feed'`, `null`, `undefined`.
- `heldShort` false for an empty pile under every policy — want is not a decision.
- `heldShort` false for a `'bank'` pile stocked *above* the reserve (that mouth gets fed; nothing to
  grumble about).
- `heldShort` agrees with `pickFoodToSpend`: for a matrix of piles, `heldShort === (spend-with-reserve is
  null && spend-without-reserve is not null)` under `'bank'`. Pins the two against drift.
- `soundsDiscontent`: false below the threshold; true at/above it when `lastDay !== day`; false when
  `lastDay === day` (the gate); true again once the day advances.
- `discontentLine` names the zone, carries 😟, and has no doubled article.

**E2E — `tests/e2e/cycle-118-discontent.spec.ts`**
- Setup mirrors `cycle-115-governance.spec.ts`: leave **Rex** the bowl's only resident (Rex's name-seeded
  agreeableness is well under 0.5, so its policy is deterministically `'bank'`), harvest three times to
  crown it provider, assert `__spendPriority('bowl') === 'bank'`.
- *the grumble sounds:* drive the store down to the reserve by starving Rex and stepping (each step spends
  one unit until only the reserve is left), then starve it twice more; assert `__discontent().shorts.bowl`
  reached the threshold and `__events` carries `/going hungry while the granary fills/`.
- *once a day, not once a step:* short again on the same in-game day; assert the count of matching ticker
  lines is still 1. `__setClock` a day forward, short again, assert it is 2.
- *feeding clears it:* `__bankFood('bowl', …)` above the reserve, starve Rex, step; assert Rex is fed and
  `__discontent().shorts.bowl === 0`.
- *the default park is silent:* on a plain boot (no provider anywhere) starve a dino and step; assert no
  discontent line ever appears.

### Risks

- **Getting a `'bank'` ground in an e2e** depends on Rex's name-seeded traits. The setup must *assert*
  `__spendPriority('bowl') === 'bank'` rather than assume it, so a future trait change fails loudly with a
  clear message instead of silently testing nothing.
- **The pile must be stocked-but-reserved, not empty.** Three harvests bank three berries and the spend
  loop drains them one per starving step down to the reserve of 1 — so the test has to *drive to* the
  short state, not assume it. If the ambient sim harvests or ferries mid-drive the count can move; keep the
  drive to `__stepWorld` calls and read the store between them rather than assuming an exact total.
- **Cross-track:** the structure track changes how much a harvest banks. In spring (fresh boot) that is 1
  per harvest, unchanged — this spec's three-harvest setup must therefore stay in spring, or assert the
  store total it actually got instead of a literal 3.
- The `favoriteFood(d.traits, season)` argument is already computed at the spend site; the short check must
  use the **same** favourite, not recompute with a different season, or the two calls can disagree.

### Estimated touch count

`~4 files` (1 new module, 1 modified scene — shared with the structure track — 2 new test files).

**Combined cycle: ~7 files** (2 new modules, 1 shared scene, 4 new test files). Well inside the arc budget.

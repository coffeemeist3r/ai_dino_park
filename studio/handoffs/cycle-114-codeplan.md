# Cycle 114 — Code Plan

Both tracks are small, pure-core additions. **No cross-track file overlap** (lore: `seasons.ts` + the
step-loop socialize roll; structure: `spoilage.ts` + the away/restore path). Build either first.

---

## Lore track — BACKLOG-178: Migrating warmth

### Item
A per-season multiplier on the daytime socialize ("drift to the cluster") roll — winter tightens, summer
spreads, spring/fall neutral. The social twin of 461's `seasonGrip`.

### Files to create
- `game/src/world/migrating-warmth.test.ts` — unit test for the new season-social functions.

### Files to modify
- `game/src/world/seasons.ts` — add `SEASON_SOCIAL_BIAS: Record<Season, number>` (`winter 1.4`, `summer 0.7`,
  `spring 1`, `fall 1`), `seasonSocialBias(season): number` (pure lookup), and
  `seasonalSocializeChance(base, season): number` = `clamp(base * seasonSocialBias(season), 0.05, 0.95)` — the
  same [0.05, 0.95] band `socializeChanceFor` uses. Doc-comment ties it to 178 + the 461 mirror.
- `game/src/scenes/WorldScene.ts`:
  - Import `seasonalSocializeChance, seasonSocialBias` from `../world/seasons` (extend the existing seasons import line).
  - At the `socializing` roll (~line 3050): change
    `Math.random() < socializeChanceFor(intent)` → `Math.random() < seasonalSocializeChance(socializeChanceFor(intent), season)`.
    `season` is already `const season = this.currentSeason();` in scope in `stepWorld`.
  - Add a dev hook near `__season` (~line 5035): `(window as any).__socialBias = () => seasonSocialBias(this.currentSeason());`.

### Reuse list
- `socializeChanceFor` (`game/src/ai/intent.ts`) — the base roll the bias multiplies; do NOT replace it.
- `seasonGrip` shape in `seasons.ts` — the exact pattern to mirror (pure per-season record + lookup).
- `Season` type + `currentSeason()` — already in scope.
- The clamp idiom `Math.min(0.95, Math.max(0.05, …))` — copy from `socializeChanceFor`.

### New dependencies
none.

### Test plan
- **Unit** (`migrating-warmth.test.ts`):
  - `seasonSocialBias`: winter > 1, summer < 1, spring === 1, fall === 1; defined for every `SEASONS` entry.
  - `seasonalSocializeChance`: spring returns `base` (in-range base unchanged); winter(0.45) > summer(0.45);
    never outside [0.05, 0.95] (base 0.9 × winter caps at 0.95; base 0.1 × summer floors at 0.05).
- **E2E** (`tests/e2e/cycle-114-migrating-warmth.spec.ts`): boot, `__setClock` to a winter day → `__socialBias() > 1`;
  a summer day → `< 1`; a spring day → `=== 1`.

### Risks
- Keep the clamp — an unclamped winter multiply could push a `social`-intent 0.65 base over 0.9; the clamp holds it.
- Spring must stay exactly 1.0 (byte-identical default season) — assert it in the unit test.

### Estimated touch count
~4 files (2 modified, 2 test files).

---

## Structure track — BACKLOG-462: Spoilage while you're away

### Item
Fold the day-counted `spoilFood` decay into the offline catch-up so a hoard left through an absence bleeds the
elapsed days, surfaced in the homecoming digest. Deterministic, floored, season/granary-aware.

### Files to create
- (none — extend existing modules and tests.)

### Files to modify
- `game/src/world/spoilage.ts` — add
  `spoilFoodOverDays(pile: FoodPile, days: number, cap = FOOD_STOCKPILE_CAP, margin = SPOIL_MARGIN): FoodPile`:
  `if (days <= 0) return pile; let cur = pile; for (let i = 0; i < days; i++) { const next = spoilFood(cur, cap, margin); if (next === cur) break; cur = next; } return cur;`
  Doc-comment ties it to 462 as the day-counted away twin of the live pass; the `break` bounds the loop and
  keeps it cheap (spoilFood self-limits, so once a pass no-ops further days are no-ops).
- `game/src/scenes/WorldScene.ts`:
  - Import: add `spoilFoodOverDays` to the existing `../world/spoilage` import (already has `spoilFood, spoiledLine, SPOIL_MARGIN`).
  - Add a private helper `applyAwaySpoilage(days: number): string[]` (near `runSpoilage`, ~line 5129): for each
    `zone of zoneChain()`, `const pile = this.foodStoreFor(zone); const next = spoilFoodOverDays(pile, days, this.foodCapFor(zone), this.spoilMarginFor());`
    skip when `next === pile`; else push a `spoiledLine(zoneName, emoji)` for every id where `next[id] < pile[id]`,
    set `this.foodPileByZone[zone] = next`, and mark `changed`. On `changed`: `this.lastSpoilDay = getWorldClock().now().day; void this.saveGame();`. Return the collected lines. `if (days <= 0) return [];` guard up top.
  - **Restore path** (`setupSave`, after `this.syncSeason();` ~line 5373, before the digest dialog at ~5375):
    `const awaySpoil = this.applyAwaySpoilage(away.days); if (awaySpoil.length) { away.digest.push(...awaySpoil); this.lastAwayDigest = away.digest; }`.
    (`away.digest` is the same array `lastAwayDigest` already points at; the dialog at 5377 then shows the appended lines.)
  - **`__catchUp` dev hook** (~line 5418, after `this.lastAwayDigest = away.digest;`):
    same two lines — `const awaySpoil = this.applyAwaySpoilage(away.days); if (awaySpoil.length) { away.digest.push(...awaySpoil); this.lastAwayDigest = away.digest; }` — so the returned `digest` (line ~5429) and `__awayDigest()` both carry the 🥀 lines.

### Reuse list
- `spoilFood` (`spoilage.ts`) — the single-day decision `spoilFoodOverDays` iterates; do NOT reimplement the decay.
- `spoiledLine` (`spoilage.ts`) — the exact 🥀 digest line; reuse, no new copy.
- `this.foodCapFor(zone)` + `this.spoilMarginFor()` (WorldScene) — the granary + season-aware cap/margin the
  live `runSpoilage` already uses; the away path must read the same so 461's grip carries into the catch-up.
- `zoneChain()`, `zoneById(zone).name`, `FOODS.find(...).emoji`, `this.foodStoreFor(zone)` — copy the exact
  loop shape from `runSpoilage` (~line 5111).
- `fastForward` result's `days` (`away.days`) — already computed; the day-count input, no new elapsed math.

### New dependencies
none.

### Test plan
- **Unit** (`game/src/world/spoilage.test.ts`, extend): a `spoilFoodOverDays (BACKLOG-462)` describe —
  `days=0` returns same ref; `{berries: cap}` over 3 days bleeds to the floor `cap-margin-1` and no lower;
  purity (input untouched); a winter margin (SPOIL_MARGIN+1) bleeds sooner/deeper than the flat margin over
  the same day count; matches hand-iterated `spoilFood`.
- **E2E** (`tests/e2e/cycle-114-away-spoilage.spec.ts`): boot; `__setZoneFoodPile('bowl', {berries: 6})`;
  `__catchUp(3 in-game days)` → bowl berries bled toward the floor (`< 6`) AND `__awayDigest()` has a 🥀 spoiled
  line; a second test: a sub-day `__catchUp` leaves the pile at 6 with no 🥀 line. (Default season = spring so
  cap 6 / margin 1 → floor 4; the assert is `< 6`, season-robust.)

### Risks
- Order on the restore path: `applyAwaySpoilage` must run **after** `syncSeason()` (so `spoilMarginFor()`/
  `foodCapFor()` read the restored day) and it re-sets `lastSpoilDay` to the post-jump day (syncSeason set it;
  we set it again to the same value after spoiling) so the next live hour doesn't double-decay.
- `away.days` is the **capped** whole-day count (`MAX_AWAY_DAYS = 7`) — correct: a huge absence still spoils
  only the capped span, and the self-limiting floor means even 7 days can't over-spoil.
- `foodPileByZone` is restored (line ~5359) **before** `syncSeason` (5373); the spoilage runs after both, so it
  reads the restored piles. Good.

### Estimated touch count
~4 files (2 modified, 2 test files).

---

## Shipped (Coder)

**Lore track — BACKLOG-178:**
- `game/src/world/seasons.ts` — added `SEASON_SOCIAL_BIAS`, `seasonSocialBias`, `seasonalSocializeChance` (clamped [0.05,0.95]).
- `game/src/scenes/WorldScene.ts` — extended the seasons import; socialize roll now `seasonalSocializeChance(socializeChanceFor(intent), season)`; added `__socialBias` dev hook.
- `game/src/world/migrating-warmth.test.ts` — new (5 tests).

**Structure track — BACKLOG-462:**
- `game/src/world/spoilage.ts` — added `spoilFoodOverDays` (day-counted, self-limiting, early-out).
- `game/src/scenes/WorldScene.ts` — extended the spoilage import; added `applyAwaySpoilage(days)` helper; wired into the restore path (after `syncSeason`) and the `__catchUp` dev hook.
- `game/src/world/spoilage.test.ts` — extended (+5 tests for `spoilFoodOverDays`).
- `tests/e2e/cycle-114-migrating-warmth.spec.ts` + `tests/e2e/cycle-114-away-spoilage.spec.ts` — new.

**Deviations:** none — built to plan.

**Status:** `npm --prefix game run build` clean · `npm run test:unit` **1353/1353** green (+10) · new e2e specs (3) green on warm run (first run cold-boot-flaked, passed on re-run). Full e2e suite is QA's gate.

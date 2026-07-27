# Cycle 113 — Code Plan (two tracks)

## Lore track — BACKLOG-173: Season in the voice

**Item:** Season in the voice — a temperament-shaded seasonal aside on the greeting, + season in the LLM
prompt context.

**Files to create:** none (the aside lives beside its siblings).

**Files to modify:**
- `game/src/ai/brain.ts`
  - Add `import type { Season } from '../world/seasons'` (type-only — no runtime/WebLLM coupling).
  - `NPCContext`: add `season?: Season`.
  - Add `seasonAside(season, traits?)`: returns a temperament-shaded line for **winter** (grumble) and
    **spring** (savour), `''` for summer/fall. Prickly (`agreeableness < PRICKLY_MAX`) / warm
    (`> EFFUSIVE_MIN`) / even variants each. Leads with a space, like the other asides.
  - `cannedReply`: after the provider aside, if `ctx.season` and `seasonAside(...)` is non-empty, append it
    (`.slice(0, 360)` — one step above the provider cap so a full stack still fits).
- `game/src/ai/webllmBrain.ts`
  - `buildMessages`: add a `seasonal` clause — a nudge to let the season colour the line, only in
    winter/spring (mirrors the canned gate so LLM + fallback agree). Fold into the system template beside
    `hungry`/`rattled`/`provider`.
- `game/src/scenes/WorldScene.ts`
  - The player-greet context (~line 4666, in `pickTone`): add `season: this.currentSeason()`.

**Reuse list (MUST):**
- `PRICKLY_MAX` / `EFFUSIVE_MIN` from `ai/brain.ts` — the exact temperament cutoffs the other asides use.
- The aside-composition pattern in `cannedReply` (hungry/rattled/provider) — copy its shape exactly.
- `this.currentSeason()` (WorldScene:1211) — the live season off the clock.
- `seasonFor` / `Season` from `world/seasons.ts`.

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/cycle-113-season-voice.test.ts`:
  - `seasonAside('winter', prickly/warm/even)` each returns a distinct non-empty grumble; `'spring'` a
    distinct savour; `'summer'` and `'fall'` return `''`.
  - `cannedReply` with `season:'winter'` contains the grumble; with `'summer'` byte-identical to no-season.
  - Compose: `{hungry:true, season:'winter'}` contains both tells, length ≤ 360.
  - `buildMessages` with `season:'winter'` includes the season clause; `'summer'` does not.
- E2E: none strictly needed (pure-function behaviour) — covered by unit. The greet path already has e2e
  coverage; a season-specific greet assert is brittle (needs a live model or canned-line scrape), so QA
  may add one only if cheap. Note in QA.

**Risks:** Aside stacking length — the 360 cap covers hungry+rattled+provider+season. Keep summer/fall
silent so the aside isn't an every-greet tic.

**Estimated touch count:** ~4 files.

---

## Structure track — BACKLOG-461: The lean season

**Item:** The lean season — a pure park-wide seasonal food modifier read at banking + spoilage.

**Files to create:** none (extend `seasons.ts`).

**Files to modify:**
- `game/src/world/seasons.ts`
  - Add `SeasonGrip = { capDelta: number; spoilMarginDelta: number }`, `SEASON_GRIP` record, and
    `seasonGrip(season): SeasonGrip` (winter `{-1,+1}`, summer/fall `{+1,-1}`, spring `{0,0}`).
  - Add `seasonGripLine(season): string` — the ticker line for the economic shift (winter "tightens the
    stores", summer/fall "eases the stores", spring `''`).
- `game/src/world/spoilage.ts`
  - `spoilsAtCap(count, cap, margin = SPOIL_MARGIN)` and `spoilFood(pile, cap, margin = SPOIL_MARGIN)` —
    add the optional margin (default keeps every existing caller byte-identical), floored at 0 inside.
- `game/src/scenes/WorldScene.ts`
  - Add `import { seasonGrip, seasonGripLine } from '../world/seasons'`.
  - Add private `foodCapFor(zone)`: `granaryFoodCap(this.hasGranary(zone)) + seasonGrip(this.currentSeason()).capDelta` (floored at 1 for safety).
  - Add private `spoilMarginFor()`: `Math.max(0, SPOIL_MARGIN + seasonGrip(this.currentSeason()).spoilMarginDelta)` (import `SPOIL_MARGIN` from spoilage).
  - Replace the food-cap reads: harvest banking (`~1143`), ferry destCap (`~4511`), `__foodCap` hook
    (`973`), `__bankFood` hook (`988`) → `this.foodCapFor(zone)`.
  - `runSpoilage` (`~5089`): `spoilFood(pile, this.foodCapFor(zone), this.spoilMarginFor())`.
  - `checkSeasonTurn` (`~5057`): after the turn line, `const g = seasonGripLine(turned); if (g) this.logEvent(g);`.

**Reuse list (MUST):**
- `granaryFoodCap` (world/granary.ts) — the granary-aware base cap; the seasonal delta stacks on top.
- `spoilFood` / `SPOIL_MARGIN` (world/spoilage.ts) — extend, don't reinvent.
- `this.currentSeason()` — the one season source.
- `zoneChain` / `foodStoreFor` — the existing per-zone iteration in `runSpoilage`.

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/cycle-113-lean-season.test.ts` (or extend `seasons.test.ts` + `spoilage.test.ts`):
  - `seasonGrip` returns the four expected shapes.
  - `spoilFood(pile, cap, margin)` with a widened margin spoils a pile the default margin wouldn't, down to
    the deeper floor; with a narrowed margin (0) spoils only at cap. Default-margin call unchanged.
- E2E `tests/e2e/cycle-113-lean-season.spec.ts` (mirror `cycle-111-spoilage.spec.ts`):
  - `__setClock` to a winter day (22) → `__foodCap('grove')` is base−1; a summer day (8) → base+1; spring (1) → base.
  - Winter: `__setZoneFoodPile('grove',{berries:6})` then repeated `__spoilFood()` bleeds below the spring
    floor (to the winter floor); a 🥀 line reaches `__events`.
  - Summer: a pile one below base cap does **not** spoil.

**Risks:**
- **Consistency:** banking, ferry, and spoilage must all use `foodCapFor` or a pile could bank above what
  spoilage bleeds. Route every food-cap read through the one helper — do not leave a stray `granaryFoodCap`
  at a food-cap site. (The non-food resource cap is separate and untouched.)
- Lowering the cap mid-game leaves existing piles above cap — `bankFood` no-ops (fine) and `spoilFood`
  bleeds them (intended). No crash.

**Cross-track collision:** both tracks touch `WorldScene.ts` but **different regions** (greet-context line
~4666 for lore; food-cap sites + runSpoilage + checkSeasonTurn for structure) and different imports — no
clobber. Do structure first (adds the `foodCapFor` helper + imports), then the one-line lore addition.

**Estimated touch count:** ~5 files (2 shared WorldScene regions counted once).

---

## Shipped (Coder)

**Structure track — BACKLOG-461:**
- `game/src/world/seasons.ts` — added `SeasonGrip`, `seasonGrip(season)`, `seasonGripLine(season)`.
- `game/src/world/spoilage.ts` — `spoilsAtCap` + `spoilFood` gained an optional `margin` (default `SPOIL_MARGIN`, floored at 0). Existing callers byte-identical.
- `game/src/scenes/WorldScene.ts` — `foodCapFor(zone)` + `spoilMarginFor()` helpers; routed harvest banking, ferry destCap, `__foodCap`, `__bankFood`, and `runSpoilage` through them; grip line on the season turn.
- `game/src/world/lean-season.test.ts` — seasonGrip shapes + spoilFood seasonal-margin behaviour (7 tests).
- `tests/e2e/cycle-113-lean-season.spec.ts` — seasonal cap shift + winter/summer spoilage (3 specs).

**Lore track — BACKLOG-173:**
- `game/src/ai/brain.ts` — `season?: Season` on `NPCContext`; `seasonAside(season, traits?)`; composed into `cannedReply` (last, `.slice(0,360)`).
- `game/src/ai/webllmBrain.ts` — season nudge clause in `buildMessages` (winter/spring only).
- `game/src/scenes/WorldScene.ts` — `season: this.currentSeason()` on the player-greet context.
- `tests/unit/cycle-113-season-voice.test.ts` — aside per season × temperament, compose, buildMessages clause (7 tests).

**Deviations:** unit test for the lean season co-located in `game/src/world/` (matches its `seasons.test.ts`/`spoilage.test.ts` siblings) rather than `tests/unit/`. No scope creep.

**Status:** `npm run build` ✅ · `npm run test:unit` ✅ 1343/1343 · dev server HTTP 200.

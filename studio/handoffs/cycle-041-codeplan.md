# Cycle 41 — Code Plan

## Item
BACKLOG-170 [emergent] Seasonal palates — a small per-season craving bonus on the favorite-food
verdict, read off the live clock season. Builds on 061 / 159.

## Files to create
- `tests/e2e/cycle-041-seasonal-palates.spec.ts` — in-world proof the bowl acts on the live season.

## Files to modify
- `game/src/world/foods.ts`
  - Import `type Season`, `SEASONS` from `./seasons` (type-only + the const; seasons.ts imports only
    `./dayNight`, so no import cycle).
  - Add `export const SEASON_CRAVING: Record<Season, string>` mapping season → food **id**:
    `spring:'greens', summer:'berries', fall:'fish', winter:'meat'`.
  - Add `export const SEASON_CRAVING_BONUS = 0.4` — small enough that only a near-tied dino flips
    (empirically: Rex/Mossback/Sunny sway, Twitch/Glade loyal under the name-seeds).
  - Add `export function seasonCraving(season: Season): Food` — the craved Food (lookup in FOODS).
  - `favoriteFood(traits, season?)` — add optional `season?: Season`. Inside the argmax loop, add
    `+ (season && food.id === SEASON_CRAVING[season] ? SEASON_CRAVING_BONUS : 0)` to the score.
    With `season` omitted the math is byte-identical to cycle-061 (backward compatible). First-max
    wins on FOODS order is preserved (a craved food only ever *gains*, never reorders the rest).
  - `foodReaction(food, traits?, season?)` — thread the optional `season` into the internal
    `favoriteFood(traits, season)` call. Omitted → exact old behavior.
- `game/src/keeper/scan.ts`
  - `scanLines(subject, season?)` — optional `season?: Season` (import the type from `../world/seasons`),
    passed to `favoriteFood(subject.traits, season)`. Omitted → exact old behavior (existing scan
    test stays green).
- `game/src/scenes/WorldScene.ts`
  - Add `private currentSeason(): Season { return seasonFor(getWorldClock().now().day); }` (import
    `seasonFor` already present; add `type Season` to the seasons import).
  - Line ~390 `__favoriteFood` hook: accept an optional season override —
    `(name: string, season?: Season) => favoriteFood(d.traits, season ?? this.currentSeason())`.
  - Line ~429 eat path: `foodReaction(kind!, d.traits, this.currentSeason())`.
  - Line ~1035 feeding rush: `favoriteFood(d.traits, this.currentSeason()).id`.
  - Lines ~1466 + ~1490 scan: `scanLines(this.scanSubject(target), this.currentSeason())` and the
    `__scanLines` hook likewise.
  - Add `(window as any).__seasonCraving = (s: Season) => seasonCraving(s).id;` next to the other
    season hooks (~1575). Import `favoriteFood`/`foodReaction` already present; add `seasonCraving`
    to the foods import.

## Reuse list (CHARTER demands it)
- `giftScore` (`social/gifts.ts`) — already the scoring core of `favoriteFood`; the bonus rides on
  top of it, no new scoring math.
- `favoriteFood` / `foodReaction` (`world/foods.ts`) — extended in place, **not** duplicated.
- `seasonFor` (`world/seasons.ts`) — the single source of "what season is day N"; never re-derive
  the season anywhere else.
- `getWorldClock().now().day` — the live day, same accessor the tint/HUD already use.
- `__setClock` dev hook (WorldScene ~1582) — the e2e sets the season through it (restore-semantics,
  no spurious turn beat), exactly as cycle-040 staged season state.
- `FOODS` table — unchanged; the craving references existing ids.

## New dependencies
none.

## Test plan
### Unit (vitest)
- `tests/unit/foods.test.ts` — new `describe('seasonal palates', …)`:
  - `SEASON_CRAVING` / `seasonCraving` map the four seasons 1:1 to greens/berries/fish/meat.
  - `favoriteFood(traits)` (no season) === cycle-061 result for all five roster seeds (regression pin).
  - Rex: `favoriteFood(rex,'winter').id==='meat'` and `favoriteFood(rex,'summer').id==='berries'` —
    differ (sways).
  - Twitch: `favoriteFood(twitch, s).id==='greens'` for all four seasons (loyal — strong fit immune).
  - Monotonic-promotion property: for every food `f` and season `s`, applying the bonus never makes
    a non-craved food outscore where it didn't before — assert by checking that the season-favorite
    is always either the base favorite **or** that season's craving (never a third food).
  - `foodReaction(meat, rex, 'winter').favorite===true` and `foodReaction(meat, rex, 'summer').favorite===false`.
- `tests/unit/scan.test.ts` — add: `scanLines(rex,'winter')` favorite line names meat, `scanLines(rex,'summer')`
  names berries; the existing season-less assertion stays.

### E2E (playwright) — `tests/e2e/cycle-041-seasonal-palates.spec.ts`
1. **sways with the year**: `__setClock` to a winter day (e.g. day 25 = winter), read `__favoriteFood('Rex')`
   → `meat`; `__setClock` to a summer day (day 11) → `__favoriteFood('Rex')` → `berries`. Assert they differ.
2. **a loyal dino never sways**: across all four seasons `__favoriteFood('Twitch')` stays `greens`.
3. **the craving table is live**: `__seasonCraving('winter')==='meat'`, `'summer'==='berries'`, etc.
4. **the bowl eats by the live season**: `__setClock` to winter, `__warpTo('Rex')`, `__dropFood(col, 'meat')`
   in Rex's lane, step the sim, assert Rex eats it and files a `favorite` memory (😋 path) — i.e. meat
   is his favorite *in winter*. (Mirror of the cycle-027 favorites flow, season-pinned.)

## Risks
- **cycle-027 favorites e2e regression** — it drops `__favoriteFood(name)` and expects a `favorite`
  memory. Now the hook returns the *live-season* favorite and the eat path reads the *same* live
  season, so the dropped food is always the current-season favorite and the memory still fires.
  Self-consistent by construction; QA must confirm cycle-027 stays green.
- **import direction** — foods.ts importing seasons.ts: verified one-way (seasons.ts → dayNight only),
  no cycle. scan.ts already imports foods.ts; adding a seasons type import is fine.
- **boot season** — a fresh save boots at day 1 (spring); spring's craving is greens. Rex's spring
  favorite is still meat (his base wins spring), so no existing boot-time `__favoriteFood('Rex')`
  assertion shifts. Confirmed against the seeds.
- **the bonus must not leak into gifts** — `SEASON_CRAVING_BONUS` lives only in `favoriteFood`; the
  gift loop (`giftReaction`) is untouched (that's BACKLOG-176).

## Estimated touch count
~5 files (foods.ts, scan.ts, WorldScene.ts, foods.test.ts, scan.test.ts) + 1 new e2e = within budget.

## Shipped
**Files touched (exactly the plan, no scope creep):**
- `game/src/world/foods.ts` — `SEASON_CRAVING` table, `SEASON_CRAVING_BONUS = 0.4`, `seasonCraving()`;
  `favoriteFood(traits, season?)` adds the bonus to the craved food's score inside the argmax;
  `foodReaction(food, traits?, season?)` threads the season. Season-less calls are byte-identical to cycle-061.
- `game/src/keeper/scan.ts` — `scanLines(subject, season?)` passes the season to `favoriteFood`.
- `game/src/scenes/WorldScene.ts` — `currentSeason()` helper (off the live clock day); season threaded
  into the `__favoriteFood` hook (with optional override), the eat path (`foodReaction`), the feeding
  rush (`favoriteFood`), and both scan call sites; new `__seasonCraving` dev hook.
- `tests/unit/foods.test.ts` — `describe('seasonal palates')`: craving table, season-less regression
  pin, Rex sways (meat↔berries), Twitch loyal (greens ×4), promote-only invariant, foodReaction by season.
- `tests/unit/scan.test.ts` — scan favorite line follows the live season.
- `tests/e2e/cycle-041-seasonal-palates.spec.ts` — sways / loyal / craving table / live-season eat path.

**Deviations:** none.

**Build:** ✅ clean (`npm --prefix game run build`).
**Unit:** ✅ 298 passed (was 291; +7). Dev server smoke: ✅ HTTP 200 then port freed.
**E2E:** deferred to QA (full `npx playwright test`).

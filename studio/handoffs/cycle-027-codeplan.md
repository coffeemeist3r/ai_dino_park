# Cycle 27 — Codeplan — BACKLOG-061 Food favorites

## Item
BACKLOG-061 [emergent] Food favorites — typed hatch food + per-dino favorite (from personality); favorite eat = bigger bump + 😋 + memory; favorite is rushed harder.

## Files to create
- **`game/src/world/foods.ts`** — the food table and preference logic (pure, no Phaser):
  - `export interface Food { id: string; emoji: string; label: string; appeal: Partial<Personality>; }`
  - `export const FOODS: ReadonlyArray<Food>` — `meat 🍖 {bravery:1, energy:0.5}`, `greens 🌿 {agreeableness:1, curiosity:-0.3}`, `fish 🐟 {curiosity:1}`, `berries 🍓 {sociability:1, agreeableness:0.5}`.
  - `export function favoriteFood(traits: Personality): Food` — argmax of `giftScore(food, traits)` over FOODS (stable: first max wins on FOODS order).
  - `export interface FoodReaction { favorite: boolean; gain: number; emoji: string; }`
  - `export function foodReaction(food: Food, traits?: Personality): FoodReaction` — `favorite = !!traits && food.id === favoriteFood(traits).id`; `gain = favorite ? FEED_GAIN_FAV : FEED_GAIN`; `emoji = favorite ? '😋' : '🙂'`.
  - Imports: `giftScore`, `type Gift` from `../social/gifts` (Food is structurally assignable to Gift — both expose `appeal`; reuse `giftScore` rather than re-deriving the fit math); `FEED_GAIN`, `FEED_GAIN_FAV` from `./feeding`; `type Personality` from `../ai/personality`.

- **`tests/unit/foods.test.ts`** — unit tests for foods.ts (see Test plan).
- **`tests/e2e/cycle-027-favorites.spec.ts`** — e2e (see Test plan).

## Files to modify
- **`game/src/world/feeding.ts`**
  - Add `export const FEED_GAIN_FAV = 9;` (favorite bump; > generic `FEED_GAIN = 5`, < loved-gift 12).
  - Add `export const FEED_RANGE_FAV = 12;` and a module-private `EAGER_FAV = 0.15;`.
  - Extend `reactionToFood(energy, distTiles, isFavorite = false)`: range = `isFavorite ? FEED_RANGE_FAV : FEED_RANGE`; bar = `isFavorite ? EAGER_FAV : EAGER`. With `isFavorite` defaulted false, output is identical to today (existing call sites/tests untouched).
- **`game/src/scenes/WorldScene.ts`**
  - Import `FOODS`, `favoriteFood`, `foodReaction`, `type Food` from `../world/foods`; import `FEED_GAIN_FAV`/`FEED_RANGE_FAV` are *not* needed here (gains come via `foodReaction`).
  - Add field `private foodKind: Food | null = null;` alongside `food`.
  - `dropFood(col?, foodId?)`: pick `kind = foodId ? (FOODS.find(f => f.id === foodId) ?? FOODS[0]) : FOODS[Math.floor(Math.random()*FOODS.length)]`; set `this.foodKind = kind`; falling `foodSprite` uses `kind.emoji`; drop log → `` `${kind.emoji} ${kind.label} dropped from the hatch — food dropped` `` (keeps the "food dropped" substring AND names the food). [Simpler: `` `${kind.emoji} food dropped from the hatch (${kind.label})` `` — keeps "food dropped".]
  - `forceStep` rush branch: `const fav = favoriteFood(d.traits); const isFav = !!this.foodKind && this.foodKind.id === fav.id; if (reactionToFood(d.traits.energy, dist, isFav) === 'rush') { ... }`.
  - `eatFood(d)`: `const kind = this.foodKind; const r = foodReaction(kind!, d.traits);` → `bumpPoints(..., r.gain)`; memory = favorite ? `` `you snapped up the food at the hatch — your favorite ${kind.label}!` `` : `'you scrambled to the hatch and snapped up the food'` (both contain "snapped up the food" / "scrambled"); `flashFeed(d, r.emoji)`; eat log = `` `🍖 ${d.name} snapped up the food at the hatch${r.favorite ? ` — its favorite ${kind.label}!` : ''}` `` (keeps "snapped up the food"). Clear `this.foodKind = null` with `this.food`.
  - `flashFeed(d, emoji = '😋')`: parameterize the emoji (default keeps existing callers safe).
  - `setupFeeding` hooks: `__dropFood = (col?, foodId?) => {...}` (thread foodId); add `(window as any).__favoriteFood = (name) => { const d = this.dinos.find(x => x.name === name); return d ? { ...favoriteFood(d.traits) } : null; };`. `__food()` may also surface `foodId` (`this.food ? { ...this.food, foodId: this.foodKind?.id } : null`) — additive, non-breaking.

## Reuse list
- `giftScore` + `type Gift` — `game/src/social/gifts.ts`. Food fit = gift fit; reuse the scoring, don't re-derive.
- `stepToward` / `feedStep` — `game/src/world/movement.ts` + `feeding.ts`. Rush step unchanged.
- `bumpPoints` — `game/src/social/friendship.ts`. Affinity delta.
- `remember` — `game/src/ai/memory.ts`. Eat memory.
- `logEvent` (WorldScene) — Park News ticker line.
- `seededPersonality` / `Personality` / `Dino.traits` — already on every dino; favorites need no new state.
- `reactionToFood` / `reachedFood` / `foodLanding` — `feeding.ts`. Extend, don't replace.

## New dependencies
none.

## Test plan
**Unit (vitest)**
- `tests/unit/foods.test.ts`:
  - `favoriteFood` is deterministic per personality and spans ≥3 distinct foods across the five roster names (re-derive traits via `seededPersonality`).
  - `foodReaction(fav, traits)` → `{favorite:true, gain:FEED_GAIN_FAV, emoji:'😋'}`; `foodReaction(nonFav, traits)` → `{favorite:false, gain:FEED_GAIN, emoji:'🙂'}`; `FEED_GAIN_FAV > FEED_GAIN`.
  - `foodReaction(food, undefined)` → favorite false (pure-safe).
- `tests/unit/feeding.test.ts` (extend): `reactionToFood` favorite variant — a calm dino (energy between `EAGER_FAV` and `EAGER`) rushes its favorite but ignores generic; a far dino (dist in `(FEED_RANGE, FEED_RANGE_FAV]`) rushes its favorite but ignores generic; the existing 2-arg cases still assert identical results.

**E2E (playwright)** — `tests/e2e/cycle-027-favorites.spec.ts`:
- *favorite delights its lover*: for the first dino, read `__favoriteFood(name)`, `__dropFood(col-of-that-dino, fav.id)`, `__stepWorld` until eaten, assert the eater's memory includes "favorite" and its hearts rose (favorite gain path exercised).
- *plain food is plain*: drop a food that is NOT a chosen dino's favorite, let it be eaten, assert no "favorite" memory was written for the eater (plain path); drop + eat still posted to Park News ("food dropped" / "snapped up the food").

## Risks
- **Existing cycle-25 feeding e2e regression** — it asserts `'food dropped'` and `'snapped up the food'` substrings and a generic memory. Mitigation baked into the strings above: both drop/eat logs and both memory variants keep those substrings. The cycle-25 e2e calls `__dropFood(col)` with no foodId → random food → its assertions are food-type-agnostic, so they hold.
- **`giftScore` reuse via structural typing** — `Food` carries an extra `emoji` field vs `Gift`; passing a typed `Food` value to `giftScore(gift: Gift, …)` is allowed (excess-property checks only bite object literals). Confirmed safe; if TS complains, widen `giftScore`'s param to `{ appeal: Partial<Personality> }`.
- **Favorite rush widening** — only ever *adds* rushers (bigger range, lower bar) when `isFavorite`, never removes; cannot break "food gets eaten". Generic path (default false) is unchanged.
- **Random food on H** — gameplay nondeterminism is intended; all tests force `foodId`, so determinism holds where it matters.

## Estimated touch count
~6 files (2 new src+test pairs counted): `world/foods.ts` (new), `world/feeding.ts` (mod), `scenes/WorldScene.ts` (mod), `tests/unit/foods.test.ts` (new), `tests/unit/feeding.test.ts` (mod), `tests/e2e/cycle-027-favorites.spec.ts` (new). Within budget; no split needed.

## Shipped
Files touched (exactly the plan):
- `game/src/world/foods.ts` (new) — `FOODS` (meat/greens/fish/berries), `favoriteFood` (argmax of reused `giftScore`), `foodReaction` (favorite → `FEED_GAIN_FAV` + 😋, else `FEED_GAIN` + 🙂; pure-safe with no traits).
- `game/src/world/feeding.ts` (mod) — added `FEED_RANGE_FAV = 12`, `FEED_GAIN_FAV = 9`, private `EAGER_FAV = 0.15`; `reactionToFood` gained an optional `isFavorite` (default false → byte-identical to cycle 25).
- `game/src/scenes/WorldScene.ts` (mod) — `foodKind` state; `dropFood(col?, foodId?)` picks a random/forced food, uses its emoji + names it in Park News (keeps "food dropped"); favorite-aware rush branch in `forceStep`; `eatFood` consults `foodReaction` for gain/emoji/memory/log (both memory variants keep "snapped up the food"); `flashFeed(d, emoji)`; hooks `__dropFood(col?, foodId?)`, `__food()` now also returns `foodId`, new `__favoriteFood(name)`.
- `tests/unit/foods.test.ts` (new, 6) + `tests/unit/feeding.test.ts` (mod, +3) + `tests/e2e/cycle-027-favorites.spec.ts` (new, 2).

Deviations: none. Drop-log form chosen: `` `${emoji} food dropped from the hatch (${label})` `` (keeps the cycle-25 substring while naming the food).

Build + unit status: `npm run build` ✅ clean (webllm still isolated in its own worker chunk). `npx vitest run` ✅ **148/148** (22 files). E2E deferred to the QA stage.

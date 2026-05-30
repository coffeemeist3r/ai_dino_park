# Cycle 9 — Code-plan

## Item
BACKLOG-015 [social] Gift system.

## Files to create
- `game/src/social/gifts.ts` — pure, no Phaser.
  - `export interface Gift { id: string; label: string; appeal: Partial<Personality> }` (appeal weights in [-1,1] per axis).
  - `export const GIFTS: ReadonlyArray<Gift>` — 5 items: `shell`{curiosity:1}, `flower`{sociability:1,agreeableness:0.5}, `rock`{energy:-1}, `stick`{bravery:1,energy:0.5}, `snack`{agreeableness:1}.
  - `export type GiftVerdict = 'loved' | 'liked' | 'neutral' | 'disliked'`
  - `export interface GiftReaction { verdict: GiftVerdict; delta: number }`
  - `export function giftScore(gift, traits): number` — Σ over axes of `appeal[axis] * (traits[axis]*2 - 1)` (trait 0..1 → −1..1). No traits → 0.
  - `export function giftReaction(gift, traits?): GiftReaction` — thresholds: ≥0.6 loved(+12), ≥0.2 liked(+6), ≤−0.2 disliked(−4), else neutral(+1).
- `tests/unit/gifts.test.ts`
- `tests/e2e/cycle-009-gifts.spec.ts`

## Files to modify
- `game/src/scenes/WorldScene.ts`
  - Field `private heldItemIndex = 0` + `private giftHud!: Phaser.GameObjects.Text`.
  - `setupGifts()` from `create()`: build the held-item HUD (bottom-left, depth 11), keys **]**/**[** to cycle (and refresh HUD), **G** to give to nearest dino.
  - `private giveGift()`: `target = nearestDino()`; if none return. `const gift = GIFTS[heldItemIndex]; const { verdict, delta } = giftReaction(gift, target.traits); this.friendship = bumpPoints(this.friendship, target.name, delta); void this.saveGame(); this.refreshHeartsPanel();` then show dialog `${target.name} ${verdictPhrase(verdict)} the ${gift.label}!`.
  - Dev hooks: `__heldItem`, `__cycleItem`, `__giveGift(name)` (gives held item to the named dino, returns `{verdict, hearts}`).

## Reuse list
- `bumpPoints` + `heartsFromPoints` (friendship, 016) — the affinity delta + readout; no second store.
- `Personality`/traits (010) — reaction input.
- `nearestDino()`, the dialog box, the save path — reuse.
- `__clockNow` dev-hook pattern; clock HUD as the model for the gift HUD.

## New dependencies
none.

## Test plan
### Unit — `tests/unit/gifts.test.ts`
- `GIFTS.length >= 4`, ids distinct.
- curious-dominant traits → `giftReaction(shell)` verdict `loved`, delta > 0.
- calm (energy≈0) → `rock` loved; energetic (energy≈1) → `rock` disliked, delta < 0.
- cross-pairing (curious dino, snack) is not `loved`.
- no-traits → defined verdict, delta is a number, no throw.
- verdict↔delta sign coherence (loved/liked > 0, disliked < 0, neutral ≥ 0).
### E2E — `tests/e2e/cycle-009-gifts.spec.ts`
- `__cycleItem()` changes `__heldItem()`; cycling `GIFTS.length` times returns to start (wrap).
- `__giveGift('Rex')` returns a verdict string; Rex's hearts/points move; reload → change persisted.
- prior suites green.

## Risks
- **Score thresholds vs trait ranges:** seeded traits are 0..1; with single-axis weight 1, score = trait*2−1 ∈ [−1,1], so loved (≥0.6) needs trait ≥0.8. Tests use crafted traits at the extremes to be deterministic; in-game "loved" will be rarer, which is fine (it's a puzzle).
- **Negative affinity:** disliked can push points below 0 → `bumpPoints` clamps at 0. Covered by friendship tests already.
- **Held-item state not persisted:** intentional (scene-local); documented in design.

## Estimated touch count
4 files (1 new src, 1 modified src, 1 new unit, 1 new e2e). Under the ceiling.

## Shipped
**Files touched:**
- `game/src/social/gifts.ts` (new) — `Gift`/`GIFTS` (5 items), `giftScore`, `giftReaction` (loved/liked/neutral/disliked + delta), `verdictPhrase`.
- `game/src/scenes/WorldScene.ts` (modified) — held-item HUD, `[`/`]` cycle + **G** give, `applyGift`/`giveGift`/`refreshGiftHud`, `__heldItem`/`__cycleItem`/`__giveGift` hooks. Affinity delta applied via existing `bumpPoints` + saved.
- `tests/unit/gifts.test.ts` (new) — 7 tests.
- `tests/e2e/cycle-009-gifts.spec.ts` (new) — 2 tests.

**Deviations:** none. (Typed `applyGift` to return `GiftVerdict` to avoid an `as never` cast — cleanup, not a behavior change.)

**Build + test status:**
- `npm run build` — ✅ exit 0 (pre-existing chunk-size warning only).
- `npm run test:unit` — ✅ 53/53 (7 new gifts).
- `npx playwright test` — ✅ 22/22.

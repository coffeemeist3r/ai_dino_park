/**
 * The provider's say (BACKLOG-463) — the first governance beat. The CHARTER's
 * resources→crafting→building→**governance** arc had stalled at building: a zone can raise a granary
 * (454) and crown a provider (448), but no dino ever *decided* anything for the ground it keeps fed.
 * This seeds the decision, foundation-first: a zone with a standing provider gains one persistent,
 * provider-set **spend priority**, and who a zone trusts to keep it fed now shapes *how* it spends.
 * Not a vote (031 stays deferred) — one policy value, read by two hooks that already exist.
 *
 * Pure TypeScript (no Phaser): Node-testable. WorldScene owns the per-zone store, the persistence,
 * and the two read sites (`feedFromStores` 444, `buildOnGather` 454).
 */

import type { Personality } from '../ai/personality';

/**
 * A zone's stance on its banked food, set by its provider:
 * - `'feed'` — feed-the-hungry-first: spend the store down to zero for a starving resident, and hold
 *   off putting up the granary while the store is thin (mouths before buildings).
 * - `'bank'` — bank-for-a-granary: keep a reserve of each food id banked, and build the granary the
 *   moment resources allow (invest in the bigger pantry).
 */
export type SpendPriority = 'feed' | 'bank';

/** How much of each food id a `'bank'` zone holds back before it'll spend on a hungry mouth. */
export const BANK_RESERVE = 1;

/** Food-store total a `'feed'` zone wants in hand before it commits resources to a granary. */
export const FEED_BUILD_FLOOR = 4;

/**
 * The priority a provider sets, read off its temperament: a **warm** provider (`agreeableness ≥ 0.5`)
 * feeds its ground first; a **prickly** one banks toward the granary. Deterministic and stable per
 * provider (traits are name-seeded), so the same dino always sets the same table. An absent trait set
 * defaults to warm/feed — the gentler, behaviour-preserving-leaning default.
 */
export function providerPriority(traits?: Personality): SpendPriority {
  return (traits?.agreeableness ?? 0.5) >= 0.5 ? 'feed' : 'bank';
}

/**
 * Hook 1 — the pantry-spend reserve (444). A `'bank'` zone keeps `BANK_RESERVE` of each food id
 * banked and spends only above it; a `'feed'` zone (or a zone with no provider → `null`) keeps nothing
 * back, exactly as before 463. The compatibility seam: `null` → 0 → today's behaviour.
 */
export function feedReserve(p: SpendPriority | null | undefined): number {
  return p === 'bank' ? BANK_RESERVE : 0;
}

/**
 * Hook 2 — the granary build defer (454). A `'feed'` zone holds off raising its granary while its food
 * store is below `FEED_BUILD_FLOOR` (feed the mouths before investing in walls); a `'bank'` zone (or
 * no provider → `null`) never defers, building as soon as resources allow, exactly as before 463.
 */
export function granaryDeferredForFeeding(p: SpendPriority | null | undefined, foodTotal: number): boolean {
  return p === 'feed' && foodTotal < FEED_BUILD_FLOOR;
}

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
import { YIELD_MAX, YIELD_REGROW } from './regrowth';

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

/**
 * The lens read (BACKLOG-468) — a zone's policy as one glyph for the zone-map box: 🍽️ feeds its own first,
 * 🏦 banks toward plenty. A ground with no policy (`null`) renders nothing, the same compatibility seam both
 * hooks above honour, so a young park's map is exactly as it was. Lives here beside the type it reads, the
 * way `declineGlyph` lives with decline and `GRANARY_GLYPH` with the granary.
 */
export function spendGlyph(p: SpendPriority | null | undefined): string {
  return p === 'feed' ? '🍽️' : p === 'bank' ? '🏦' : '';
}

/* ---------------------------------------------------------------------------------------------------
 * The ground's second decision (BACKLOG-473).
 *
 * 463 gave a provider one call — how the pantry spends. One call is a setting; governance only becomes a
 * *system* once a ground decides more than one thing. This is the second, orthogonal call: what the
 * residents put their backs into. It lives here rather than in a module of its own because the shape is
 * identical (temperament read → persistent enum → hooks that treat `null` as today's behaviour → a lens
 * glyph), and a second file would have been this one with a different name.
 * ------------------------------------------------------------------------------------------------- */

/**
 * A zone's stance on its residents' labour, set by its provider:
 * - `'gather'` — fill the stores first: hold off raising a landmark while the pile is thin, and the ground
 *   itself recovers faster for being worked and tended.
 * - `'build'` — raise the walls first: never defer a landmark, reach the granary a landmark sooner, and let
 *   the ground regrow slower for it.
 */
export type WorkPriority = 'gather' | 'build';

/** Pile total a `'gather'` zone wants in hand before it spends on a bias landmark. Above the cairn recipe
 *  and below the granary's, so a gather-first ground visibly banks a while and still builds. */
export const WORK_BUILD_FLOOR = 6;

/** Regrowth multipliers — a worked-and-tended ground recovers faster, a ground whose backs are on the walls
 *  slower. The calibration knobs; `null` is exactly 1 and must stay that way (the compatibility seam). */
export const GATHER_REGROW_MULT = 1.6;
export const BUILD_REGROW_MULT = 0.6;

/**
 * The work priority a provider sets, read off its **energy** — deliberately a different axis from the spend
 * call's agreeableness, so two providers of equal warmth can still run their grounds differently. An
 * energetic provider puts its ground to work raising landmarks; a calm one has it gather and store. Absent
 * traits default to `'build'`, which is today's behaviour.
 */
export function providerWorkPriority(traits?: Personality): WorkPriority {
  return (traits?.energy ?? 0.5) >= 0.5 ? 'build' : 'gather';
}

/**
 * The council actually decides (BACKLOG-481) — **BACKLOG-031**, "at threshold population, NPCs vote on a
 * simple rule", queued since cycle 1 and deferred every cycle since for exactly one reason: there was no
 * *set of deciders* to hold a vote. 479 derived one (`zoneCouncil`) and gave it nothing to do. This hands
 * it the ground's second call.
 *
 * The work priority and not the spend priority, deliberately: its three hooks (the landmark defer, the
 * granary gate, the regrowth multiplier) can none of them leave a dino hungry, and leaving 463 with the
 * provider means the unchanged call sits beside the changed one as a live control.
 *
 * Each seat votes with `providerWorkPriority(traits)` — the same energy read the provider always used, so
 * a council of one behaves exactly as that one dino did alone. Majority wins. An even split falls to the
 * `tieBreak` (WorldScene passes the provider's own vote — the say still counts for something), and with
 * no provider to break it, to `votes[0]`: `zoneCouncil` orders most-banked first, so the tie goes to the
 * ground's biggest contributor. Deterministic in every branch; no RNG anywhere near a vote.
 *
 * A note on the tie-break, recorded rather than hidden: `zoneCouncil`'s comparator is byte-identical to
 * `zoneProvider`'s, so **the provider is always seat 1** (479 states that as a guarantee). Today, then,
 * `tieBreak` and `votes[0]` name the same dino in every reachable state, and the parameter is a statement
 * of intent rather than a branch you can reach. It is kept separate because the two stop coinciding the
 * moment seats get terms (484) or a seat is earned any way other than banking — at which point the rule
 * "the say breaks a tie" must already be written down, not invented under pressure.
 *
 * `[]` → `null` is the compatibility seam every governance function here honours: a ground that seats
 * nobody has decided nothing *by council*, and the caller falls through to the pre-481 provider rule.
 */
export function councilWorkPriority(
  votes: readonly WorkPriority[],
  tieBreak: WorkPriority | null,
): WorkPriority | null {
  if (votes.length === 0) return null;
  const build = votes.filter((v) => v === 'build').length;
  const gather = votes.length - build;
  if (build > gather) return 'build';
  if (gather > build) return 'gather';
  return tieBreak ?? votes[0];
}

/** The ground's call in the player's words, read off the same table the lens glyph and the `[?]` legend
 *  read (477). The ticker beat uses this so a vote can never be announced in words the legend disagrees
 *  with — one table, three readers. */
export function workCallMeaning(p: WorkPriority): string {
  return WORK_CALL.options.find((o) => o.value === p)!.meaning;
}

/**
 * Hook 1a — the bias-landmark defer. A `'gather'` zone holds off raising its landmark while its pile is
 * below `WORK_BUILD_FLOOR` (stores before walls), so the pile visibly climbs instead of being auto-drained
 * on every affordable cairn. `'build'` and `null` never defer — exactly as before 473.
 */
export function landmarkDeferredForGathering(p: WorkPriority | null | undefined, pileTotal: number): boolean {
  return p === 'gather' && pileTotal < WORK_BUILD_FLOOR;
}

/**
 * Hook 1b — the granary gate. A `'build'` zone reaches its granary one base landmark sooner (floored at 1,
 * so the gate never vanishes); `'gather'` and `null` read the gate unchanged.
 */
export function granaryGateFor(p: WorkPriority | null | undefined, base: number): number {
  return p === 'build' ? Math.max(1, base - 1) : base;
}

/** The regrowth multiplier for a work priority. `null` is exactly 1 — the seam that keeps an unpolicied
 *  ground bit-identical to `regrowYield`. */
export function workRegrowMult(p: WorkPriority | null | undefined): number {
  return p === 'gather' ? GATHER_REGROW_MULT : p === 'build' ? BUILD_REGROW_MULT : 1;
}

/**
 * Hook 2 — the ground's recovery (384). One regrow tick scaled by the zone's work priority, clamped to
 * `[0, YIELD_MAX]`. `workRegrowth(null, y)` is `regrowYield(y)` to the bit.
 */
export function workRegrowth(p: WorkPriority | null | undefined, y: number): number {
  const next = y + YIELD_REGROW * workRegrowMult(p);
  return Math.max(0, Math.min(YIELD_MAX, next));
}

/** The lens read (twin of `spendGlyph`): 🧺 fills its stores first, 🧱 raises its walls first. A ground with
 *  no policy renders nothing. */
export function workGlyph(p: WorkPriority | null | undefined): string {
  return p === 'gather' ? '🧺' : p === 'build' ? '🧱' : '';
}

/* ---------------------------------------------------------------------------------------------------
 * Both of the ground's calls, on the lens (BACKLOG-477).
 *
 * 468 hung 🍽️/🏦 off the end of the lens box's prosperity line because at the time there was one
 * governance call and the end of a line was a fine place for it. 473 added 🧺/🧱 by copying that. The line
 * now carries five independent reads, two of which are the same *kind* of fact, and nothing anywhere told
 * the player what any of the four glyphs meant.
 *
 * So the calls become a **table**, and the lens row and the `[?]` legend are both derived from it. A third
 * call (479 is queued) is then a new entry here and no function below changes — which is the item's own
 * stated ask: a row, not a redesign. It also means the legend cannot drift from the glyphs it explains,
 * because they are the same data read twice.
 * ------------------------------------------------------------------------------------------------- */

export interface GovernanceOption {
  /** The enum value, as the sim stores it. */
  value: string;
  glyph: string;
  /** One plain line for the legend — what this ground has chosen, in the player's words. */
  meaning: string;
}

export interface GovernanceCall {
  /** What this ground is deciding about, for the legend. */
  name: string;
  options: readonly GovernanceOption[];
}

/**
 * A call this ground has not made yet. The row keeps the position rather than closing up, so a
 * half-decided ground can never be misread as a fully decided one. Deliberately not `·`: the unsettled
 * badge (474) already draws that character in this very box, and a placeholder that collides with another
 * read is worse than no placeholder.
 */
export const UNSET_GLYPH = '▫';

export const SPEND_CALL: GovernanceCall = {
  name: 'pantry',
  options: [
    { value: 'feed', glyph: '🍽️', meaning: 'feeds its own first' },
    { value: 'bank', glyph: '🏦', meaning: 'banks toward plenty' },
  ],
};

export const WORK_CALL: GovernanceCall = {
  name: 'labour',
  options: [
    { value: 'gather', glyph: '🧺', meaning: 'fills its stores first' },
    { value: 'build', glyph: '🧱', meaning: 'raises its walls first' },
  ],
};

/** Every call a ground makes, in the order the lens row and the legend read them. */
export const GOVERNANCE_CALLS: readonly GovernanceCall[] = [SPEND_CALL, WORK_CALL];

/**
 * The lens row: one glyph per call in table order, `UNSET_GLYPH` for a call this ground hasn't made.
 * A ground that has decided *nothing* renders `''` — the same `null` seam every hook above honours, so a
 * young park's map is exactly as it was. `values` is positional against `GOVERNANCE_CALLS`.
 */
export function governanceLine(values: ReadonlyArray<string | null | undefined>): string {
  if (!values.some((v) => v)) return '';
  return GOVERNANCE_CALLS.map((call, i) => {
    const v = values[i];
    return call.options.find((o) => o.value === v)?.glyph ?? UNSET_GLYPH;
  }).join(' ');
}

/** The same table rendered for the `[?]` panel, so a glyph on the map is decodable in-game. */
export function governanceLegend(): string[] {
  return [
    '— How a ground decides —',
    ...GOVERNANCE_CALLS.flatMap((c) => c.options.map((o) => `${o.glyph} ${c.name}: ${o.meaning}`)),
    `${UNSET_GLYPH} not yet decided`,
  ];
}

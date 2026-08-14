/**
 * Seasons (BACKLOG-159) — a turning year layered on the realtime clock. The season is *derived*
 * from the persisted day (nothing new in the save): a week per season, a 28-day year, wrapping
 * forever. The tint is a subtle wash under the day/night overlay — the year colours the bowl,
 * the sun still owns the light.
 *
 * Pure TypeScript (no Phaser): Node-testable. WorldScene paints the wash and lands the turn beat.
 */

import type { Tint } from './dayNight';

export const SEASONS = ['spring', 'summer', 'fall', 'winter'] as const;
export type Season = (typeof SEASONS)[number];

export const SEASON_LENGTH_DAYS = 7;

/** The season for a 1-indexed clock day. Day 1–7 spring, 8–14 summer, …, 29 spring again. */
export function seasonFor(day: number): Season {
  const idx = Math.floor((day - 1) / SEASON_LENGTH_DAYS) % SEASONS.length;
  return SEASONS[(idx + SEASONS.length) % SEASONS.length];
}

/** The new season iff the clock moved forward across a boundary; null otherwise. */
export function seasonTurned(prevDay: number, day: number): Season | null {
  if (day <= prevDay) return null;
  const next = seasonFor(day);
  return next === seasonFor(prevDay) ? null : next;
}

/** Subtle per-season wash. Alphas capped at 0.12 so the day/night overlay stays dominant. */
export const SEASON_TINT: Record<Season, Tint> = {
  spring: { color: 0x58c04a, alpha: 0.08 },
  summer: { color: 0xe8c050, alpha: 0.09 },
  fall: { color: 0xd07030, alpha: 0.11 },
  winter: { color: 0x90b8e0, alpha: 0.12 },
};

const TURN_LINES: Record<Season, string> = {
  spring: 'The season turns — spring greens the bowl.',
  summer: 'The season turns — summer gold settles over the grass.',
  fall: 'The season turns — fall browns the edges of everything.',
  winter: 'The season turns — winter pales the light in the bowl.',
};

/** The one-off banner line for a turn. */
export function turnLine(season: Season): string {
  return TURN_LINES[season];
}

/** The memory every dino files when the year turns. */
export function turnMemory(season: Season): string {
  return `the season turned to ${season}`;
}

/**
 * The lean season (BACKLOG-461) — the turning year's grip on the food economy. For its whole life the season
 * was a tint and a huddle-pull: a zone banked and spoiled at the same rate in every season (446/455). This is
 * the one pure park-wide modifier the harvest-banking and spoilage hooks read, so *when* it is finally shapes
 * how much a ground can hold. Foundation-first: a flat park-wide grip; per-crop seasonal yield stays deferred
 * (BACKLOG-465).
 *
 * - `capDelta` stacks onto a zone's food cap: **−1 in the lean season** (winter — a ground holds one less per
 *   food id), **+1 in the plenty seasons** (summer/fall — hold one more), 0 in spring (the year's hinge).
 * - `spoilMarginDelta` stacks onto spoilage's near-cap band (`SPOIL_MARGIN`): **+1 in winter** (the band
 *   widens, so a hoard bleeds sooner and to a deeper floor), **−1 in summer/fall** (spoils only at the very
 *   cap), 0 in spring. So the lean season tightens both ends and plenty eases both.
 */
export type SeasonGrip = { capDelta: number; spoilMarginDelta: number };

const SEASON_GRIP: Record<Season, SeasonGrip> = {
  spring: { capDelta: 0, spoilMarginDelta: 0 }, // neutral — the hinge of the year
  summer: { capDelta: 1, spoilMarginDelta: -1 }, // plenty — hold more, spoil later
  fall: { capDelta: 1, spoilMarginDelta: -1 }, // harvest — plenty
  winter: { capDelta: -1, spoilMarginDelta: 1 }, // lean — hold less, spoil sooner
};

/** The season's grip on the food economy (BACKLOG-461). Pure lookup; WorldScene threads it into the food-cap
 *  and spoilage-margin reads. */
export function seasonGrip(season: Season): SeasonGrip {
  return SEASON_GRIP[season];
}

/**
 * Migrating warmth (BACKLOG-178) — the year's grip on the bowl's *daytime* social density, the social twin of
 * `seasonGrip`'s grip on the pantry. Winter pulls the cast together (they seek company against the cold, so the
 * ambient "drift to the cluster" roll leans up) and summer lets them spread and laze (it leans down). The night
 * den already tightens with the season (huddle window + bar, BACKLOG-171); this is its daytime companion.
 * Spring and fall are exactly 1.0 — the year's hinges, and the 1.0 spring keeps a fresh clock byte-identical to
 * every build since the socialize roll existed (same compatibility discipline as 461/171).
 */
const SEASON_SOCIAL_BIAS: Record<Season, number> = {
  spring: 1, // the hinge — unchanged
  summer: 0.7, // spread out and laze
  fall: 1, // the hinge — unchanged
  winter: 1.4, // seek company in the cold — the den fills earlier
};

/** The season's multiplier on the daytime socialize roll (BACKLOG-178). Pure lookup. */
export function seasonSocialBias(season: Season): number {
  return SEASON_SOCIAL_BIAS[season];
}

/**
 * Apply the season's social bias to a base socialize chance, clamped to the same [0.05, 0.95] band the intent
 * roll uses (BACKLOG-178), so the year colours the drift-to-the-cluster odds without ever pegging the roll to
 * always or freezing it to never. Composes on top of `socializeChanceFor` (the 393 intent lean), never replaces it.
 */
export function seasonalSocializeChance(base: number, season: Season): number {
  return Math.min(0.95, Math.max(0.05, base * seasonSocialBias(season)));
}

/**
 * The dry season (BACKLOG-466) — the year's grip on *drinking*, the water twin of `seasonGrip`'s grip on
 * the pantry. For its whole life thirst (371) was one constant in every season and a waterhole (445) slaked
 * identically in August and January: the season reached the stores, the crops, the den and the daytime
 * cluster, and never once reached a drink. Two numbers close that.
 *
 * - `seasonThirst` multiplies the trait-scaled thirst build rate: summer parches (the bowl drinks harder in
 *   the heat), winter eases it.
 * - `slakeFloor` is what a drink resets thirst *to*: in the dry season a drink doesn't hold, so thirst
 *   settles at a small floor rather than 0. This is what the deferred shrinking-waterhole sprite would have
 *   meant, done as one number instead of art.
 *
 * Spring and fall are exactly 1.0 / 0 — the year's hinges, and the reason a fresh clock behaves exactly as
 * it did before this existed (the 461/178/171 compatibility discipline). Both are threaded into `needs.ts`
 * as plain numbers rather than imported there, so the two pure modules stay independent.
 */
const SEASON_THIRST: Record<Season, number> = {
  spring: 1, // the hinge — unchanged
  summer: 1.5, // the dry season — thirst builds half again as fast
  fall: 1, // the hinge — unchanged
  winter: 0.7, // the cold eases it
};

/** The season's multiplier on the thirst build rate (BACKLOG-466). Pure lookup. */
export function seasonThirst(season: Season): number {
  return SEASON_THIRST[season];
}

/** How much thirst a summer drink leaves behind (BACKLOG-466). The calibration knob for the dry season's
 *  waterhole half; small enough that a drink is still worth taking. */
export const SUMMER_SLAKE_FLOOR = 0.15;

/** The thirst level a drink at the water resets to this season — the floor in the dry season, 0 otherwise. */
export function slakeFloor(season: Season): number {
  return season === 'summer' ? SUMMER_SLAKE_FLOOR : 0;
}

const THIRST_LINES: Record<Season, string> = {
  spring: '', // the hinge — nothing to say about the drinking
  summer: '☀️ the dry season parches the bowl — thirst builds faster and a drink doesn’t hold.',
  fall: '', // the hinge — nothing to say about the drinking
  winter: '❄️ winter eases the thirst — a drink goes further.',
};

/** The ticker line for the season turn's drinking half (BACKLOG-466); '' on the hinges. The twin of
 *  `seasonGripLine` — no silent change (CHARTER §Quality bar). */
export function seasonThirstLine(season: Season): string {
  return THIRST_LINES[season];
}

const GRIP_LINES: Record<Season, string> = {
  spring: '', // neutral — nothing to say about the stores
  summer: '🌻 summer eases the stores — plenty keeps longer.',
  fall: '🌾 the harvest season eases the stores — plenty keeps longer.',
  winter: '❄️ winter tightens the stores — the pantry holds less and spoils sooner.',
};

/** The ticker line for the season turn's economic half (BACKLOG-461); '' in spring (no shift to announce).
 *  No silent change (CHARTER §Quality bar): a season that changes the pantry says so. */
export function seasonGripLine(season: Season): string {
  return GRIP_LINES[season];
}

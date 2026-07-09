/**
 * Zone prosperity index (BACKLOG-428) — the milestone-closing "a zone you can read" beat. Four per-zone
 * signals the sim already produces — banked resources (328), built landmarks (286/315/417), resident head
 * count (316), and crops harvested from the zone's plot (145/418) — folded into one score and a coarse tier,
 * so "which zone is thriving" is a glance on the map lens (425) instead of four separate lookups.
 *
 * Pure TypeScript (no Phaser): the fold + the tier cut are decided here and unit-tested; WorldScene builds
 * the per-zone signals and draws the tier badge. Nothing here authors sim behavior — it's a derived readout
 * (the CHARTER lens rule), the foundation the deferred governance/festival items (031/026) can read instead
 * of re-deriving.
 */

export interface ZoneSignals {
  /** Total banked resources in the zone (sum over the zone's stockpile kinds). */
  stockpile: number;
  /** Built landmarks in the zone (cairns + lean-tos + thatches). */
  structures: number;
  /** Resident dinos that call the zone home. */
  heads: number;
  /** Crops harvested from the zone's plot. */
  harvested: number;
}

/**
 * The raw prosperity score — a weighted, monotonic, non-negative sum. The rarer, harder-won signals count
 * for more: a built landmark (many gathers) outweighs a resident, which outweighs a single banked resource
 * or one harvest. Every term is >= 0 and raising any signal never lowers the score.
 */
export function zoneProsperity(s: ZoneSignals): number {
  return s.structures * 3 + s.heads * 2 + s.harvested + s.stockpile;
}

export type ProsperityTier = 'quiet' | 'growing' | 'thriving';

/** Score at/below which a zone reads 'quiet'; above the next, 'thriving'. Tunable. */
export const PROSPERITY_QUIET_MAX = 3;
export const PROSPERITY_GROWING_MAX = 9;

/** The coarse tier a score falls into — the three-step read the map lens shows. */
export function prosperityTier(score: number): ProsperityTier {
  if (score <= PROSPERITY_QUIET_MAX) return 'quiet';
  if (score <= PROSPERITY_GROWING_MAX) return 'growing';
  return 'thriving';
}

/** A small dot meter per tier — a filling circle, so the tier reads at a glance without colour. */
export const PROSPERITY_GLYPH: Record<ProsperityTier, string> = {
  quiet: '○',
  growing: '◐',
  thriving: '●',
};

/** The lens badge for a tier: `● thriving`. */
export function prosperityBadge(tier: ProsperityTier): string {
  return `${PROSPERITY_GLYPH[tier]} ${tier}`;
}

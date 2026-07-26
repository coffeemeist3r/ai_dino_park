/**
 * The draining zone (BACKLOG-460) — the M7 structural companion to scarcity migration (450). As mouths move
 * toward plenty (450), the poorest zone hollows out, but nothing compounded it: the migration bias re-read
 * prosperity *fresh every roll*, so a thinning zone never gained momentum and an exodus never read *as* one.
 * This gives an exodus a read and a pull: a zone whose population has fallen below its own high-water mark
 * reads **declining** (a ⬇ on the map lens), and its remaining settled residents lean a touch harder to leave
 * — capped by a floor that never lets the last resident go, so a zone can thin but never vanish (deathless,
 * per the CHARTER: mortality stays an operator call).
 *
 * Pure (no Phaser): the high-water fold, the declining read, and the damp knob are decided here and
 * unit-tested. WorldScene tracks each zone's peak on the migrate cadence and drives the resist gate through it.
 */

/** Each zone's population high-water mark (name → peak head count); absent → never counted (0). */
export type ZonePeaks = Record<string, number>;

/** The floor: the ambient wander never drains a zone below this many residents, so it thins but never vanishes. */
export const ZONE_FLOOR = 1;

/**
 * A declining zone's settled resident resists the ambient wander at this rate (vs. `SETTLED_MIGRATE_DAMP` 0.6
 * for a stable zone): a hollowing zone holds its people more weakly, so the exodus gains momentum instead of
 * re-levelling each roll. The calibration knob — tune here, not at the call site.
 */
export const DECLINING_MIGRATE_DAMP = 0.3;

/**
 * Raise a zone's high-water mark to its current head count (BACKLOG-460). Pure — returns a new map when the
 * peak rises, the **same** reference when `heads` is at or below the recorded peak (a cheap no-op on the
 * cadence). Never lowers: a peak only ever climbs, so a later drop below it is what reads as declining.
 */
export function bumpPeak(peaks: ZonePeaks, zone: string, heads: number): ZonePeaks {
  if (heads <= (peaks[zone] ?? 0)) return peaks;
  return { ...peaks, [zone]: heads };
}

/**
 * Is a zone declining (BACKLOG-460) — has it lost residents from its peak while still holding at least the
 * floor? A zone at or above its peak is stable/growing (false); a zone at 0 (never occupied, or fully
 * emptied by a non-ambient path) is not "draining" either (false) — the read is a *live hollowing*.
 */
export function isDeclining(peak: number, heads: number): boolean {
  return heads < peak && heads >= ZONE_FLOOR;
}

/** The map-lens marker for a declining zone — a down arrow beside the prosperity tier. */
export function declineGlyph(): string {
  return '⬇';
}

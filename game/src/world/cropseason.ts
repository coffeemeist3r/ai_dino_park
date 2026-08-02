/**
 * Per-crop seasonal yield (BACKLOG-465) — the half 461 deferred in its own source comment. The lean season
 * gave the year a grip on the food economy, but a *park-wide* one: every ground banked and spoiled by the
 * same delta at the same time, so the calendar could make the whole chain richer or poorer and never make
 * one ground richer **than another**. That difference is what the whole chain economy runs on — the ferry
 * (447) moves food from the fuller zone to the lighter one, the demand read (438) points at what a ground
 * can't grow, migration (450) walks mouths toward plenty — and until now only chance ever produced it.
 *
 * Here the calendar produces it, on a schedule: each crop has one good season and one lean one, and the
 * three farmed crops rotate so every season has exactly one thriving ground and exactly one thin one.
 * **Spring is the hinge for every crop**, the same discipline 461 used — a fresh boot (day 1) banks exactly
 * what it always banked.
 *
 * Pure TypeScript (no Phaser): Node-testable. WorldScene owns the harvest loop and the ticker.
 */

import { FOODS } from './foods';
import type { Season } from './seasons';

export interface CropSeason {
  good: Season; // the crop comes in thick — the ground banks double
  lean: Season; // the crop comes in thin — nothing to bank
}

/**
 * The year, per crop. Keyed by FOODS id — the same key `CROP_BY_ZONE` (418/432) yields — so a fourth crop
 * is a row here, not a branch anywhere (the 449 discipline). The rotation is deliberate: summer favours the
 * bowl and starves the Fernreach, fall favours the Grove and starves the bowl, winter favours the Fernreach
 * and starves the Grove. Spring appears in no row, which is what makes it the hinge.
 */
export const CROP_SEASON: Record<string, CropSeason> = {
  berries: { good: 'summer', lean: 'fall' },
  greens: { good: 'fall', lean: 'winter' },
  roots: { good: 'winter', lean: 'summer' },
  // BACKLOG-472: the Hollow's mushrooms take the one season the founding three left empty, so every
  // season now has exactly one thriving ground — spring included, where the park used to have none.
  //
  // The rotation does NOT stay one-thin-per-season, and that is a decision, not an oversight: with the
  // founding three holding fall/winter/summer as their lean seasons, the only free *good* slot is spring
  // and the only free *lean* slot is spring, and one crop cannot take both. Re-pointing roots' lean at
  // spring would have squared the table at the cost of the hinge below — a fresh boot (day 1, spring)
  // would stop banking what it always banked. The hinge is worth more than the symmetry, so fall carries
  // two thin crops instead: greens thrive there while both the bowl's berries and the Hollow's mushrooms
  // come in thin. Fall is the park's pinch season now, which is a better fact about the year than a tidy
  // table would have been.
  //
  // The hinge itself is untouched: berries/greens/roots still name no spring, so the three founding
  // grounds bank exactly what they always banked on a fresh boot.
  mushrooms: { good: 'spring', lean: 'fall' },
};

export const YIELD_GOOD = 2;
export const YIELD_LEAN = 0;
export const YIELD_BASE = 1;

/**
 * How many units a harvest of `food` banks into its ground's store this season. A food with no row (an
 * unfarmed food, or a crop a future cycle adds without declaring its year) yields the base everywhere —
 * the same compatibility seam 463's `null` policy uses.
 */
export function cropYield(food: string, season: Season): number {
  const year = CROP_SEASON[food];
  if (!year) return YIELD_BASE;
  if (year.good === season) return YIELD_GOOD;
  if (year.lean === season) return YIELD_LEAN;
  return YIELD_BASE;
}

/** A food's human label for the ticker lines; the raw id if it isn't in FOODS. */
function labelOf(food: string): string {
  return FOODS.find((f) => f.id === food)?.label ?? food;
}

/**
 * The harvest ticker line for a non-neutral yield — '' at the base yield, so a spring harvest reads exactly
 * as it did before 465. No silent economy change (CHARTER §Quality bar): a year that doubles or cancels
 * what a ground banks says so at the moment it happens.
 */
export function harvestYieldLine(cropGlyph: string, food: string, season: Season): string {
  const y = cropYield(food, season);
  if (y === YIELD_GOOD) return `${cropGlyph} the ${labelOf(food)} came in thick — two for the stores`;
  if (y === YIELD_LEAN) return `${cropGlyph} a lean year for the ${labelOf(food)} — nothing to bank`;
  return '';
}

/**
 * The season-turn line naming this season's winner and loser, the per-crop companion to 461's park-wide
 * `seasonGripLine`. Derived by scanning `CROP_SEASON` rather than hand-written per season, so the sentence
 * can never drift from the table it describes. '' in spring — nobody's good or lean season, nothing to say.
 */
export function seasonCropLine(season: Season): string {
  const ids = Object.keys(CROP_SEASON);
  const good = ids.find((id) => CROP_SEASON[id].good === season);
  // BACKLOG-472: a season may now carry more than one lean crop (fall thins both berries and mushrooms),
  // so the sentence names all of them rather than whichever the table happens to list first.
  const lean = ids.filter((id) => CROP_SEASON[id].lean === season);
  if (!good || lean.length === 0) return '';
  const thin = lean.map(labelOf).join(' and the ');
  return `🌾 ${season} favours the ${labelOf(good)}; the ${thin} come in thin`;
}

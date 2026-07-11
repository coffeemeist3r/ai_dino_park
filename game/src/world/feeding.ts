/**
 * Feeding hatch (BACKLOG-059) — the keeper drops food through the lid and the
 * cast swarms it. Pure (no Phaser): the reaction, the rush step, the landing tile,
 * and "did it reach the food" are all decided here and unit-tested; WorldScene
 * turns an H press into a food drop and drives the swarm off the world clock.
 *
 * Symmetric to world/startle.ts — a tap repels by temperament, food attracts by it.
 */

import type { Tile } from './movement';
import { stepToward } from './movement';

export type FeedReaction = 'rush' | 'ignore';

export const FEED_RANGE = 7; // tiles — beyond this a food drop goes unnoticed
export const FEED_RANGE_FAV = 12; // a dino will cross most of the bowl for its favorite (BACKLOG-061)
export const FEED_GAIN = 5; // friendship points a fed dino gains (keeping reframed)
export const FEED_GAIN_FAV = 9; // a favorite is extra-happy: > plain feed, < a loved gift (12)
const EAGER = 0.4; // energy at/above which a dino bothers to rush the food
const EAGER_FAV = 0.15; // even a fairly calm dino rouses for its favorite

/**
 * Does a dino notice and rush dropped food, given its energy (0..1) and distance?
 * Its favorite pulls harder — a wider range and a lower energy bar — so the keeper
 * learns tastes by watching who comes running for what (BACKLOG-061). Omitting
 * `isFavorite` keeps the cycle-25 behavior exactly.
 */
export function reactionToFood(energy: number, distTiles: number, isFavorite = false): FeedReaction {
  if (distTiles > (isFavorite ? FEED_RANGE_FAV : FEED_RANGE)) return 'ignore';
  return energy >= (isFavorite ? EAGER_FAV : EAGER) ? 'rush' : 'ignore';
}

/** One tile toward the food along the dominant axis, clamped. Reuses stepToward. */
export function feedStep(from: Tile, food: Tile, cols: number, rows: number): Tile {
  return stepToward(from, food, cols, rows);
}

/** Has the dino reached the food — same tile or one tile away (Chebyshev ≤ 1)? */
export function reachedFood(at: Tile, food: Tile): boolean {
  return Math.abs(at.tileX - food.tileX) <= 1 && Math.abs(at.tileY - food.tileY) <= 1;
}

/**
 * Generous feeder (BACKLOG-375) — the need-drive (371) reaches *between* dinos. When a well-fed dino
 * wins the rush to a drop while a hungrier high-bond friend is in the swarm beside it, it gives up the
 * meal and lets the friend eat first — the first generosity that costs the giver something (the
 * friendship gain it forgoes). Pure: WorldScene supplies the winner's hunger and the nearby swarm's
 * {name, hunger, bond}; this decides *who* (if anyone) the winner yields to.
 */
export const WELL_FED = 0.3; // hunger at/below which the winner doesn't need this meal itself
export const GENEROUS_BOND = 40; // bond at/above which a dino will yield a meal to that friend
export const HUNGRIER_BY = 0.25; // the friend must be at least this much hungrier to be worth yielding to
export const SWARM_RADIUS = 4; // tiles from the food — who counts as "beside" the winner in the swarm

/**
 * Remembered generosity (BACKLOG-385) — a dino repays a friend that once fed it (375) more readily
 * than a mere acquaintance. When a candidate is in the winner's `owes` set (a benefactor it remembers),
 * the two yield bars drop from the stranger-friend thresholds to these: you'll cross the bowl for
 * someone who crossed it for you, at a bond you wouldn't for anyone else.
 */
export const RECIPROCAL_BOND = 20; // owed benefactor: yielded to at half the GENEROUS_BOND bar
export const RECIPROCAL_HUNGRIER_BY = 0.1; // ...and a smaller hunger gap suffices to repay a kindness

/**
 * The friend the `winner` yields its meal to, or null when it eats itself. Null when the winner is
 * hungry (> WELL_FED) — it keeps its own food — or when no candidate clears both bars (bond ≥
 * GENEROUS_BOND AND at least HUNGRIER_BY hungrier). Otherwise the hungriest qualifying friend, ties
 * broken by the higher bond. Deterministic — a stable sort over the supplied order.
 *
 * `owes` names benefactors the winner remembers being fed by (BACKLOG-385): a candidate in this set
 * qualifies at the relaxed RECIPROCAL_* bars and wins ties over an un-owed friend, so generosity is
 * repaid. Omitting `owes` (an empty set) reproduces the cycle-83 verdict exactly.
 */
export function yieldFoodTo(
  winner: string,
  winnerHunger: number,
  candidates: ReadonlyArray<{ name: string; hunger: number; bond: number }>,
  owes: ReadonlySet<string> = new Set(),
): string | null {
  if (winnerHunger > WELL_FED) return null;
  const worthy = candidates
    .filter((c) => {
      if (c.name === winner) return false;
      const bondBar = owes.has(c.name) ? RECIPROCAL_BOND : GENEROUS_BOND;
      const hungrierBar = owes.has(c.name) ? RECIPROCAL_HUNGRIER_BY : HUNGRIER_BY;
      return c.bond >= bondBar && c.hunger - winnerHunger >= hungrierBar;
    })
    // owed benefactors first (repay a kindness), then hungriest, then the higher bond
    .sort((a, b) => Number(owes.has(b.name)) - Number(owes.has(a.name)) || b.hunger - a.hunger || b.bond - a.bond);
  return worthy[0]?.name ?? null;
}

/**
 * Greedy gobble (BACKLOG-387) — the inverse pole of yieldFoodTo. Generosity (375) gives a contested
 * meal away; greed seizes it. A hungry, prickly (low-agreeableness) dino won't wait its turn: standing
 * in the swarm beside a winner that's *keeping* its food, it shoulders past and eats first (😤), so
 * giving way reads as a trait, not a universal — some dinos cede, some grab. Pure + deterministic.
 */
export const GOBBLE_HUNGER = 0.5; // hunger at/above which a dino is hungry enough to push to the front
export const GREEDY_AGREE = 0.35; // agreeableness at/below which a dino won't wait its turn (prickly)

/** Is this dino greedy-hungry enough to shoulder past for food (BACKLOG-387)? */
export function gobblesFood(hunger: number, agreeableness: number): boolean {
  return hunger >= GOBBLE_HUNGER && agreeableness <= GREEDY_AGREE;
}

/**
 * The greedy gobbler that shoulders the `winner` aside, or null when none does (the winner eats as
 * normal). A candidate qualifies when it's `gobblesFood` AND at least `HUNGRIER_BY` hungrier than the
 * winner (so it has real cause to push). Hungriest first, ties broken toward the pricklier dino.
 * Deterministic stable sort over the supplied order — the mirror of `yieldFoodTo`.
 */
export function gobblerAmong(
  winner: string,
  winnerHunger: number,
  candidates: ReadonlyArray<{ name: string; hunger: number; agreeableness: number }>,
): string | null {
  const greedy = candidates
    .filter(
      (c) => c.name !== winner && gobblesFood(c.hunger, c.agreeableness) && c.hunger - winnerHunger >= HUNGRIER_BY,
    )
    .sort((a, b) => b.hunger - a.hunger || a.agreeableness - b.agreeableness);
  return greedy[0]?.name ?? null;
}

/**
 * Standing up to the gobbler (BACKLOG-390) — the third pole of the contested-drop trio. A yield (375)
 * gives the meal away; a gobble (387) seizes it; this is the winner who *won't be seized from*. When a
 * gobbler would shoulder past (gobblerAmong returned someone), a **bold** winner instead holds its tile
 * and the gobbler backs down (😠). So who gets pushed around at the hatch is a bravery read — the timid
 * cede, the bold don't. Pure; consumed only in checkFeeding's no-yield branch, after the gobbler is found.
 */
export const STAND_BRAVERY = 0.65; // bravery at/above which a winner holds its ground rather than ceding

/** Does this winner stand up to a gobbler rather than cede the contested drop (BACKLOG-390)? */
export function standsGround(winnerBravery: number): boolean {
  return winnerBravery >= STAND_BRAVERY;
}

/**
 * Backed-down gobbler slinks off (BACKLOG-394) — when a bold winner holds its ground (390), the denied
 * gobbler doesn't just lose the tile: it slinks away (😖) carrying who wouldn't budge, so the failed grab
 * has a visible, remembered cost. Pure memory builder (sibling to world/cold.ts's coldMemory etc.).
 */
export function slunkOffMemory(boldName: string): string {
  return `${boldName} wouldn't budge — you slunk off`;
}

/**
 * Where dropped food lands. `col` (the hatch column) is honored and clamped when
 * given; otherwise a column is picked from `rand`. It always settles in the
 * upper-middle feeding zone so it falls into the cast rather than onto the rim.
 */
export function foodLanding(cols: number, rows: number, col?: number, rand: () => number = Math.random): Tile {
  const tileX =
    col === undefined ? Math.floor(rand() * cols) : Math.max(0, Math.min(cols - 1, Math.round(col)));
  return { tileX, tileY: Math.floor(rows * 0.45) };
}

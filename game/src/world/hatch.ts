/**
 * The feeding hatch (BACKLOG-510) — where the most-pressed key in the game actually happens.
 *
 * `H` has dropped food since cycle 59 and the park's entire social engine hangs off where it lands: the
 * swarm, the cede, the gobble, the pecking order, the escort that walks a withdrawn loner over, four
 * remembered beats and a Park News line. All of it reads a position that was rolled uniformly across the
 * whole map, spawned *above the top of the world*, and marked by nothing before or after. The event line
 * has said "food dropped from the hatch" for eighty cycles about a thing that did not exist.
 *
 * So the hatch becomes a place. Pure (no Phaser): the tile and the landing roll live here, `WorldScene`
 * owns the sprite — the `world/bank.ts` split, for the same reason.
 */

import { rand as worldRand } from './rng';

/**
 * The hatch sits on the **same tile on every ground**, exactly as the bank does (504), and for a reason the
 * game already teaches: `H` is one key everywhere, so the hatch should be one place everywhere.
 *
 * `tileY` is not a new number. It is `Math.floor(rows * 0.45)` at the shipping 15 rows — the row
 * `foodLanding` has settled food on since 059 — so **the feeding row does not move** and every spec that
 * pins it stays true. `cycle-143-hatch.test.ts` asserts that against `foodLanding` itself rather than
 * restating the arithmetic, and asserts the tile is not water on any ground in `zoneChain()`.
 *
 * Not water is the assertion that means something here, where the bank could ask for grass: the Grove's
 * trail runs through row 6 and the Saltpan (505) is bare crust. A hatch on a trail or on crust is fine. A
 * hatch under the pond is not.
 */
export const HATCH_TILE = { tileX: 13, tileY: 6 } as const;

/** The `PROP_RIGS` key BACKLOG-502 will claim. Until it does, `bakePropArt` resolves nothing and the scene
 *  draws the glyph — the same per-item fallback 490, 494, 496 and 504 all ship. */
export const HATCH_ART_KEY = 'hatch';

/** The stand-in until 502 draws the rig: an opening in the ground, in the park's own emoji vocabulary. */
export const HATCH_GLYPH = '🕳️';

/**
 * How far a dropped piece may scatter from the hatch column.
 *
 * The landing keeps its randomness on purpose. `startEscort`, `reactionToFood`'s rush/amble split, the
 * berth (389) and the pecking order all read the *distance* to the landing; a landing pinned to one tile
 * would flatten every one of them — five systems made duller to make one visible, which is the reachability
 * bar's own mistake run backwards. What changes is the range, not the roll: food used to appear anywhere on
 * a twenty-wide map and now spills out of a thing you can see.
 */
export const HATCH_SCATTER = 2;

/** The column a dropped piece lands in — within `HATCH_SCATTER` of the hatch, clamped to the map. */
export function hatchLanding(cols: number, rand: () => number = worldRand): number {
  const span = HATCH_SCATTER * 2 + 1;
  const raw = HATCH_TILE.tileX - HATCH_SCATTER + Math.floor(rand() * span);
  return Math.max(0, Math.min(cols - 1, raw));
}

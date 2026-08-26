/**
 * The ground's bank (BACKLOG-504) — where a zone's gathered pile is a thing you can stand next to.
 *
 * The per-zone stockpile (285 → 328) has been load-bearing since cycle 285: it pays the upkeep bill, funds
 * a mend, stakes a seat in the ballot (492), fills toward the granary's raised cap (454), and rides along
 * with a courier (447). Its whole on-screen existence was one line of text inside the zone-map lens. A dino
 * carried a stone across a ground — which is the entire point of 328 — and the stone became an integer in a
 * menu, one screen away from the ground it describes.
 *
 * So each ground gets a **bank tile**, and the heap standing on it steps with `pileTotal`. Pure: the tile
 * and the step function live here, `WorldScene` owns the sprite.
 */

import type { Stockpile } from './resource';
import { pileTotal } from './resource';

/**
 * The bank sits on the **same tile on every ground**, on purpose: the player learns one place and can then
 * find the bank anywhere, the way `H` is one key everywhere. It is grass on all five grounds and clear of
 * every fixture the park pins — the bowl's NW waterhole and its huddle tile, the grove's NE pond, its mid
 * trail and the founding ruin, the Fernreach's west creek and its scrub bands, the Hollow's centre-south
 * pool and fen rim, the Ridge's switchback columns and its SW tarn. `cycle-141-bank.test.ts` asserts that
 * against `zoneTileAt` for every ground in `zoneChain()`, so a future terrain edit that grows a pond over
 * this tile fails a test rather than drowning the heap.
 */
export const BANK_TILE = { tileX: 16, tileY: 11 } as const;

export type PileStep = 0 | 1 | 2 | 3;

/**
 * The totals at which the heap reaches step 1, 2 and 3.
 *
 * Chosen to sit *around* the founding state rather than above it (the CHARTER v7 corollary read forwards).
 * The Grove ships with `{ stone: 2 }` — enough to mend the founding ruin with a unit to spare — which is
 * **step 2**, a heap standing on the ground the moment a new player walks one edge east; `REPAIR_COST` is 1,
 * so watching Bramble put the ruin back up knocks the heap down a step in the same minute. Step 3 sits at 4,
 * below `STOCKPILE_SOFT_CAP` (6), so a well-gathered ground actually reaches its full heap instead of
 * capping out one short of it.
 */
export const PILE_STEPS = [1, 2, 4] as const;

/** How full a ground's heap looks, from its banked total. */
export function pileStep(total: number): PileStep {
  if (total >= PILE_STEPS[2]) return 3;
  if (total >= PILE_STEPS[1]) return 2;
  if (total >= PILE_STEPS[0]) return 1;
  return 0;
}

/** A ground's heap step, straight from its pile. */
export function bankStep(pile: Stockpile): PileStep {
  return pileStep(pileTotal(pile));
}

/**
 * The prop key for a heap step — `pile_1` / `pile_2` / `pile_3`, or null at step 0 (nothing banked, nothing
 * drawn). The rigs are BACKLOG-506; until they exist `bakePropArt` resolves nothing and the scene falls back
 * to the stone glyph repeated per step, the same per-item fallback 490/494/496/502 all ship.
 */
export function pileArtKey(step: PileStep): string | null {
  return step === 0 ? null : `pile_${step}`;
}

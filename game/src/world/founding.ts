/**
 * The founding state of a brand-new park (CHARTER v7).
 *
 * The charter's corollary to the reachability bar: *constants are not tuned to be dormant.* `upkeep.ts`
 * describes its own founding calibration as a virtue — one landmark per ground, so a fresh park owes
 * nothing and nothing is ever derelict — which meant that in the entire life of a new save, the disrepair
 * system (480), its gathering lean (485) and now the mend job (488) could not be observed at all. The
 * founding park has to *exercise* the systems the park has built, so it now ships with a ruin on it.
 *
 * One fallen cairn in the Grove, and enough stone in the Grove's pile to put it back up. The Grove is one
 * edge from where the player spawns, Bramble and Pip live there (CHARTER v7's spread cast), and a derelict
 * landmark owes no upkeep — so the ruin costs the ground nothing and is purely an invitation. The first
 * structure a new player ever walks up to is a broken one, and within a minute somebody mends it.
 *
 * Pure data (no Phaser): the scene seeds this on the `!save` branch only. It writes ordinary `cairns` and
 * `stockpileByZone` entries, so it round-trips through the existing save fields with no version bump, and
 * a restored save seeds nothing.
 */

import { GROVE_ID } from './zones';
import type { Stockpile } from './resource';

/**
 * The founding ruin: a toppled cairn on the Grove's west side. Grass by `groveTileAt` (the pond is the NE
 * block x∈[15,18] y∈[2,4]; the trail is the two middle rows), clear of both, and a few tiles from where
 * Bramble wakes up — so the nearest-resident pick has an obvious answer and a short walk.
 */
export const FOUNDING_RUIN = { zone: GROVE_ID, tileX: 4, tileY: 10 } as const;

/**
 * What the founding grounds start with in the pile. Only the Grove is stocked, and only enough to cover
 * `REPAIR_COST` with a unit to spare — the point is that the ruin is *mendable*, not that the Grove starts
 * rich. `cycle-136-founding.test.ts` pins this against the repair cost: if a later tuning pass drops the
 * pile below what a mend costs, the founding beat goes unreachable again and that test says so out loud.
 */
export const FOUNDING_PILES: Record<string, Stockpile> = {
  [GROVE_ID]: { stone: 2 },
};

/**
 * Scarcity moves the herd (BACKLOG-450) — the mirror of the goods economy for *mouths*. The demand read
 * (438) and the food flow (447) push resources toward need; this pushes bodies toward plenty. Migration
 * used to pick its destination with a coin flip across the adjacency table and pick *who* leaves off
 * grove-news and homesickness alone — nothing about a zone's health made a dino leave it, nothing about a
 * neighbour's plenty made a dino head there. These pure reads fold the two signals the park already derives
 * — the prosperity index (428) and the per-zone food store (446) — into one "appeal" per zone, off which
 * the migration decision biases: mouths move toward plenty, and want empties the poorest zone first.
 *
 * Pure (no Phaser): the fold and the two picks are decided here and unit-tested. WorldScene gathers the live
 * prosperity/food reads and drives `maybeMigrate`/`pickMigrant` through these.
 */

/** How much a unit of banked food counts toward a zone's appeal, relative to a point of prosperity index.
 *  The calibration knob: 1 keeps a full pantry (≤6/kind) a real but not dominant pull beside the built-up
 *  prosperity score (structures×3 + heads×2 + harvested + stockpile). Tune here, not at the call sites. */
export const FOOD_APPEAL_WEIGHT = 1;

/**
 * A zone's appeal to a mouth seeking plenty (BACKLOG-450): its prosperity index plus its banked food. Both
 * inputs are already ≥ 0 and monotonic (a richer zone and a fuller pantry both raise appeal), so appeal is
 * too — raising either signal never makes a zone less appealing.
 */
export function zoneAppeal(prosperity: number, food: number): number {
  return prosperity + food * FOOD_APPEAL_WEIGHT;
}

/**
 * The most appealing of a zone's neighbours (BACKLOG-450) — where a scarcity-driven migrant heads. Mouths
 * move toward plenty: the neighbour with the highest appeal wins. **Deterministic** — a strict `>` means the
 * first neighbour in the input order wins a tie (stable, `ZONE_LINKS` order), never a coin flip, because a
 * weighted-random destination pick is exactly the parallel-load flake shape BACKLOG-456 catalogues. `null`
 * for an empty neighbour list.
 */
export function richestNeighbor(neighbors: string[], appealOf: (zone: string) => number): string | null {
  let best: string | null = null;
  let bestAppeal = -Infinity;
  for (const zone of neighbors) {
    const appeal = appealOf(zone);
    if (appeal > bestAppeal) {
      bestAppeal = appeal;
      best = zone;
    }
  }
  return best;
}

/**
 * The candidates that live in the least-appealing occupied zone (BACKLOG-450) — a resident of the poorest,
 * emptiest-pantry ground is likeliest to walk out, so want empties out. Returns *all* residents tied at the
 * minimum appeal (the caller still picks among them at random, so which of the equally-poor leaves stays
 * varied), the full input when every zone ties, and the input unchanged for ≤ 1 candidate. Pure.
 */
export function poorestResidents<T>(
  candidates: T[],
  zoneOf: (c: T) => string,
  appealOf: (zone: string) => number,
): T[] {
  if (candidates.length <= 1) return candidates;
  let minAppeal = Infinity;
  for (const c of candidates) minAppeal = Math.min(minAppeal, appealOf(zoneOf(c)));
  return candidates.filter((c) => appealOf(zoneOf(c)) <= minAppeal);
}

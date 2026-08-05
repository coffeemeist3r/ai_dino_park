/**
 * Distance on the chain (BACKLOG-475) — the park learns how far apart its grounds are.
 *
 * Adjacency (084/383/449) is a flat neighbour list, which was indistinguishable from "the whole park" while
 * the chain was three long and every zone bordered the middle. At four it isn't, and the gap it hides is
 * sharper than a missing feature: the two migration **pulls** this studio shipped last — word of plenty
 * (458) and a ground you come to miss (362) — each compute what a dino wants and then *throw the answer
 * away* when it isn't adjacent. A dino standing in the bowl cannot miss the Hollow.
 *
 * This is the derived read that fixes that, and it is derived on purpose: hops come out of `ZONE_LINKS` by
 * breadth-first walk, so there is no second table to keep in sync with the first (the 449 lesson). A fifth
 * ground is still a row.
 *
 * The multi-hop walk needs no path state and nothing persisted: each migration roll re-reads the pull and
 * takes one more step toward it, so a dino crossing the park is the existing per-roll decision applied
 * again. If what it wants changes on the way, it changes course — which is the honest behaviour.
 *
 * Pure TypeScript (no Phaser, no `Math.random()` — the BACKLOG-456 rule against randomness in a migration
 * decision): Node-testable.
 */

import { zoneNeighbors } from './zones';

/**
 * Hops from `from` to every zone it can reach, `from` → 0. Breadth-first over the link graph, neighbours
 * walked in `ZONE_LINKS` order, so the result is deterministic without a sort. An unknown id yields just
 * `{ [from]: 0 }` — it reaches nothing, which is what every caller below wants it to mean.
 */
export function hopDistances(from: string): Record<string, number> {
  const dist: Record<string, number> = { [from]: 0 };
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i];
    for (const link of zoneNeighbors(cur)) {
      if (dist[link.to] !== undefined) continue;
      dist[link.to] = dist[cur] + 1;
      queue.push(link.to);
    }
  }
  return dist;
}

/** Hops between two grounds, or null when `b` is unreachable from `a` (an unknown id included). */
export function hopsBetween(a: string, b: string): number | null {
  return hopDistances(a)[b] ?? null;
}

/**
 * The neighbour of `from` to walk to next on the way to `to` — one ground closer, every roll, until the
 * dino is standing in it.
 *
 * **`hopToward(a, b) === b` whenever `b` borders `a`.** That identity is what makes every pre-475 call site
 * byte-identical: a pull toward the ground next door still returns that ground, and only a pull toward a
 * ground further off (which used to return nothing at all) returns something new.
 *
 * null for the same zone, an unreachable target, or an unknown id. Deterministic: the first neighbour in
 * `ZONE_LINKS` order that is genuinely closer wins, so a future branching map picks a stable path rather
 * than a coin-flipped one.
 */
export function hopToward(from: string, to: string): string | null {
  if (from === to) return null;
  const dist = hopDistances(from);
  const total = dist[to];
  if (total === undefined) return null;
  for (const link of zoneNeighbors(from)) {
    if (hopsBetween(link.to, to) === total - 1) return link.to;
  }
  return null;
}

/**
 * The nearest of `candidates` that satisfies `ok` — fewest hops from `from` wins, input order breaks a tie,
 * `null` when nothing qualifies. `from` itself never qualifies (you are not a place you can travel to).
 *
 * The shape the cross-zone reads want: "the nearest ground that still has room / still grows what I lack",
 * rather than the merely-largest one somewhere across the park.
 */
export function nearestQualifying(
  from: string,
  candidates: readonly string[],
  ok: (zone: string) => boolean,
): string | null {
  const dist = hopDistances(from);
  let best: string | null = null;
  let bestHops = Infinity;
  for (const zone of candidates) {
    if (zone === from || !ok(zone)) continue;
    const hops = dist[zone];
    if (hops === undefined) continue;
    if (hops < bestHops) {
      bestHops = hops;
      best = zone;
    }
  }
  return best;
}

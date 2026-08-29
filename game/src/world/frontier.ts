/**
 * The unsettled ground (BACKLOG-474) — a ground nobody has ever lived on, and the way the herd finds it.
 *
 * 472 added a fourth zone as data and proved nine cross-zone systems meet it untouched. What it could not
 * prove is that anyone ever *arrives*: an empty ground's prosperity is 0 by construction (structures×3 +
 * heads×2 + harvested + stockpile), the destination pick takes the **highest** appeal, so the emptiest
 * ground in the park is the one place migration will never send anyone. The chain could grow and the growth
 * was inert.
 *
 * The fix is a tier, not a weight. `zoneAppeal` is documented monotonic in plenty and is also read by
 * `poorestResidents` to decide *who* leaves; a frontier bonus folded in there would quietly make the empty
 * ground's (nonexistent) residents look rich. So the frontier lives in the destination pick alone.
 *
 * "Unsettled" is deliberately stricter than "empty": no residents **and** never founded. A ground that
 * hollows out later keeps its pioneer forever, so it reads as *hollowed* — a place people left — and
 * never again as a frontier nobody has seen. Exactly one ground in the park can be unsettled at a time
 * today, and it can only stop being unsettled once.
 *
 * Pure TypeScript (no Phaser): Node-testable. WorldScene supplies the live head counts and the pioneer map.
 */

import { theZone } from './zones'; // BACKLOG-499

/**
 * Is this ground unsettled — nobody living there, and nobody has ever set foot on it? Every argument is
 * derivable at the call site (`zonePopulations`, `pioneerOf`), so this module owns no state.
 *
 * Two clauses, and it used to be three. The third was an `isOrigin` flag naming the bowl, because 343
 * records a pioneer at *arrival* and nothing recorded one at spawn — so the ground the cast began on had
 * no founder and, once emptied by migration, read as a place nobody had ever lived. BACKLOG-512 deleted
 * that flag by making the record true instead: `foundingPioneers` (founding.ts) records a founding as a
 * founding, for every ground the roster wakes on. The rule stopped being *which id the save calls home*
 * and became *what the history says* — which matters because CHARTER v7's spread cast put residents on
 * five grounds at boot and the flag only ever excused one of them.
 */
export function isUnsettled(heads: number, pioneer: string | undefined): boolean {
  return heads === 0 && !pioneer;
}

/**
 * The other empty ground (BACKLOG-512): nobody lives here **and** somebody once did. The exact complement
 * of `isUnsettled` within "no heads", so the two can never both be true and an empty ground always reads
 * as one of them.
 *
 * Distinct from `isDeclining` (460) on purpose: declining is a *live* hollowing, a ground below its peak
 * but still holding the floor, and it is a modifier on a prosperity tier. This is a ground at zero, where
 * the tier says nothing worth reading — so, like the unsettled badge, it replaces the line rather than
 * decorating it.
 */
export function isHollowed(heads: number, pioneer: string | undefined): boolean {
  return heads === 0 && !!pioneer;
}

/**
 * The unsettled neighbour a migrant heads for, or null when every neighbour is inhabited. **First match**
 * in input order (`ZONE_LINKS` order at the call site), never a random pick: `richestNeighbor` set that
 * precedent with its strict `>`, and BACKLOG-456 catalogues what `Math.random()` in a migration decision
 * costs the e2e suite.
 */
export function unsettledNeighbor(
  neighbors: readonly string[],
  unsettled: (zone: string) => boolean,
): string | null {
  return neighbors.find((z) => unsettled(z)) ?? null;
}

/**
 * The founder's own memory of settling a ground nobody had lived on. Written in the dino's frame (343's
 * ticker line names it in the third person). First-hand like any lived memory, but carrying **no other
 * system's token** — the `pondSwapMemory` hazard: a memory that merely *looks* like grove news or word of
 * plenty gets re-spread by the cascade rung that owns that token.
 */
export function settleMemory(zoneName: string): string {
  return `🌱 first to settle ${theZone(zoneName)}`;
}

/** The bubble the founder floats as it arrives on ground nobody has stood on. */
export function settleLine(): string {
  return '🌱 …nobody lives here.';
}

/** The ticker line, posted just after 343's founding line — the founding made a settlement. */
export function settleEvent(name: string, zoneName: string): string {
  return `🌱 ${name} settles ${theZone(zoneName)} — nobody has ever lived here`;
}

/** The zone-map lens read for an unsettled ground. Lives with its rule, the way `declineGlyph` lives in
 *  decline.ts: an empty ground has no prosperity worth reading, so this replaces the tier badge rather
 *  than sitting beside it. */
export const UNSETTLED_BADGE = '· unsettled ·';

/** The zone-map lens read for a ground everybody has left (BACKLOG-512). Sits beside its own rule, exactly
 *  as `UNSETTLED_BADGE` does — the two are read by the same three-way branch and are wrong apart. */
export const HOLLOWED_BADGE = '· hollowed ·';

/** The one-off ticker line the first time a founded ground empties. It names the founder because that is
 *  the fact the record now holds, and because it is what tells this beat from the frontier's. */
export function hollowedLine(zoneName: string, founder: string): string {
  return `🕸️ ${theZone(zoneName)} stands empty — ${founder} settled it, and nobody is left`;
}

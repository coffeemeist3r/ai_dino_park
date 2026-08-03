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
 * hollows out later keeps its pioneer forever, so it reads as *declining* (460) — a place people left — and
 * never again as a frontier nobody has seen. Exactly one ground in the park can be unsettled at a time
 * today, and it can only stop being unsettled once.
 *
 * Pure TypeScript (no Phaser): Node-testable. WorldScene supplies the live head counts and the pioneer map.
 */

/**
 * Is this ground unsettled — nobody living there, and nobody has ever set foot on it? Every argument is
 * derivable at the call site (`zonePopulations`, `pioneerOf`, the origin id), so this module owns no state.
 *
 * `isOrigin` is the mirror of 343's construction: a pioneer is recorded at *arrival*, and nothing records
 * one at spawn, so the ground the cast began on has no pioneer and never will. Without this the bowl —
 * emptied by migration, as the cycle-109 specs deliberately arrange — would read as a place nobody has
 * ever lived, which is the one thing it certainly is not. An emptied origin is a *hollowed* ground (460),
 * exactly like an emptied grove.
 */
export function isUnsettled(heads: number, pioneer: string | undefined, isOrigin = false): boolean {
  return heads === 0 && !pioneer && !isOrigin;
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
  return `🌱 first to settle ${zoneName}`;
}

/** The bubble the founder floats as it arrives on ground nobody has stood on. */
export function settleLine(): string {
  return '🌱 …nobody lives here.';
}

/** The ticker line, posted just after 343's founding line — the founding made a settlement. */
export function settleEvent(name: string, zoneName: string): string {
  return `🌱 ${name} settles ${zoneName} — nobody has ever lived here`;
}

/** The zone-map lens read for an unsettled ground. Lives with its rule, the way `declineGlyph` lives in
 *  decline.ts: an empty ground has no prosperity worth reading, so this replaces the tier badge rather
 *  than sitting beside it. */
export const UNSETTLED_BADGE = '· unsettled ·';

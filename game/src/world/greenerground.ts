/**
 * Left for greener ground (BACKLOG-457) — the voice on scarcity migration (450). When a dino's crossing
 * carried it toward a *richer* neighbour, it left for a reason; this is that reason, in its own memory. The
 * trace rides the existing `recall → recentMemory → greet` path (like the 451 courier's pride and the 452
 * homecoming), so the dino greets a beat later naming the ground it left — a scarcity move stops being a
 * silently-repositioned sprite and becomes a choice with a reason. Twin of `courierMemory`/`courierLine`.
 *
 * Pure: WorldScene fires the beat in `crossDino` only on a scarcity-tagged crossing (dest richer than home).
 */

/** The memory a dino files when it leaves a poor zone for a richer one (BACKLOG-457) — names the ground it
 *  left, so the reason surfaces in its next greeting. No leading article: two of three zone names carry
 *  their own ("The Grove"), the `storesFedLine` trap. */
export function greenerGroundMemory(leftZoneName: string): string {
  return `${leftZoneName}'s pantry ran dry, so you went where the food is`;
}

/** The departure bubble shown over a dino leaving for greener ground (BACKLOG-457). */
export function greenerGroundLine(): string {
  return '🍃';
}

/**
 * Come for the plenty (BACKLOG-459) — the far side of scarcity migration. 450 moves a mouth toward plenty,
 * 457 gives it a reason it left (the 🍃 greener-ground beat), 458 lets the plenty gossip ahead of the body.
 * But the ground it *arrives* at has stayed silent: a migrant walks into a richer zone and reads as a sprite
 * that reappeared on the far edge. This is the answer back — the nearest resident sizes up the newcomer with
 * a wry welcome and a small bond forms over it. The mirror of 452's homecoming welcome (same crossDino seam,
 * same nearest-resident greeter, same `strengthen`), but sardonic: a newcomer come for the food, not a
 * returner come home.
 *
 * Pure TypeScript (no Phaser, no AI — the NPCBrain boundary is untouched, this is deterministic): the line,
 * event, and both traces run in Node. WorldScene fires it in `crossDino`, inside the existing
 * `reason === 'scarcity' && !homecoming` guard the greener-ground beat already uses. Twin of `belonging.ts`.
 */

/** The bond a wry welcome is worth — small, matching 452's `WELCOME_BOND`: a nod at the edge, not a meal. */
export const PLENTY_WELCOME_BOND = 2;

/** The wry bubble the resident floats at a plenty-migrant. Deliberately distinct from 452's `🏡` welcome-home
 *  string — this is 😏, a newcomer sized up, not a friend welcomed back. */
export function plentyWelcomeLine(): string {
  return '😏 Come for the plenty, have you?';
}

/** The ticker line for the wry welcome. */
export function plentyWelcomeEvent(resident: string, migrant: string): string {
  return `👋 ${resident} sized up ${migrant}, come for the plenty`;
}

/** The trace the resident keeps — surfaces in a later greeting via recall. No leading article (two of three
 *  zone names carry their own, the `storesFedLine` trap). */
export function plentyWelcomeMemory(migrant: string, zoneName: string): string {
  return `you gave ${migrant} a wry welcome to ${zoneName}`;
}

/** The trace the migrant keeps — being sized up on arrival colours its next greeting. */
export function plentyWelcomedMemory(zoneName: string): string {
  return `${zoneName} sized you up when you came for the food`;
}

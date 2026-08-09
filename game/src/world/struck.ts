/**
 * Still full of the place it left (BACKLOG-347) — the short window after a crossing in which a dino
 * hasn't shaken off the ground it came from.
 *
 * 362 gave the park a clock on the far end of leaving: a ground you have been away from long enough starts
 * calling you back. This is the *near* end of the same journey. A crossing dino files the ground it just
 * left (which rides `recall → recentMemory → greet`, so its next greeting is coloured by where it's been)
 * and, for a roll or two, floats that ground's keepsake glyph — a glance back the way it came — before the
 * place wears off and it belongs where it is.
 *
 * The item was written at cycle 75 as "grove-struck", when the grove was the only other place to come back
 * from. At four grounds that is one case of four, so the beat keys on **whichever** ground the dino left:
 * one glyph table, and a fifth ground is a row.
 *
 * No new clock. Tenure (341) already counts migration rolls in the current zone and already resets on every
 * crossing, so `isStruck` is a read of state the park keeps anyway.
 *
 * Pure TypeScript (no Phaser): Node-testable. WorldScene owns the map, the crossing seams, the bubble and
 * the save.
 */

/** dino → the ground it last crossed *out* of. Its own small record (the `LeftDays` precedent), not a
 *  widening of `SeenZones` or `roots`. */
export type CameFrom = Record<string, string>;

/** Migration rolls the place stays with a dino. The calibration knob: 2 rolls ≈ 3 real minutes at the
 *  90 s migration cadence — long enough to catch, short enough that it reads as a passing feeling. */
export const STRUCK_ROLLS = 2;

/**
 * One keepsake glyph per ground — what a dino carries away from that place in its head. The bowl's open
 * grass, the grove's leaf, the Fernreach's dry scrub, the Hollow's damp. Deliberately *not* each zone's
 * crop or its water landmark: this is the place as a memory, not as a resource.
 */
export const KEEPSAKE: Record<string, string> = {
  bowl: '🌾',
  grove: '🌿',
  fernreach: '🍂',
  hollow: '🌫',
  ridge: '🪨', // BACKLOG-478 — a chip of the high ground
};

/** The glyph for a ground; an unknown id falls back to the leaf — the "floor is always whole" seam every
 *  zone-keyed table in this project keeps, so a new zone can never blank the beat. */
export function keepsakeGlyph(zoneId: string): string {
  return KEEPSAKE[zoneId] ?? '🌿';
}

/** Record that `name` has just crossed out of `zone`. Overwrites: what matters is the last place it left. */
export function markCameFrom(map: CameFrom, name: string, zone: string): void {
  map[name] = zone;
}

/** Forget where it came from (unused by the crossing path, which always overwrites — the seam for a caller
 *  that needs to end the window early). */
export function clearCameFrom(map: CameFrom, name: string): void {
  delete map[name];
}

/**
 * Is this dino still full of the place it left: it came from somewhere, and it has held its new ground for
 * fewer than `window` rolls. A dino that has never crossed is never struck, however fresh its tenure.
 *
 * A **homecoming** (452) restores tenure to `SETTLE_ROLLS`, so a dino walking back into the ground it
 * belongs to reads false here — it is home, not visiting. That fall-out is deliberate: the 🏡 beat owns
 * that moment, and two beats claiming one crossing would read as a stutter.
 */
export function isStruck(rolls: number, from?: string, window: number = STRUCK_ROLLS): boolean {
  return !!from && rolls < window;
}

/**
 * The stable tell that a remembered line is this beat. Carries no other system's token — a memory that
 * merely *looks* like grove news (`groveNewsMemory`) or word of plenty (`PLENTY_TOKEN`) gets re-spread by
 * the cascade rung that owns that token, the hazard 362's header names and this one is pinned against.
 */
export const STRUCK_MARK = '🍃 still full of ';

/** The memory the arriving dino files, naming the ground it left. No leading article — two zone names
 *  already carry their own ("The Grove"), the `storesFedLine` trap. */
export function struckMemory(zoneName: string): string {
  return `${STRUCK_MARK}${zoneName}`;
}

/** The bubble floated over a still-struck dino: the keepsake glyph of the ground it came from. */
export function struckLine(glyph: string): string {
  return glyph;
}

/** The ticker line, logged once per crossing (not once per float). */
export function struckEvent(name: string, zoneName: string, glyph: string): string {
  return `${glyph} ${name} keeps glancing back toward ${zoneName}`;
}

/** How it reads in the collection book while the window is open. */
export function struckBookLine(zoneName: string): string {
  return `just back from ${zoneName}`;
}

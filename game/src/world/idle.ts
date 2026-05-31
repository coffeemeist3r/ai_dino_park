/**
 * Idle / ambient mode (BACKLOG-060) — the vivarium as a quiet desktop companion.
 * After a stretch with no input the HUD fades away and the camera breathes, leaving
 * just the bowl and its life; any key or click snaps everything back. Pure (no Phaser):
 * the fade curve + idle test live here; WorldScene tracks input and applies them.
 */

export const IDLE_AFTER_MS = 12_000; // no input this long → go ambient
export const FADE_MS = 1_500; // HUD fade duration once ambient begins
export const AMBIENT_ALPHA = 0.12; // HUD opacity at full ambient (not fully gone, so it's findable)

/** Has the bowl been idle long enough to enter ambient mode? */
export function isIdle(idleMs: number): boolean {
  return idleMs >= IDLE_AFTER_MS;
}

/** HUD opacity for a given idle duration: full until idle, then eases to AMBIENT_ALPHA over FADE_MS. */
export function hudAlpha(idleMs: number): number {
  if (idleMs <= IDLE_AFTER_MS) return 1;
  const t = Math.min(1, (idleMs - IDLE_AFTER_MS) / FADE_MS);
  return 1 + t * (AMBIENT_ALPHA - 1); // lerp 1 → AMBIENT_ALPHA
}

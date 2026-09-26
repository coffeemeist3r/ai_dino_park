/**
 * The bowl gets acoustic space (BACKLOG-206) — how much of a call survives the walk to the keeper.
 *
 * Until now the park had exactly one loudness per kind of call. `gainFor` answered from a table and
 * nothing else could influence it, so a dino crying out from the far corner of the ground and a dino
 * chirping at your elbow arrived at the identical level, and where the keeper chose to stand had
 * never once changed what the keeper heard. Last cycle's bus (559) named this arc in its own header
 * as the one the seam was built for; this is that arc.
 *
 * Pure: no Phaser, no WebAudio, no scene. Vitest runs it in Node. The scene measures the distance
 * and hands over a scalar; this module owns only the curve.
 */

/** Inside this, you are standing with it and it is as loud as it has ever been. 3 tiles. */
export const NEAR_PX = 96;

/**
 * At and past this, a call is as faint as it gets. 14 tiles.
 *
 * Sized against the ground the player actually walks: the map is 20x15 at 32 px, so 640x480, and the
 * floor is reached about two thirds of the way across. A curve calibrated to bottom out past the
 * far wall would be a falloff the park could never demonstrate — which CHARTER v7's corollary calls
 * a defect, not a subtlety.
 */
export const FAR_PX = 448;

/**
 * The floor, and it is deliberately well above zero.
 *
 * A call that fades to nothing is a beat the player cannot know they missed, and this cycle's other
 * track (BACKLOG-204) exists precisely to make far-off trouble *findable*. The two must not fight:
 * a cry from the far corner is faint and still there. Silence is not distance, it is a lost event.
 */
export const FAR_LEVEL = 0.35;

/**
 * The 0-1 multiplier a call made `distPx` away from the keeper survives at.
 *
 * Bad input returns 1 rather than a quiet call: a `NaN` distance should make the park sound wrong in
 * a way somebody notices, not make it silently swallow its own voices.
 */
export function distanceGain(distPx: number): number {
  if (!Number.isFinite(distPx) || distPx <= NEAR_PX) return 1;
  if (distPx >= FAR_PX) return FAR_LEVEL;
  const w = (distPx - NEAR_PX) / (FAR_PX - NEAR_PX);
  return 1 - (1 - FAR_LEVEL) * w;
}

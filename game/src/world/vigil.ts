/**
 * The vigil at the hatch (BACKLOG-121) — somebody is already waiting when you open the park.
 *
 * Milestone 17's last open arc owes one sentence: *a dino awake at the wrong hour is doing something* — and
 * after cycle 148 the arc named the specific debt out loud, **an owl doing something a day-dino would not,
 * rather than the same behaviour under a different sky.** BACKLOG-109 split the cast into two sets of hours
 * and 524 taught the grounds to notice; neither gave a dino anything to *do* with being the one who is up.
 *
 * This does. The park learns the real hour you tend to open it, and around that hour a waking resident of
 * the ground you are looking at walks to the hatch and stands there.
 *
 * **There is no `'owl'` in this file, and there must never be one.** That was 524's lesson, arrived at the
 * hard way: making a beat the property of a *trait* rather than of an *hour* switches it off for the eight
 * hours a day that trait is asleep, and makes it a label instead of a behaviour. The filter is `atRest`,
 * applied by the caller, and the chronotype falls out of the clock. Come back at the founding hour and the
 * Bowl's vigil is one of its four day-dinos, because Rex — the Bowl's owl — is face-down in the dirt. Come
 * back while the park is dark and Rex is the only resident who *can* be standing there. Same rule, opposite
 * halves of the roster, no branch that knows either word.
 *
 * **Friendship grades this; it does not gate it.** The item as filed says *a very-high-friendship dino*, and
 * shipped literally that is an invisible feature: a fresh save's friendship book is empty, so the item's own
 * gate is a gate nothing passes on the first frame, and the park would carry a system that switches on some
 * hours after CHARTER v7's bar stops watching. So the fondest waking dino keeps the vigil, and with nobody
 * yet fond, name order decides — and the warmth of what it says is graded by hearts, the way `homecoming.ts`
 * grades its welcome-back.
 *
 * Pure TypeScript: no Phaser, no clock, no randomness. Every hour is a parameter, so this is Node-testable
 * and the scene owns the errand state and the walk — exactly as `mending.ts` owns the mend's words and
 * WorldScene owns its legs.
 */

/**
 * How many visits the history keeps. Small on purpose: a keeper whose habits change should be *believed*
 * within a week or so of visits, not out-voted by a month of an old routine. Newest kept, oldest dropped.
 */
export const VISIT_HISTORY_MAX = 8;

/**
 * Sightings needed before the park will claim to know your hour. Two rather than one, and the difference is
 * the whole feature: at one, somebody is waiting at the glass *every* time you open the park, which is a tic
 * and is also just the homecoming (112) wearing a different glyph. At two, the park can be **wrong** — come
 * back at an hour you have never come back at and the hatch is empty, which is what makes the times it is
 * right feel like anticipation instead of a greeting.
 */
export const MIN_VISITS = 2;

/** How near your usual hour counts as "about then". One hour either side, so the dial's own resolution. */
export const VIGIL_WINDOW = 1;

/** The mark the waiting dino wears, and the rig key BACKLOG-526 will draw it against — declared together,
 *  the way `chronotype.ts` declares its two hour-marks beside the glyphs they replace. */
export const VIGIL_GLYPH = '👀';
export const VIGIL_ART_KEY = 'vigil';

/**
 * Steps the errand gets. Sized as the mend's is (`MEND_STEPS`): `stepToward` moves one axis per step, so a
 * corner-to-corner crossing of the 20×15 map costs ~33 and this covers the ordinary case with room. The
 * budget is the safety valve, not the schedule.
 */
export const VIGIL_STEPS = 40;

/** Wall-clock gate between dispatches, on the 333 primitive — so the cadence holds at either clock rate. */
export const VIGIL_COOLDOWN_MS = 30_000;

/** The live errand: who is walking to the glass, on which ground, with how much budget left. */
export interface Vigil {
  keeper: string;
  zone: string;
  steps: number;
}

/** One waking candidate, as the scene hands them over: a name and what it is worth to the keeper. */
export interface VigilCandidate {
  name: string;
  friendship: number;
}

/** Record a visit at this local hour. Newest last, capped — the oldest sighting falls off the front. */
export function noteVisit(hours: readonly number[], hour: number): number[] {
  return [...hours, hour].slice(-VISIT_HISTORY_MAX);
}

/**
 * The hour you usually come back, or `null` when the history cannot support the claim.
 *
 * The mode, not the mean: a keeper who visits at 09:00 most mornings and once at 23:00 comes back *at nine*,
 * and an average would answer half past three — an hour they have never once opened the park at. Ties go to
 * the smaller hour so the answer is deterministic, which matters because a spec asserts it.
 */
export function habitualHour(hours: readonly number[]): number | null {
  const counts = new Map<number, number>();
  for (const h of hours) counts.set(h, (counts.get(h) ?? 0) + 1);
  let best: number | null = null;
  let bestCount = 0;
  for (const [hour, count] of [...counts.entries()].sort((a, b) => a[0] - b[0])) {
    if (count > bestCount) {
      best = hour;
      bestCount = count;
    }
  }
  return bestCount >= MIN_VISITS ? best : null;
}

/** Distance between two hours on a 24-hour dial, so 23 and 0 are one apart rather than twenty-three. */
export function hoursApart(a: number, b: number): number {
  const d = Math.abs(((a - b) % 24) + 24) % 24;
  return Math.min(d, 24 - d);
}

/** Is now about the hour this keeper usually turns up? */
export function isAnticipating(hours: readonly number[], hour: number): boolean {
  const usual = habitualHour(hours);
  return usual !== null && hoursApart(usual, hour) <= VIGIL_WINDOW;
}

/**
 * Who keeps the vigil. **Callers pass only residents who are awake** — that filter is where the whole
 * chronotype read lives, and it is deliberately not this function's business.
 *
 * The fondest wins; ties, including the all-zero book a fresh save ships, go to name order.
 */
export function vigilKeeper(candidates: readonly VigilCandidate[]): string | null {
  let best: VigilCandidate | null = null;
  for (const c of candidates) {
    if (!best || c.friendship > best.friendship || (c.friendship === best.friendship && c.name < best.name)) {
      best = c;
    }
  }
  return best ? best.name : null;
}

/**
 * What it says when you get there, graded by hearts the way the homecoming's welcome is. A dino with no
 * bond yet is not pretending to have one — it was at the glass, it will admit that much, and no more.
 */
export function vigilLine(name: string, hearts: number): string {
  if (hearts >= 7) return `${name}: I knew it. I knew you'd come now. ${VIGIL_GLYPH}`;
  if (hearts >= 3) return `${name}: ...oh! You're early. Or I'm early. ${VIGIL_GLYPH}`;
  return `${name}: *watching the glass, in case* ${VIGIL_GLYPH}`;
}

/** What the waiting dino keeps. Written as the dino's own recollection, the `mendMemory` register. */
export function vigilMemory(): string {
  return 'you waited at the glass around the hour the keeper usually comes';
}

/** The ticker line — who went and stood there, said out loud once. */
export function vigilEventLine(keeper: string): string {
  return `${VIGIL_GLYPH} ${keeper} went to the glass and waited`;
}

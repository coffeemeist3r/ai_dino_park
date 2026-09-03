import { describe, it, expect } from 'vitest';
import { FOUNDING_DAY, FOUNDING_HOUR, WorldClock } from '../../game/src/world/clock';
import { REACHABILITY_REGISTER, castSplitAt, darkEntries, wakingAt } from '../../game/src/world/reachability';
import { foundingResidents } from '../../game/src/world/founding';

/** The whole shipping cast, and how many of them are up at an hour — both derived, neither written down. */
const cast = () => Object.values(foundingResidents()).flat();
const wakingCount = (hour: number) =>
  Object.keys(foundingResidents()).reduce((n, z) => n + wakingAt(hour, z).length, 0);
const HOURS = Array.from({ length: 24 }, (_, h) => h);

/**
 * BACKLOG-523 — the hour a save opens on.
 *
 * The opening hour was a field initialiser: written once, derived from nothing, pinned by nothing, and
 * quietly the number every day-shaped read this milestone shipped is measured from. Naming it would have
 * been 519's fix for 519's problem (a number written down twice); this number is written down once. What it
 * lacked was a **claim**, and these tests are that claim's teeth: move the hour to somewhere the cast agrees
 * with itself and the register goes red naming the item.
 *
 * Not one test below names an hour. The dark hours are *found*, so a season table move or an `OWL_SHIFT`
 * change re-derives them instead of going stale.
 */
describe('the founding hour (BACKLOG-523)', () => {
  it('opens the park exactly where it always opened it', () => {
    const t = new WorldClock().now();
    expect(t).toEqual({ day: FOUNDING_DAY, hour: FOUNDING_HOUR, minute: 0 });
  });

  it('splits the cast — somebody up, somebody down', () => {
    expect(castSplitAt(FOUNDING_HOUR)).toBe(true);
  });

  it('goes dark at the hours where the whole cast is up — and the founding hour is not one of them', () => {
    const dark = HOURS.filter((h) => !castSplitAt(h));
    const allUp = dark.filter((h) => wakingCount(h) === cast().length);
    expect(allUp.length).toBeGreaterThan(0);
    expect(dark).not.toContain(FOUNDING_HOUR);
  });

  it('and the park is never all asleep at once, at any hour, which is why only one failure mode exists', () => {
    // 523 was filed expecting two ways to break the opening hour: wake everybody, or open in the dark. The
    // first is real and the test above finds it. The second turns out **not** to be a property of the cast:
    // `OWL_SHIFT` is 8 against a rest window of about the same, so the two halves of the roster are never
    // both down, and there is no hour at which moving the constant would put every dino to sleep. Opening
    // "in the dark" is a claim about the *sky*, not about who is up — a different entry, if anybody wants it.
    // Pinned here because it is load-bearing for the vigil: some ground always has somebody awake on it.
    expect(HOURS.filter((h) => wakingCount(h) === 0)).toEqual([]);
  });

  it('is a claim the register carries, and the register is not dark', () => {
    expect(REACHABILITY_REGISTER.some((e) => e.id.includes('BACKLOG-523'))).toBe(true);
    expect(darkEntries().map((e) => e.id)).toEqual([]);
  });
});

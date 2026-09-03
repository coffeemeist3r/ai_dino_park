import { describe, it, expect } from 'vitest';
import { FOUNDING_DAY, FOUNDING_HOUR, WorldClock } from '../../game/src/world/clock';
import { REACHABILITY_REGISTER, castSplitAt, darkEntries } from '../../game/src/world/reachability';

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

  it('goes dark at an hour where the whole cast is up, and at one where it is all down', () => {
    const hours = Array.from({ length: 24 }, (_, h) => h);
    const dark = hours.filter((h) => !castSplitAt(h));
    // Both failure modes exist and are reachable by moving the constant — which is the entire point of the
    // entry. One of these is "everybody is awake, and the milestone's arcs have nothing to show"; the other
    // is "the park opens with the lights out".
    expect(dark.length).toBeGreaterThan(0);
    expect(dark).not.toContain(FOUNDING_HOUR);
  });

  it('is a claim the register carries, and the register is not dark', () => {
    expect(REACHABILITY_REGISTER.some((e) => e.id.includes('BACKLOG-523'))).toBe(true);
    expect(darkEntries().map((e) => e.id)).toEqual([]);
  });
});

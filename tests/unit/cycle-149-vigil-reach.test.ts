import { describe, it, expect } from 'vitest';
import { FOUNDING_HOUR } from '../../game/src/world/clock';
import { REACHABILITY_REGISTER, darkEntries, wakingAt } from '../../game/src/world/reachability';
import { BOWL_ID } from '../../game/src/world/zones';
import { vigilKeeper } from '../../game/src/world/vigil';
import { dayPhase } from '../../game/src/world/dayNight';

/**
 * BACKLOG-121 — who keeps the vigil, and why it is a different dino at different hours.
 *
 * This is the arc's debt written as an assertion. Milestone 17's last open arc asks for *an owl doing
 * something a day-dino would not*, and the answer this cycle ships is not a branch — it is a filter. The
 * same read, run at two hours, returns two different dinos, and the code that produced it has never heard
 * of a chronotype.
 *
 * On a fresh save the friendship book is empty, so `vigilKeeper` falls to name order, exactly as it does
 * in the scene. Nothing below names an hour except through `FOUNDING_HOUR`.
 */
const emptyBook = (names: readonly string[]) => names.map((name) => ({ name, friendship: 0 }));

describe('the vigil at the hatch (BACKLOG-121)', () => {
  it('is kept by a day-dino at the hour the park opens, because the Bowl’s owl is down', () => {
    const waking = wakingAt(FOUNDING_HOUR, BOWL_ID);
    expect(waking).not.toContain('Rex'); // the Bowl's owl, asleep on the first frame since BACKLOG-109
    expect(vigilKeeper(emptyBook(waking))).toBe('Glade');
  });

  it('is kept by the owl in the middle of the night, because nobody else can be standing there', () => {
    // The hour is *found*, not named: the first hour the park calls night at which the Bowl has exactly one
    // resident up. A season table move or an OWL_SHIFT change re-derives it instead of going stale.
    const hours = Array.from({ length: 24 }, (_, h) => h);
    const deepNight = hours.filter((h) => dayPhase(h) === 'night' && wakingAt(h, BOWL_ID).length === 1);
    expect(deepNight.length).toBeGreaterThan(0);
    for (const h of deepNight) {
      expect(vigilKeeper(emptyBook(wakingAt(h, BOWL_ID)))).toBe('Rex');
    }
  });

  it('never leaves the hatch’s ground with nobody who could keep it, on a fresh save', () => {
    expect(wakingAt(FOUNDING_HOUR, BOWL_ID).length).toBeGreaterThan(0);
  });

  it('is a claim the register carries, and the register is not dark', () => {
    expect(REACHABILITY_REGISTER.some((e) => e.id.includes('BACKLOG-121'))).toBe(true);
    expect(darkEntries().map((e) => e.id)).toEqual([]);
  });
});

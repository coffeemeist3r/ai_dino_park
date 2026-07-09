import { describe, it, expect } from 'vitest';
import {
  aloneInStrangeZone,
  inventsTic,
  TIC_AFTER_STEPS,
  TIC_AFTER_STEPS_HOMESICK,
} from '../../game/src/world/tic';

/**
 * Homesick sooner (BACKLOG-410) — a dino freshly moved *alone* into a friendless zone (not settled + no
 * in-zone bonded friend) falls into its signature tic (405) quicker than one on home ground. Pure onset read.
 */
describe('homesick-sooner tic (BACKLOG-410)', () => {
  it('aloneInStrangeZone: only fresh AND friendless reads strange', () => {
    expect(aloneInStrangeZone(false, false)).toBe(true); // unsettled + no in-zone friend
    expect(aloneInStrangeZone(true, false)).toBe(false); // settled → home ground
    expect(aloneInStrangeZone(false, true)).toBe(false); // has a friend in the zone
    expect(aloneInStrangeZone(true, true)).toBe(false);
  });

  it('the homesick onset is shorter than the plain one', () => {
    expect(TIC_AFTER_STEPS_HOMESICK).toBeLessThan(TIC_AFTER_STEPS);
  });

  it('inventsTic fires at the homesick threshold, not before', () => {
    expect(inventsTic(TIC_AFTER_STEPS_HOMESICK, TIC_AFTER_STEPS_HOMESICK)).toBe(true);
    expect(inventsTic(TIC_AFTER_STEPS_HOMESICK - 1, TIC_AFTER_STEPS_HOMESICK)).toBe(false);
    // and a strange-zone dino would NOT yet have ticced at the homesick threshold under the plain onset
    expect(inventsTic(TIC_AFTER_STEPS_HOMESICK, TIC_AFTER_STEPS)).toBe(false);
  });
});

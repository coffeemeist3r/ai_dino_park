import { describe, it, expect } from 'vitest';
import { HUDDLE_THRESHOLD, SEASON_HUDDLE, huddleThreshold, inHuddleWindow } from '../../game/src/world/huddle';
import { dayPhase } from '../../game/src/world/dayNight';
import { SEASONS } from '../../game/src/world/seasons';

const HOURS = Array.from({ length: 24 }, (_, h) => h);

describe('season-conditional huddle rules (BACKLOG-171)', () => {
  it('season omitted is the legacy cycle-18 verdict for every hour', () => {
    expect(huddleThreshold()).toBe(HUDDLE_THRESHOLD);
    for (const h of HOURS) {
      expect(inHuddleWindow(h)).toBe(dayPhase(h) === 'night');
    }
  });

  it('spring is byte-identical to the legacy verdict', () => {
    expect(huddleThreshold('spring')).toBe(HUDDLE_THRESHOLD);
    for (const h of HOURS) {
      expect(inHuddleWindow(h, 'spring')).toBe(dayPhase(h) === 'night');
    }
  });

  it('winter lowers the bar to 4 and opens the den from dusk past dawn', () => {
    expect(huddleThreshold('winter')).toBe(4);
    for (const h of HOURS) {
      const expected = h >= 19 || h < 7;
      expect(inHuddleWindow(h, 'winter'), `hour ${h}`).toBe(expected);
    }
  });

  it('summer keeps the bar at 8 but waits until late — 21:00 and 22:00 are not huddle time', () => {
    expect(huddleThreshold('summer')).toBe(HUDDLE_THRESHOLD);
    for (const h of HOURS) {
      const expected = h >= 23 || h < 4;
      expect(inHuddleWindow(h, 'summer'), `hour ${h}`).toBe(expected);
    }
    expect(inHuddleWindow(21, 'summer')).toBe(false);
    expect(inHuddleWindow(22, 'summer')).toBe(false);
  });

  it('fall lowers the bar to 6 on the unchanged spring window', () => {
    expect(huddleThreshold('fall')).toBe(6);
    for (const h of HOURS) {
      expect(inHuddleWindow(h, 'fall')).toBe(inHuddleWindow(h, 'spring'));
    }
  });

  it('table sanity: no season raises the bar above legacy, and winter has the longest window', () => {
    const windowLength = (s: (typeof SEASONS)[number]) => HOURS.filter((h) => inHuddleWindow(h, s)).length;
    for (const s of SEASONS) {
      expect(SEASON_HUDDLE[s].threshold).toBeLessThanOrEqual(HUDDLE_THRESHOLD);
      if (s !== 'winter') expect(windowLength(s)).toBeLessThan(windowLength('winter'));
    }
  });
});

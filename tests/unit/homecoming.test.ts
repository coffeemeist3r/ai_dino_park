import { describe, it, expect } from 'vitest';
import { homecoming, HOMECOMING_MIN_MINUTES } from '../../game/src/world/homecoming';
import { heartsFromPoints } from '../../game/src/social/friendship';

const LONG = HOMECOMING_MIN_MINUTES;

describe('homecoming (BACKLOG-112)', () => {
  it('picks the highest-friendship dino after a long absence', () => {
    const hc = homecoming({ Rex: 20, Sunny: 80, Glade: 50 }, LONG);
    expect(hc?.name).toBe('Sunny');
  });

  it('breaks ties alphabetically by name', () => {
    const hc = homecoming({ Twitch: 60, Glade: 60, Mossback: 60 }, LONG);
    expect(hc?.name).toBe('Glade');
  });

  it('returns null for a short absence even with a clear favorite', () => {
    expect(homecoming({ Sunny: 90 }, HOMECOMING_MIN_MINUTES - 1)).toBeNull();
  });

  it('returns null when no dino has any friendship', () => {
    expect(homecoming({}, LONG)).toBeNull();
    expect(homecoming({ Rex: 0, Sunny: 0 }, LONG)).toBeNull();
  });

  it('ignores zero/negative-point dinos when a positive one exists', () => {
    const hc = homecoming({ Rex: 0, Sunny: 0, Glade: 5 }, LONG);
    expect(hc?.name).toBe('Glade');
  });

  it('line contains the name and a 👋, and high vs low hearts differ', () => {
    const warm = homecoming({ Sunny: 90 }, LONG); // 9 hearts
    const cool = homecoming({ Sunny: 20 }, LONG); // 2 hearts
    expect(warm?.line).toContain('Sunny');
    expect(warm?.line).toContain('👋');
    expect(cool?.line).toContain('👋');
    expect(warm?.line).not.toBe(cool?.line);
  });

  it('reports hearts matching heartsFromPoints for the chosen dino', () => {
    const hc = homecoming({ Sunny: 73 }, LONG);
    expect(hc?.hearts).toBe(heartsFromPoints(73));
  });

  it('carries a non-empty homecoming memory string', () => {
    const hc = homecoming({ Sunny: 50 }, LONG);
    expect(hc?.memory).toBeTruthy();
    expect(typeof hc?.memory).toBe('string');
  });
});

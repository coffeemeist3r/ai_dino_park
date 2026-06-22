import { describe, it, expect } from 'vitest';
import { homecoming, HOMECOMING_MIN_MINUTES, JEALOUS_TIE_POINTS } from '../../game/src/world/homecoming';
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

describe('jealous nuzzle (BACKLOG-120)', () => {
  it('a near-tied runner-up gets a jealous beat naming them', () => {
    const hc = homecoming({ Sunny: 60, Glade: 55 }, LONG);
    expect(hc?.name).toBe('Sunny');
    expect(hc?.jealous?.name).toBe('Glade');
  });

  it('breaks runner-up ties alphabetically', () => {
    const hc = homecoming({ Rex: 60, Glade: 55, Mossback: 55 }, LONG);
    expect(hc?.name).toBe('Rex');
    expect(hc?.jealous?.name).toBe('Glade');
  });

  it('an exact top tie makes the alpha-loser the jealous one (gap 0)', () => {
    const hc = homecoming({ Sunny: 60, Glade: 60 }, LONG);
    expect(hc?.name).toBe('Glade'); // alpha-smallest is the homecomer
    expect(hc?.jealous?.name).toBe('Sunny');
  });

  it('a clear gap leaves no one jealous', () => {
    const hc = homecoming({ Sunny: 60, Glade: 40 }, LONG);
    expect(hc?.jealous).toBeNull();
  });

  it('threshold boundary: gap === JEALOUS_TIE_POINTS is jealous, one more is not', () => {
    const tie = homecoming({ Sunny: 60, Glade: 60 - JEALOUS_TIE_POINTS }, LONG);
    expect(tie?.jealous?.name).toBe('Glade');
    const apart = homecoming({ Sunny: 60, Glade: 60 - JEALOUS_TIE_POINTS - 1 }, LONG);
    expect(apart?.jealous).toBeNull();
  });

  it('a lone befriended dino has no runner-up to be jealous', () => {
    const hc = homecoming({ Sunny: 90 }, LONG);
    expect(hc?.jealous).toBeNull();
  });

  it('the jealous line names the runner-up and shows the 😒, memory names the homecomer', () => {
    const hc = homecoming({ Sunny: 60, Glade: 55 }, LONG);
    expect(hc?.jealous?.line).toContain('Glade');
    expect(hc?.jealous?.line).toContain('😒');
    expect(hc?.jealous?.memory).toContain('Sunny');
  });

  it('a short absence stages neither homecoming nor jealousy', () => {
    expect(homecoming({ Sunny: 60, Glade: 55 }, HOMECOMING_MIN_MINUTES - 1)).toBeNull();
  });
});

describe('in-character homecoming (BACKLOG-306)', () => {
  it('leads the welcome-back with the homecomer signature quirk', () => {
    const hc = homecoming({ Sunny: 90 }, LONG, () => 'paces');
    expect(hc?.line).toContain('Sunny');
    expect(hc?.line).toContain('paces');
    expect(hc?.line).toContain('👋');
    // the quirk leads, the spoken line follows
    expect(hc?.line.indexOf('paces')).toBeLessThan(hc!.line.indexOf('👋'));
  });

  it('only the homecomer name is looked up for the quirk', () => {
    const seen: string[] = [];
    const hc = homecoming({ Sunny: 60, Glade: 55 }, LONG, (n) => {
      seen.push(n);
      return 'hums to itself';
    });
    expect(hc?.name).toBe('Sunny');
    expect(seen).toEqual(['Sunny']); // not the jealous runner-up
  });

  it('two different quirks make visibly different lines for the same dino', () => {
    const a = homecoming({ Sunny: 90 }, LONG, () => 'paces');
    const b = homecoming({ Sunny: 90 }, LONG, () => 'peeks around timidly');
    expect(a?.line).not.toBe(b?.line);
  });

  it('with NO quirk lookup the line is byte-identical to the original tiers', () => {
    expect(homecoming({ Sunny: 90 }, LONG)?.line).toBe('Sunny: You\'re finally back! 👋'); // 9 hearts
    expect(homecoming({ Sunny: 50 }, LONG)?.line).toBe('Sunny: Welcome home! 👋'); // 5 hearts
    expect(homecoming({ Sunny: 20 }, LONG)?.line).toBe('Sunny: Oh — you\'re back. 👋'); // 2 hearts
  });

  it('a lookup that returns undefined falls back to the plain tier line', () => {
    expect(homecoming({ Sunny: 90 }, LONG, () => undefined)?.line).toBe('Sunny: You\'re finally back! 👋');
  });
});

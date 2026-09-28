import { describe, expect, it } from 'vitest';
import { bestFriend, friendLine, shiftLine, SHIFT_MARGIN } from './closest';
import { BOND_PER_MEET, meetGain, strengthen, bondPoints, type Bonds } from './bonds';
import { pairKey } from './meetings';
import { FOUNDING_BONDS, foundingBonds } from '../world/founding';
import { ROSTER } from '../entities/roster';
import { isLoner, LONER_FLOOR } from '../world/loner';

const b = (pairs: Array<[string, string, number]>): Bonds =>
  Object.fromEntries(pairs.map(([x, y, v]) => [pairKey(x, y), v]));

describe('BACKLOG-567 meetGain', () => {
  it('shrinks toward the cap', () => {
    expect(meetGain(0)).toBe(BOND_PER_MEET);
    expect(meetGain(50)).toBe(2);
    expect(meetGain(100)).toBe(0);
  });
  it('never reaches the cap, and more company reads closer', () => {
    let g: Bonds = {};
    const after: number[] = [];
    for (let i = 1; i <= 200; i++) {
      g = strengthen(g, 'A', 'B', meetGain(bondPoints(g, 'A', 'B')));
      after[i] = bondPoints(g, 'A', 'B');
    }
    expect(after[200]).toBeLessThan(100);
    expect(after[40]).toBeGreaterThan(after[10]);
  });
});

describe('BACKLOG-565 FOUNDING_BONDS', () => {
  const names = ROSTER.map((r) => r.name);
  it('only names roster dinos', () => {
    for (const [a, c] of FOUNDING_BONDS) expect(names).toContain(a), expect(names).toContain(c);
  });
  it('leaves exactly Twitch friendless', () => {
    const g = foundingBonds();
    expect(names.filter((n) => isLoner(g, n, names, LONER_FLOOR))).toEqual(['Twitch']);
  });
});

describe('BACKLOG-134 bestFriend', () => {
  const others = ['Glade', 'Rex', 'Sunny'];
  it('picks the closest over the floor', () => {
    expect(bestFriend('Mossback', null, b([['Mossback', 'Glade', 24], ['Mossback', 'Rex', 12]]), others)).toBe('Glade');
  });
  it('is null under the floor', () => {
    expect(bestFriend('Twitch', null, b([['Twitch', 'Rex', LONER_FLOOR - 1]]), others)).toBeNull();
  });
  it('holds the current friend inside the margin', () => {
    const g = b([['Mossback', 'Glade', 24], ['Mossback', 'Rex', 24 + SHIFT_MARGIN - 1]]);
    expect(bestFriend('Mossback', 'Glade', g, others)).toBe('Glade');
  });
  it('gives way past the margin', () => {
    const g = b([['Mossback', 'Glade', 24], ['Mossback', 'Rex', 24 + SHIFT_MARGIN]]);
    expect(bestFriend('Mossback', 'Glade', g, others)).toBe('Rex');
  });
  it('drops a departed friend', () => {
    const g = b([['Mossback', 'Gone', 90], ['Mossback', 'Rex', 10]]);
    expect(bestFriend('Mossback', 'Gone', g, others)).toBe('Rex');
  });
});

describe('BACKLOG-134 lines', () => {
  it('tiers by closeness', () => {
    expect(friendLine(null, 0)).toBe('🤝 no friend yet');
    expect(friendLine('Rex', 12)).toBe('🤝 friendly with Rex');
    expect(friendLine('Rex', 30)).toBe('🤝 close to Rex');
    expect(friendLine('Rex', 60)).toBe('🤝 thick as thieves with Rex');
  });
  it('names both friends in the shift', () => {
    expect(shiftLine('Mossback', 'Glade', 'Rex')).toBe('💞 Mossback has grown closer to Rex than to Glade');
  });
});

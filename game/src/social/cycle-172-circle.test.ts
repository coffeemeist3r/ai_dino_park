import { describe, it, expect } from 'vitest';
import { innerCircle, circleLine, joinedLine, newcomers, CIRCLE_ART_KEY } from './circle';
import { homecoming, HOMECOMING_MIN_MINUTES } from '../world/homecoming';
import { bookLines, type BookRow } from '../ui/lenses';
import { worldPlacedProps } from '../world/reachability';

const roster = ['Rex', 'Sunny', 'Pip', 'Glade', 'Twitch'];

describe('BACKLOG-127 the inner circle', () => {
  it('L1: top three by points, no zeroes, nobody off the roster', () => {
    const c = innerCircle({ Rex: 12, Sunny: 40, Pip: 0, Glade: 25, Twitch: 5, Ghost: 99 }, roster);
    expect(c).toEqual([
      { name: 'Sunny', hearts: 4 },
      { name: 'Glade', hearts: 2 },
      { name: 'Rex', hearts: 1 },
    ]);
    expect(innerCircle({ Rex: 3 }, roster)).toEqual([{ name: 'Rex', hearts: 0 }]);
    expect(innerCircle({}, roster)).toEqual([]);
  });

  it('L2: the circle\'s #1 is always the dino the homecoming picks', () => {
    const maps: Record<string, number>[] = [
      { Rex: 10, Sunny: 10, Pip: 10 },
      { Twitch: 70, Glade: 70, Rex: 3 },
      { Pip: 1 },
      { Sunny: 55, Rex: 54, Glade: 90, Pip: 90 },
    ];
    for (const f of maps) {
      expect(innerCircle(f, roster)[0].name).toBe(homecoming(f, HOMECOMING_MIN_MINUTES)!.name);
    }
    expect(innerCircle({ Rex: 10, Sunny: 10, Pip: 10, Glade: 10 }, roster).map((c) => c.name)).toEqual(['Glade', 'Pip', 'Rex']);
  });

  it('L3: the book line, empty and ranked', () => {
    expect(circleLine([])).toBe('♛ your inner circle: nobody yet — say hello');
    expect(circleLine([{ name: 'Rex', hearts: 3 }, { name: 'Sunny', hearts: 1 }])).toBe('♛ your inner circle: 1 Rex ♥3 · 2 Sunny ♥1');
    expect(joinedLine('Pip', 3)).toBe('♛ Pip has joined your inner circle (#3)');
    expect(newcomers(['Rex'], ['Sunny', 'Rex'])).toEqual(['Sunny']);
  });

  it('L4: the book is unchanged without a circle, and carries it under the title with one', () => {
    const row: BookRow = { name: 'Rex', species: 'Raptor', hearts: 2, topBond: 30, role: 'none' as BookRow['role'], rumorsHeard: 0 };
    const plain = bookLines([row], ['away']);
    expect(plain[1]).toBe('away');
    const withCircle = bookLines([row], ['away'], circleLine([]));
    expect(withCircle[1]).toBe(circleLine([]));
    expect(withCircle.slice(2)).toEqual(plain.slice(1));
  });

  it('L7: the crown has a host in the world', () => {
    expect(worldPlacedProps().has(CIRCLE_ART_KEY)).toBe(true);
  });
});

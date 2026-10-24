import { describe, expect, it } from 'vitest';
import { isPairs, mateBookLine, pairUp } from './courtship';
import { GUEST_BOND, WEDDING_HOUR, wed, weddingClosedLine, weddingDue, weddingGuests, weddingTicker } from './wedding';
import { pairKey } from './meetings';

const nest = { zone: 'bowl', tileX: 5, tileY: 6 };
const at = (day: number, hour: number) => ({ day, hour, minute: 0 }) as any;

describe('the wedding (BACKLOG-625)', () => {
  const pairs = pairUp({}, 'Sunny', 'Rex', 1, nest);

  it('is due in the wedding hour, on or after the day the pair formed, once', () => {
    expect(weddingDue(at(1, WEDDING_HOUR), pairs)).toEqual(['Rex', 'Sunny']);
    expect(weddingDue(at(1, WEDDING_HOUR - 1), pairs)).toBeNull();
    expect(weddingDue(at(1, WEDDING_HOUR), pairUp({}, 'Sunny', 'Rex', 2, nest))).toBeNull();
    expect(weddingDue(at(1, WEDDING_HOUR), wed(pairs, 'Rex', 'Sunny', 1))).toBeNull();
    expect(weddingDue(at(1, WEDDING_HOUR), pairUp({}, 'Sunny', 'Rex', 1))).toBeNull(); // no nest, nowhere to stand
  });

  it('the guests are friends of either mate, awake and settled on the nest’s ground', () => {
    const bonds = { [pairKey('Ember', 'Sunny')]: GUEST_BOND, [pairKey('Glade', 'Rex')]: 30, [pairKey('Murk', 'Rex')]: GUEST_BOND - 1, [pairKey('Pip', 'Rex')]: 20, [pairKey('Twitch', 'Rex')]: 20, [pairKey('Bramble', 'Rex')]: 20 };
    const p = (name: string, over = {}) => ({ name, zone: 'bowl', awake: true, migrating: false, ...over });
    const present = [p('Rex'), p('Sunny'), p('Ember'), p('Glade'), p('Murk'), p('Pip', { zone: 'grove' }), p('Twitch', { awake: false }), p('Bramble', { migrating: true })];
    expect(weddingGuests('Rex', 'Sunny', 'bowl', present, bonds)).toEqual(['Ember', 'Glade']);
  });

  it('the day is in the save and the book', () => {
    const w = wed(pairs, 'Rex', 'Sunny', 1);
    expect(w.Rex).toMatchObject({ mate: 'Sunny', wed: 1, nest });
    expect(isPairs(w)).toBe(true);
    expect(isPairs({ Rex: { mate: 'Sunny', day: 1, wed: 'today' } })).toBe(false);
    expect(mateBookLine(w, 'Sunny')).toBe('💍 wed to Rex (day 1)');
    expect(mateBookLine(pairs, 'Sunny')).toBe('💕 sweet on Rex (since day 1)');
  });

  it('the ticker names who came', () => {
    expect(weddingTicker('Rex', 'Sunny', ['Ember', 'Glade', 'Murk'])).toBe('💍 Rex and Sunny are wed at their nest. Ember, Glade and Murk came.');
    expect(weddingTicker('Rex', 'Sunny', ['Ember'])).toBe('💍 Rex and Sunny are wed at their nest. Ember came.');
    expect(weddingTicker('Rex', 'Sunny', [])).toBe('💍 Rex and Sunny are wed at their nest, with nobody there but each other.');
    expect(weddingClosedLine('Rex', 'Sunny')).toBe("💍 The guests drift home from Rex and Sunny's nest.");
  });
});

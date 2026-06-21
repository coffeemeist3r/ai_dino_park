import { describe, it, expect } from 'vitest';
import { bankResource, stockpileLine, type Stockpile } from '../../game/src/world/resource';

describe('resource stockpile (BACKLOG-285)', () => {
  it('banks the first of a kind from an empty pile', () => {
    expect(bankResource({}, 'branch')).toEqual({ branch: 1 });
  });

  it('accumulates the same kind', () => {
    let pile: Stockpile = {};
    pile = bankResource(pile, 'branch');
    pile = bankResource(pile, 'branch');
    expect(pile.branch).toBe(2);
  });

  it('banks a new kind without touching the others', () => {
    const pile = bankResource({ branch: 2 }, 'stone');
    expect(pile).toEqual({ branch: 2, stone: 1 });
  });

  it('is pure — never mutates the input pile', () => {
    const before: Stockpile = { branch: 1 };
    const after = bankResource(before, 'branch');
    expect(before).toEqual({ branch: 1 }); // untouched
    expect(after).not.toBe(before);
  });

  it('renders an empty pile as the empty string (no plaque line)', () => {
    expect(stockpileLine({})).toBe('');
    expect(stockpileLine({ branch: 0 })).toBe(''); // a zero-count kind is omitted
  });

  it('renders a glyph readout listing only banked kinds', () => {
    const line = stockpileLine({ branch: 3, stone: 1 });
    expect(line).toContain('🪵 3');
    expect(line).toContain('🪨 1');
    expect(line).toContain(' · ');
    expect(stockpileLine({ stone: 2 })).toBe('🪨 2'); // branch absent → omitted, no leading separator
  });
});

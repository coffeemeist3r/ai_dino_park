import { describe, it, expect } from 'vitest';
import {
  FOUNDING_SATCHEL,
  SATCHEL_STAPLES,
  bankToSatchel,
  refillSatchel,
  rollFromSatchel,
  satchelCount,
  satchelEmpty,
  spendFromSatchel,
  stockedIds,
} from './satchel';
import { FOOD_STOCKPILE_CAP } from './foodstore';
import { FOODS } from './foods';
import { mulberry32 } from '../ai/personality';

describe('the founding satchel (BACKLOG-546)', () => {
  it('is not empty — the keeper can feed on the first frame', () => {
    expect(satchelEmpty(FOUNDING_SATCHEL)).toBe(false);
  });

  it('is uneven, and holds at least one food thin enough to run out in a sitting', () => {
    const counts = SATCHEL_STAPLES.map((id) => satchelCount(FOUNDING_SATCHEL, id));
    expect(new Set(counts).size).toBeGreaterThan(1); // not a flat handful of everything
    expect(Math.min(...counts)).toBeLessThanOrEqual(2);
  });

  it('starts the farmed crops at zero — the only way to hold one is to grow it', () => {
    for (const id of ['roots', 'mushrooms', 'seeds']) expect(satchelCount(FOUNDING_SATCHEL, id)).toBe(0);
  });

  it('names only real foods', () => {
    const ids = new Set(FOODS.map((f) => f.id));
    for (const id of SATCHEL_STAPLES) expect(ids.has(id), id).toBe(true);
  });
});

describe('spending', () => {
  it('takes one and never mutates the pile it was given', () => {
    const before = { ...FOUNDING_SATCHEL };
    const after = spendFromSatchel(FOUNDING_SATCHEL, 'greens')!;
    expect(FOUNDING_SATCHEL).toEqual(before);
    expect(satchelCount(after, 'greens')).toBe(satchelCount(before, 'greens') - 1);
  });

  it('answers null when there is none of that id — the empty-handed drop', () => {
    expect(spendFromSatchel(FOUNDING_SATCHEL, 'roots')).toBeNull();
    expect(spendFromSatchel({}, 'greens')).toBeNull();
  });

  it('never produces a negative count, however hard it is spent', () => {
    let pile = { ...FOUNDING_SATCHEL };
    for (let i = 0; i < 50; i++) {
      const next = spendFromSatchel(pile, 'fish');
      if (!next) break;
      pile = next;
    }
    expect(satchelCount(pile, 'fish')).toBe(0);
    expect(Object.values(pile).every((n) => (n ?? 0) >= 0)).toBe(true);
  });

  it('drops an id spent to nothing rather than leaving a 0 behind', () => {
    const after = spendFromSatchel(FOUNDING_SATCHEL, 'fish')!; // fish starts at 1
    expect('fish' in after).toBe(false);
  });
});

describe('refilling', () => {
  it('tops every staple back to its founding count', () => {
    expect(refillSatchel({})).toEqual(FOUNDING_SATCHEL);
  });

  it('leaves a farmed crop alone', () => {
    expect(satchelCount(refillSatchel({ roots: 3 }), 'roots')).toBe(3);
  });

  it('does not claw back a staple a harvest pushed above founding', () => {
    const rich = { ...FOUNDING_SATCHEL, greens: 6 };
    expect(satchelCount(refillSatchel(rich), 'greens')).toBe(6);
  });

  it('does not mutate its argument', () => {
    const pile = { greens: 1 };
    refillSatchel(pile);
    expect(pile).toEqual({ greens: 1 });
  });
});

describe('banking a harvest', () => {
  it('adds one and clamps at the pile cap', () => {
    expect(satchelCount(bankToSatchel({}, 'roots'), 'roots')).toBe(1);
    const full = { roots: FOOD_STOCKPILE_CAP };
    expect(bankToSatchel(full, 'roots')).toBe(full); // at cap: unchanged, same reference
  });
});

describe('the random handful, drawn from what you have', () => {
  it('never names a food the keeper is out of', () => {
    const pile = { greens: 2, meat: 1 };
    const rand = mulberry32(12345);
    for (let i = 0; i < 200; i++) {
      const id = rollFromSatchel(pile, rand);
      expect(id === 'greens' || id === 'meat', String(id)).toBe(true);
    }
  });

  it('answers null on an empty satchel — the auto slot meets the same empty-handed path', () => {
    expect(rollFromSatchel({}, mulberry32(1))).toBeNull();
    expect(rollFromSatchel({ greens: 0 }, mulberry32(1))).toBeNull();
  });

  it('can reach every stocked id', () => {
    const pile = { greens: 1, meat: 1, fish: 1, berries: 1 };
    const rand = mulberry32(99);
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) seen.add(rollFromSatchel(pile, rand)!);
    expect(seen).toEqual(new Set(stockedIds(pile)));
  });

  it('reads stocked ids in FOODS order, so the readout is stable', () => {
    expect(stockedIds({ berries: 1, meat: 1 })).toEqual(['meat', 'berries']);
  });
});

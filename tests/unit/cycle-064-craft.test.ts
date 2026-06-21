import { describe, it, expect } from 'vitest';
import { canCraft, craft, CRAFT_RECIPE, type Stockpile } from '../../game/src/world/resource';

describe('first craft (BACKLOG-286)', () => {
  const enough: Stockpile = { branch: 3, stone: 2 };

  it('canCraft is false below either threshold', () => {
    expect(canCraft({})).toBe(false);
    expect(canCraft({ branch: 3 })).toBe(false); // no stone
    expect(canCraft({ branch: 2, stone: 2 })).toBe(false); // a branch short
  });

  it('canCraft is true at or above every recipe threshold', () => {
    expect(canCraft(enough)).toBe(true);
    expect(canCraft({ branch: 9, stone: 5 })).toBe(true);
  });

  it('craft subtracts exactly the recipe cost', () => {
    expect(craft({ branch: 5, stone: 4 })).toEqual({ branch: 5 - CRAFT_RECIPE.branch!, stone: 4 - CRAFT_RECIPE.stone! });
  });

  it('craft of an exactly-affordable pile leaves the recipe kinds at 0', () => {
    expect(craft(enough)).toEqual({ branch: 0, stone: 0 });
  });

  it('craft returns null when unaffordable', () => {
    expect(craft({ branch: 1, stone: 1 })).toBeNull();
    expect(craft({})).toBeNull();
  });

  it('craft is pure — never mutates the input pile', () => {
    const before: Stockpile = { branch: 4, stone: 3 };
    const after = craft(before);
    expect(before).toEqual({ branch: 4, stone: 3 }); // untouched
    expect(after).not.toBe(before);
  });

  it('a second craft needs the stockpile rebuilt (one cairn per threshold)', () => {
    const afterOne = craft({ branch: 4, stone: 3 })!; // → { branch: 1, stone: 1 }
    expect(canCraft(afterOne)).toBe(false); // can't immediately craft again
  });
});

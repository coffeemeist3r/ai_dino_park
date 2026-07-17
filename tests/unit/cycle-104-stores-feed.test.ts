import { describe, it, expect } from 'vitest';
import { takeFood, pickFoodToSpend, storesFedLine, storesFedMemory } from '../../game/src/world/foodstore';
import { isStarving, STARVING, NEED_THRESHOLD } from '../../game/src/world/needs';

/**
 * A carrier feeds the hungry (BACKLOG-444) — the spend half of the food store (446): the starving bar,
 * taking a unit back out of a pile, and which food a zone hands its own.
 */

describe('isStarving (BACKLOG-444)', () => {
  it('fires at the starving bar and not a hair under', () => {
    expect(isStarving({ hunger: STARVING - 0.001, thirst: 0 })).toBe(false);
    expect(isStarving({ hunger: STARVING, thirst: 0 })).toBe(true);
    expect(isStarving({ hunger: 1, thirst: 0 })).toBe(true);
  });

  it('is silent for a dino the needs map has never seen', () => {
    expect(isStarving(undefined)).toBe(false);
  });

  it('leaves the 0.6–0.9 band intact — the band Milestone 5 lives in', () => {
    // Load-bearing: if the stores ever spent at the pressing bar they would eat 376's dawn beat and
    // 436's need-pull before the player saw either. The store is the last resort, not the default.
    expect(STARVING).toBeGreaterThan(NEED_THRESHOLD);
    expect(isStarving({ hunger: 0.7, thirst: 0 })).toBe(false);
  });
});

describe('takeFood (BACKLOG-444)', () => {
  it('takes exactly one unit', () => {
    expect(takeFood({ berries: 2 }, 'berries')).toEqual({ berries: 1 });
  });

  it('floors at zero — an empty or absent id returns the pile unchanged', () => {
    expect(takeFood({ berries: 0 }, 'berries')).toEqual({ berries: 0 });
    expect(takeFood({ berries: 1 }, 'roots')).toEqual({ berries: 1 });
  });

  it('never mutates its input', () => {
    const pile = { berries: 2 };
    takeFood(pile, 'berries');
    expect(pile).toEqual({ berries: 2 });
  });
});

describe('pickFoodToSpend (BACKLOG-444)', () => {
  it('hands the dino its favorite when the zone has it banked, even over a bigger stock of something else', () => {
    expect(pickFoodToSpend({ berries: 1, roots: 5 }, 'berries')).toBe('berries');
  });

  it('falls back to the most-stocked id when the favorite is not banked', () => {
    expect(pickFoodToSpend({ berries: 1, roots: 5 }, 'fish')).toBe('roots');
  });

  it('drains the glut first when no favorite is offered', () => {
    expect(pickFoodToSpend({ berries: 1, roots: 5 })).toBe('roots');
  });

  it('breaks a count tie in FOODS order, deterministically', () => {
    const pick = pickFoodToSpend({ roots: 2, greens: 2 });
    expect(pick).toBe('greens'); // greens precedes roots in FOODS
    expect(pickFoodToSpend({ roots: 2, greens: 2 })).toBe(pick);
  });

  it('gives nothing from an empty pantry', () => {
    expect(pickFoodToSpend({})).toBeNull();
    expect(pickFoodToSpend({ berries: 0 })).toBeNull();
    expect(pickFoodToSpend({ berries: 0 }, 'berries')).toBeNull();
  });
});

describe('the stores-fed wording (BACKLOG-444)', () => {
  it('names the zone and the dino it fed', () => {
    const line = storesFedLine('The Fernreach', 'Thornback', '🥕');
    expect(line).toContain('The Fernreach');
    expect(line).toContain('Thornback');
    expect(line).toContain('🥕');
  });

  it('reads clean for a zone name that carries its own article', () => {
    // ZONES names are 'Pocket Cretaceous' / 'The Grove' / 'The Fernreach' — a leading "the" in the
    // template would render "the The Grove's stores".
    expect(storesFedLine('The Grove', 'Rex', '🍓')).not.toContain('the The');
    expect(storesFedMemory('The Grove')).not.toContain('the The');
  });

  it('leaves the fed dino a memory naming the zone that carried it', () => {
    expect(storesFedMemory('The Grove')).toContain('The Grove');
  });
});

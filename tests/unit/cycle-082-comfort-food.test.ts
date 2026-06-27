import { describe, it, expect } from 'vitest';
import { comfortsLoner, comfortFoodMemory, comfortFoodLine, COMFORT_FOOD_GLYPH } from '../../game/src/world/loner';

/**
 * Comfort food (BACKLOG-374). A moping loner soothed by its *favorite* food gets a quiet solace beat a plain
 * meal never gives — solace is per-palate. Pure predicate + the memory/bubble strings; WorldScene.eatFood
 * fires them when `comfortsLoner` holds.
 */

describe('comfortsLoner — the per-palate solace predicate (BACKLOG-374)', () => {
  it('is true only when the food is the favorite AND the dino is a loner', () => {
    expect(comfortsLoner(true, true)).toBe(true);
  });

  it('is false for a favorite eaten by a well-bonded (non-loner) dino', () => {
    expect(comfortsLoner(true, false)).toBe(false);
  });

  it('is false for a non-favorite meal, loner or not', () => {
    expect(comfortsLoner(false, true)).toBe(false);
    expect(comfortsLoner(false, false)).toBe(false);
  });
});

describe('comfort-food beat strings (BACKLOG-374)', () => {
  it('the memory names the food and is distinct from a plain favorite memory', () => {
    const mem = comfortFoodMemory('silver fish');
    expect(mem).toContain('silver fish');
    expect(mem).toContain('comfort food');
    expect(mem).toContain(COMFORT_FOOD_GLYPH);
    expect(mem).not.toContain('snapped up'); // not the plain favorite memory eatFood files
  });

  it('the bubble carries the name + 😌', () => {
    expect(comfortFoodLine('Mossback')).toBe(`Mossback ${COMFORT_FOOD_GLYPH}`);
  });
});

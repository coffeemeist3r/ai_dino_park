import { describe, it, expect } from 'vitest';
import { mannerTallies, hatchManner, mannerLine } from './manner';
import { slunkOffMemory } from './feeding';

const YIELD = 'you stepped back and let Rex eat first';
const REPAY = "you repaid Rex's kindness at the hatch";
const SNATCH = 'you shouldered past Rex and snatched the food first';
const STAND = 'you stood your ground and kept your food from Rex';
const SLINK = slunkOffMemory('Rex'); // the real builder, so a wording change breaks here first

describe('the manner at the hatch (BACKLOG-402)', () => {
  it('shows nothing for a dino that has never contested a drop', () => {
    expect(hatchManner([])).toBeNull();
    expect(mannerLine([])).toBeNull();
    expect(hatchManner(['you ate alongside Sunny', 'you brought down a meal'])).toBeNull();
  });

  it('derives each of the four manners from its own memory', () => {
    expect(hatchManner([YIELD])).toBe('generous');
    expect(hatchManner([SNATCH])).toBe('greedy');
    expect(hatchManner([STAND])).toBe('unbowed');
    expect(hatchManner([SLINK])).toBe('timid');
  });

  it('counts the 385 repay as generosity', () => {
    expect(hatchManner([REPAY])).toBe('generous');
    expect(mannerTallies([YIELD, REPAY])).toEqual({ generous: 2, greedy: 0, unbowed: 0, timid: 0 });
  });

  it('takes the highest count, not the most recent beat', () => {
    expect(hatchManner([YIELD, REPAY, SNATCH])).toBe('generous');
    expect(hatchManner([SNATCH, SNATCH, YIELD])).toBe('greedy');
  });

  it('never lets timid win a tie — one lost contest is not a character', () => {
    expect(hatchManner([YIELD, SLINK])).toBe('generous');
    expect(hatchManner([SLINK, YIELD])).toBe('generous');
  });

  it('breaks a greedy/unbowed tie toward unbowed (the declared precedence)', () => {
    expect(hatchManner([SNATCH, STAND])).toBe('unbowed');
    expect(hatchManner([STAND, SNATCH])).toBe('unbowed');
  });

  it('is a single glyph-led line per manner', () => {
    expect(mannerLine([YIELD])).toBe('🍽️ at the hatch: generous — steps back so a friend eats first');
    expect(mannerLine([SNATCH])).toBe('🍽️ at the hatch: greedy — shoulders in and takes the drop');
    expect(mannerLine([STAND])).toBe('🍽️ at the hatch: unbowed — holds its ground and keeps its food');
    expect(mannerLine([SLINK])).toBe("🍽️ at the hatch: timid — backs off when someone won't budge");
  });
});

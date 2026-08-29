import { describe, it, expect } from 'vitest';
import {
  heldShort,
  soundsDiscontent,
  discontentLine,
  SHORTS_BEFORE_WORD,
} from '../../game/src/world/discontent';
import { pickFoodToSpend, type FoodPile } from '../../game/src/world/foodstore';
import { feedReserve, BANK_RESERVE, type SpendPriority } from '../../game/src/world/governance';

/**
 * The grumble reaches the keeper (BACKLOG-471). The detection is the interesting half: "the reserve is the
 * only reason this mouth went unfed" must be answered by the same function the spend site (444/463) asks,
 * or the ticker will one day report a grievance the pantry never actually caused. These pin that agreement
 * directly, plus the freshness gate that keeps the line a standing rather than a per-step tic.
 */

const POLICIES: Array<SpendPriority | null | undefined> = ['feed', 'bank', null, undefined];

describe('heldShort (BACKLOG-471)', () => {
  it('is true only under bank, when the pile holds exactly the reserve of the favourite', () => {
    const pile: FoodPile = { berries: BANK_RESERVE };
    expect(heldShort(pile, 'berries', 'bank')).toBe(true);
    expect(heldShort(pile, 'berries', 'feed')).toBe(false);
    expect(heldShort(pile, 'berries', null)).toBe(false);
    expect(heldShort(pile, 'berries', undefined)).toBe(false);
  });

  it('is false for an empty pantry under every policy — want is not a decision', () => {
    for (const p of POLICIES) expect(heldShort({}, 'berries', p)).toBe(false);
    for (const p of POLICIES) expect(heldShort({ berries: 0 }, 'berries', p)).toBe(false);
  });

  it('is false when the bank ground can still spend above its reserve — that mouth gets fed', () => {
    expect(heldShort({ berries: BANK_RESERVE + 1 }, 'berries', 'bank')).toBe(false);
  });

  it('reads a pile whose only stocked id sits at the reserve, where a pile total would not', () => {
    // Total is 1 either way; what matters is that no *id* clears the reserve.
    expect(heldShort({ greens: BANK_RESERVE }, 'berries', 'bank')).toBe(true);
  });

  it('agrees with pickFoodToSpend across a matrix of piles (pinned against drift)', () => {
    const piles: FoodPile[] = [
      {},
      { berries: 1 },
      { berries: 2 },
      { greens: 1 },
      { greens: 1, roots: 1 },
      { greens: 3, roots: 1 },
      { berries: 1, greens: 2 },
    ];
    for (const pile of piles) {
      for (const fav of ['berries', 'greens', undefined]) {
        const expected =
          pickFoodToSpend(pile, fav, feedReserve('bank')) === null && pickFoodToSpend(pile, fav, 0) !== null;
        expect(heldShort(pile, fav, 'bank')).toBe(expected);
      }
    }
  });
});

describe('soundsDiscontent (BACKLOG-471)', () => {
  it('stays quiet below the threshold', () => {
    expect(soundsDiscontent(SHORTS_BEFORE_WORD - 1, null, 3)).toBe(false);
    expect(soundsDiscontent(0, null, 3)).toBe(false);
  });

  it('sounds at the threshold on a ground that has never sounded', () => {
    expect(soundsDiscontent(SHORTS_BEFORE_WORD, null, 3)).toBe(true);
    expect(soundsDiscontent(SHORTS_BEFORE_WORD + 5, null, 3)).toBe(true);
  });

  it('sounds once a day, however many mouths go short in it', () => {
    expect(soundsDiscontent(SHORTS_BEFORE_WORD, 3, 3)).toBe(false);
    expect(soundsDiscontent(SHORTS_BEFORE_WORD + 4, 3, 3)).toBe(false);
    expect(soundsDiscontent(SHORTS_BEFORE_WORD, 3, 4)).toBe(true);
  });
});

describe('discontentLine (BACKLOG-471)', () => {
  it('names the ground, carries the worry glyph, and never doubles an article', () => {
    const line = discontentLine('The Grove');
    expect(line).toContain('the Grove'); // BACKLOG-499
    expect(line).toContain('😟');
    expect(line).toMatch(/going hungry while the granary fills/);
    expect(line).not.toMatch(/the The/i);
  });
});

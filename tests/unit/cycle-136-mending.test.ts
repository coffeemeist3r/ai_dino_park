import { describe, it, expect } from 'vitest';
import { canMend, mendLine, mendMemory, mendEventLine, MEND_GLYPH, MEND_STEPS, MEND_COOLDOWN_MS } from '../../game/src/world/mending';
import { runUpkeep, REPAIR_COST, UPKEEP_GLYPH } from '../../game/src/world/upkeep';

/**
 * Hands on the derelict (BACKLOG-488). The arithmetic in `upkeep.ts` is unchanged; what these pin is the
 * *dispatch* half — what a ground must be able to afford, how long the errand gets, and the words the
 * fixer leaves behind.
 */
describe('canMend', () => {
  it('an empty pile cannot pay for a patch-up', () => {
    expect(canMend(0, REPAIR_COST)).toBe(false);
  });

  it('exactly the cost is enough — the founding grove is not asked to be rich', () => {
    expect(canMend(REPAIR_COST, REPAIR_COST)).toBe(true);
    expect(canMend(REPAIR_COST - 1, REPAIR_COST)).toBe(false);
    expect(canMend(99, REPAIR_COST)).toBe(true);
  });

  it('a costless mend is not a mend', () => {
    expect(canMend(0, 0)).toBe(false);
  });
});

describe('the spend seam', () => {
  /**
   * The scene spends through `runUpkeep(pile, 0, 1)`: zero standing landmarks means zero bill, so the only
   * thing that call does is the repair spend — by the same largest-kind rule upkeep has always used. Pinned
   * here so a future change to `upkeep.ts` cannot silently make a mend charge a ground its bill as well.
   */
  it('costs exactly REPAIR_COST and lapses nothing', () => {
    const plan = runUpkeep({ stone: 2, branch: 1 }, 0, 1);
    expect(plan.paid).toBe(REPAIR_COST);
    expect(plan.lapsed).toBe(0);
    expect(plan.repaired).toBe(1);
    const before = 2 + 1;
    const after = (plan.pile.stone ?? 0) + (plan.pile.branch ?? 0) + (plan.pile.frond ?? 0);
    expect(before - after).toBe(REPAIR_COST);
  });

  it('reports no repair when the pile cannot cover it, and spends nothing', () => {
    const pile = {};
    const plan = runUpkeep(pile, 0, 1);
    expect(plan.repaired).toBe(0);
    expect(plan.paid).toBe(0);
    expect(plan.pile).toBe(pile); // the no-op contract — same reference
  });
});

describe('the errand budget', () => {
  it('covers an ordinary walk across the map rather than binding it', () => {
    const manhattanDiagonal = 20 + 15; // COLS + ROWS — the worst corner-to-corner case
    expect(MEND_STEPS).toBeGreaterThanOrEqual(manhattanDiagonal);
  });

  it('paces dispatch on the wall clock in seconds, not in-game days', () => {
    expect(MEND_COOLDOWN_MS).toBeGreaterThan(0);
    expect(MEND_COOLDOWN_MS).toBeLessThanOrEqual(60_000); // CHARTER v7: a beat nobody can wait out is not a beat
  });
});

describe('the words', () => {
  it('the glyph is 480s own, so upkeep and mending read as one system', () => {
    expect(MEND_GLYPH).toBe(UPKEEP_GLYPH);
  });

  it('the bubble names the fixer and the structure', () => {
    const line = mendLine('Bramble', '🗿');
    expect(line).toContain('Bramble');
    expect(line).toContain('🗿');
  });

  it('the memory names the ground and the structure, in the first person the courier uses', () => {
    const mem = mendMemory('The Grove', '🗿');
    expect(mem).toContain('The Grove');
    expect(mem).toContain('🗿');
    expect(mem.startsWith('you ')).toBe(true);
  });

  it('the ticker line names who did it', () => {
    const line = mendEventLine('Bramble', 'The Grove', '🗿');
    expect(line).toContain(MEND_GLYPH);
    expect(line).toContain('Bramble');
    expect(line).toContain('The Grove');
  });

  /**
   * The 403 precedent: a memory must not be read as something it is not by the greeting scorers. A mend is
   * a day's work, not a slight and not a gift.
   */
  it('does not read as a slight or a favour', () => {
    const mem = mendMemory('The Grove', '🗿');
    for (const word of ['slight', 'jealous', 'gave', 'gift', 'sorry']) expect(mem).not.toContain(word);
  });
});

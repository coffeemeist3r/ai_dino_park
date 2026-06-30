import { describe, it, expect } from 'vitest';
import { slunkOffMemory } from '../../game/src/world/feeding';

/**
 * Backed-down gobbler slinks off (BACKLOG-394) — the pure memory the denied gobbler files when a bold
 * winner stands its ground (390). The behavior (only on a bold-winner stand) is the e2e's job; here we
 * pin the builder.
 */
describe('slunkOffMemory (BACKLOG-394)', () => {
  it('names who wouldn’t budge', () => {
    const m = slunkOffMemory('Rex');
    expect(m.length).toBeGreaterThan(0);
    expect(m).toContain('Rex');
  });

  it('reflects the actual bold dino', () => {
    expect(slunkOffMemory('Mossback')).not.toBe(slunkOffMemory('Sunny'));
    expect(slunkOffMemory('Mossback')).toContain('Mossback');
  });
});

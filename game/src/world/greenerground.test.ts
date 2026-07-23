import { describe, it, expect } from 'vitest';
import { greenerGroundMemory, greenerGroundLine } from './greenerground';

describe('greenerGround (BACKLOG-457)', () => {
  it('memory names the ground it left and reads as the reason', () => {
    const m = greenerGroundMemory('The Fernreach');
    expect(m).toContain('The Fernreach');
    expect(m).toContain('went where the food is');
    // no double article — zone names carry their own (storesFedLine trap)
    expect(m).not.toContain('the The Fernreach');
  });

  it('departure line is the leaf bubble', () => {
    expect(greenerGroundLine()).toBe('🍃');
  });
});

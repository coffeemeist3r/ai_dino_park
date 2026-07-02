import { describe, it, expect } from 'vitest';
import { bashfulOpener, caughtMemory, signatureTic, TIC_BY_AXIS } from '../../game/src/world/tic';

/**
 * Caught mid-tic (BACKLOG-408). Pure helpers only — the greet-path wiring (😳 flash, one-time memory,
 * bashful-prefixed reply) is exercised in the e2e. Here we pin the deterministic frame + the memory weave.
 */
describe('BACKLOG-408 caught mid-tic', () => {
  it('bashfulOpener is a non-empty deterministic frame', () => {
    const a = bashfulOpener();
    expect(a.length).toBeGreaterThan(0);
    expect(bashfulOpener()).toBe(a); // deterministic — model-free
  });

  it('caughtMemory weaves the ritual label so the memory names what was seen', () => {
    for (const tic of Object.values(TIC_BY_AXIS)) {
      const mem = caughtMemory(tic.label);
      expect(mem).toContain(tic.label);
      expect(mem.toLowerCase()).toContain('keeper');
    }
  });

  it('caughtMemory reads off a real signatureTic label', () => {
    const label = signatureTic({ curiosity: 0.9, sociability: 0.5, energy: 0.5, agreeableness: 0.5, bravery: 0.5 }).label;
    expect(caughtMemory(label)).toContain(label);
  });
});

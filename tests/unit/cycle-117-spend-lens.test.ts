import { describe, it, expect } from 'vitest';
import { spendGlyph, type SpendPriority } from '../../game/src/world/governance';
import { zoneMapModel } from '../../game/src/ui/lenses';
import { zoneChain, BOWL_ID, GROVE_ID, FERNREACH_ID } from '../../game/src/world/zones';

/**
 * The provider's read on the lens (BACKLOG-468) — Milestone 9's closing structure arc. The spend policy
 * 463 set has lived inside two hooks and one ticker line; here it becomes a column on the zone map, so the
 * whole chain's governance reads at a glance. Pure read: no new state, no save change.
 */

describe('spendGlyph (BACKLOG-468)', () => {
  it('gives each stance its own glyph', () => {
    expect(spendGlyph('feed')).toBe('🍽️');
    expect(spendGlyph('bank')).toBe('🏦');
  });

  it('shows nothing for a ground that has decided nothing', () => {
    expect(spendGlyph(null)).toBe('');
    expect(spendGlyph(undefined)).toBe('');
  });
});

describe('zoneMapModel spend column (BACKLOG-468)', () => {
  const chain = zoneChain();
  const pops = { [BOWL_ID]: 2, [GROVE_ID]: 1, [FERNREACH_ID]: 1 };
  const spends: Record<string, SpendPriority | null> = { [BOWL_ID]: 'feed', [GROVE_ID]: 'bank' };

  it('attaches each zone its own policy', () => {
    const model = zoneMapModel(chain, pops, BOWL_ID, {}, {}, {}, [], {}, spends);
    expect(model.find((e) => e.id === BOWL_ID)!.spend).toBe('feed');
    expect(model.find((e) => e.id === GROVE_ID)!.spend).toBe('bank');
  });

  it('reads null for a zone absent from the map — a ground with no policy', () => {
    const model = zoneMapModel(chain, pops, BOWL_ID, {}, {}, {}, [], {}, spends);
    expect(model.find((e) => e.id === FERNREACH_ID)!.spend).toBeNull();
  });

  it('stays back-compatible with every pre-468 call shape', () => {
    expect(zoneMapModel(chain, pops, BOWL_ID).every((e) => e.spend === null)).toBe(true);
    expect(zoneMapModel(chain, pops, BOWL_ID, {}, {}, {}, [], {}).every((e) => e.spend === null)).toBe(true);
  });
});

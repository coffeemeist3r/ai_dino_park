import { describe, it, expect } from 'vitest';
import {
  zoneProsperity,
  prosperityTier,
  prosperityBadge,
  PROSPERITY_GLYPH,
  PROSPERITY_QUIET_MAX,
  PROSPERITY_GROWING_MAX,
  type ZoneSignals,
} from '../../game/src/world/prosperity';
import { zoneMapModel } from '../../game/src/ui/lenses';
import { zoneChain, zonePopulations, BOWL_ID, GROVE_ID } from '../../game/src/world/zones';

/**
 * Zone prosperity index (BACKLOG-428) — fold a zone's live stockpile/structures/heads/harvest into one
 * score + tier for the map lens (425). Pure derived read; Milestone 2's closing structure arc.
 */
describe('zone prosperity index (BACKLOG-428)', () => {
  const zero: ZoneSignals = { stockpile: 0, structures: 0, heads: 0, harvested: 0 };

  it('an empty zone scores zero', () => {
    expect(zoneProsperity(zero)).toBe(0);
  });

  it('is monotonic and non-negative — raising any one signal never lowers the score', () => {
    const base = zoneProsperity(zero);
    expect(zoneProsperity({ ...zero, stockpile: 1 })).toBeGreaterThan(base);
    expect(zoneProsperity({ ...zero, structures: 1 })).toBeGreaterThan(base);
    expect(zoneProsperity({ ...zero, heads: 1 })).toBeGreaterThan(base);
    expect(zoneProsperity({ ...zero, harvested: 1 })).toBeGreaterThan(base);
  });

  it('weights the rarer signals higher (structure > head > stockpile/harvest)', () => {
    const one = zoneProsperity({ ...zero, structures: 1 });
    const head = zoneProsperity({ ...zero, heads: 1 });
    const pile = zoneProsperity({ ...zero, stockpile: 1 });
    const crop = zoneProsperity({ ...zero, harvested: 1 });
    expect(one).toBeGreaterThan(head);
    expect(head).toBeGreaterThan(pile);
    expect(pile).toBe(crop);
  });

  it('prosperityTier partitions the score at both boundaries', () => {
    expect(prosperityTier(0)).toBe('quiet');
    expect(prosperityTier(PROSPERITY_QUIET_MAX)).toBe('quiet');
    expect(prosperityTier(PROSPERITY_QUIET_MAX + 1)).toBe('growing');
    expect(prosperityTier(PROSPERITY_GROWING_MAX)).toBe('growing');
    expect(prosperityTier(PROSPERITY_GROWING_MAX + 1)).toBe('thriving');
  });

  it('the badge reads glyph + tier', () => {
    expect(prosperityBadge('quiet')).toBe(`${PROSPERITY_GLYPH.quiet} quiet`);
    expect(prosperityBadge('thriving')).toBe(`${PROSPERITY_GLYPH.thriving} thriving`);
  });
});

describe('zoneMapModel prosperity tier (BACKLOG-428)', () => {
  it('sets each entry tier from the passed map, defaulting absent zones to quiet', () => {
    const pops = zonePopulations({}, ['Rex'], BOWL_ID);
    const model = zoneMapModel(zoneChain(), pops, BOWL_ID, { [GROVE_ID]: 'thriving' });
    const byId = Object.fromEntries(model.map((e) => [e.id, e.tier]));
    expect(byId[GROVE_ID]).toBe('thriving');
    expect(byId[BOWL_ID]).toBe('quiet'); // not in the tiers map → default
  });

  it('defaults every tier to quiet when no tiers passed (back-compat 3-arg call)', () => {
    const model = zoneMapModel(zoneChain(), {}, BOWL_ID);
    expect(model.every((e) => e.tier === 'quiet')).toBe(true);
  });
});

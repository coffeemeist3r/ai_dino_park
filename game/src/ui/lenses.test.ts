import { describe, it, expect } from 'vitest';
import { zoneMapModel } from './lenses';
import { zoneChain, BOWL_ID, GROVE_ID, FERNREACH_ID } from '../world/zones';

describe('per-zone harvest on the map lens (BACKLOG-433)', () => {
  const chain = zoneChain();
  const pops = { [BOWL_ID]: 3, [GROVE_ID]: 1, [FERNREACH_ID]: 1 };

  it('reads each zone its own harvest tally from the harvests map', () => {
    const model = zoneMapModel(chain, pops, BOWL_ID, {}, { [BOWL_ID]: 2, [GROVE_ID]: 1 });
    const byId = Object.fromEntries(model.map((e) => [e.id, e.harvested]));
    expect(byId[BOWL_ID]).toBe(2);
    expect(byId[GROVE_ID]).toBe(1);
    expect(byId[FERNREACH_ID]).toBe(0); // absent from the map → 0, not blended
  });

  it('defaults harvested to 0 for older callers that omit the harvests arg', () => {
    const model = zoneMapModel(chain, pops, BOWL_ID); // 3-arg, cycle-96 shape
    expect(model.every((e) => e.harvested === 0)).toBe(true);
    // and the 4-arg (tiers only) shape stays valid too
    const withTiers = zoneMapModel(chain, pops, BOWL_ID, {});
    expect(withTiers.every((e) => e.harvested === 0)).toBe(true);
  });
});

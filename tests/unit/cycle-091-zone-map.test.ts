import { describe, it, expect } from 'vitest';
import { ZONES, zoneChain, zonePopulations, BOWL_ID, GROVE_ID, FERNREACH_ID, HOLLOW_ID, RIDGE_ID, SALTPAN_ID } from '../../game/src/world/zones';
import { zoneMapModel, LENS_ORDER } from '../../game/src/ui/lenses';

describe('zoneChain (BACKLOG-425)', () => {
  it('orders the chain west→east off the adjacency table', () => {
    // BACKLOG-478: the walk still follows east links from the westmost ground — that is the *trunk*. The
    // Ridge hangs north off the Grove, so no east walk can reach it and 425's append-the-unreached fallback
    // (written for a hypothetical orphan zone) is what puts the branch on the lens. The chain is an
    // iteration order, not a west→east geography, and this assertion is the place that says so.
    expect(zoneChain()).toEqual([BOWL_ID, GROVE_ID, FERNREACH_ID, HOLLOW_ID, SALTPAN_ID, RIDGE_ID]);
  });

  it('includes every zone exactly once', () => {
    const chain = zoneChain();
    expect([...chain].sort()).toEqual(ZONES.map((z) => z.id).sort());
    expect(new Set(chain).size).toBe(chain.length);
  });
});

describe('zoneMapModel (BACKLOG-425)', () => {
  const names = ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade'];
  const homes = { Twitch: GROVE_ID };

  it('mirrors zonePopulations and flags exactly the keeper zone', () => {
    const pops = zonePopulations(homes, names, BOWL_ID);
    const model = zoneMapModel(zoneChain(), pops, GROVE_ID);
    expect(model.map((e) => e.count)).toEqual([4, 1, 0, 0, 0, 0]); // BACKLOG-505: six grounds
    expect(model.map((e) => e.keeper)).toEqual([false, true, false, false, false, false]);
    expect(model.map((e) => e.name)).toEqual([
      'Pocket Cretaceous',
      'The Grove',
      'The Fernreach',
      'The Hollow',
      'The Saltpan', // BACKLOG-505
      'The Sunward Ridge', // BACKLOG-478
    ]);
  });

  it('counts every dino somewhere (totals preserved)', () => {
    const pops = zonePopulations(homes, names, BOWL_ID);
    const total = zoneMapModel(zoneChain(), pops, BOWL_ID).reduce((s, e) => s + e.count, 0);
    expect(total).toBe(names.length);
  });
});

describe('lens ring (BACKLOG-425)', () => {
  it('appends map at the end so existing positions are untouched', () => {
    expect(LENS_ORDER).toEqual(['off', 'book', 'bonds', 'roles', 'ticker', 'map']);
  });
});

import { describe, it, expect } from 'vitest';

import { ROSTER } from '../../game/src/entities/roster';
import {
  foundingResidents,
  groundsWithoutResidents,
  foundingCouncils,
} from '../../game/src/world/founding';
import { zoneChain, zoneTileAt, BOWL_ID } from '../../game/src/world/zones';
import { zoneCapacity } from '../../game/src/world/capacity';

const COLS = 20;
const ROWS = 15;

describe('the residency invariant (BACKLOG-500)', () => {
  it('leaves no ground without a resident', () => {
    // CHARTER v7: "every ground the player can walk to has life on it at boot." This is that sentence as a
    // thing that breaks. Before this cycle it returned ['hollow', 'ridge'].
    expect(groundsWithoutResidents()).toEqual([]);
  });

  it('reports every ground in the chain, including any that would be empty', () => {
    // Present-and-empty and absent are different claims — the empty ones were the evidence 500 was filed on.
    expect(Object.keys(foundingResidents())).toEqual(zoneChain());
  });

  it('is derived from zoneChain, so a sixth ground inherits it', () => {
    // Not a literal list of five ids anywhere: every key comes from the chain itself.
    for (const id of zoneChain()) expect(foundingResidents()[id]).toBeDefined();
  });

  it('accounts for the whole roster exactly once', () => {
    const placed = Object.values(foundingResidents()).flat();
    expect(placed.sort()).toEqual(ROSTER.map((r) => r.name).sort());
  });
});

describe('the founding cast stands on ground it can stand on (BACKLOG-500)', () => {
  it('spawns every dino on grass in its own zone', () => {
    // The invariant that would have caught a bad spawn tile before the specs went red: the Hollow has a
    // standing pool and a fen rim, and the Ridge has a switchback and a tarn.
    for (const r of ROSTER) {
      const zone = r.zone ?? BOWL_ID;
      expect([zone, r.name, zoneTileAt(zone, r.tileX, r.tileY, COLS, ROWS)]).toEqual([
        zone,
        r.name,
        'grass',
      ]);
    }
  });

  it('does not boot any ground over its capacity', () => {
    // Two new residents must not switch on the crowding damp (476) as a side effect.
    const residents = foundingResidents();
    for (const id of zoneChain()) {
      expect(residents[id].length).toBeLessThanOrEqual(zoneCapacity(id, COLS, ROWS));
    }
  });
});

describe('the two additions disturb nothing that was already reachable (BACKLOG-492 / -497)', () => {
  it('leaves the founding councils exactly as they were', () => {
    // The new residents bank nothing, so they are ineligible for a seat — the bowl's two-seat council and
    // the Grove's single seat are the same ballots 492 and 497 shipped.
    const councils = foundingCouncils();
    expect(councils.bowl.sort()).toEqual(['Glade', 'Sunny']);
    expect(councils.grove).toEqual(['Pip']);
    expect(councils.hollow).toEqual([]);
    expect(councils.ridge).toEqual([]);
  });

  it('keeps the bowl at five — the cast four systems are tuned against', () => {
    // The roster GREW rather than rebalanced. If a later pass moves a body off the bowl to fill a ground,
    // it has to come here and say so, because TILES_PER_HEAD, the 460 last-one floor, the huddle and the
    // food scramble were all calibrated at five.
    expect(foundingResidents()[BOWL_ID]).toHaveLength(5);
  });
});

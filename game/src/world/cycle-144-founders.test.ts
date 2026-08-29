/**
 * BACKLOG-512 — the frontier read stops calling lived-in ground unlived-in.
 *
 * `isUnsettled` used to be three clauses: no heads, no pioneer, and an `isOrigin` flag naming the bowl,
 * because 343 records a pioneer at *arrival* and nothing recorded one at spawn. CHARTER v7's spread cast
 * made that flag wrong four times over — five grounds hold residents from the first frame and none of them
 * had a founder — so a ground the cast has lived on since frame zero read as virgin frontier the moment it
 * emptied. These tests pin the fix: the record is now true, so the rule needs no exemption.
 */

import { describe, it, expect } from 'vitest';
import { foundingPioneers, foundingResidents } from './founding';
import { isUnsettled, isHollowed, unsettledNeighbor, hollowedLine } from './frontier';
import { recordPioneer, type Pioneers } from './pioneer';
import { zoneChain, SALTPAN_ID, BOWL_ID } from './zones';

describe('foundingPioneers (BACKLOG-512)', () => {
  const founders = foundingPioneers();
  const residents = foundingResidents();

  it('records a founder for every ground the roster wakes on, and none for one it does not', () => {
    for (const [zone, names] of Object.entries(residents)) {
      expect(founders[zone] === undefined).toBe(names.length === 0);
    }
  });

  it('names somebody who actually lives there — no cross-wiring', () => {
    for (const [zone, name] of Object.entries(founders)) {
      expect(residents[zone]).toContain(name);
    }
  });

  it('leaves the Saltpan without a founder — the park keeps exactly one frontier', () => {
    expect(founders[SALTPAN_ID]).toBeUndefined();
  });

  it('records the bowl, which is the whole point — the origin is a founding, not an exemption', () => {
    expect(founders[BOWL_ID]).toBeDefined();
  });

  it('covers the whole chain, so a seventh ground inherits this the day it is added', () => {
    // Derived from foundingResidents (which walks zoneChain + ROSTER), never from a list of ids.
    expect(Object.keys(residents).sort()).toEqual([...zoneChain()].sort());
  });
});

describe('isUnsettled / isHollowed — the two kinds of empty (BACKLOG-512)', () => {
  it('an emptied founded ground is hollowed, not unsettled', () => {
    expect(isUnsettled(0, 'Bramble')).toBe(false);
    expect(isHollowed(0, 'Bramble')).toBe(true);
  });

  it('a never-founded empty ground is unsettled, not hollowed', () => {
    expect(isUnsettled(0, undefined)).toBe(true);
    expect(isHollowed(0, undefined)).toBe(false);
  });

  it('an inhabited ground is neither', () => {
    expect(isUnsettled(2, 'Bramble')).toBe(false);
    expect(isHollowed(2, 'Bramble')).toBe(false);
    expect(isHollowed(2, undefined)).toBe(false);
  });

  it('the two are complements within "no heads" — an empty ground always reads as one of them', () => {
    for (const pioneer of [undefined, 'Murk']) {
      expect(isUnsettled(0, pioneer) !== isHollowed(0, pioneer)).toBe(true);
    }
  });

  it('exactly one ground reads unsettled on a fresh park, and it is the Saltpan', () => {
    const founders = foundingPioneers();
    const residents = foundingResidents();
    const unsettled = zoneChain().filter((z) => isUnsettled(residents[z]?.length ?? 0, founders[z]));
    expect(unsettled).toEqual([SALTPAN_ID]);
  });

  it('and no ground reads hollowed on a fresh park — nobody has left anywhere yet', () => {
    const founders = foundingPioneers();
    const residents = foundingResidents();
    expect(zoneChain().filter((z) => isHollowed(residents[z]?.length ?? 0, founders[z]))).toEqual([]);
  });

  it('emptying any founded ground leaves the Saltpan the only frontier', () => {
    const founders = foundingPioneers();
    for (const emptied of Object.keys(founders)) {
      const heads = (z: string) => (z === emptied ? 0 : (foundingResidents()[z]?.length ?? 0));
      const unsettled = zoneChain().filter((z) => isUnsettled(heads(z), founders[z]));
      expect(unsettled).toEqual([SALTPAN_ID]);
    }
  });
});

describe('the frontier destination pick, unchanged (BACKLOG-474 / 512)', () => {
  // `unsettledNeighbor` takes a predicate, so fixing `isUnsettled` fixes the destination with no edit here.
  const founders: Pioneers = { grove: 'Bramble' };
  const heads: Record<string, number> = { grove: 0, saltpan: 0, hollow: 1 };
  const unsettled = (z: string) => isUnsettled(heads[z] ?? 0, founders[z]);

  it('never aims a migrant at a founded-but-empty neighbour', () => {
    expect(unsettledNeighbor(['grove', 'hollow'], unsettled)).toBeNull();
  });

  it('still finds a genuine frontier past one', () => {
    expect(unsettledNeighbor(['grove', 'saltpan'], unsettled)).toBe('saltpan');
  });
});

describe('hollowedLine (BACKLOG-512)', () => {
  it('names the ground and the dino who settled it', () => {
    const line = hollowedLine('The Hollow', 'Murk');
    expect(line).toContain('the Hollow'); // BACKLOG-499: through the article seam
    expect(line).toContain('Murk');
  });
});

describe('the save back-fill (BACKLOG-512)', () => {
  const seed = (map: Pioneers): Pioneers => {
    for (const [z, n] of Object.entries(foundingPioneers())) recordPioneer(map, z, n);
    return map;
  };

  it('fills every founding ground in a pre-144 save that recorded nothing', () => {
    expect(seed({})).toEqual(foundingPioneers());
  });

  it('keeps a recorded arrival — first write wins, so a real history is never overwritten', () => {
    const founders = foundingPioneers();
    const someGround = Object.keys(founders)[0];
    const out = seed({ [someGround]: 'Sunny' });
    expect(out[someGround]).toBe('Sunny');
    for (const z of Object.keys(founders)) if (z !== someGround) expect(out[z]).toBe(founders[z]);
  });

  it('is idempotent — a save loaded twice gains nothing the second time', () => {
    const once = seed({});
    expect(seed({ ...once })).toEqual(once);
  });
});

import { describe, expect, it } from 'vitest';
import { worstRival, rivalLine, RIVAL_BAR, GRUDGE_DRIFT } from './grudges';
import { BOND_DRIFT, driftBonds, bondPoints, type Bonds } from './bonds';
import { pairKey } from './meetings';
import { FOUNDING_GRUDGES, foundingGrudges } from '../world/founding';
import { ROSTER } from '../entities/roster';
import { SAVE_VERSION, deserialize } from '../world/saveGame';

const g = (pairs: Array<[string, string, number]>): Bonds =>
  Object.fromEntries(pairs.map(([x, y, v]) => [pairKey(x, y), v]));

describe('BACKLOG-574 founding feud', () => {
  it('is one pair of roster dinos who spawn on the same ground, above the bar', () => {
    expect(FOUNDING_GRUDGES.length).toBe(1);
    for (const [a, b, v] of FOUNDING_GRUDGES) {
      const za = ROSTER.find((r) => r.name === a);
      const zb = ROSTER.find((r) => r.name === b);
      expect(za && zb).toBeTruthy();
      expect(za!.zone ?? 'bowl').toBe(zb!.zone ?? 'bowl');
      expect(v).toBeGreaterThanOrEqual(RIVAL_BAR);
    }
    expect(bondPoints(foundingGrudges(), 'Twitch', 'Mossback')).toBe(40);
  });
});

describe('BACKLOG-574 worstRival / rivalLine', () => {
  const names = ['A', 'B', 'C'];
  it('names the worst grudge at or over the bar, and nobody under it', () => {
    expect(worstRival('A', g([['A', 'B', 25], ['A', 'C', 30]]), names)).toBe('C');
    expect(worstRival('A', g([['A', 'B', RIVAL_BAR - 1]]), names)).toBeNull();
    expect(worstRival('A', {}, names)).toBeNull();
  });
  it('reads as the book line', () => {
    expect(rivalLine('Twitch')).toBe("😒 doesn't get on with Twitch");
  });
});

describe('BACKLOG-574 grudges cool, slower than bonds', () => {
  it('drifts toward 0 and is slower than BOND_DRIFT', () => {
    expect(GRUDGE_DRIFT).toBeLessThan(BOND_DRIFT);
    let m: Bonds = foundingGrudges();
    for (let i = 0; i < 200; i++) m = driftBonds(m, 0, GRUDGE_DRIFT); // ten minutes of watching
    const after = bondPoints(m, 'Mossback', 'Twitch');
    expect(after).toBeLessThan(40);
    expect(after).toBeGreaterThan(RIVAL_BAR); // a feud outlasts a sitting
  });
});

describe('BACKLOG-574 grudges in the save', () => {
  const base = () => ({ version: SAVE_VERSION, time: { day: 1, hour: 8, minute: 0 }, player: { x: 10, y: 10 }, friendship: {}, memory: {} });
  it('round-trips', () => {
    expect(deserialize(JSON.stringify({ ...base(), grudges: { 'Mossback|Twitch': 33 } }))?.grudges).toEqual({ 'Mossback|Twitch': 33 });
  });
  it('opens a pre-574 save with no feud', () => {
    const save = deserialize(JSON.stringify(base()));
    expect(save).not.toBeNull();
    expect(save?.grudges).toBeUndefined();
  });
  it('rejects a malformed map', () => {
    expect(deserialize(JSON.stringify({ ...base(), grudges: { 'A|B': 'x' } }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...base(), grudges: null }))).toBeNull();
  });
});

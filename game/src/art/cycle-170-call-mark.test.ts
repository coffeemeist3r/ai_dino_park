import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { ROUSE_ART_KEY } from '../world/chronotype';
import { CALL_ART_KEY } from '../audio/chorus';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-566 — the call note, the ♪ over a singer as a ground calls the keeper in. */

const call = PROP_RIGS[CALL_ART_KEY];
const cells = (r: typeof call) => r.grid.join('').split('').filter((c) => c !== '.').length;

describe('BACKLOG-566 — the call note', () => {
  it('is a square 16px grid whose palette is exactly what it inks', () => {
    expect(call).toBeDefined();
    expect(call.size).toBe(16);
    expect(call.grid).toHaveLength(16);
    for (const row of call.grid) expect(row).toHaveLength(16);
    expect(Object.keys(call.palette).length).toBeLessThanOrEqual(8);
    expect(propCharsUsed(call.grid)).toEqual(new Set(Object.keys(call.palette)));
  });

  it('shares the family rim with rouse', () => {
    expect(call.palette.o).toBe(PROP_RIGS[ROUSE_ART_KEY].palette.o);
  });

  it('is one note, not a beamed pair — a single stem, two cells wide on every stem row', () => {
    // rows 5–9 are pure stem below the flag's reach on the left: exactly one lit+shade pair per row
    for (const y of [8, 9]) {
      const lit = [...call.grid[y]].filter((c) => c === 'C' || c === 'c').length;
      expect(lit).toBe(2);
    }
  });

  it('is lighter than the heaviest mark', () => {
    expect(cells(call)).toBeLessThan(cells(PROP_RIGS[ROUSE_ART_KEY]));
  });

  it('is placed by the shipping world (reachability register)', () => {
    expect(worldPlacedProps().has(CALL_ART_KEY)).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { ROUSE_ART_KEY } from '../world/chronotype';
import { STANDOFF_ART_KEY } from '../social/standoff';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-575 — the 💢 over two rivals squaring off. */

const vein = PROP_RIGS[STANDOFF_ART_KEY];

describe('BACKLOG-575 — the standoff mark', () => {
  it('is a square 16px grid whose palette is exactly what it inks', () => {
    expect(vein).toBeDefined();
    expect(vein.size).toBe(16);
    expect(vein.grid).toHaveLength(16);
    for (const row of vein.grid) expect(row).toHaveLength(16);
    expect(Object.keys(vein.palette).length).toBeLessThanOrEqual(8);
    expect(propCharsUsed(vein.grid)).toEqual(new Set(Object.keys(vein.palette)));
    expect(vein.palette.o).toBe(PROP_RIGS[ROUSE_ART_KEY].palette.o);
  });

  it('has an empty centre — the gap is what makes it a vein and not a slab', () => {
    for (const y of [7, 8]) for (const x of [7, 8]) expect(vein.grid[y][x]).toBe('.');
    for (let i = 0; i < 16; i++) expect(vein.grid[i].slice(7, 9)).toBe('..');
  });

  it('is placed by the shipping world (reachability register)', () => {
    expect(worldPlacedProps().has(STANDOFF_ART_KEY)).toBe(true);
  });
});

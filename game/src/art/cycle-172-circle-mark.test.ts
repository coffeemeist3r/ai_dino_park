import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { ROUSE_ART_KEY } from '../world/chronotype';
import { CIRCLE_ART_KEY } from '../social/circle';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-569 — the crown over a dino as it joins the keeper's inner circle. */

const crown = PROP_RIGS[CIRCLE_ART_KEY];

describe('BACKLOG-569 — the inner-circle crown', () => {
  it('is a square 16px grid whose palette is exactly what it inks', () => {
    expect(crown).toBeDefined();
    expect(crown.size).toBe(16);
    expect(crown.grid).toHaveLength(16);
    for (const row of crown.grid) expect(row).toHaveLength(16);
    expect(Object.keys(crown.palette).length).toBeLessThanOrEqual(8);
    expect(propCharsUsed(crown.grid)).toEqual(new Set(Object.keys(crown.palette)));
  });

  it('shares the family rim', () => {
    expect(crown.palette.o).toBe(PROP_RIGS[ROUSE_ART_KEY].palette.o);
  });

  it('has three points — three separate rim caps on its top row', () => {
    const top = crown.grid[3];
    expect(top.match(/o+/g)).toHaveLength(3);
  });

  it('is placed by the shipping world (reachability register)', () => {
    expect(worldPlacedProps().has(CIRCLE_ART_KEY)).toBe(true);
  });
});

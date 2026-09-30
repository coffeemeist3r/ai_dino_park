import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { ROUSE_ART_KEY } from '../world/chronotype';
import { CIRCLE_ART_KEY } from '../social/circle';
import { COMFORT_ART_KEY } from '../world/comfort';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-572 — the hug over a friend as it arrives to console a sore dino. */

const hug = PROP_RIGS[COMFORT_ART_KEY];

describe('BACKLOG-572 — the comfort mark', () => {
  it('is a square 16px grid whose palette is exactly what it inks', () => {
    expect(hug).toBeDefined();
    expect(hug.size).toBe(16);
    expect(hug.grid).toHaveLength(16);
    for (const row of hug.grid) expect(row).toHaveLength(16);
    expect(Object.keys(hug.palette).length).toBeLessThanOrEqual(8);
    expect(propCharsUsed(hug.grid)).toEqual(new Set(Object.keys(hug.palette)));
  });

  it('shares the family rim, and its heart is the crown gem\'s rose', () => {
    expect(hug.palette.o).toBe(PROP_RIGS[ROUSE_ART_KEY].palette.o);
    expect(hug.palette.R).toBe(PROP_RIGS[CIRCLE_ART_KEY].palette.R);
  });

  it('is not a ring — the arms meet under the heart, and no arm pixel sits above the heart\'s top', () => {
    const rowsWith = (ch: string) => hug.grid.map((r, i) => (r.includes(ch) ? i : -1)).filter((i) => i >= 0);
    const heartTop = Math.min(...rowsWith('R'));
    const armTop = Math.min(...rowsWith('A'));
    const armBottom = Math.max(...rowsWith('A'), ...rowsWith('a'));
    const heartBottom = Math.max(...rowsWith('R'), ...rowsWith('r'));
    expect(armTop).toBeGreaterThan(heartTop);
    expect(armBottom).toBeGreaterThan(heartBottom);
  });

  it('is placed by the shipping world (reachability register)', () => {
    expect(worldPlacedProps().has(COMFORT_ART_KEY)).toBe(true);
  });
});

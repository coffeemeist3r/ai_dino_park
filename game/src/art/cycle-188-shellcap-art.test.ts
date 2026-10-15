import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { SHELLCAP_ART_KEY } from '../world/molt';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-606 — the shell cap (host 604). */
describe('cycle 188-art — the shell cap', () => {
  const rig = PROP_RIGS[SHELLCAP_ART_KEY];
  it('is a square 16px grid whose palette is exactly what it inks, on the family rim, and placed', () => {
    expect(rig).toBeDefined();
    expect(rig.grid).toHaveLength(16);
    for (const row of rig.grid) expect(row).toHaveLength(16);
    expect(Object.keys(rig.palette).length).toBeLessThanOrEqual(8);
    expect(propCharsUsed(rig.grid)).toEqual(new Set(Object.keys(rig.palette)));
    expect(rig.palette.o).toBe(PROP_RIGS.welcome.palette.o);
    expect(worldPlacedProps().has(SHELLCAP_ART_KEY)).toBe(true);
  });
  it('hangs from its bottom edge, broken in a zigzag, and is the same shell as the husk', () => {
    expect(rig.grid.slice(0, 8).join('')).toMatch(/^\.+$/);
    expect(rig.grid[15]).toMatch(/o\.o\.o/);
    expect(rig.palette.p).toBe(PROP_RIGS.molt.palette.p);
  });
});

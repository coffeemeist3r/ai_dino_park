import { describe, it, expect } from 'vitest';
import { isLoner, edgeTarget, perkUpLine, LONER_FLOOR, LONER_BONUS, MOPE_GLYPH } from '../../game/src/world/loner';
import { strengthen, type Bonds } from '../../game/src/social/bonds';

const COLS = 20;
const ROWS = 15;
const cast = ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade'];

describe('the loner (BACKLOG-135)', () => {
  it('a dino with no bond at/above the floor is a loner', () => {
    expect(isLoner({}, 'Rex', cast)).toBe(true);
    // a few weak ties, all below the floor → still a loner
    let b: Bonds = {};
    b = strengthen(b, 'Rex', 'Sunny', LONER_FLOOR - 1);
    b = strengthen(b, 'Rex', 'Twitch', 1);
    expect(isLoner(b, 'Rex', cast)).toBe(true);
  });

  it('one bond at/above the floor lifts a dino out of loner status', () => {
    let b: Bonds = {};
    b = strengthen(b, 'Rex', 'Sunny', LONER_FLOOR); // exactly the floor counts
    expect(isLoner(b, 'Rex', cast)).toBe(false);
    expect(isLoner(b, 'Sunny', cast)).toBe(false); // symmetric — Sunny is no longer alone either
    // Mossback, who shares no strong bond, is still a loner under the same graph
    expect(isLoner(b, 'Mossback', cast)).toBe(true);
  });

  it('a dino with no peers is a loner by default', () => {
    expect(isLoner({}, 'Rex', ['Rex'])).toBe(true);
    expect(isLoner({}, 'Rex', [])).toBe(true);
  });

  it('edgeTarget returns the nearest wall tile (one coord pinned to an edge)', () => {
    // near the left wall → snap to x=0, same row
    expect(edgeTarget({ tileX: 2, tileY: 7 }, COLS, ROWS)).toEqual({ tileX: 0, tileY: 7 });
    // near the top → snap to y=0, same column
    expect(edgeTarget({ tileX: 10, tileY: 1 }, COLS, ROWS)).toEqual({ tileX: 10, tileY: 0 });
    // near the right wall
    expect(edgeTarget({ tileX: 18, tileY: 5 }, COLS, ROWS)).toEqual({ tileX: COLS - 1, tileY: 5 });
    // near the bottom
    expect(edgeTarget({ tileX: 8, tileY: 13 }, COLS, ROWS)).toEqual({ tileX: 8, tileY: ROWS - 1 });
  });

  it('edgeTarget always lands on a wall', () => {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const t = edgeTarget({ tileX: x, tileY: y }, COLS, ROWS);
        const onWall = t.tileX === 0 || t.tileX === COLS - 1 || t.tileY === 0 || t.tileY === ROWS - 1;
        expect(onWall).toBe(true);
      }
    }
  });

  it('the perk-up line names the dino and carries the 💐 beat; constants are sane', () => {
    expect(perkUpLine('Rex')).toContain('Rex');
    expect(perkUpLine('Rex')).toContain('💐');
    expect(LONER_BONUS).toBeGreaterThan(0);
    expect(LONER_FLOOR).toBeGreaterThan(0);
    expect(MOPE_GLYPH).toBe('🥀');
  });
});

import { describe, it, expect } from 'vitest';
import {
  edgeTarget,
  keeperEdgeTarget,
  leansOnKeeper,
  leanMemory,
  LEAN_HEARTS,
} from '../../game/src/world/loner';

const COLS = 20;
const ROWS = 15;

describe('lonely lean on the keeper (BACKLOG-370)', () => {
  it('the heart floor is where the keeper outranks the nearest wall', () => {
    expect(leansOnKeeper(LEAN_HEARTS)).toBe(true);
    expect(leansOnKeeper(LEAN_HEARTS - 1)).toBe(false);
    expect(leansOnKeeper(0)).toBe(false);
    expect(leansOnKeeper(10)).toBe(true);
    // a fresh park is 0 hearts for every dino — the whole beat is dormant on a new save
    expect(leansOnKeeper(0, LEAN_HEARTS)).toBe(false);
  });

  it('aims at the wall the KEEPER is by, not the dino', () => {
    // keeper hugging the left wall → the left wall at the keeper's row
    expect(keeperEdgeTarget({ tileX: 1, tileY: 9 }, COLS, ROWS)).toEqual({ tileX: 0, tileY: 9 });
    // right
    expect(keeperEdgeTarget({ tileX: COLS - 2, tileY: 4 }, COLS, ROWS)).toEqual({ tileX: COLS - 1, tileY: 4 });
    // top
    expect(keeperEdgeTarget({ tileX: 10, tileY: 1 }, COLS, ROWS)).toEqual({ tileX: 10, tileY: 0 });
    // bottom
    expect(keeperEdgeTarget({ tileX: 10, tileY: ROWS - 2 }, COLS, ROWS)).toEqual({ tileX: 10, tileY: ROWS - 1 });
  });

  it('breaks a tie in the same order as edgeTarget (it delegates, so it cannot drift)', () => {
    // a keeper equidistant from left and right on an even-width grid
    const keeper = { tileX: 5, tileY: 7 };
    expect(keeperEdgeTarget(keeper, 11, ROWS)).toEqual(edgeTarget(keeper, 11, ROWS));
    // exhaustively: every tile on the grid resolves identically through both reads
    for (let x = 0; x < COLS; x++)
      for (let y = 0; y < ROWS; y++)
        expect(keeperEdgeTarget({ tileX: x, tileY: y }, COLS, ROWS)).toEqual(edgeTarget({ tileX: x, tileY: y }, COLS, ROWS));
  });

  it('edgeTarget itself is unchanged — a loner still takes its own nearest wall', () => {
    expect(edgeTarget({ tileX: 2, tileY: 7 }, COLS, ROWS)).toEqual({ tileX: 0, tileY: 7 });
    expect(edgeTarget({ tileX: 17, tileY: 7 }, COLS, ROWS)).toEqual({ tileX: COLS - 1, tileY: 7 });
  });

  it('the lean memory names the waiting, not the loneliness', () => {
    expect(leanMemory()).toBe('waited by the glass for the keeper');
  });
});

import { describe, it, expect } from 'vitest';
import {
  barterSwap,
  takeResource,
  bankResource,
  CRAFT_RECIPE,
  STOCKPILE_CAP,
  type Stockpile,
  type ResourceKind,
} from '../../game/src/world/resource';
import { nearLinkEdge, BOWL_ID, GROVE_ID, FERNREACH_ID } from '../../game/src/world/zones';

/**
 * Edge-meet barter (BACKLOG-358). Two dinos from different zones meeting at their shared edge swap the kind
 * each other's zone is short of (barterSwap = directedCarry both ways), on the lossless carry path.
 */

const COLS = 20;

/** Apply a barter the way WorldScene.doBarter does, returning the two resulting piles. */
function applyBarter(pileA: Stockpile, pileB: Stockpile, recipeA = CRAFT_RECIPE, recipeB = CRAFT_RECIPE) {
  const swap = barterSwap(pileA, pileB, recipeA, recipeB);
  let a = pileA;
  let b = pileB;
  if (swap.aGives) {
    a = takeResource(a, swap.aGives);
    b = bankResource(b, swap.aGives);
  }
  if (swap.bGives) {
    b = takeResource(b, swap.bGives);
    a = bankResource(a, swap.bGives);
  }
  return { swap, a, b };
}

const total = (a: Stockpile, b: Stockpile, k: ResourceKind) => (a[k] ?? 0) + (b[k] ?? 0);

describe('barterSwap — each side gives what the other needs', () => {
  it('A gives B its shortfall kind and B gives A its shortfall kind', () => {
    // A (branch-rich, needs stone) meets B (stone-rich, needs branch): they swap the useful kinds.
    const { swap } = applyBarter({ branch: 2 }, { stone: 2 });
    expect(swap.aGives).toBe('branch'); // B is short of branch for its cairn
    expect(swap.bGives).toBe('stone'); // A is short of stone for its cairn
  });

  it('is conserved on apply — one pile down, the other up, per direction', () => {
    const { a, b } = applyBarter({ branch: 2 }, { stone: 2 });
    expect(total(a, b, 'branch')).toBe(2); // 2 branch total before and after
    expect(total(a, b, 'stone')).toBe(2);
    expect(a.branch ?? 0).toBe(1); // A gave a branch
    expect(a.stone ?? 0).toBe(1); // A got a stone
    expect(b.stone ?? 0).toBe(1);
    expect(b.branch ?? 0).toBe(1);
  });

  it('never banks past the cap — a full destination for a kind blocks that direction', () => {
    // B is at cap for branch, so A cannot give branch (directedCarry filters a full destination).
    const { swap } = applyBarter({ branch: 3 }, { branch: STOCKPILE_CAP });
    expect(swap.aGives).toBeNull(); // branch is full at B → no move
  });

  it('is a no-op when neither side has anything the other can take', () => {
    expect(barterSwap({}, {})).toEqual({ aGives: null, bGives: null });
  });
});

describe('nearLinkEdge — the shared-edge gate', () => {
  it('reports the neighbour a dino is at the linking edge of, null in the interior', () => {
    expect(nearLinkEdge(BOWL_ID, { tileX: COLS - 1 }, COLS)).toBe(GROVE_ID); // bowl east → grove
    expect(nearLinkEdge(GROVE_ID, { tileX: 0 }, COLS)).toBe(BOWL_ID); // grove west → bowl
    expect(nearLinkEdge(BOWL_ID, { tileX: 10 }, COLS)).toBeNull(); // middle → not at an edge
  });

  it('a two-link zone reports whichever neighbour the tile is actually toward', () => {
    expect(nearLinkEdge(GROVE_ID, { tileX: 0 }, COLS)).toBe(BOWL_ID); // west edge → bowl
    expect(nearLinkEdge(GROVE_ID, { tileX: COLS - 1 }, COLS)).toBe(FERNREACH_ID); // east edge → Fernreach
  });
});

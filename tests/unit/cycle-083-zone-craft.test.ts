import { describe, it, expect } from 'vitest';
import {
  zoneStructure,
  structureRecipe,
  STRUCTURE_BY_BIAS,
  CRAFT_RECIPE,
  SHELTER_RECIPE,
  directedCarry,
  type Stockpile,
} from '../../game/src/world/resource';
import { BOWL_ID, GROVE_ID } from '../../game/src/world/zones';

/**
 * Zone-distinct craft (BACKLOG-377) — each zone builds the structure its bias (348) favors. The
 * stone-rich bowl stacks cairns; the branch-rich grove raises lean-tos. directedCarry now aims at the
 * destination zone's own structure recipe (356 recipe seam).
 */
describe('zone-distinct craft (BACKLOG-377)', () => {
  it('the bowl builds cairns, the grove builds lean-tos', () => {
    expect(zoneStructure(BOWL_ID)).toBe('cairn');
    expect(zoneStructure(GROVE_ID)).toBe('shelter');
  });

  it('an omitted/unknown zone defaults to the cairn (286 back-compat)', () => {
    expect(zoneStructure()).toBe('cairn');
    expect(zoneStructure('nowhere')).toBe('cairn');
  });

  it('STRUCTURE_BY_BIAS maps each bias kind to a distinct structure', () => {
    expect(STRUCTURE_BY_BIAS.stone).toBe('cairn');
    expect(STRUCTURE_BY_BIAS.branch).toBe('shelter');
  });

  it('structureRecipe returns the cairn recipe for the bowl, the lean-to recipe for the grove', () => {
    // BACKLOG-509: a ground's recipe is now its base *plus* the Ridge's tithe, so this asserts the base
    // kinds explicitly rather than identity against the base const. The shard is stated out loud here
    // because this spec depends on what a landmark costs.
    expect(structureRecipe(BOWL_ID)).toEqual({ ...CRAFT_RECIPE, obsidian: 1 });
    expect(structureRecipe(GROVE_ID)).toEqual({ ...SHELTER_RECIPE, obsidian: 1 });
    expect(structureRecipe()).toEqual({ ...CRAFT_RECIPE, obsidian: 1 }); // unknown → cairn recipe, tithed
  });

  it('directedCarry under the grove recipe pulls the kind it is short of for a lean-to', () => {
    // grove holds branches but is short of stone for {branch:6, stone:4}; a stone-holding source ferries stone.
    const src: Stockpile = { stone: 3, branch: 1 };
    const groveDest: Stockpile = { branch: 5, stone: 1 }; // 3 stone short of the lean-to, 1 branch short
    expect(directedCarry(src, groveDest, structureRecipe(GROVE_ID))).toBe('stone'); // larger deficit
  });

  it('directedCarry under the bowl recipe aims at the cairn recipe instead', () => {
    // same piles, but the bowl only needs {branch:3, stone:2}; dest already has stone≥2, short 0; branch short.
    const src: Stockpile = { stone: 3, branch: 3 };
    const bowlDest: Stockpile = { branch: 1, stone: 2 }; // cairn needs branch:3 (short 2), stone:2 (short 0)
    expect(directedCarry(src, bowlDest, structureRecipe(BOWL_ID))).toBe('branch');
  });
});

import { describe, it, expect } from 'vitest';
import {
  zoneStructure,
  structureRecipe,
  buildStructureFor,
  craft,
  STRUCTURE_BY_BIAS,
  CRAFT_RECIPE,
  SHELTER_RECIPE,
  THATCH_RECIPE,
  type Stockpile,
} from '../../game/src/world/resource';
import { BOWL_ID, GROVE_ID, FERNREACH_ID } from '../../game/src/world/zones';

/**
 * The Fernreach's frond thatch (BACKLOG-417) — the third distinct landmark. The frond-rich Fernreach (400)
 * now weaves a 🥻 thatch from its own gather instead of scraping cairns off its 25% off-kind, so the
 * three-zone chain raises three different structures.
 */
describe('frond thatch (BACKLOG-417)', () => {
  it('the Fernreach builds a thatch; bowl/grove are unchanged', () => {
    expect(zoneStructure(FERNREACH_ID)).toBe('thatch');
    expect(zoneStructure(BOWL_ID)).toBe('cairn');
    expect(zoneStructure(GROVE_ID)).toBe('shelter');
  });

  it('STRUCTURE_BY_BIAS is total over the ResourceKind union (no kind falls through)', () => {
    expect(STRUCTURE_BY_BIAS.stone).toBe('cairn');
    expect(STRUCTURE_BY_BIAS.branch).toBe('shelter');
    expect(STRUCTURE_BY_BIAS.frond).toBe('thatch');
  });

  it('structureRecipe returns the frond recipe for the Fernreach, others unchanged', () => {
    // BACKLOG-509: a ground's recipe is now its base *plus* the Ridge's tithe, so this asserts the base
    // kinds explicitly rather than identity against the base const. The shard is stated out loud here
    // because this spec depends on what a landmark costs.
    expect(structureRecipe(FERNREACH_ID)).toEqual({ frond: 4, obsidian: 1 });
    expect(structureRecipe(BOWL_ID)).toEqual({ ...CRAFT_RECIPE, obsidian: 1 });
    expect(structureRecipe(GROVE_ID)).toEqual({ ...SHELTER_RECIPE, obsidian: 1 });
  });

  it('buildStructureFor spends the Fernreach thatch recipe (frond -4) and its tithe', () => {
    // BACKLOG-509: the shard is seeded out loud, because this spec is about what a thatch costs and a
    // thatch now costs one climb. Without it the build defers — which is 509's whole point, and is
    // covered on its own in cycle-146-tithe.test.ts.
    const pile: Stockpile = { frond: 5, stone: 1, obsidian: 1 };
    const after = buildStructureFor(pile, FERNREACH_ID);
    expect(after).toEqual({ frond: 1, stone: 1, obsidian: 0 });
    expect(pile).toEqual({ frond: 5, stone: 1, obsidian: 1 }); // pure — input untouched
  });

  it('buildStructureFor returns null when the pile cannot afford the recipe', () => {
    expect(buildStructureFor({ frond: 3 }, FERNREACH_ID)).toBeNull();
    expect(buildStructureFor({}, BOWL_ID)).toBeNull();
  });

  it('buildStructureFor on a bowl pile spends the cairn recipe identically to craft() (parity, plus the tithe)', () => {
    // BACKLOG-509: `craft` is the untithed base spend and stays that way on purpose — it is the recipe,
    // not the bill. So parity is asserted against craft's result with the shard taken off beside it.
    const pile: Stockpile = { branch: 4, stone: 3, obsidian: 1 };
    expect(buildStructureFor(pile, BOWL_ID)).toEqual({ ...craft(pile), obsidian: 0 });
  });
});

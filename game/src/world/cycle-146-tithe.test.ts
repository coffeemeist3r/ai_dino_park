import { describe, it, expect } from 'vitest';
import {
  structureRecipe,
  buildStructureFor,
  recipeShortfall,
  shortOnlyTithe,
  directedCarry,
  barterSwap,
  CRAFT_RECIPE,
  TITHE,
  type Stockpile,
} from './resource';
import { GRANARY_RECIPE } from './granary';
import { shortfallLine } from './quarry';
import { BOWL_ID, GROVE_ID, FERNREACH_ID, RIDGE_ID } from './zones';

/** A pile that covers the bowl's base cairn recipe exactly, and holds no black glass. */
const READY_BUT_UNTITHED: Stockpile = { ...CRAFT_RECIPE };

describe('BACKLOG-509 — the tithe in the recipe', () => {
  it('costs every ordinary ground one shard', () => {
    for (const z of [BOWL_ID, GROVE_ID, FERNREACH_ID]) {
      expect(structureRecipe(z).obsidian).toBe(TITHE);
    }
  });

  it('exempts the source — the Ridge does not tithe to itself', () => {
    // The beacon's own three shards are its recipe, not a tithe; nothing is stacked on top.
    expect(structureRecipe(RIDGE_ID).obsidian).toBe(3);
  });

  it('tithes the back-compat default ground too', () => {
    expect(structureRecipe(undefined).obsidian).toBe(TITHE);
  });

  it('leaves the base recipes themselves alone', () => {
    expect(CRAFT_RECIPE.obsidian).toBeUndefined();
    expect(structureRecipe(BOWL_ID).branch).toBe(CRAFT_RECIPE.branch);
    expect(structureRecipe(BOWL_ID).stone).toBe(CRAFT_RECIPE.stone);
  });

  it('does not double the granary, which pays its own shard on its own path', () => {
    expect(GRANARY_RECIPE.obsidian).toBe(1);
  });
});

describe('BACKLOG-509 — an unpaid tithe defers, it does not fail', () => {
  it('returns null for a ground that has everything but the shard', () => {
    expect(buildStructureFor(READY_BUT_UNTITHED, BOWL_ID)).toBeNull();
  });

  it('builds once the shard arrives, and spends it', () => {
    const paid = buildStructureFor({ ...READY_BUT_UNTITHED, obsidian: 1 }, BOWL_ID);
    expect(paid).not.toBeNull();
    expect(paid!.obsidian).toBe(0);
    expect(paid!.branch).toBe(0);
  });
});

describe('BACKLOG-509 — the shortfall, derived once and read twice', () => {
  it('names the shard as the only thing missing', () => {
    expect(recipeShortfall(READY_BUT_UNTITHED, BOWL_ID)).toEqual({ obsidian: TITHE });
    expect(shortOnlyTithe(READY_BUT_UNTITHED, BOWL_ID)).toBe(true);
  });

  it('is empty for a ground that can already afford its landmark', () => {
    expect(recipeShortfall({ ...READY_BUT_UNTITHED, obsidian: 1 }, BOWL_ID)).toEqual({});
    expect(shortfallLine({ ...READY_BUT_UNTITHED, obsidian: 1 }, BOWL_ID)).toBe('');
  });

  it('refuses the errand promotion for a ground short of two kinds — 503s finding, pinned', () => {
    // The whole reason the promotion is conditional: an unconditional one made every migration an errand
    // and took the scarcity system dormant. A ground missing a branch as well still migrates on appeal.
    expect(shortOnlyTithe({ branch: 1, stone: 2 }, BOWL_ID)).toBe(false);
  });

  it('is never true on the source ground, which owes nobody', () => {
    expect(shortOnlyTithe({}, RIDGE_ID)).toBe(false);
  });
});

describe('BACKLOG-509 — the ground says what it is waiting on', () => {
  it('names the shard and where it comes from, on a ground holding nothing', () => {
    const line = shortfallLine({}, BOWL_ID);
    expect(line).toContain('🌑');
    expect(line).toContain('Sunward Ridge');
  });

  it('names a plain kind without a source, since anywhere can grow it', () => {
    const line = shortfallLine({ ...READY_BUT_UNTITHED, obsidian: 1, branch: 0 }, BOWL_ID);
    expect(line).toContain('🪵');
    expect(line).not.toContain('Sunward Ridge');
  });

  it('says nothing at all on the Ridge, which is standing on its own supply', () => {
    expect(shortfallLine({ obsidian: 3 }, RIDGE_ID)).toBe('');
  });
});

describe('BACKLOG-509 — the carry systems read the new shortfall', () => {
  it('has a Ridge dino carry the shard to a ground that owes it', () => {
    // The delivery half. `directedCarry` only proposes a kind the *source* holds, which is why the tithe
    // alone was never going to produce a climb — that is the errand tier's job, tested above.
    expect(directedCarry({ obsidian: 2 }, READY_BUT_UNTITHED, structureRecipe(BOWL_ID))).toBe('obsidian');
  });

  it('has a barter hand the shard toward the ground that needs it', () => {
    const swap = barterSwap({ obsidian: 2 }, READY_BUT_UNTITHED, structureRecipe(RIDGE_ID), structureRecipe(BOWL_ID));
    expect(swap.aGives).toBe('obsidian');
  });
});

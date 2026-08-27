import { describe, it, expect } from 'vitest';
import {
  pickKind,
  zoneStructure,
  structureRecipe,
  buildStructureFor,
  ZONE_EXCLUSIVE,
  BEACON_RECIPE,
  RESOURCE_GLYPH,
  type ResourceKind,
} from '../../game/src/world/resource';
import { canBuildGranary, GRANARY_RECIPE, GRANARY_AFTER_STRUCTURES } from '../../game/src/world/granary';
import { quarryGround, quarryKind, needsQuarry, quarryDest } from '../../game/src/world/quarry';
import { zoneChain, BOWL_ID, GROVE_ID, FERNREACH_ID, HOLLOW_ID, RIDGE_ID } from '../../game/src/world/zones';

/**
 * BACKLOG-503 — the branch gets a stake.
 *
 * The whole item rests on one claim that is easy to state and easy to break by accident: obsidian falls on
 * the Ridge and on no other ground, and the Ridge falls nothing else. Both halves are asserted at the
 * `BIAS_WEIGHT` boundary rather than at a convenient midpoint, because 0.75 is exactly where the existing
 * lean flips and is the value a careless edit would slide past.
 */

const RANDS = [0, 0.25, 0.5, 0.74, 0.749999, 0.75, 0.9, 0.999];

describe('obsidian is exclusive to the Ridge', () => {
  it('the Ridge rolls obsidian at every point in the stream', () => {
    for (const r of RANDS) expect(pickKind(() => r, RIDGE_ID)).toBe('obsidian');
  });

  it('no other ground can ever roll it', () => {
    for (const zone of zoneChain()) {
      if (zone === RIDGE_ID) continue;
      for (const r of RANDS) expect(pickKind(() => r, zone)).not.toBe('obsidian');
    }
  });

  it('an omitted or unknown zone can never roll it either', () => {
    for (const r of RANDS) {
      expect(pickKind(() => r)).not.toBe('obsidian');
      expect(pickKind(() => r, 'nowhere')).not.toBe('obsidian');
    }
  });

  it('leaves every other ground byte-identical to the pre-503 lean', () => {
    // The pre-503 rule, restated here rather than imported, so a change to `pickKind` has to disagree with
    // a written-down claim instead of quietly agreeing with itself.
    const before = (r: number, zone?: string): ResourceKind => {
      const favored = zone ? ({ [BOWL_ID]: 'stone', [GROVE_ID]: 'branch', [FERNREACH_ID]: 'frond' } as Record<string, ResourceKind>)[zone] : undefined;
      if (!favored) return r < 0.5 ? 'branch' : 'stone';
      const other: ResourceKind = favored === 'branch' ? 'stone' : 'branch';
      return r < 0.75 ? favored : other;
    };
    for (const zone of [BOWL_ID, GROVE_ID, FERNREACH_ID, HOLLOW_ID, undefined]) {
      for (const r of RANDS) expect(pickKind(() => r, zone)).toBe(before(r, zone));
    }
  });

  it('appends the new kind last, so every KINDS-order tie-break is unchanged', () => {
    expect(Object.keys(RESOURCE_GLYPH)).toEqual(['branch', 'stone', 'frond', 'obsidian']);
  });
});

describe('the beacon is the Ridge structure', () => {
  it('the Ridge raises a beacon and nothing else does', () => {
    expect(zoneStructure(RIDGE_ID)).toBe('beacon');
    expect(zoneStructure(BOWL_ID)).toBe('cairn');
    expect(zoneStructure(GROVE_ID)).toBe('shelter');
    expect(zoneStructure(FERNREACH_ID)).toBe('thatch');
    expect(zoneStructure(HOLLOW_ID)).toBe('cairn');
    expect(zoneStructure()).toBe('cairn');
  });

  it('costs obsidian and only obsidian', () => {
    expect(structureRecipe(RIDGE_ID)).toBe(BEACON_RECIPE);
    expect(Object.keys(BEACON_RECIPE)).toEqual(['obsidian']);
  });

  it('spends the recipe when the pile covers it and refuses when it does not', () => {
    expect(buildStructureFor({ obsidian: 3 }, RIDGE_ID)).toEqual({ obsidian: 0 });
    expect(buildStructureFor({ obsidian: 2 }, RIDGE_ID)).toBeNull();
    // The pile a pre-503 Ridge would have held: plenty of stone and branch, and no beacon in it.
    expect(buildStructureFor({ branch: 8, stone: 8 }, RIDGE_ID)).toBeNull();
  });

  it('is what keeps the Ridge able to build at all — the exclusivity would otherwise strand it', () => {
    // Without the STRUCTURE_BY_BIAS row, `structureRecipe(RIDGE_ID)` would be the cairn's branch+stone,
    // which a ground that only ever gathers obsidian can never afford. This is that claim, pinned.
    const ridgeGathers = pickKind(() => 0.5, RIDGE_ID);
    const recipe = structureRecipe(RIDGE_ID);
    expect(Object.keys(recipe)).toContain(ridgeGathers);
  });
});

describe('the granary is the need that forces the climb', () => {
  const enough = { branch: 3, stone: 3 };
  const args = (pile: Record<string, number>) =>
    canBuildGranary(pile as never, GRANARY_AFTER_STRUCTURES, false);

  it('needs one obsidian on top of what it always needed', () => {
    expect(GRANARY_RECIPE.obsidian).toBe(1);
  });

  it('cannot be raised by a ground that has never sent anybody up the Ridge', () => {
    expect(args(enough)).toBe(false);
  });

  it('can be raised the moment one shard is home', () => {
    expect(args({ ...enough, obsidian: 1 })).toBe(true);
  });
});

describe('the quarry errand', () => {
  it('knows the one ground that holds the stake', () => {
    expect(quarryGround()).toBe(RIDGE_ID);
    expect(quarryKind()).toBe('obsidian');
    expect(ZONE_EXCLUSIVE[RIDGE_ID]).toBe('obsidian');
  });

  it('a ground with none has an errand; a ground with any does not', () => {
    expect(needsQuarry({})).toBe(true);
    expect(needsQuarry({ branch: 8, stone: 8, frond: 8 })).toBe(true);
    expect(needsQuarry({ obsidian: 1 })).toBe(false);
  });

  it('routes multi-hop toward the Ridge rather than only to a neighbour', () => {
    // The Ridge hangs north off the Grove; the Hollow is two grounds east of it. A Hollow dino gets the
    // first step of the walk, not a shrug.
    const fromHollow = quarryDest(HOLLOW_ID, {});
    expect(fromHollow).not.toBeNull();
    expect(fromHollow).not.toBe(RIDGE_ID); // it is a hop, not a teleport
    expect(quarryDest(GROVE_ID, {})).toBe(RIDGE_ID); // the Grove is one hop away
  });

  it('nobody standing on the Ridge quarries, and nobody with a shard in the pile does', () => {
    expect(quarryDest(RIDGE_ID, {})).toBeNull();
    expect(quarryDest(BOWL_ID, { obsidian: 1 })).toBeNull();
  });

  it('is deterministic — the same home and pile always give the same hop', () => {
    const first = quarryDest(BOWL_ID, {});
    for (let i = 0; i < 20; i++) expect(quarryDest(BOWL_ID, {})).toBe(first);
  });
});

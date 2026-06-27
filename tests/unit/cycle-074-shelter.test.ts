import { describe, it, expect } from 'vitest';
import {
  canBuildShelter,
  buildShelter,
  SHELTER_RECIPE,
  CRAFT_RECIPE,
  type Stockpile,
} from '../../game/src/world/resource';

describe('dino-built shelter (BACKLOG-315)', () => {
  const enough: Stockpile = { branch: 6, stone: 4 };

  it('canBuildShelter is false below either threshold', () => {
    expect(canBuildShelter({})).toBe(false);
    expect(canBuildShelter({ branch: 6 })).toBe(false); // no stone
    expect(canBuildShelter({ branch: 5, stone: 4 })).toBe(false); // a branch short
    expect(canBuildShelter({ branch: 6, stone: 3 })).toBe(false); // a stone short
  });

  it('canBuildShelter is true at or above every recipe threshold', () => {
    expect(canBuildShelter(enough)).toBe(true);
    expect(canBuildShelter({ branch: 8, stone: 8 })).toBe(true);
  });

  it('buildShelter subtracts exactly the recipe cost', () => {
    expect(buildShelter({ branch: 8, stone: 6 })).toEqual({
      branch: 8 - SHELTER_RECIPE.branch!,
      stone: 6 - SHELTER_RECIPE.stone!,
    });
  });

  it('buildShelter of an exactly-affordable pile leaves the recipe kinds at 0', () => {
    expect(buildShelter(enough)).toEqual({ branch: 0, stone: 0 });
  });

  it('buildShelter returns null when unaffordable', () => {
    expect(buildShelter({ branch: 5, stone: 4 })).toBeNull();
    expect(buildShelter({})).toBeNull();
  });

  it('buildShelter is pure — never mutates the input pile', () => {
    const before: Stockpile = { branch: 7, stone: 5 };
    const after = buildShelter(before);
    expect(before).toEqual({ branch: 7, stone: 5 });
    expect(after).not.toBe(before);
  });

  it('the shelter recipe is strictly richer than the cairn recipe (a higher build bar)', () => {
    expect(SHELTER_RECIPE.branch!).toBeGreaterThan(CRAFT_RECIPE.branch!);
    expect(SHELTER_RECIPE.stone!).toBeGreaterThan(CRAFT_RECIPE.stone!);
  });

  it('both recipe kinds stay within the per-kind stockpile cap (8), so the pile can reach them', () => {
    // SHELTER_RECIPE must be affordable under STOCKPILE_CAP=8 or no shelter could ever be built.
    expect(SHELTER_RECIPE.branch!).toBeLessThanOrEqual(8);
    expect(SHELTER_RECIPE.stone!).toBeLessThanOrEqual(8);
  });

  // NOTE (BACKLOG-377): the lean-to is no longer a per-zone *escalation* after the cairn (the retired
  // SHELTER_AFTER_CAIRNS bar). It is now the grove's bias-chosen landmark — the bowl stacks cairns, the
  // grove raises lean-tos. The build math above is unchanged; the *selection* moved to zoneStructure
  // (see cycle-083-zone-craft.test.ts + cycle-074-shelter.spec.ts).
});

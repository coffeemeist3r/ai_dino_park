import { describe, it, expect } from 'vitest';
import {
  blendTraits,
  blendColor,
  childName,
  eggId,
  makeEgg,
  isHatched,
  hatch,
  shouldLay,
  EGG_HATCH_DAYS,
  EGG_BOND_THRESHOLD,
  MAX_POPULATION,
} from '../../game/src/social/breeding';
import type { Personality } from '../../game/src/ai/personality';

const A: Personality = { curiosity: 0.2, sociability: 0.8, energy: 0.4, agreeableness: 1.0, bravery: 0.6 };
const B: Personality = { curiosity: 0.8, sociability: 0.2, energy: 0.6, agreeableness: 0.0, bravery: 0.4 };

describe('blendTraits', () => {
  it('averages each axis with no jitter by default', () => {
    expect(blendTraits(A, B)).toEqual({
      curiosity: 0.5,
      sociability: 0.5,
      energy: 0.5,
      agreeableness: 0.5,
      bravery: 0.5,
    });
  });

  it('stays clamped to [0,1] under extreme jitter', () => {
    const hi = blendTraits(A, B, () => 1);
    const lo = blendTraits(A, B, () => 0);
    for (const v of [...Object.values(hi), ...Object.values(lo)]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('blendColor', () => {
  it('averages each channel', () => {
    expect(blendColor(0xffffff, 0x000000)).toBe(0x7f7f7f);
    expect(blendColor(0x8a4a3a, 0x4a7a4a)).toBe(0x6a6242);
  });
});

describe('childName', () => {
  it('blends a prefix of one parent with a suffix of the other', () => {
    expect(childName('Rex', 'Mossback')).toBe('Rexback');
  });
  it('is capitalized and non-empty', () => {
    const n = childName('Sunny', 'Glade');
    expect(n.length).toBeGreaterThan(1);
    expect(n[0]).toBe(n[0].toUpperCase());
  });
});

describe('egg lifecycle', () => {
  it('makeEgg sets a hatch day EGG_HATCH_DAYS out and a stable id', () => {
    const egg = makeEgg('Rex', 'Mossback', 2, { tileX: 11, tileY: 11 });
    expect(egg.hatchDay).toBe(2 + EGG_HATCH_DAYS);
    expect(egg.id).toBe(eggId('Rex', 'Mossback', 2));
    expect(egg.id).toBe(eggId('Mossback', 'Rex', 2)); // symmetric
  });

  it('isHatched flips only on/after the hatch day', () => {
    const egg = makeEgg('Rex', 'Sunny', 1, { tileX: 11, tileY: 11 });
    expect(isHatched(egg, egg.hatchDay - 1)).toBe(false);
    expect(isHatched(egg, egg.hatchDay)).toBe(true);
    expect(isHatched(egg, egg.hatchDay + 5)).toBe(true);
  });

  it('hatch blends parents into a young dino', () => {
    const egg = makeEgg('Rex', 'Mossback', 1, { tileX: 11, tileY: 11 });
    const baby = hatch(
      egg,
      { traitsA: A, traitsB: B, speciesA: 'triceratops', speciesB: 'stegosaurus', colorA: 0x8a4a3a, colorB: 0x4a7a4a },
      'Rexback',
    );
    expect(baby.name).toBe('Rexback');
    expect(baby.traits).toEqual(blendTraits(A, B));
    expect(baby.color).toBe(blendColor(0x8a4a3a, 0x4a7a4a));
    expect(baby.personality).toContain('child of Rex and Mossback');
    expect(['triceratops', 'stegosaurus']).toContain(baby.species);
    expect(baby.tileX).toBe(11);
  });
});

describe('shouldLay', () => {
  const base = {
    bond: EGG_BOND_THRESHOLD,
    population: 5,
    isClearNight: true,
    bothHuddling: true,
    hasEggForPair: false,
  };

  it('lays when all conditions hold', () => {
    expect(shouldLay(base)).toBe(true);
  });

  it('refuses below the bond threshold', () => {
    expect(shouldLay({ ...base, bond: EGG_BOND_THRESHOLD - 1 })).toBe(false);
  });

  it('refuses by day, when not huddling, or with a pending clutch', () => {
    expect(shouldLay({ ...base, isClearNight: false })).toBe(false);
    expect(shouldLay({ ...base, bothHuddling: false })).toBe(false);
    expect(shouldLay({ ...base, hasEggForPair: true })).toBe(false);
  });

  it('refuses at the population cap', () => {
    expect(shouldLay({ ...base, population: MAX_POPULATION })).toBe(false);
  });
});

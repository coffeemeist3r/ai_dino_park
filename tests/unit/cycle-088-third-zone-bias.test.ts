import { describe, it, expect } from 'vitest';
import {
  pickKind,
  stockpileLine,
  pickCarry,
  directedCarry,
  barterSwap,
  zoneStructure,
  structureRecipe,
  CRAFT_RECIPE,
  THATCH_RECIPE,
  BIAS_WEIGHT,
  type ResourceKind,
} from '../../game/src/world/resource';
import { BOWL_ID, GROVE_ID, FERNREACH_ID } from '../../game/src/world/zones';

/**
 * Third-zone resource bias (BACKLOG-400). The Fernreach leans a third kind (🌾 frond), extending the
 * two-row ZONE_BIAS (348). Bowl/grove distributions stay byte-identical and frond is Fernreach-exclusive.
 */

/** A deterministic pseudo-random stream in [0,1) so the roll distributions are reproducible. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function tally(zone: string | undefined, n: number): Record<ResourceKind, number> {
  const rng = seeded(12345);
  const out: Record<ResourceKind, number> = { branch: 0, stone: 0, frond: 0 };
  for (let i = 0; i < n; i++) out[pickKind(rng, zone)]++;
  return out;
}

describe('BACKLOG-400 third-zone resource bias', () => {
  const N = 4000;

  it('the Fernreach leans frond (~BIAS_WEIGHT), with a branch/stone off-kind', () => {
    const t = tally(FERNREACH_ID, N);
    expect(t.frond).toBeGreaterThan(0);
    expect(t.frond / N).toBeGreaterThan(0.5); // favored dominates
    expect(t.frond / N).toBeCloseTo(BIAS_WEIGHT, 1);
    expect(t.branch + t.stone).toBeGreaterThan(0); // the off-kind still appears
  });

  it('frond is Fernreach-exclusive — it never rolls in the bowl, grove, or an unbiased/no-zone roll', () => {
    expect(tally(BOWL_ID, N).frond).toBe(0);
    expect(tally(GROVE_ID, N).frond).toBe(0);
    expect(tally(undefined, N).frond).toBe(0);
    expect(tally('nowhere', N).frond).toBe(0);
  });

  it('bowl leans stone and grove leans branch (348 distribution intact)', () => {
    const bowl = tally(BOWL_ID, N);
    expect(bowl.stone / N).toBeCloseTo(BIAS_WEIGHT, 1);
    const grove = tally(GROVE_ID, N);
    expect(grove.branch / N).toBeCloseTo(BIAS_WEIGHT, 1);
  });

  it('no-zone roll stays a uniform branch/stone 50/50', () => {
    const t = tally(undefined, N);
    expect(t.branch / N).toBeCloseTo(0.5, 1);
    expect(t.stone / N).toBeCloseTo(0.5, 1);
  });

  it('stockpileLine lists frond in RESOURCE_GLYPH order (branch, stone, frond)', () => {
    expect(stockpileLine({ frond: 2, branch: 1 })).toBe('🪵 1 · 🌾 2');
    expect(stockpileLine({ frond: 3 })).toBe('🌾 3');
    expect(stockpileLine({})).toBe('');
  });

  it('carry moves frond as a spare, but directed carry never pulls it for the cairn recipe', () => {
    expect(pickCarry({ frond: 3 }, {})).toBe('frond'); // a spare frond can ferry
    // frond isn't a CRAFT_RECIPE kind → no deficit → falls back to a spare (still lossless, not a no-op)
    expect(directedCarry({ frond: 3 }, {}, CRAFT_RECIPE)).toBe('frond');
    // a recipe kind still wins the direction over a spare frond
    expect(directedCarry({ branch: 1, frond: 3 }, {}, CRAFT_RECIPE)).toBe('branch');
  });

  it('the Fernreach now weaves a frond thatch (BACKLOG-417 shipped; was cairn placeholder) and is type-complete', () => {
    // Contract overturned by BACKLOG-417 (the follow-up this test's old name pointed to): frond → 'thatch'.
    expect(zoneStructure(FERNREACH_ID)).toBe('thatch');
    expect(structureRecipe(FERNREACH_ID)).toBe(THATCH_RECIPE);
    expect(structureRecipe(FERNREACH_ID)).not.toBe(CRAFT_RECIPE);
  });

  it('barter moves a frond-heavy Fernreach pile to a neighbour via the spare fallback', () => {
    const swap = barterSwap({ frond: 4 }, {}); // A=fernreach-ish pile, B empty
    expect(swap.aGives).toBe('frond'); // A hands B a frond (B has no craft shortfall A can fill → spare)
    expect(swap.bGives).toBeNull(); // B empty → nothing to give
  });
});

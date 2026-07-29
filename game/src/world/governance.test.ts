import { describe, it, expect } from 'vitest';
import {
  providerPriority,
  feedReserve,
  granaryDeferredForFeeding,
  BANK_RESERVE,
  FEED_BUILD_FLOOR,
  type SpendPriority,
} from './governance';
import type { Personality } from '../ai/personality';
import { pickFoodToSpend } from './foodstore';

const traits = (agreeableness: number): Personality => ({
  curiosity: 0.5,
  sociability: 0.5,
  energy: 0.5,
  agreeableness,
  bravery: 0.5,
});

describe('the provider\'s say (BACKLOG-463)', () => {
  describe('providerPriority — temperament sets the table', () => {
    it('a warm provider feeds first (agreeableness ≥ 0.5)', () => {
      expect(providerPriority(traits(0.5))).toBe('feed');
      expect(providerPriority(traits(0.9))).toBe('feed');
    });
    it('a prickly provider banks toward the granary (agreeableness < 0.5)', () => {
      expect(providerPriority(traits(0.49))).toBe('bank');
      expect(providerPriority(traits(0))).toBe('bank');
    });
    it('an absent trait set defaults to feed', () => {
      expect(providerPriority(undefined)).toBe('feed');
    });
  });

  describe('feedReserve — hook 1 (444 pantry-spend)', () => {
    it('a bank zone holds a reserve back', () => {
      expect(feedReserve('bank')).toBe(BANK_RESERVE);
    });
    it('a feed zone keeps nothing back', () => {
      expect(feedReserve('feed')).toBe(0);
    });
    it('no provider (null/undefined) → 0, the compatibility seam', () => {
      expect(feedReserve(null)).toBe(0);
      expect(feedReserve(undefined)).toBe(0);
    });
  });

  describe('granaryDeferredForFeeding — hook 2 (454 build gate)', () => {
    it('a feed zone defers only while the store is thin', () => {
      expect(granaryDeferredForFeeding('feed', FEED_BUILD_FLOOR - 1)).toBe(true);
      expect(granaryDeferredForFeeding('feed', FEED_BUILD_FLOOR)).toBe(false);
      expect(granaryDeferredForFeeding('feed', 0)).toBe(true);
    });
    it('a bank zone never defers', () => {
      expect(granaryDeferredForFeeding('bank', 0)).toBe(false);
      expect(granaryDeferredForFeeding('bank', 99)).toBe(false);
    });
    it('no provider never defers, at any total — the compatibility seam', () => {
      expect(granaryDeferredForFeeding(null, 0)).toBe(false);
      expect(granaryDeferredForFeeding(undefined, 0)).toBe(false);
    });
  });

  describe('pickFoodToSpend reserve (foodstore, driven by feedReserve)', () => {
    it('a reserve of 1 holds back a lone unit — the bank zone won\'t spend its last', () => {
      expect(pickFoodToSpend({ berries: 1 }, 'berries', feedReserve('bank'))).toBeNull();
    });
    it('above the reserve it still spends', () => {
      expect(pickFoodToSpend({ berries: 2 }, 'berries', feedReserve('bank'))).toBe('berries');
    });
    it('a feed zone (reserve 0) spends the last unit — byte-identical to the default', () => {
      expect(pickFoodToSpend({ berries: 1 }, 'berries', feedReserve('feed'))).toBe('berries');
      expect(pickFoodToSpend({ berries: 1 }, 'berries')).toBe('berries');
    });
    it('the reserve also gates the most-stocked fallback (no favorite; real FOODS id)', () => {
      expect(pickFoodToSpend({ berries: 1 }, undefined, 1)).toBeNull();
      expect(pickFoodToSpend({ berries: 2 }, undefined, 1)).toBe('berries');
    });
  });

  it('the two hooks compose into opposite, self-consistent stances', () => {
    const feed: SpendPriority = 'feed';
    const bank: SpendPriority = 'bank';
    // feed: spends to zero (no reserve) but waits to build while thin
    expect(feedReserve(feed)).toBe(0);
    expect(granaryDeferredForFeeding(feed, 1)).toBe(true);
    // bank: holds a reserve but builds eagerly
    expect(feedReserve(bank)).toBe(BANK_RESERVE);
    expect(granaryDeferredForFeeding(bank, 1)).toBe(false);
  });
});

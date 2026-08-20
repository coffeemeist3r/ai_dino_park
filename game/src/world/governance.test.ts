import { describe, it, expect } from 'vitest';
import {
  councilMajority,
  councilSpendPriority,
  spendCallMeaning,
  SPEND_CALL,
  type SpendPriority,
  providerPriority,
  feedReserve,
  granaryDeferredForFeeding,
  BANK_RESERVE,
  FEED_BUILD_FLOOR,
  spendGlyph,
  workGlyph,
  governanceLine,
  governanceLegend,
  GOVERNANCE_CALLS,
  SPEND_CALL,
  WORK_CALL,
  UNSET_GLYPH,
  councilWorkPriority,
  workCallMeaning,
  type SpendPriority,
  type WorkPriority,
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

describe("both of the ground's calls, on the lens (BACKLOG-477)", () => {
  it('the table describes exactly the glyphs the two shipped readers already use', () => {
    // the descriptors are the data spendGlyph/workGlyph were hand-writing — pinned so they cannot drift
    for (const o of SPEND_CALL.options) expect(spendGlyph(o.value as SpendPriority)).toBe(o.glyph);
    for (const o of WORK_CALL.options) expect(workGlyph(o.value as WorkPriority)).toBe(o.glyph);
    expect(GOVERNANCE_CALLS).toEqual([SPEND_CALL, WORK_CALL]); // pantry before labour
  });

  it('folds both calls into one row, in table order', () => {
    const line = governanceLine(['feed', 'build']);
    expect(line).toContain(spendGlyph('feed'));
    expect(line).toContain(workGlyph('build'));
    expect(line.indexOf(spendGlyph('feed'))).toBeLessThan(line.indexOf(workGlyph('build')));
  });

  it('keeps the position of a call the ground has not made yet', () => {
    const line = governanceLine(['bank', null]);
    expect(line).toContain(spendGlyph('bank'));
    expect(line).toContain(UNSET_GLYPH);
    // and the other way round — the labour call alone still reads as the *second* position
    const other = governanceLine([null, 'gather']);
    expect(other.indexOf(UNSET_GLYPH)).toBeLessThan(other.indexOf(workGlyph('gather')));
  });

  it('renders nothing at all for a ground that has decided nothing — the null seam, unchanged', () => {
    expect(governanceLine([null, null])).toBe('');
    expect(governanceLine([undefined, undefined])).toBe('');
    expect(governanceLine([])).toBe('');
  });

  it('the legend explains every glyph the row can draw, including the placeholder', () => {
    const legend = governanceLegend().join('\n');
    for (const call of GOVERNANCE_CALLS) {
      for (const o of call.options) {
        expect(legend).toContain(o.glyph);
        expect(legend).toContain(o.meaning);
      }
      expect(legend).toContain(call.name);
    }
    expect(legend).toContain(UNSET_GLYPH);
  });

  it('is table-driven: a third call would add a position without touching either function', () => {
    const third = governanceLine(['feed', 'build', 'whatever']);
    expect(third).toBe(governanceLine(['feed', 'build'])); // extra values beyond the table are ignored
    // title + one row per option + the placeholder row
    const options = GOVERNANCE_CALLS.reduce((n, c) => n + c.options.length, 0);
    expect(governanceLegend().length).toBe(options + 2);
  });
});

describe('councilWorkPriority (BACKLOG-481 / 031)', () => {
  it('is null with no seats — a ground that seats nobody has decided nothing by council', () => {
    expect(councilWorkPriority([], 'build')).toBeNull();
    expect(councilWorkPriority([], null)).toBeNull();
  });

  it('a single seat is that seat, so a council of one behaves as that dino did alone (pre-481)', () => {
    expect(councilWorkPriority(['gather'], 'build')).toBe('gather');
    expect(councilWorkPriority(['build'], 'gather')).toBe('build');
  });

  it('majority wins', () => {
    expect(councilWorkPriority(['build', 'build', 'gather'], 'gather')).toBe('build');
    expect(councilWorkPriority(['gather', 'gather', 'build'], 'build')).toBe('gather');
  });

  it('the provider breaks an even split', () => {
    expect(councilWorkPriority(['build', 'gather'], 'gather')).toBe('gather');
    expect(councilWorkPriority(['build', 'gather'], 'build')).toBe('build');
  });

  it('with no provider, the biggest contributor breaks it — never null once anyone has voted', () => {
    expect(councilWorkPriority(['build', 'gather'], null)).toBe('build'); // votes[0], seats are most-banked first
    expect(councilWorkPriority(['gather', 'build'], null)).toBe('gather');
  });

  it('a unanimous council does not need the tie-break at all', () => {
    expect(councilWorkPriority(['gather', 'gather'], 'build')).toBe('gather');
  });

  it('the ticker reads the same table the lens glyph and the legend read', () => {
    for (const o of WORK_CALL.options) {
      expect(workCallMeaning(o.value as WorkPriority)).toBe(o.meaning);
    }
  });
});

/**
 * The other call goes to the council (BACKLOG-487) — Milestone 14's last arc.
 *
 * `councilWorkPriority`'s own cases above are left byte-identical on purpose: they are the proof that
 * turning its body into a generic changed no answer.
 */
describe('BACKLOG-487 — the pantry call at the same seats', () => {
  it('councilMajority takes the plurality', () => {
    expect(councilMajority(['a', 'a', 'b'], null)).toBe('a');
    expect(councilMajority(['a', 'a', 'a'], 'b')).toBe('a'); // unanimity never reaches the tie-break
    expect(councilMajority(['a', 'b', 'b'], 'a')).toBe('b');
  });

  it('councilMajority falls to the say on an even split, then to the top banker', () => {
    expect(councilMajority(['a', 'b'], 'b')).toBe('b');
    expect(councilMajority(['a', 'b'], null)).toBe('a'); // votes[0] — seats are most-banked first
    expect(councilMajority(['b', 'a'], null)).toBe('b');
  });

  it('councilMajority answers null for a ground that seats nobody — the compatibility seam', () => {
    expect(councilMajority([], 'a')).toBeNull();
    expect(councilMajority<string>([], null)).toBeNull();
  });

  it('councilMajority is stated for a plurality, not just two options', () => {
    expect(councilMajority(['a', 'b', 'b', 'c'], null)).toBe('b');
    expect(councilMajority(['a', 'b', 'c'], 'c')).toBe('c'); // three-way tie falls to the say
  });

  it('the pantry vote is the work vote’s twin, over its own enum', () => {
    expect(councilSpendPriority(['feed', 'feed', 'bank'], null)).toBe('feed');
    expect(councilSpendPriority(['feed', 'bank'], 'bank')).toBe('bank'); // the provider breaks it
    expect(councilSpendPriority(['feed', 'bank'], null)).toBe('feed'); // ...else the biggest contributor
    expect(councilSpendPriority([], 'feed')).toBeNull();
  });

  it('a council of one behaves exactly as that one dino did alone — why a shipping park is bit-identical', () => {
    expect(councilSpendPriority(['feed'], null)).toBe('feed');
    expect(councilSpendPriority(['bank'], null)).toBe('bank');
  });

  it('the pantry beat reads the same table the lens glyph and the legend read', () => {
    for (const o of SPEND_CALL.options) {
      expect(spendCallMeaning(o.value as SpendPriority)).toBe(o.meaning);
    }
  });
});

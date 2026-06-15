import { describe, it, expect } from 'vitest';
import {
  COLD_SEASON,
  sleptCold,
  coldShiver,
  coldMemory,
  WARM_BONUS,
  warmGain,
  warmLine,
  warmMemory,
  neglectMemory,
  COLD_NEWS_TOKEN,
  coldWordLine,
  spreadColdWord,
  WARM_NEWS_TOKEN,
  warmWordLine,
  spreadWarmWord,
  SYMPATHY_BOND,
  heardColdWordAbout,
  cameToFindMemory,
  sympathyLine,
  sympathyVisit,
  recovered,
  reliefLine,
  reliefMemory,
  selfCorrect,
} from '../../game/src/world/cold';
import { COMFORT_BOND, comfortMemory } from '../../game/src/world/comfort';
import { REPAIR_BONUS } from '../../game/src/world/repair';
import { RUMOR_MARK, isShareable, makeRumor } from '../../game/src/social/gossip';
import { remember, type MemoryStore } from '../../game/src/ai/memory';
import { greetGain } from '../../game/src/social/friendship';
import { SEASONS, type Season } from '../../game/src/world/seasons';
import type { Personality } from '../../game/src/ai/personality';

const WARM: Season[] = SEASONS.filter((s) => s !== COLD_SEASON);

describe('cold-night shiver (BACKLOG-179)', () => {
  it('a winter night never huddled sleeps cold', () => {
    expect(sleptCold(false, 'winter')).toBe(true);
  });

  it('a winter night that did huddle is warm', () => {
    expect(sleptCold(true, 'winter')).toBe(false);
  });

  it('warm seasons never leave a sleeper cold, huddled or not', () => {
    for (const s of WARM) {
      expect(sleptCold(false, s)).toBe(false);
      expect(sleptCold(true, s)).toBe(false);
    }
  });

  it('huddling is never cold in any season', () => {
    for (const s of SEASONS) expect(sleptCold(true, s)).toBe(false);
  });

  it('only winter is the cold season', () => {
    expect(COLD_SEASON).toBe('winter');
  });

  it('the shiver bubble and the stored memory are distinct, non-empty, and both freezing', () => {
    expect(coldShiver().length).toBeGreaterThan(0);
    expect(coldMemory().length).toBeGreaterThan(0);
    expect(coldShiver()).toContain('🥶');
    expect(coldMemory()).toContain('🥶');
    expect(coldShiver()).not.toBe(coldMemory());
  });
});

describe("keeper's warmth (BACKLOG-184)", () => {
  const corners: Array<Personality | undefined> = [
    undefined,
    { curiosity: 0, sociability: 0, energy: 0, agreeableness: 0, bravery: 0 },
    { curiosity: 1, sociability: 1, energy: 1, agreeableness: 1, bravery: 1 },
    { curiosity: 1, sociability: 0, energy: 1, agreeableness: 0, bravery: 1 },
    { curiosity: 0, sociability: 1, energy: 0, agreeableness: 1, bravery: 0 },
  ];

  it('a warming greet is a normal greet plus the bonus — personality still scales the mend', () => {
    for (const t of corners) expect(warmGain(t)).toBe(greetGain(t) + WARM_BONUS);
  });

  it('the warm bonus matches the repair bonus — the two mends weigh the same', () => {
    expect(WARM_BONUS).toBe(REPAIR_BONUS);
    expect(WARM_BONUS).toBeGreaterThanOrEqual(6);
  });

  it('the warm line names the dino and smiles; the warm memory credits the keeper', () => {
    expect(warmLine('Glade')).toContain('Glade');
    expect(warmLine('Glade')).toContain('😊');
    expect(warmMemory()).toContain('keeper');
    expect(warmMemory()).toContain('warm');
  });

  it('the mend is not the wound — warm strings never carry the freeze', () => {
    expect(warmLine('Glade')).not.toContain('🥶');
    expect(warmMemory()).not.toContain('🥶');
    expect(warmMemory()).not.toBe(coldMemory());
  });
});

describe('nobody came (BACKLOG-208)', () => {
  it('the neglect memory names the hurt — shivered, and nobody came', () => {
    expect(neglectMemory().length).toBeGreaterThan(0);
    expect(neglectMemory()).toContain('nobody came');
  });

  it('the three cold memories are pairwise distinct — cold, warmed, neglected', () => {
    expect(neglectMemory()).not.toBe(coldMemory());
    expect(neglectMemory()).not.toBe(warmMemory());
    expect(coldMemory()).not.toBe(warmMemory());
  });

  it('neglect is the morning after, not the night — it carries no freeze of its own', () => {
    expect(neglectMemory()).not.toContain('🥶');
  });
});

describe('word of the cold (BACKLOG-185)', () => {
  it('the cold-news token is a real substring of the cold memory — detector and memory cannot drift', () => {
    expect(coldMemory()).toContain(COLD_NEWS_TOKEN);
  });

  it('the cold word names the speaker, carries the rumor mark, and cannot re-spread (1 hop)', () => {
    const line = coldWordLine('Mossback');
    expect(line).toContain('Mossback');
    expect(line).toContain(RUMOR_MARK);
    expect(isShareable(line)).toBe(false);
  });

  it('the cold word is distinct from every first-hand cold memory and from the generic retell', () => {
    const line = coldWordLine('Mossback');
    expect(line).not.toBe(coldMemory());
    expect(line).not.toBe(neglectMemory());
    expect(line).not.toBe(warmMemory());
    expect(line).not.toBe(makeRumor('Mossback', coldMemory()));
  });

  it('a cold-slept speaker plants the word on the listener and returns it', () => {
    const store: MemoryStore = remember({}, 'Mossback', coldMemory());
    const { store: next, rumor } = spreadColdWord(store, 'Mossback', 'Sunny');
    expect(rumor).toBe(coldWordLine('Mossback'));
    expect(next.Sunny).toContain(coldWordLine('Mossback'));
  });

  it('a speaker with no cold memory passes nothing — the caller falls back to generic gossip', () => {
    const store: MemoryStore = remember({}, 'Rex', 'you greeted me');
    const { store: next, rumor } = spreadColdWord(store, 'Rex', 'Sunny');
    expect(rumor).toBeNull();
    expect(next).toBe(store);
  });

  it('the heard word is one hop — a listener cannot re-tell it as fresh cold news', () => {
    const seeded: MemoryStore = remember({}, 'Mossback', coldMemory());
    const { store: afterFirst } = spreadColdWord(seeded, 'Mossback', 'Sunny');
    const { rumor: second } = spreadColdWord(afterFirst, 'Sunny', 'Glade');
    expect(second).toBeNull();
  });

  it('a dino never gossips to itself', () => {
    const store: MemoryStore = remember({}, 'Mossback', coldMemory());
    expect(spreadColdWord(store, 'Mossback', 'Mossback').rumor).toBeNull();
  });
});

describe('word of the warmth (BACKLOG-223)', () => {
  it('the warm-news token is a real substring of the warm memory — detector and memory cannot drift', () => {
    expect(warmMemory()).toContain(WARM_NEWS_TOKEN);
  });

  it('the warm token never matches the cold or neglect memory — cold news never reads as warm', () => {
    expect(coldMemory()).not.toContain(WARM_NEWS_TOKEN);
    expect(neglectMemory()).not.toContain(WARM_NEWS_TOKEN);
  });

  it('the warm word names the speaker, carries the rumor mark, and cannot re-spread (1 hop)', () => {
    const line = warmWordLine('Rex');
    expect(line).toContain('Rex');
    expect(line).toContain(RUMOR_MARK);
    expect(isShareable(line)).toBe(false);
  });

  it('the warm word is distinct from the first-hand warm memory and from the cold word', () => {
    const line = warmWordLine('Rex');
    expect(line).not.toBe(warmMemory());
    expect(line).not.toBe(coldWordLine('Rex'));
    expect(line).not.toContain('🥶');
  });

  it('a warmed speaker plants the warm word on the listener and returns it', () => {
    const store: MemoryStore = remember({}, 'Rex', warmMemory());
    const { store: next, rumor } = spreadWarmWord(store, 'Rex', 'Mossback');
    expect(rumor).toBe(warmWordLine('Rex'));
    expect(next.Mossback).toContain(warmWordLine('Rex'));
  });

  it('a speaker with no warm memory passes nothing — the caller falls back to the cold word / gossip', () => {
    const store: MemoryStore = remember({}, 'Rex', 'you greeted me');
    const { store: next, rumor } = spreadWarmWord(store, 'Rex', 'Mossback');
    expect(rumor).toBeNull();
    expect(next).toBe(store);
  });

  it('the heard warm word is one hop — a listener cannot re-tell it as fresh warm news', () => {
    const seeded: MemoryStore = remember({}, 'Rex', warmMemory());
    const { store: afterFirst } = spreadWarmWord(seeded, 'Rex', 'Mossback');
    const { rumor: second } = spreadWarmWord(afterFirst, 'Mossback', 'Sunny');
    expect(second).toBeNull();
  });

  it('a dino never gossips warmth to itself', () => {
    const store: MemoryStore = remember({}, 'Rex', warmMemory());
    expect(spreadWarmWord(store, 'Rex', 'Rex').rumor).toBeNull();
  });

  it('a rescued dino carries both memories — warm word fires though the cold word would too', () => {
    // warmMemory() contains "cold night", so spreadColdWord ALSO matches this speaker; the seam
    // checks warm first, and here we pin that the warm detector fires on a both-memory store.
    let store: MemoryStore = remember({}, 'Rex', coldMemory());
    store = remember(store, 'Rex', warmMemory());
    expect(spreadWarmWord(store, 'Rex', 'Mossback').rumor).toBe(warmWordLine('Rex'));
    expect(spreadColdWord(store, 'Rex', 'Mossback').rumor).toBe(coldWordLine('Rex')); // both match — ordering decides
  });
});

describe('secondhand sympathy spurs a visit (BACKLOG-217)', () => {
  // A store where Sunny carries word of Mossback's cold night (the cycle-185 plant).
  function carriedWord(): MemoryStore {
    const seeded: MemoryStore = remember({}, 'Mossback', coldMemory());
    return spreadColdWord(seeded, 'Mossback', 'Sunny').store;
  }

  it('heardColdWordAbout is exact — true for the carried sufferer, false otherwise', () => {
    const store = carriedWord();
    expect(heardColdWordAbout(store, 'Sunny', 'Mossback')).toBe(true);
    expect(heardColdWordAbout(store, 'Sunny', 'Glade')).toBe(false); // word about a different dino
    expect(heardColdWordAbout(store, 'Mossback', 'Sunny')).toBe(false); // the sufferer carries nothing
    expect(heardColdWordAbout({}, 'Sunny', 'Mossback')).toBe(false); // empty store
  });

  it('the carrier is the visitor and the named one is the sufferer', () => {
    const v = sympathyVisit(carriedWord(), 'Sunny', 'Mossback');
    expect(v).toEqual({ visitor: 'Sunny', sufferer: 'Mossback', memory: cameToFindMemory('Sunny') });
  });

  it('is direction-agnostic — call order does not decide who visited whom', () => {
    const v = sympathyVisit(carriedWord(), 'Mossback', 'Sunny');
    expect(v).toEqual({ visitor: 'Sunny', sufferer: 'Mossback', memory: cameToFindMemory('Sunny') });
  });

  it('returns null when neither carries the other’s cold word, and when a === b', () => {
    expect(sympathyVisit(remember({}, 'Rex', 'you greeted me'), 'Rex', 'Glade')).toBeNull();
    expect(sympathyVisit(carriedWord(), 'Sunny', 'Sunny')).toBeNull();
  });

  it('the came-to-find memory is first-hand and distinct from every neighbouring memory', () => {
    const m = cameToFindMemory('Sunny');
    expect(isShareable(m)).toBe(true); // no RUMOR_MARK — a deed, not hearsay
    expect(m).not.toBe(comfortMemory('Sunny'));
    expect(m).not.toBe(coldMemory());
    expect(m).not.toBe(warmMemory());
    expect(m).not.toBe(neglectMemory());
  });

  it('the bump magnitude is pinned to the 130 console bond', () => {
    expect(SYMPATHY_BOND).toBe(COMFORT_BOND);
  });

  it('the sympathy line carries both names and the 🫂', () => {
    const line = sympathyLine('Sunny', 'Mossback');
    expect(line).toContain('Sunny');
    expect(line).toContain('Mossback');
    expect(line).toContain('🫂');
  });
});

describe('the bowl self-corrects (BACKLOG-234)', () => {
  // Sunny carries word of Mossback's cold night (the cycle-185 plant).
  function carriedWord(): MemoryStore {
    const seeded: MemoryStore = remember({}, 'Mossback', coldMemory());
    return spreadColdWord(seeded, 'Mossback', 'Sunny').store;
  }
  // ...and Mossback was since warmed by the keeper (BACKLOG-184): it has recovered.
  function carriedWordRecovered(): MemoryStore {
    return remember(carriedWord(), 'Mossback', warmMemory());
  }

  it('recovered is true only for a dino carrying a first-hand warm memory', () => {
    expect(recovered(remember({}, 'Mossback', warmMemory()), 'Mossback')).toBe(true);
    expect(recovered(remember({}, 'Mossback', coldMemory()), 'Mossback')).toBe(false);
    expect(recovered({}, 'Mossback')).toBe(false);
  });

  it('the relief line carries both names and 😌; the relief memory is first-hand and distinct', () => {
    const line = reliefLine('Sunny', 'Mossback');
    expect(line).toContain('Sunny');
    expect(line).toContain('Mossback');
    expect(line).toContain('😌');
    const m = reliefMemory('Mossback');
    expect(isShareable(m)).toBe(true); // a thing seen, not hearsay
    expect(m).not.toBe(cameToFindMemory('Mossback'));
    expect(m).not.toBe(coldMemory());
    expect(m).not.toBe(warmMemory());
    expect(m).not.toBe(neglectMemory());
  });

  it('fires when the carrier holds the cold word AND the sufferer recovered', () => {
    const c = selfCorrect(carriedWordRecovered(), 'Sunny', 'Mossback');
    expect(c).toEqual({
      corrector: 'Sunny',
      sufferer: 'Mossback',
      dropped: coldWordLine('Mossback'),
      memory: reliefMemory('Mossback'),
    });
  });

  it('is direction-agnostic — call order does not decide who corrects', () => {
    const c = selfCorrect(carriedWordRecovered(), 'Mossback', 'Sunny');
    expect(c?.corrector).toBe('Sunny');
    expect(c?.sufferer).toBe('Mossback');
  });

  it('does NOT fire while the sufferer has not recovered — that stays a sympathy visit', () => {
    expect(selfCorrect(carriedWord(), 'Sunny', 'Mossback')).toBeNull();
  });

  it('returns null when neither carries the other’s cold word, and when a === b', () => {
    expect(selfCorrect(remember({}, 'Rex', 'you greeted me'), 'Rex', 'Glade')).toBeNull();
    expect(selfCorrect(carriedWordRecovered(), 'Sunny', 'Sunny')).toBeNull();
  });

  it('the dropped string is exactly the planted cold word — a precise forget, no substring', () => {
    const c = selfCorrect(carriedWordRecovered(), 'Sunny', 'Mossback');
    expect(c?.dropped).toBe(coldWordLine('Mossback'));
  });
});

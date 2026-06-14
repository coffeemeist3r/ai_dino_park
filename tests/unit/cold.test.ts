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
} from '../../game/src/world/cold';
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

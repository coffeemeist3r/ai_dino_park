import { describe, it, expect } from 'vitest';
import {
  GROVE_NEWS_TOKEN,
  groveNewsMemory,
  groveWordLine,
  spreadGroveWord,
  pondSwap,
  pondSwapMemory,
  POND_BOND,
} from '../../game/src/world/groveword';
import { spreadColdWord, coldMemory } from '../../game/src/world/cold';
import { SHARED_WONDER_BOND } from '../../game/src/world/skyEvent';
import { remember, recall } from '../../game/src/ai/memory';
import { RUMOR_MARK, isShareable } from '../../game/src/social/gossip';

describe('tell of the grove (BACKLOG-342)', () => {
  it('the grove-news memory is shareable and carries the token', () => {
    expect(groveNewsMemory()).toContain(GROVE_NEWS_TOKEN);
    expect(isShareable(groveNewsMemory())).toBe(true); // no RUMOR_MARK → it spreads
  });

  it('the spread line carries RUMOR_MARK so it cannot re-spread (1 hop)', () => {
    const line = groveWordLine('Rex');
    expect(line).toContain(RUMOR_MARK);
    expect(isShareable(line)).toBe(false);
  });

  it('a speaker carrying grove news plants the word on the listener', () => {
    const store = remember({}, 'Rex', groveNewsMemory());
    const { store: next, rumor } = spreadGroveWord(store, 'Rex', 'Mossback');
    expect(rumor).toBe(groveWordLine('Rex'));
    expect(recall(next, 'Mossback')).toContain(groveWordLine('Rex'));
  });

  it('a speaker without grove news yields null and an unchanged store', () => {
    const store = remember({}, 'Rex', 'you ate a fern');
    const { store: next, rumor } = spreadGroveWord(store, 'Rex', 'Mossback');
    expect(rumor).toBeNull();
    expect(next).toBe(store);
  });

  it('does not gossip with itself', () => {
    const store = remember({}, 'Rex', groveNewsMemory());
    expect(spreadGroveWord(store, 'Rex', 'Rex').rumor).toBeNull();
  });

  it('a heard grove rumor is not re-shared (the listener has only the marked line)', () => {
    const store = remember({}, 'Rex', groveNewsMemory());
    const { store: heard } = spreadGroveWord(store, 'Rex', 'Mossback');
    // Mossback only carries the rumor line (marked), so it has nothing first-hand to pass on.
    expect(spreadGroveWord(heard, 'Mossback', 'Sunny').rumor).toBeNull();
  });

  it('cascade order: a dino carrying both a cold night and grove news still leads with the cold', () => {
    // documents the WorldScene cascade contract — cold rung fires before the grove rung.
    let store = remember({}, 'Rex', coldMemory());
    store = remember(store, 'Rex', groveNewsMemory());
    expect(spreadColdWord(store, 'Rex', 'Mossback').rumor).not.toBeNull();
  });
});

describe('pond-swappers (BACKLOG-346)', () => {
  const visited = ['Rex', 'Twitch'];

  it('swaps only when BOTH dinos have set foot in the grove', () => {
    expect(pondSwap(visited, 'Rex', 'Twitch')).toBe(true);
    expect(pondSwap(visited, 'Rex', 'Sunny')).toBe(false); // Sunny never crossed
    expect(pondSwap(visited, 'Sunny', 'Glade')).toBe(false); // neither crossed
  });

  it('does not swap with itself', () => {
    expect(pondSwap(visited, 'Rex', 'Rex')).toBe(false);
  });

  it('the swap memory names the other dino', () => {
    expect(pondSwapMemory('Twitch')).toContain('Twitch');
  });

  it('the swap memory is NOT grove news — it can never re-spread', () => {
    // pondSwapMemory must stay clear of the token spreadGroveWord keys off, or a swap would make a dino
    // re-broadcast grove news it didn't witness.
    expect(pondSwapMemory('Twitch')).not.toContain(GROVE_NEWS_TOKEN);
    const store = remember({}, 'Rex', pondSwapMemory('Twitch'));
    expect(spreadGroveWord(store, 'Rex', 'Mossback').rumor).toBeNull();
  });

  it('POND_BOND is a small positive bump, no larger than the sky shared-wonder', () => {
    expect(POND_BOND).toBeGreaterThan(0);
    expect(POND_BOND).toBeLessThanOrEqual(SHARED_WONDER_BOND);
  });
});

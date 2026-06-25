import { describe, it, expect } from 'vitest';
import { groveCurious, grovePull, GROVE_TELL_RECENT } from '../../game/src/world/curiosity';
import { groveNewsMemory, groveWordLine } from '../../game/src/world/groveword';
import { BOWL_ID, GROVE_ID } from '../../game/src/world/zones';

describe('news pulls a newcomer (BACKLOG-345)', () => {
  const heard = [groveWordLine('Rex')]; // a *heard* rumor — contains the grove-news token

  it('a bowl dino that heard grove news and never crossed is curious', () => {
    expect(groveCurious(heard, [], 'Mossback', BOWL_ID)).toBe(true);
  });

  it('a dino with no grove news is not curious', () => {
    expect(groveCurious(['you ate a fern'], [], 'Mossback', BOWL_ID)).toBe(false);
  });

  it('a dino that already crossed is not curious, even carrying first-hand news', () => {
    expect(groveCurious([groveNewsMemory()], ['Rex'], 'Rex', BOWL_ID)).toBe(false);
  });

  it('a dino already in the grove is not curious', () => {
    expect(groveCurious(heard, [], 'Mossback', GROVE_ID)).toBe(false);
  });
});

describe('drew them across — graded pull (BACKLOG-355)', () => {
  const filler = ['you ate a fern', 'you ran into Sunny', 'a quiet afternoon']; // GROVE_TELL_RECENT non-grove memories

  it('a freshly-told dino (telling among its most-recent memories) has the strong pull, 2', () => {
    expect(grovePull([groveWordLine('Rex')], [], 'Mossback', BOWL_ID)).toBe(2);
  });

  it('an ambient dino (the telling pushed back by newer memories) has the weak pull, 1', () => {
    const aged = [groveWordLine('Rex'), ...filler]; // token at the front, last 3 are non-grove
    expect(grovePull(aged, [], 'Mossback', BOWL_ID)).toBe(1);
  });

  it('the recency boundary is GROVE_TELL_RECENT', () => {
    // exactly GROVE_TELL_RECENT-1 newer memories keeps the telling inside the recent window → still 2
    const justInside = [groveWordLine('Rex'), ...filler.slice(0, GROVE_TELL_RECENT - 1)];
    expect(grovePull(justInside, [], 'Mossback', BOWL_ID)).toBe(2);
    // one more newer memory tips it out of the window → ambient (1)
    const justOutside = [groveWordLine('Rex'), ...filler.slice(0, GROVE_TELL_RECENT)];
    expect(grovePull(justOutside, [], 'Mossback', BOWL_ID)).toBe(1);
  });

  it('no grove news → no pull; visited → no pull; grove-home → no pull', () => {
    expect(grovePull(filler, [], 'Mossback', BOWL_ID)).toBe(0);
    expect(grovePull([groveNewsMemory()], ['Rex'], 'Rex', BOWL_ID)).toBe(0); // already crossed
    expect(grovePull([groveWordLine('Rex')], [], 'Mossback', GROVE_ID)).toBe(0); // lives in the grove
  });

  it('groveCurious is exactly "pull > 0" — the 345 predicate is preserved at every tier', () => {
    const aged = [groveWordLine('Rex'), ...filler];
    expect(groveCurious([groveWordLine('Rex')], [], 'Mossback', BOWL_ID)).toBe(true); // pull 2
    expect(groveCurious(aged, [], 'Mossback', BOWL_ID)).toBe(true); // pull 1
    expect(groveCurious(filler, [], 'Mossback', BOWL_ID)).toBe(false); // pull 0
  });
});

import { describe, it, expect } from 'vitest';
import { groveCurious } from '../../game/src/world/curiosity';
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

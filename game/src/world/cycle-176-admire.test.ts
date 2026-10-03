import { describe, it, expect } from 'vitest';
import { admirers, admiredMemory, admireLine, ADMIRE_BAR, ADMIRE_ART_KEY, peckingRead } from './pecking';
import { hatchPattern, yieldedMemory, repaidMemory, snatchedMemory, stoodMemory, slunkOffMemory } from './feeding';
import { mannerTallies } from './manner';
import { worldPlacedProps } from './reachability';

describe('BACKLOG-395 witnessed backbone', () => {
  const on = (name: string, bond: number) => ({ name, bond });
  it('a friend of the holder at the bar admires; one below does not', () => {
    expect(admirers('Mossback', 'Rex', [on('Glade', ADMIRE_BAR), on('Sunny', ADMIRE_BAR - 1)])).toEqual(['Glade']);
  });
  it('never returns the pair themselves, and strangers admire nobody', () => {
    expect(admirers('Mossback', 'Rex', [on('Mossback', 99), on('Rex', 99)])).toEqual([]);
    expect(admirers('Mossback', 'Rex', [on('Glade', 0), on('Twitch', 0)])).toEqual([]);
  });
  it('says what it saw', () => {
    expect(admiredMemory('Mossback', 'Rex')).toBe('you saw Mossback stand up to Rex');
    expect(admireLine('Glade', 'Mossback', 'Rex')).toBe('👏 Glade saw Mossback stand up to Rex');
  });
  it('the mark is placed by the world', () => {
    expect(worldPlacedProps().has(ADMIRE_ART_KEY)).toBe(true);
  });
});

describe('BACKLOG-483 hatch memory builders', () => {
  it('each pattern captures the name its builder wrote', () => {
    for (const b of [yieldedMemory, repaidMemory, snatchedMemory, stoodMemory, slunkOffMemory]) {
      expect(hatchPattern(b).exec(b('Rex'))?.[1]).toBe('Rex');
      expect(hatchPattern(b).test(`you said ${b("Rex")}!`)).toBe(false);
    }
  });
  it('the readers count what the builders write', () => {
    const ring = [yieldedMemory('Rex'), snatchedMemory('Rex'), stoodMemory('Rex'), slunkOffMemory('Rex')];
    expect(mannerTallies(ring)).toEqual({ generous: 1, greedy: 1, unbowed: 1, timid: 1 });
    expect(peckingRead([stoodMemory('Rex'), stoodMemory('Rex')], 'Rex')).toEqual({ score: 4, beats: 2 });
  });
});

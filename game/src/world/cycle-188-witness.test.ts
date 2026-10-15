import { describe, it, expect } from 'vitest';
import { moltWitnesses, stageOpener, witnessLine, witnessMemory } from './molt';

const grounds: Record<string, string> = { Pip: 'grove', Bramble: 'grove', Rex: 'bowl', Sunny: 'grove', Twitch: 'grove' };
const groundOf = (n: string): string | undefined => grounds[n];

describe('BACKLOG-604: who walks to a molt', () => {
  it('parents first, then the friend, then the rival', () => {
    expect(moltWitnesses({ name: 'Pip', parents: ['Sunny', 'Bramble'], friend: 'Twitch', rival: null, groundOf })).toEqual([
      { who: 'Sunny', role: 'parent' },
      { who: 'Bramble', role: 'parent' },
      { who: 'Twitch', role: 'friend' },
    ]);
  });

  it('only its own ground, never itself, and a parent who is also the friend comes as a parent', () => {
    expect(moltWitnesses({ name: 'Pip', parents: ['Rex', 'Bramble'], friend: 'Bramble', rival: 'Pip', groundOf })).toEqual([
      { who: 'Bramble', role: 'parent' },
    ]);
  });

  it('a founder brings its friend and its rival; a dino no longer in the world brings nobody', () => {
    expect(moltWitnesses({ name: 'Pip', friend: 'Bramble', rival: 'Twitch', groundOf })).toEqual([
      { who: 'Bramble', role: 'friend' },
      { who: 'Twitch', role: 'rival' },
    ]);
    expect(moltWitnesses({ name: 'Pip', friend: 'Gone', groundOf })).toEqual([]);
  });
});

describe('BACKLOG-605: what the park says', () => {
  it('three registers', () => {
    expect(witnessLine('parent', 'Pip')).toBe("🐚 That's my Pip. All grown.");
    expect(witnessLine('friend', 'Pip')).toBe('Look at you, Pip!');
    expect(witnessLine('rival', 'Pip')).toBe('Still small to me.');
    expect(witnessMemory('Pip')).toBe('saw Pip grow up');
  });

  it('the greeting reads the stage: young, first grown, later, none', () => {
    expect(stageOpener('young', { })).toContain("I'm nearly big");
    expect(stageOpener('adult', { moltedAtMin: 10 })).toContain("I'm grown");
    expect(stageOpener('adult', { moltedAtMin: 10, greeted: true })).toBeNull();
    expect(stageOpener('adult', undefined)).toBeNull();
  });
});

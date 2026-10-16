import { describe, expect, it } from 'vitest';
import { TETHER_TILES, guardianOf, tetherStep } from './growth';
import { copiedMemory, copyLine, fidget, stopCopyingTicker } from './fidget';
import { seededPersonality } from '../ai/personality';

const grounds: Record<string, string> = { Pip: 'grove', Bramble: 'grove', Rex: 'bowl', Sunny: 'grove' };
const groundOf = (n: string) => grounds[n];

describe('a youngster keeps to its guardian (BACKLOG-607)', () => {
  it('a parent on its ground beats the friend; off-ground and self never count', () => {
    expect(guardianOf({ name: 'Pip', parents: ['Rex', 'Sunny'], friend: 'Bramble', groundOf })).toBe('Sunny');
    expect(guardianOf({ name: 'Pip', parents: ['Rex'], friend: 'Bramble', groundOf })).toBe('Bramble');
    expect(guardianOf({ name: 'Pip', friend: 'Rex', groundOf })).toBeNull();
    expect(guardianOf({ name: 'Pip', parents: ['Pip'], friend: 'Pip', groundOf })).toBeNull();
    expect(guardianOf({ name: 'Pip', groundOf })).toBeNull();
  });

  it('the leash: past it, head back; within it, wander unless the step leaves it', () => {
    const g = { tileX: 10, tileY: 10 };
    expect(tetherStep({ tileX: 15, tileY: 10 }, g, { tileX: 16, tileY: 10 }, 40, 40)).toEqual({ tileX: 14, tileY: 10 });
    expect(tetherStep({ tileX: 11, tileY: 10 }, g, { tileX: 12, tileY: 10 }, 40, 40)).toEqual({ tileX: 12, tileY: 10 });
    const edge = { tileX: 10 + TETHER_TILES, tileY: 10 };
    expect(tetherStep(edge, g, { tileX: edge.tileX + 1, tileY: 10 }, 40, 40)).toEqual(edge);
  });
});

describe('the youngster copies (BACKLOG-320)', () => {
  it("Pip's own quirk is not Bramble's, so the copy is visible", () => {
    expect(fidget(seededPersonality('Pip')).glyph).not.toBe(fidget(seededPersonality('Bramble')).glyph);
  });

  it('the book, the ticker and the memory name whose habit it was', () => {
    expect(copyLine('Bramble', 'hums to itself')).toBe('copies Bramble — hums to itself');
    expect(stopCopyingTicker('Pip', 'Bramble', 'paces')).toBe('Pip stops copying Bramble — paces now');
    expect(copiedMemory('Bramble', 'hums to itself')).toBe('you used to copy Bramble — hums to itself');
  });
});

import { describe, it, expect } from 'vitest';
import { pickMurmurMemory, murmurLine } from '../../game/src/world/murmur';

describe('sleep murmurs — deterministic dream line (BACKLOG-181)', () => {
  it('picks the most recent memory, or null when there are none', () => {
    expect(pickMurmurMemory([])).toBeNull();
    expect(pickMurmurMemory(['a', 'b', 'c'])).toBe('c');
  });

  it('a memoryless dino dozes with a generic line', () => {
    expect(murmurLine(null)).toBe('💭 …zzz…');
  });

  it('wraps a memory as a 💭 fragment and strips the leading event glyph', () => {
    const line = murmurLine('🍖 ate its favorite');
    expect(line.startsWith('💭 …')).toBe(true);
    expect(line).toContain('ate its favorite');
    expect(line).not.toContain('🍖');
  });

  it('a plain (glyph-less) memory survives intact', () => {
    expect(murmurLine('you ran into Sunny the brontosaurus')).toBe(
      '💭 …you ran into Sunny the brontosaurus…',
    );
  });

  it('different day-memories dream different lines (distinctness)', () => {
    const rex = murmurLine(pickMurmurMemory(['🍖 ate its favorite']));
    const moss = murmurLine(pickMurmurMemory(['🥶 cold night, slept alone']));
    expect(rex).not.toBe(moss);
  });
});

import { describe, expect, it } from 'vitest';
import { worldPlacedProps } from './reachability';
import { FRIEND_FOUND_ART_KEY } from './loner';
import { COLD_ART_KEY, COLD_GLYPH, coldShiver } from './cold';

describe('BACKLOG-571 / 557 hosts', () => {
  it('both marks are placed by the world, so the Artist may draw them', () => {
    expect(worldPlacedProps().has(FRIEND_FOUND_ART_KEY)).toBe(true);
    expect(worldPlacedProps().has(COLD_ART_KEY)).toBe(true);
  });
  it('the cold mark keeps the shiver’s glyph', () => {
    expect(coldShiver().startsWith(COLD_GLYPH)).toBe(true);
  });
});

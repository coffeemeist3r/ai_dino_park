import { describe, expect, it } from 'vitest';
import { squareOff, backOffTile, standoffDue, standoffLine, STANDOFF_ART_KEY, STANDOFF_BACKOFF, STANDOFF_COOLDOWN_STEPS } from './standoff';
import { worldPlacedProps } from '../world/reachability';

describe('BACKLOG-024 squareOff', () => {
  it('the bolder holds', () => {
    expect(squareOff({ name: 'Twitch', bravery: 0.9 }, { name: 'Mossback', bravery: 0.2 })).toEqual({ holder: 'Twitch', yielder: 'Mossback' });
    expect(squareOff({ name: 'Twitch', bravery: 0.1 }, { name: 'Mossback', bravery: 0.2 })).toEqual({ holder: 'Mossback', yielder: 'Twitch' });
  });
  it('a tie goes to the name that sorts first', () => {
    expect(squareOff({ name: 'Twitch', bravery: 0.5 }, { name: 'Mossback', bravery: 0.5 }).holder).toBe('Mossback');
  });
});

describe('BACKLOG-024 backOffTile', () => {
  it('steps directly away, two tiles', () => {
    expect(backOffTile({ tileX: 5, tileY: 5 }, { tileX: 4, tileY: 5 }, 20, 15)).toEqual({ tileX: 5 + STANDOFF_BACKOFF, tileY: 5 });
    expect(backOffTile({ tileX: 5, tileY: 5 }, { tileX: 6, tileY: 6 }, 20, 15)).toEqual({ tileX: 3, tileY: 3 });
  });
  it('clamps to the ground and breaks a shared tile along +x', () => {
    expect(backOffTile({ tileX: 0, tileY: 0 }, { tileX: 1, tileY: 1 }, 20, 15)).toEqual({ tileX: 0, tileY: 0 });
    expect(backOffTile({ tileX: 3, tileY: 3 }, { tileX: 3, tileY: 3 }, 20, 15)).toEqual({ tileX: 5, tileY: 3 });
  });
});

describe('BACKLOG-024 cooldown, line, placed mark', () => {
  it('a pair cannot square off again inside the cooldown', () => {
    expect(standoffDue(undefined, 3)).toBe(true);
    expect(standoffDue(10, 10 + STANDOFF_COOLDOWN_STEPS - 1)).toBe(false);
    expect(standoffDue(10, 10 + STANDOFF_COOLDOWN_STEPS)).toBe(true);
  });
  it('names both in the ticker', () => {
    expect(standoffLine('Mossback', 'Twitch')).toBe('💢 Mossback and Twitch squared off — Twitch backed down');
  });
  it('the mark is placed by the world, so the Artist may draw it', () => {
    expect(worldPlacedProps().has(STANDOFF_ART_KEY)).toBe(true);
  });
});

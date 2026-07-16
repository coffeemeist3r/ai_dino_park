import { describe, it, expect } from 'vitest';
import { sharedMeal, SHARED_MEAL_MS } from './feeding';

describe('sharedMeal (BACKLOG-373)', () => {
  it('pairs two different dinos eating within the window', () => {
    expect(sharedMeal({ name: 'Twitch', at: 1000 }, 'Mossback', 1000 + SHARED_MEAL_MS)).toBe(true);
    expect(sharedMeal({ name: 'Twitch', at: 1000 }, 'Mossback', 2500)).toBe(true);
  });

  it('does not self-pair (same dino eating twice)', () => {
    expect(sharedMeal({ name: 'Twitch', at: 1000 }, 'Twitch', 1500)).toBe(false);
  });

  it('gates on the window (stale prior meal does not pair)', () => {
    expect(sharedMeal({ name: 'Twitch', at: 1000 }, 'Mossback', 1000 + SHARED_MEAL_MS + 1)).toBe(false);
  });

  it('no prior meal → no shared meal', () => {
    expect(sharedMeal(null, 'Mossback', 1000)).toBe(false);
  });
});

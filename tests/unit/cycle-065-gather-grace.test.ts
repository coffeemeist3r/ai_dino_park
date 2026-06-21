import { describe, it, expect } from 'vitest';
import { resourceFetchable, RESOURCE_GRACE_STEPS, RESOURCE_SPAWN_CHANCE } from '../../game/src/world/resource';

describe('legible gathering (BACKLOG-297)', () => {
  it('a fresh resource is not fetchable until the grace elapses', () => {
    for (let age = 0; age < RESOURCE_GRACE_STEPS; age++) expect(resourceFetchable(age)).toBe(false);
  });

  it('becomes fetchable at and after the grace', () => {
    expect(resourceFetchable(RESOURCE_GRACE_STEPS)).toBe(true);
    expect(resourceFetchable(RESOURCE_GRACE_STEPS + 5)).toBe(true);
  });

  it('the spawn rate was bumped above the original 0.05 blink rate', () => {
    expect(RESOURCE_SPAWN_CHANCE).toBeGreaterThan(0.05);
    expect(RESOURCE_SPAWN_CHANCE).toBe(0.12);
  });
});

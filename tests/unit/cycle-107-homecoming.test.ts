import { describe, it, expect } from 'vitest';
import {
  rootOf,
  rememberRoot,
  isHomecoming,
  homecomingLine,
  homecomingEvent,
  homecomingMemory,
  welcomeMemory,
  welcomeEvent,
  WELCOME_BOND,
  type Roots,
} from '../../game/src/world/belonging';
import { pickNearest } from '../../game/src/world/movement';

/**
 * Homecoming from the road (BACKLOG-452) — a dino that settled somewhere, walked out, and later crosses
 * back reads as a *return*: it resettles, wears a 🏡, and a resident still there welcomes it home.
 * Milestone 6 lore arc 2.
 */
describe('roots — where a dino belongs (BACKLOG-452)', () => {
  it('rootOf is undefined until a dino has settled somewhere', () => {
    expect(rootOf({}, 'Rex')).toBeUndefined();
    expect(rootOf({ Rex: 'grove' }, 'Rex')).toBe('grove');
  });

  it('rememberRoot is pure and returns the same object when nothing changes', () => {
    const r: Roots = { Rex: 'bowl' };
    expect(rememberRoot(r, 'Rex', 'grove')).toEqual({ Rex: 'grove' });
    expect(rememberRoot(r, 'Glade', 'grove')).toEqual({ Rex: 'bowl', Glade: 'grove' });
    expect(r).toEqual({ Rex: 'bowl' }); // pure
    expect(rememberRoot(r, 'Rex', 'bowl')).toBe(r); // no-op write
  });
});

describe('isHomecoming (BACKLOG-452)', () => {
  const roots: Roots = { Rex: 'bowl' };

  it('is true only when the crossing lands back in the dino’s root', () => {
    expect(isHomecoming(roots, 'Rex', 'grove', 'bowl')).toBe(true);
  });

  it('is false crossing to a zone that is not its root', () => {
    expect(isHomecoming(roots, 'Rex', 'bowl', 'grove')).toBe(false);
    expect(isHomecoming(roots, 'Rex', 'bowl', 'fernreach')).toBe(false);
  });

  it('is false for a dino that has never settled anywhere', () => {
    expect(isHomecoming({}, 'Glade', 'grove', 'bowl')).toBe(false);
  });

  it('is false when the crossing does not actually change zone', () => {
    expect(isHomecoming(roots, 'Rex', 'bowl', 'bowl')).toBe(false);
  });
});

describe('the homecoming beat reads (BACKLOG-452)', () => {
  it('names the zone in the bubble, the ticker, and the memory', () => {
    expect(homecomingLine()).toBe('🏡');
    expect(homecomingEvent('Rex', 'The Grove')).toContain('Rex');
    expect(homecomingEvent('Rex', 'The Grove')).toContain('The Grove');
    expect(homecomingMemory('The Grove')).toContain('The Grove');
    expect(homecomingMemory('The Grove')).toContain('back where you belong');
  });

  it('the welcome names both dinos, and is worth less than a shared meal', () => {
    expect(welcomeEvent('Glade', 'Rex')).toContain('Glade');
    expect(welcomeEvent('Glade', 'Rex')).toContain('Rex');
    expect(welcomeMemory('Rex', 'The Bowl')).toContain('welcomed Rex back');
    expect(WELCOME_BOND).toBeGreaterThan(0);
    expect(WELCOME_BOND).toBeLessThan(3); // SHARED_MEAL_BOND — a nod, not a meal
  });
});

describe('pickNearest (BACKLOG-448/452 — the shared closest-dino pick)', () => {
  it('picks the closest candidate', () => {
    expect(pickNearest([{ name: 'Rex', dist: 4 }, { name: 'Glade', dist: 1 }])).toBe('Glade');
  });

  it('breaks ties by name, deterministically', () => {
    expect(pickNearest([{ name: 'Rex', dist: 2 }, { name: 'Glade', dist: 2 }])).toBe('Glade');
    expect(pickNearest([{ name: 'Glade', dist: 2 }, { name: 'Rex', dist: 2 }])).toBe('Glade');
  });

  it('is null with nobody to pick, and never mutates its input', () => {
    expect(pickNearest([])).toBeNull();
    const entries = [{ name: 'Rex', dist: 3 }, { name: 'Glade', dist: 1 }];
    pickNearest(entries);
    expect(entries[0].name).toBe('Rex');
  });
});

import { describe, it, expect } from 'vitest';
import {
  nearestPrey,
  fleeStep,
  huntCaught,
  STALK_RANGE,
  huntSucceeds,
  HUNT_SUCCESS_CHANCE,
  recentHunter,
  chaseCount,
  fearsHunter,
  WARY_CHASES,
  WARY_RANGE,
  catchTally,
  escapeTally,
  foodwebStanding,
} from './foodweb';
import type { Tile } from './movement';

const t = (tileX: number, tileY: number): Tile => ({ tileX, tileY });

describe('food web hunt (BACKLOG-367)', () => {
  describe('nearestPrey', () => {
    it('picks the closest herbivore within range', () => {
      const prey = [
        { name: 'far', tile: t(5, 0) },
        { name: 'near', tile: t(2, 0) },
      ];
      expect(nearestPrey(t(0, 0), prey)).toBe('near');
    });

    it('returns null when none is within STALK_RANGE', () => {
      expect(nearestPrey(t(0, 0), [{ name: 'gone', tile: t(STALK_RANGE + 1, 0) }])).toBeNull();
      expect(nearestPrey(t(0, 0), [])).toBeNull();
    });

    it('breaks ties by supplied order (deterministic)', () => {
      const prey = [
        { name: 'first', tile: t(3, 0) },
        { name: 'second', tile: t(0, 3) }, // same Chebyshev distance (3)
      ];
      expect(nearestPrey(t(0, 0), prey)).toBe('first');
    });

    it('uses Chebyshev distance (diagonal counts as one)', () => {
      expect(nearestPrey(t(0, 0), [{ name: 'diag', tile: t(STALK_RANGE, STALK_RANGE) }])).toBe('diag');
    });
  });

  describe('fleeStep', () => {
    it('moves strictly away from the hunter along the dominant axis', () => {
      // hunter to the west → flee east
      expect(fleeStep(t(5, 5), t(2, 5), 20, 20)).toEqual(t(6, 5));
      // hunter to the south → flee north
      expect(fleeStep(t(5, 5), t(5, 9), 20, 20)).toEqual(t(5, 4));
    });

    it('slides along the other axis when the flee direction is wall-blocked', () => {
      // pinned on the east wall (x=19), hunter due west → can't go further east, slide on y
      const step = fleeStep(t(19, 5), t(10, 5), 20, 20);
      expect(step.tileX).toBe(19); // did not leave the wall
      expect(step.tileY).not.toBe(5); // slid along y instead of freezing
    });

    it('always stays in bounds', () => {
      for (let hx = 0; hx < 6; hx++) {
        for (let hy = 0; hy < 6; hy++) {
          const s = fleeStep(t(0, 0), t(hx, hy), 6, 6);
          expect(s.tileX).toBeGreaterThanOrEqual(0);
          expect(s.tileX).toBeLessThan(6);
          expect(s.tileY).toBeGreaterThanOrEqual(0);
          expect(s.tileY).toBeLessThan(6);
        }
      }
    });
  });

  describe('huntCaught', () => {
    it('is true at Chebyshev ≤ 1 (adjacent or same tile), false beyond', () => {
      expect(huntCaught(t(5, 5), t(5, 5))).toBe(true);
      expect(huntCaught(t(5, 5), t(6, 6))).toBe(true); // diagonal-adjacent
      expect(huntCaught(t(5, 5), t(7, 5))).toBe(false);
    });
  });

  // The hunt feeds (BACKLOG-437)
  describe('huntSucceeds', () => {
    it('lands when the roll is under the chance, misses at or above it', () => {
      expect(huntSucceeds(0)).toBe(true);
      expect(huntSucceeds(0.99)).toBe(false);
      expect(huntSucceeds(0.1, 0.5)).toBe(true);
      expect(huntSucceeds(0.5, 0.5)).toBe(false); // strict <, boundary misses
    });

    it('keeps the default chance an occasional (0,1) rate — the chase stays the point', () => {
      expect(HUNT_SUCCESS_CHANCE).toBeGreaterThan(0);
      expect(HUNT_SUCCESS_CHANCE).toBeLessThan(1);
      expect(HUNT_SUCCESS_CHANCE).toBeLessThanOrEqual(0.5); // most stalks come up empty
    });
  });

  // Rattled after the chase (BACKLOG-440)
  describe('recentHunter', () => {
    it("reads the chaser out of the 367 prey memory", () => {
      expect(recentHunter([`you slipped Twitch's hunt`])).toBe('Twitch');
    });

    it('returns null when there is no fresh hunt memory', () => {
      expect(recentHunter([])).toBeNull();
      expect(recentHunter(['ate some berries', 'watched the sky'])).toBeNull();
    });

    it('picks the newest chaser when several are present (newest-first scan)', () => {
      const mem = [`you slipped Rex's hunt`, 'napped', `you slipped Twitch's hunt`];
      expect(recentHunter(mem)).toBe('Twitch');
    });

    it('handles multi-word names via the non-greedy capture', () => {
      expect(recentHunter([`you slipped Little Foot's hunt`])).toBe('Little Foot');
    });
  });

  // The hunter's reputation (BACKLOG-442)
  describe('chaseCount', () => {
    it('counts only the hunt memories that name the given hunter', () => {
      const mem = [`you slipped Twitch's hunt`, 'napped', `you slipped Twitch's hunt`, `you slipped Rex's hunt`];
      expect(chaseCount(mem, 'Twitch')).toBe(2);
      expect(chaseCount(mem, 'Rex')).toBe(1);
    });

    it('is 0 for a hunter never seen and for an empty / non-hunt store', () => {
      expect(chaseCount([`you slipped Twitch's hunt`], 'Glade')).toBe(0);
      expect(chaseCount([], 'Twitch')).toBe(0);
      expect(chaseCount(['ate some berries'], 'Twitch')).toBe(0);
    });
  });

  describe('fearsHunter', () => {
    const twice = [`you slipped Twitch's hunt`, `you slipped Twitch's hunt`];

    it('turns personal at WARY_CHASES and not before', () => {
      expect(fearsHunter([`you slipped Twitch's hunt`], 'Twitch')).toBe(false); // one chase — rattled (440), not yet wary
      expect(fearsHunter(twice, 'Twitch')).toBe(true); // WARY_CHASES = 2
    });

    it('tracks hunters independently — fears the repeat chaser, not the one-off', () => {
      const mem = [...twice, `you slipped Rex's hunt`];
      expect(fearsHunter(mem, 'Twitch')).toBe(true);
      expect(fearsHunter(mem, 'Rex')).toBe(false);
    });

    it('honours an explicit threshold', () => {
      expect(fearsHunter(twice, 'Twitch', 3)).toBe(false);
      expect(fearsHunter(twice, 'Twitch', 1)).toBe(true);
    });

    it('keeps its constants sane — WARY_CHASES ≥ 2, WARY_RANGE reuses the stalk range', () => {
      expect(WARY_CHASES).toBeGreaterThanOrEqual(2);
      expect(WARY_RANGE).toBe(STALK_RANGE);
    });
  });

  // Predator/prey in the book (BACKLOG-443)
  describe('catchTally', () => {
    it('counts only the 437 success memory', () => {
      const mem = ['you brought down a meal', 'napped', 'you brought down a meal', `you slipped Rex's hunt`];
      expect(catchTally(mem)).toBe(2);
    });
    it('is 0 for an empty / non-catch store', () => {
      expect(catchTally([])).toBe(0);
      expect(catchTally(['ate some berries'])).toBe(0);
    });
  });

  describe('escapeTally', () => {
    it('counts every slipped-hunt memory across all hunters', () => {
      const mem = [`you slipped Twitch's hunt`, 'dozed', `you slipped Rex's hunt`, `you slipped Twitch's hunt`];
      expect(escapeTally(mem)).toBe(3);
    });
    it('is 0 with no hunt memory', () => {
      expect(escapeTally([])).toBe(0);
      expect(escapeTally(['watched the sky'])).toBe(0);
    });
  });

  describe('foodwebStanding', () => {
    it('reads catches for a carnivore, escapes for a herbivore', () => {
      expect(foodwebStanding('carnivore', ['you brought down a meal'])).toBe('🦖 brought down 1 meal');
      expect(foodwebStanding('herbivore', [`you slipped Twitch's hunt`, `you slipped Rex's hunt`])).toBe(
        '💨 slipped 2 hunts',
      );
    });
    it('pluralises correctly', () => {
      const twoCatches = ['you brought down a meal', 'you brought down a meal'];
      expect(foodwebStanding('carnivore', twoCatches)).toBe('🦖 brought down 2 meals');
      expect(foodwebStanding('herbivore', [`you slipped Twitch's hunt`])).toBe('💨 slipped 1 hunt');
    });
    it('is null when the relevant tally is 0 (no line shows)', () => {
      expect(foodwebStanding('carnivore', [])).toBeNull();
      expect(foodwebStanding('herbivore', [])).toBeNull();
      // a carnivore reads catches only — a stray slipped memory doesn't give it a line
      expect(foodwebStanding('carnivore', [`you slipped Rex's hunt`])).toBeNull();
      // a herbivore reads escapes only — a stray catch memory doesn't give it a line
      expect(foodwebStanding('herbivore', ['you brought down a meal'])).toBeNull();
    });
  });
});

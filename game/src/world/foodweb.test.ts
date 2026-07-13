import { describe, it, expect } from 'vitest';
import {
  nearestPrey,
  fleeStep,
  huntCaught,
  STALK_RANGE,
  huntSucceeds,
  HUNT_SUCCESS_CHANCE,
  recentHunter,
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
});
